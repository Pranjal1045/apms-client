import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../../lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "../../store/slices/studentSlice";

const ChatbotPage = () => {
  const dispatch = useDispatch();
  const { project } = useSelector((state) => state.student);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! 👋 I'm your **ProjectHub AI Assistant**.\n\nI can help you with deadlines, progress, files, feedback, and more. Try asking me something!", time: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { dispatch(fetchProject()); }, [dispatch]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const SUGGESTIONS = ["What is my deadline?", "What is my progress score?", "How many files uploaded?", "Do I have any feedback?", "Give me tips to improve"];

  const send = async (msg) => {
    const text = (msg || input).trim();
    if (!text) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text, time: new Date() }]);
    setLoading(true);
    try {
      const res = await axiosInstance.post('/ai/chatbot', { message: text, projectId: project?._id || null });
      setMessages(prev => [...prev, { role: "bot", text: res.data.reply, time: new Date() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ AI service is unavailable. Make sure the Python service is running on port 8001.", time: new Date(), error: true }]);
    } finally { setLoading(false); }
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part.split("\n").map((line, j) => <span key={j}>{line}{j < part.split("\n").length - 1 && <br />}</span>)
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className=" border border-slate-200 rounded-t-2xl p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-primary">ProjectHub AI Chatbot</h2>
          <p className="text-xs text-faint">Python NLP · Intent Detection · Context-aware</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 font-medium">AI Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-elevated border-x border-slate-200 p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-blue-600" : " border border-slate-200"}`}>
              {msg.role === "user"
                ? <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                : <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              }
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" :
                msg.error ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-sm" :
                " border border-slate-200 text-secondary rounded-tl-sm shadow-sm"
              }`}>
                {renderText(msg.text)}
              </div>
              <span className="text-xs text-faint mt-1 px-1">{formatTime(msg.time)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl  border border-slate-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div className=" border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className=" border-x border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => send(s)}
            className="flex-shrink-0 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className=" border border-slate-200 rounded-b-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask me about your project..." disabled={loading}
            className="flex-1 px-4 py-2.5 bg-elevated border border-slate-200 rounded-xl text-sm text-secondary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
