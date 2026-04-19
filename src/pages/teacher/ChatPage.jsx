import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { connectSocket, getSocket, subscribeToOnlineUsers } from "../../lib/socket";
import { Send, Loader, MessageSquare, Circle, Users, ChevronLeft, AlertCircle } from "lucide-react";

const fmt     = (d) => d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" }) : "";

// Avatar colors for group members
const AVATAR_COLORS = [
  "linear-gradient(135deg,#2563eb,#7c3aed)",
  "linear-gradient(135deg,#0891b2,#2563eb)",
  "linear-gradient(135deg,#16a34a,#0891b2)",
  "linear-gradient(135deg,#d97706,#dc2626)",
  "linear-gradient(135deg,#7c3aed,#db2777)",
];

const ChatWindow = ({ student, authUser, onBack }) => {
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState("");
  const [loading,     setLoading]     = useState(true);
  const [sending,     setSending]     = useState(false);
  const [isTyping,    setIsTyping]    = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected,   setConnected]   = useState(false);

  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);

  const projectId = student?.project?._id || student?.project;
  const studentId = student?._id;
  const studentOnline = studentId && onlineUsers.includes(String(studentId));

  useEffect(() => {
    if (!projectId || !studentId) { setLoading(false); return; }

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

    // Use global online users subscription (fixes the timing/offline bug)
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
  }, [projectId, studentId, authUser?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/chat/project/${projectId}`);
      setMessages(res.data.data.messages || []);
      getSocket()?.emit("mark_read", { projectId: String(projectId), senderId: String(studentId) });
    } catch (e) { console.error("Failed to load history", e); }
    finally { setLoading(false); }
  };

  const handleSend = useCallback(async () => {
    if (!text.trim() || !studentId || !projectId || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    clearTimeout(typingTimer.current);
    getSocket()?.emit("stop_typing", { projectId: String(projectId), receiverId: String(studentId) });

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("send_message", { projectId: String(projectId), receiverId: String(studentId), text: content });
      setSending(false);
    } else {
      try {
        const res = await axiosInstance.post("/chat/send", { projectId: String(projectId), receiverId: String(studentId), text: content });
        setMessages(prev => [...prev, res.data.data.message]);
      } catch { setText(content); }
      finally { setSending(false); }
    }
  }, [text, studentId, projectId, sending]);

  const handleTypingEmit = useCallback(() => {
    if (!projectId || !studentId) return;
    getSocket()?.emit("typing", { projectId: String(projectId), receiverId: String(studentId) });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      getSocket()?.emit("stop_typing", { projectId: String(projectId), receiverId: String(studentId) });
    }, 1500);
  }, [projectId, studentId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  let lastDate = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem", display: "flex" }}>
            <ChevronLeft size={20}/>
          </button>
        )}
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {(student?.name || "S")[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>{student?.name}</p>
          <p style={{ fontSize: "0.78rem", color: studentOnline ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Circle size={7} style={{ fill: studentOnline ? "var(--success)" : "var(--text-muted)", color: studentOnline ? "var(--success)" : "var(--text-muted)" }}/>
            {studentOnline ? "Online" : "Offline"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {student?.project?.title || student?.groupName || "Project"}
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
            <p style={{ fontSize: "0.875rem" }}>Start the conversation with {student?.name}!</p>
          </div>
        ) : messages.map((msg, i) => {
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
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
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
        })}
        {isTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-muted)", animation: `chatBounce 1.2s infinite ${i*0.2}s` }}/>)}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{student?.name?.split(" ")[0]} is typing…</p>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "0.75rem 1rem", display: "flex", gap: "0.625rem", alignItems: "flex-end", flexShrink: 0 }}>
        <textarea value={text} onChange={e => { setText(e.target.value); handleTypingEmit(); }} onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)" rows={1}
          style={{ flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.625rem 0.875rem", color: "var(--text-primary)", fontSize: "0.875rem", resize: "none", minHeight: 44, maxHeight: 120, outline: "none", lineHeight: 1.5, fontFamily: "inherit" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending} className="btn-primary" style={{ padding: "0.625rem 1rem", flexShrink: 0, minWidth: 46 }}>
          {sending ? <Loader size={15} className="animate-spin"/> : <Send size={15}/>}
        </button>
      </div>
    </div>
  );
};

// ── Main teacher chat — shows ALL group members, not just leaders ──────────────
const TeacherChatPage = () => {
  const { authUser } = useSelector(s => s.auth);
  const [students,  setStudents]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    loadStudents();
    connectSocket();
    const unsub = subscribeToOnlineUsers(setOnlineUsers);
    return () => unsub();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // This endpoint now returns ALL group members (fixed in teacherController)
      const res = await axiosInstance.get("/teacher/assigned-students");
      const list = res.data.data?.students || [];
      setStudents(list);
      if (list.length === 1) setSelected(list[0]);
    } catch (e) { console.error("Failed to load students", e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin"/>
    </div>
  );

  if (!students.length) return (
    <div style={{ maxWidth: 600 }}>
      <div className="alert-info" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }}/>
        <p>No students assigned yet. Chat will be available once students are assigned to you.</p>
      </div>
    </div>
  );

  if (selected) {
    return (
      <div className="fade-in" style={{ maxWidth: 740 }}>
        <ChatWindow
          student={selected}
          authUser={authUser}
          onBack={students.length > 1 ? () => setSelected(null) : null}
        />
        <style>{`
          @keyframes chatBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
        `}</style>
      </div>
    );
  }

  // Group students by their project
  const byProject = students.reduce((acc, s) => {
    const pId = s.project?._id || s.project || "no-project";
    const pTitle = s.project?.title || s.groupName || "Unknown Project";
    if (!acc[pId]) acc[pId] = { title: pTitle, members: [] };
    acc[pId].members.push(s);
    return acc;
  }, {});

  return (
    <div className="fade-in" style={{ maxWidth: 740 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Student Chats</h1>
        <p className="page-subtitle">All students across your supervised projects — including every group member.</p>
      </div>

      {Object.entries(byProject).map(([pId, { title, members }]) => (
        <div key={pId} style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Users size={14} style={{ color: "var(--accent)" }}/>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {members.map((s, idx) => {
              const isOnline = onlineUsers.includes(String(s._id));
              const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              return (
                <div key={s._id} onClick={() => setSelected(s)}
                  className="card"
                  style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateX(2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateX(0)"; }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                      {(s.name || "S")[0]?.toUpperCase()}
                    </div>
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: isOnline ? "var(--success)" : "var(--text-faint)", border: "2px solid var(--bg-card)" }}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{s.name}</p>
                      {s.isGroupLeader && (
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}>Leader</span>
                      )}
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{s.email}</p>
                    <p style={{ fontSize: "0.73rem", color: isOnline ? "var(--success)" : "var(--text-faint)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Circle size={6} style={{ fill: isOnline ? "var(--success)" : "var(--text-faint)", color: isOnline ? "var(--success)" : "var(--text-faint)" }}/>
                      {isOnline ? "Online now" : "Offline"}
                    </p>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <MessageSquare size={13}/> Chat
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default TeacherChatPage;
