import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, PieChart, Pie, Legend } from "recharts";

function SimilarityRing({ score, size=70 }) {
  const color = score >= 60 ? "#ef4444" : score >= 30 ? "#f59e0b" : "#22c55e";
  const r = size/2 - 6, cx = size/2, cy = size/2, circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setAnim(score/100),200); return ()=>clearTimeout(t); }, [score]);
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-default)" strokeWidth={6}/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ*(1-anim)}
        style={{ transform:"rotate(-90deg)", transformOrigin:`${cx}px ${cy}px`, transition:"stroke-dashoffset 0.9s ease" }}/>
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="800" fill={color}>{score}%</text>
    </svg>
  );
}

const RISK = {
  High:   { hex:"#ef4444", bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#ef4444" },
  Medium: { hex:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#f59e0b" },
  Low:    { hex:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)",  text:"#22c55e" },
};

const BarTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border-default)", borderRadius:8, padding:"8px 12px", maxWidth:180 }}>
      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:13 }}>{label}</p>
      <p style={{ fontWeight:700, color:payload[0]?.fill, fontSize:13 }}>{payload[0]?.value}% similarity</p>
    </div>
  ) : null;

export default function PlagiarismChecker({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);

  const check = async () => {
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axiosInstance.get(`/ai/check-plagiarism/${projectId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Check failed. Please try again.");
    } finally { setLoading(false); }
  };

  const os = data ? (RISK[data.overallRisk] || RISK.Low) : null;
  const barData = data?.comparisons?.slice(0,8).map(c => ({
    name: c.projectTitle?.length > 18 ? c.projectTitle.slice(0,18)+"…" : c.projectTitle,
    value: c.similarityScore, fill: c.similarityScore>=60?"#ef4444":c.similarityScore>=30?"#f59e0b":"#22c55e",
    full: c.projectTitle,
  })) || [];

  const high = data?.comparisons?.filter(c=>c.similarityLevel==="High").length   || 0;
  const med  = data?.comparisons?.filter(c=>c.similarityLevel==="Medium").length || 0;
  const low  = data?.comparisons?.filter(c=>c.similarityLevel==="Low").length    || 0;
  const pieData = [{name:"High",value:high,fill:"#ef4444"},{name:"Medium",value:med,fill:"#f59e0b"},{name:"Low",value:low,fill:"#22c55e"}].filter(d=>d.value>0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:40, height:40, background:"var(--accent)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>Plagiarism & Similarity Checker</p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>TF-IDF + Cosine Similarity · Pure Python · No external API</p>
          </div>
        </div>
        <button onClick={check} disabled={loading} className="btn-primary">
          {loading ? <><div className="spinner"/>Scanning…</> : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>Run Check</>}
        </button>
      </div>

      {error && <div className="alert-danger" style={{ display:"flex", gap:"0.5rem", alignItems:"flex-start" }}><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0,marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><div><strong>Check Failed</strong> — {error}</div></div>}

      {!data && !loading && !error && (
        <div style={{ border:"2px dashed var(--border-default)", borderRadius:12, padding:"3rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, background:"var(--accent-light)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="26" height="26" fill="none" stroke="var(--accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>Ready to Scan</p>
          <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4 }}>Compare this project against all others in the system</p>
        </div>
      )}

      {data && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {/* Banner */}
          <div style={{ borderRadius:12, border:`1px solid ${os.border}`, padding:"1.125rem", background:os.bg }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
                <div style={{ width:52, height:52, borderRadius:10, background:"var(--bg-card)", border:`1px solid ${os.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="26" height="26" fill="none" stroke={os.hex} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>Overall Risk</p>
                  <p style={{ fontSize:"1.625rem", fontWeight:900, color:os.hex }}>{data.overallRisk}</p>
                  <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{data.comparisons?.length||0} projects scanned</p>
                </div>
              </div>
              <span style={{ fontSize:"0.875rem", fontWeight:700, padding:"0.375rem 0.875rem", borderRadius:99, border:`1px solid ${os.border}`, color:os.hex, background:"var(--bg-card)" }}>{data.overallRisk} Risk</span>
            </div>
            <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", marginTop:"0.875rem", lineHeight:1.6 }}>{data.summary}</p>
          </div>

          {/* Charts */}
          {data.comparisons?.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"1rem" }}>
              <div className="card" style={{ padding:"1.125rem" }}>
                <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.875rem" }}>Similarity Scores</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} layout="vertical" margin={{ top:4, right:40, left:4, bottom:4 }} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false}/>
                    <XAxis type="number" domain={[0,100]} tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"var(--text-secondary)" }} axisLine={false} tickLine={false} width={80}/>
                    <Tooltip content={<BarTip/>} cursor={{ fill:"var(--bg-elevated)" }}/>
                    <Bar dataKey="value" radius={[0,6,6,0]} label={{ position:"right", fontSize:11, formatter:v=>`${v}%`, fill:"var(--text-muted)" }}>
                      {barData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card" style={{ padding:"1.125rem" }}>
                <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.875rem" }}>Risk Distribution</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={68} innerRadius={38} dataKey="value" strokeWidth={2} stroke="var(--bg-card)">
                      {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n)=>[`${v} project(s)`,n]}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", justifyContent:"center", gap:"1rem", marginTop:6 }}>
                  {[["#ef4444","High"],["#f59e0b","Medium"],["#22c55e","Low"]].map(([c,l])=>(
                    <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ width:9, height:9, borderRadius:"50%", background:c, flexShrink:0 }}/>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Detail list */}
          {data.comparisons?.length > 0 ? (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"0.75rem 1rem", borderBottom:"1px solid var(--border-subtle)", display:"flex", justifyContent:"space-between" }}>
                <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Detailed Comparison</p>
                <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{data.comparisons.length} projects</span>
              </div>
              {data.comparisons.map((item,i) => {
                const s = RISK[item.similarityLevel] || RISK.Low;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"0.875rem 1rem", borderBottom:"1px solid var(--border-subtle)", transition:"background 0.12s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="var(--bg-elevated)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", width:20, flexShrink:0 }}>#{i+1}</span>
                    <SimilarityRing score={item.similarityScore}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.875rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.projectTitle}</p>
                      <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>{item.reason}</p>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <span style={{ fontSize:"0.72rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:99, background:s.bg, color:s.text, border:`1px solid ${s.border}` }}>{item.similarityLevel}</span>
                      <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:3 }}>by {item.studentName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding:"2.5rem", textAlign:"center" }}>
              <div style={{ width:52, height:52, background:"var(--green-light)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
                <svg width="26" height="26" fill="none" stroke="var(--green-text)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p style={{ fontWeight:700, color:"var(--green-text)", fontSize:"0.9rem" }}>Project is Unique</p>
              <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4 }}>No similar projects found in the system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
