import { useState, useRef, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";

const ChatbotTab = ({ projectId }) => {
  const [messages, setMessages] = useState([
    { role:"bot", text:"Hello! 👋 I'm your **ProjectHub AI Assistant**.\n\nAsk me about your deadlines, progress, files, feedback, or tips to improve your project!", time:new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const SUGGESTIONS = ["What is my progress?","When is my deadline?","How many files uploaded?","Do I have feedback?","Give me tips"];

  const send = async (msg) => {
    const text = (msg || input).trim();
    if (!text) return;
    setInput("");
    setMessages(p => [...p, { role:"user", text, time:new Date() }]);
    setLoading(true);
    try {
      const res = await axiosInstance.post("/ai/chatbot", { message:text, projectId: projectId || null });
      setMessages(p => [...p, { role:"bot", text:res.data.reply, time:new Date() }]);
    } catch {
      setMessages(p => [...p, { role:"bot", text:"⚠️ AI service error. Make sure Python service is running on port 8001.", time:new Date(), error:true }]);
    } finally { setLoading(false); }
  };

  const fmtTime = (d) => d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  const renderText = (text) =>
    text.split("\n").map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2,-2)}</strong> : p
      );
      return <span key={i}>{parts}{i < text.split("\n").length - 1 && <br/>}</span>;
    });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:520 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.875rem" }}>
        <div style={{ width:36, height:36, background:"var(--accent)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>ProjectHub AI Chatbot</p>
          <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Python NLP · Uses your real project data</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"0.25rem 0.625rem", background:"var(--green-light)", border:"1px solid rgba(22,163,74,0.2)", borderRadius:99 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--green-text)", animation:"pulse 2s infinite" }}/>
          <span style={{ fontSize:"0.72rem", color:"var(--green-text)", fontWeight:600 }}>AI Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", background:"var(--bg-elevated)", border:"1px solid var(--border-subtle)", borderRadius:10, padding:"0.875rem", display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"0.75rem" }}>
        {messages.map((msg,i) => (
          <div key={i} style={{ display:"flex", gap:"0.5rem", flexDirection: msg.role==="user" ? "row-reverse" : "row" }}>
            <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background: msg.role==="user" ? "var(--accent)" : "var(--bg-card)", border: msg.role==="user" ? "none" : "1px solid var(--border-subtle)" }}>
              {msg.role==="user"
                ? <svg width="13" height="13" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                : <svg width="13" height="13" fill="none" stroke="var(--accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>}
            </div>
            <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", alignItems: msg.role==="user" ? "flex-end" : "flex-start" }}>
              <div style={{ padding:"0.5rem 0.875rem", borderRadius: msg.role==="user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", fontSize:"0.875rem", lineHeight:1.6,
                background: msg.role==="user" ? "var(--accent)" : msg.error ? "var(--red-light)" : "var(--bg-card)",
                color: msg.role==="user" ? "#fff" : msg.error ? "var(--red-text)" : "var(--text-primary)",
                border: msg.role==="user" ? "none" : `1px solid var(--border-subtle)` }}>
                {renderText(msg.text)}
              </div>
              <span style={{ fontSize:"0.67rem", color:"var(--text-disabled)", marginTop:3, padding:"0 4px" }}>{fmtTime(msg.time)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"var(--bg-card)", border:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="13" height="13" fill="none" stroke="var(--accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
            <div style={{ padding:"0.5rem 0.875rem", borderRadius:"12px 12px 12px 3px", background:"var(--bg-card)", border:"1px solid var(--border-subtle)" }}>
              <div style={{ display:"flex", gap:4, alignItems:"center", height:14 }}>
                {[0,1,2].map(i => <span key={i} style={{ width:7, height:7, borderRadius:"50%", background:"var(--accent)", opacity:0.7, animation:`bounce 1.2s infinite ${i*0.2}s` }}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      <div style={{ display:"flex", gap:"0.5rem", overflowX:"auto", paddingBottom:"0.5rem", marginBottom:"0.625rem" }}>
        {SUGGESTIONS.map((s,i) => (
          <button key={i} onClick={() => send(s)} disabled={loading}
            style={{ flexShrink:0, fontSize:"0.78rem", fontWeight:500, color:"var(--accent)", background:"var(--accent-light)", border:"1px solid rgba(37,99,235,0.2)", padding:"0.3rem 0.75rem", borderRadius:99, cursor:"pointer", whiteSpace:"nowrap", opacity: loading ? 0.5 : 1 }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:"0.5rem" }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && send()}
          placeholder="Ask about your project..." disabled={loading}
          className="input" style={{ flex:1 }}/>
        <button onClick={() => send()} disabled={loading || !input.trim()} className="btn-primary btn-icon" style={{ flexShrink:0, width:42, height:42, padding:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>

      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
    </div>
  );
};
export default ChatbotTab;
