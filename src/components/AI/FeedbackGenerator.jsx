import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const TYPES = [
  { id:"positive", label:"Positive",  desc:"Highlight strengths & achievements", icon:"👍", hex:"#22c55e", lightBg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)",  textColor:"#22c55e" },
  { id:"general",  label:"General",   desc:"Balanced review with improvements",  icon:"📝", hex:"#2563eb", lightBg:"rgba(37,99,235,0.08)",  border:"rgba(37,99,235,0.25)",  textColor:"var(--accent)" },
  { id:"negative", label:"Critical",  desc:"Focus on areas needing improvement", icon:"⚠️", hex:"#f59e0b", lightBg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", textColor:"#f59e0b" },
];

export default function FeedbackGenerator({ projectId }) {
  const [loading,      setLoading]      = useState(false);
  const [feedbackType, setFeedbackType] = useState("general");
  const [result,       setResult]       = useState(null);
  const [history,      setHistory]      = useState([]);
  const [error,        setError]        = useState(null);
  const [copied,       setCopied]       = useState(false);

  const generate = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axiosInstance.post(`/ai/generate-feedback/${projectId}`, { feedbackType });
      setResult(res.data);
      setHistory(p => [...p, feedbackType]);
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed. Please try again.");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result?.feedback?.message) { navigator.clipboard.writeText(result.feedback.message); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  const activeType = TYPES.find(t => t.id === feedbackType);
  const counts = { positive: history.filter(h=>h==="positive").length, general: history.filter(h=>h==="general").length, negative: history.filter(h=>h==="negative").length };
  const pieData = [
    { name:"Positive", value:counts.positive, fill:"#22c55e" },
    { name:"General",  value:counts.general,  fill:"#2563eb" },
    { name:"Critical", value:counts.negative, fill:"#f59e0b" },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <div style={{ width:40, height:40, background:"var(--accent)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </div>
        <div>
          <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>AI Feedback Generator</p>
          <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>Generates structured academic feedback from real project data</p>
        </div>
      </div>

      {/* Session stats */}
      {history.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.625rem" }}>
          {[{ label:"Generated",value:history.length,color:"#6366f1" },{ label:"Positive",value:counts.positive,color:"#22c55e" },{ label:"General",value:counts.general,color:"var(--accent)" },{ label:"Critical",value:counts.negative,color:"#f59e0b" }].map(s => (
            <div key={s.label} className="card" style={{ padding:"0.875rem", textAlign:"center" }}>
              <p style={{ fontSize:"1.5rem", fontWeight:900, color:s.color }}>{s.value}</p>
              <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:2 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Type selector */}
      <div className="card" style={{ padding:"1.125rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
        <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Select Feedback Type</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.625rem" }}>
          {TYPES.map(type => (
            <button key={type.id} onClick={()=>{setFeedbackType(type.id);setResult(null);}}
              style={{ display:"flex", alignItems:"flex-start", gap:"0.625rem", padding:"0.875rem", borderRadius:10, border:`2px solid ${feedbackType===type.id ? type.hex : "var(--border-default)"}`, background: feedbackType===type.id ? type.lightBg : "transparent", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
              <span style={{ fontSize:"1.25rem", flexShrink:0 }}>{type.icon}</span>
              <div>
                <p style={{ fontWeight:700, color: feedbackType===type.id ? type.textColor : "var(--text-primary)", fontSize:"0.875rem" }}>{type.label}</p>
                <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginTop:2, lineHeight:1.5 }}>{type.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={loading}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.625rem", background: loading ? "var(--border-default)" : "var(--accent)", color:"#fff", border:"none", borderRadius:9, fontWeight:600, fontSize:"0.875rem", cursor: loading ? "not-allowed":"pointer", transition:"background 0.15s" }}>
          {loading ? <><div className="spinner"/>Generating {activeType?.label} Feedback…</> : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Generate {activeType?.label} Feedback</>}
        </button>
      </div>

      {error && <div className="alert-danger">{error}</div>}

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div className="alert-success" style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Feedback generated and saved to the project successfully.
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"1rem" }}>
            {/* Feedback card */}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"0.75rem 1rem", background:`${activeType?.hex}15`, borderBottom:`1px solid ${activeType?.hex}30`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span style={{ fontSize:"1.1rem" }}>{activeType?.icon}</span>
                  <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.875rem" }}>{result.feedback.title}</p>
                  <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:99, background:activeType?.lightBg, color:activeType?.textColor, border:`1px solid ${activeType?.border}` }}>{activeType?.label}</span>
                </div>
                <button onClick={copy} style={{ fontSize:"0.75rem", color:"var(--text-muted)", background:"var(--bg-elevated)", border:"1px solid var(--border-default)", padding:"0.2rem 0.5rem", borderRadius:6, cursor:"pointer" }}>
                  {copied ? <span style={{ color:"var(--green-text)" }}>✓ Copied!</span> : "Copy"}
                </button>
              </div>
              <div style={{ padding:"1rem 1.125rem", display:"flex", gap:"0.625rem" }}>
                <div style={{ width:3, background:activeType?.hex, borderRadius:99, flexShrink:0 }}/>
                <p style={{ fontSize:"0.9rem", color:"var(--text-primary)", lineHeight:1.7 }}>{result.feedback.message}</p>
              </div>
              <div style={{ padding:"0.625rem 1rem", background:"var(--bg-elevated)", borderTop:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Saved to project record automatically</p>
                <button onClick={()=>setResult(null)} style={{ fontSize:"0.78rem", color:"var(--accent)", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>Generate another →</button>
              </div>
            </div>

            {/* Session donut */}
            <div className="card" style={{ padding:"1rem", display:"flex", flexDirection:"column", alignItems:"center" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.75rem", alignSelf:"flex-start" }}>Session</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={48} innerRadius={28} dataKey="value" strokeWidth={2} stroke="var(--bg-card)">
                        {pieData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                      </Pie>
                      <Tooltip formatter={(v,n)=>[`${v} generated`,n]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display:"flex", alignItems:"center", gap:"0.5rem", width:"100%", marginTop:4 }}>
                      <span style={{ width:9, height:9, borderRadius:"50%", background:d.fill, flexShrink:0 }}/>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-secondary)", flex:1 }}>{d.name}</span>
                      <span style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-primary)" }}>{d.value}</span>
                    </div>
                  ))}
                </>
              ) : <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", textAlign:"center" }}>Generate more to see breakdown</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
