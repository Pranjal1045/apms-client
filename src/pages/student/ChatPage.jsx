import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { connectSocket, getSocket, subscribeToOnlineUsers } from "../../lib/socket";
import { Send, Loader, MessageSquare, Circle, AlertCircle } from "lucide-react";

const fmt     = (d) => d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" }) : "";

const ChatPage = () => {
  const { project }  = useSelector(s => s.student);
  const { authUser } = useSelector(s => s.auth);

  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [isTyping,    setIsTyping]    = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected,   setConnected]   = useState(false);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const inputRef    = useRef(null);

  const supervisor   = project?.supervisor;
  const projectId    = project?._id;
  const supervisorId = supervisor?._id || (typeof supervisor === "string" ? supervisor : null);
  const supervisorOnline = supervisorId && onlineUsers.includes(String(supervisorId));

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId || !supervisorId) { setLoading(false); return; }

    const socket = connectSocket();
    if (!socket) return;

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join_project", String(projectId));
    };
    const handleDisconnect = () => setConnected(false);

    if (socket.connected) {
      setConnected(true);
      socket.emit("join_project", String(projectId));
    }

    socket.on("connect",    handleConnect);
    socket.on("disconnect", handleDisconnect);

    const handleNewMessage = ({ message }) => {
      if (!message) return;
      if (String(message.project) !== String(projectId) &&
          String(message.project?._id) !== String(projectId)) return;
      setMessages(prev =>
        prev.some(m => m._id === message._id) ? prev : [...prev, message]
      );
    };

    const handleTyping     = ({ userId }) => { if (String(userId) !== String(authUser?._id)) setIsTyping(true);  };
    const handleStopTyping = ({ userId }) => { if (String(userId) !== String(authUser?._id)) setIsTyping(false); };
    const handleRead       = ({ projectId: pid }) => {
      if (String(pid) === String(projectId))
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    };

    socket.on("new_message",      handleNewMessage);
    socket.on("user_typing",      handleTyping);
    socket.on("user_stop_typing", handleStopTyping);
    socket.on("messages_read",    handleRead);

    // Subscribe to global online users (fixes timing bug — gets current state immediately)
    const unsubOnline = subscribeToOnlineUsers((ids) => setOnlineUsers(ids.map(String)));

    loadHistory();

    return () => {
      socket.off("connect",          handleConnect);
      socket.off("disconnect",       handleDisconnect);
      socket.off("new_message",      handleNewMessage);
      socket.off("user_typing",      handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      socket.off("messages_read",    handleRead);
      unsubOnline();
      clearTimeout(typingTimer.current);
    };
  }, [projectId, supervisorId, authUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/chat/project/${projectId}`);
      setMessages(res.data.data.messages || []);
      getSocket()?.emit("mark_read", { projectId: String(projectId), senderId: String(supervisorId) });
    } catch (e) {
      console.error("Failed to load chat history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() || !supervisorId || !projectId || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    clearTimeout(typingTimer.current);
    getSocket()?.emit("stop_typing", { projectId: String(projectId), receiverId: String(supervisorId) });

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("send_message", { projectId: String(projectId), receiverId: String(supervisorId), text: content });
      setSending(false);
    } else {
      try {
        const res = await axiosInstance.post("/chat/send", { projectId: String(projectId), receiverId: String(supervisorId), text: content });
        setMessages(prev => [...prev, res.data.data.message]);
      } catch { setText(content); }
      finally { setSending(false); }
    }
  }, [text, supervisorId, projectId, sending]);

  const handleTypingEmit = useCallback(() => {
    if (!projectId || !supervisorId) return;
    getSocket()?.emit("typing", { projectId: String(projectId), receiverId: String(supervisorId) });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      getSocket()?.emit("stop_typing", { projectId: String(projectId), receiverId: String(supervisorId) });
    }, 1500);
  }, [projectId, supervisorId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!project) return (
    <div style={{ maxWidth: 680 }}>
      <div className="alert-warning" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>You need an approved project with an assigned supervisor to use the chat feature.</p>
      </div>
    </div>
  );
  if (!supervisor || !supervisorId) return (
    <div style={{ maxWidth: 680 }}>
      <div className="alert-warning" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>No supervisor assigned yet. Chat becomes available once admin assigns a supervisor.</p>
      </div>
    </div>
  );

  let lastDate = "";

  return (
    <div style={{ maxWidth: 740, display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {(supervisor?.name || "S")[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{supervisor?.name || "Supervisor"}</p>
          <p style={{ fontSize: "0.78rem", color: supervisorOnline ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Circle size={7} style={{ fill: supervisorOnline ? "var(--success)" : "var(--text-muted)", color: supervisorOnline ? "var(--success)" : "var(--text-muted)" }}/>
            {supervisorOnline ? "Online" : "Offline"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project?.title}
          </p>
          <p style={{ fontSize: "0.68rem", marginTop: 2, color: connected ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>
            ● {connected ? "Connected" : "Reconnecting…"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg-base)", border: "1px solid var(--border)", borderTop: "none", borderBottom: "none", padding: "1rem" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <Loader size={26} style={{ color: "var(--accent)" }} className="animate-spin"/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <MessageSquare size={40} style={{ opacity: 0.25 }}/>
            <p style={{ fontWeight: 600 }}>No messages yet</p>
            <p style={{ fontSize: "0.875rem" }}>Start the conversation with your supervisor!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe    = String(msg.sender?._id || msg.sender) === String(authUser?._id);
            const msgDate = fmtDate(msg.createdAt);
            const showDate = msgDate !== lastDate;
            if (showDate) lastDate = msgDate;
            return (
              <div key={msg._id || i}>
                {showDate && (
                  <div style={{ textAlign: "center", margin: "1rem 0 0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 999, padding: "0.2rem 0.85rem" }}>
                      {msgDate}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.6rem", alignItems: "flex-end", gap: "0.5rem" }}>
                  {!isMe && (
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                      {(msg.sender?.name || "S")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ maxWidth: "72%" }}>
                    {!isMe && <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{msg.sender?.name}</p>}
                    <div style={{ padding: "0.625rem 0.9rem", borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: isMe ? "linear-gradient(135deg, var(--accent), #7c3aed)" : "var(--bg-card)", border: isMe ? "none" : "1px solid var(--border)", color: isMe ? "#fff" : "var(--text-primary)", fontSize: "0.875rem", lineHeight: 1.6, wordBreak: "break-word", boxShadow: "var(--shadow-sm)" }}>
                      {msg.text || msg.content}
                    </div>
                    <p style={{ fontSize: "0.68rem", color: "var(--text-faint)", marginTop: "0.2rem", textAlign: isMe ? "right" : "left" }}>
                      {fmt(msg.createdAt)}{isMe && msg.isRead ? " · ✓✓" : isMe ? " · ✓" : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)", animation: `chatBounce 1.2s infinite ${i*0.2}s` }}/>)}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{supervisor?.name?.split(" ")[0]} is typing…</p>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "0.75rem 1rem", display: "flex", gap: "0.625rem", alignItems: "flex-end", flexShrink: 0 }}>
        <textarea ref={inputRef} value={text} onChange={e => { setText(e.target.value); handleTypingEmit(); }} onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)" rows={1}
          style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem 0.875rem", color: "var(--text-primary)", fontSize: "0.875rem", resize: "none", minHeight: 44, maxHeight: 120, outline: "none", lineHeight: 1.5, fontFamily: "inherit", transition: "border-color 0.15s" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending} className="btn-primary" style={{ padding: "0.625rem 1rem", flexShrink: 0, minWidth: 46 }}>
          {sending ? <Loader size={15} className="animate-spin"/> : <Send size={15}/>}
        </button>
      </div>

      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
