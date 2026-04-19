import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, PieChart, Pie,
} from "recharts";

function GaugeRing({ score, color, size = 160 }) {
  const r = size / 2 - 14;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const [anim, setAnim] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnim(score / 100), 250); return () => clearTimeout(t); }, [score]);
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - anim)}
        style={{ transform:`rotate(-90deg)`, transformOrigin:`${cx}px ${cy}px`, transition:"stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="34" fontWeight="900" fill={color}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text-muted)">/100</text>
    </svg>
  );
}

const RISK = {
  Low:    { hex:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)",  text:"#22c55e" },
  Medium: { hex:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", text:"#f59e0b" },
  High:   { hex:"#ef4444", bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  text:"#ef4444" },
};

const Tip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:13 }}>{label}</p>
      <p style={{ fontWeight:700, color:"var(--accent)", fontSize:13 }}>{payload[0]?.value}</p>
    </div>
  ) : null;

export default function ProgressAnalyzer({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);

  const analyze = async () => {
    if (!projectId) { setError("No project found. Submit a proposal first."); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axiosInstance.get(`/ai/analyze-progress/${projectId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Analysis failed. Make sure the Python AI service is running on port 8001.");
    } finally { setLoading(false); }
  };

  const r = data ? (RISK[data.riskLevel] || RISK.Low) : null;

  // Build chart data — use real milestone stats if available, else fallback to legacy deadlines
  const statsData = data ? (() => {
    const s = data.stats;
    const hasMilestones = (s.totalMilestones ?? 0) > 0;
    if (hasMilestones) {
      return [
        { name:"Approved",   value: s.approvedMilestones   ?? 0, fill:"#22c55e" },
        { name:"Submitted",  value: s.submittedMilestones  ?? 0, fill:"#3b82f6" },
        { name:"Overdue",    value: s.overdueMilestones    ?? 0, fill: (s.overdueMilestones ?? 0) > 0 ? "#ef4444" : "#22c55e" },
        { name:"Active",     value: s.activeMilestones     ?? 0, fill:"#f59e0b" },
        { name:"Upcoming",   value: s.upcomingMilestones   ?? 0, fill:"#8b5cf6" },
        { name:"Files",      value: s.filesUploaded        ?? 0, fill:"#10b981" },
        { name:"Feedback",   value: s.feedbackCount        ?? 0, fill:"#f59e0b" },
        { name:"Days Left",  value: Math.max(s.daysUntilDeadline ?? 0, 0), fill: (s.daysUntilDeadline ?? 99) < 7 ? "#ef4444" : "#6366f1" },
      ];
    }
    // Legacy fallback
    return [
      { name:"Deadlines",  value: s.totalDeadlines  ?? 0, fill:"#6366f1" },
      { name:"Overdue",    value: s.overdueCount     ?? 0, fill: (s.overdueCount ?? 0) > 0 ? "#ef4444" : "#22c55e" },
      { name:"Upcoming",   value: s.upcomingCount    ?? 0, fill:"#0ea5e9" },
      { name:"Files",      value: s.filesUploaded    ?? 0, fill:"#10b981" },
      { name:"Feedback",   value: s.feedbackCount    ?? 0, fill:"#f59e0b" },
      { name:"Days Left",  value: Math.max(s.daysUntilDeadline ?? 0, 0), fill: (s.daysUntilDeadline ?? 99) < 7 ? "#ef4444" : "#8b5cf6" },
    ];
  })() : [];

  const pieData = data ? [
    { value: data.riskScore,        fill: r.hex },
    { value: 100 - data.riskScore,  fill: "var(--border)" },
  ] : [];

  const hasMilestones = data && (data.stats.totalMilestones ?? 0) > 0;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:40, height:40, background:"var(--accent)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>AI Progress Risk Analyzer</p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>
              Weighted Scoring · Real milestone + file data
            </p>
          </div>
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary">
          {loading
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing…</>
            : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Run Analysis</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-danger" style={{ display:"flex", gap:"0.625rem", alignItems:"flex-start" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div><p style={{ fontWeight:600, marginBottom:2 }}>Analysis Failed</p><p style={{ fontSize:"0.85rem" }}>{error}</p></div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div style={{ border:"2px dashed var(--border)", borderRadius:12, padding:"3rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, background:"var(--accent-light)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="26" height="26" fill="none" stroke="var(--accent)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>Ready to Analyze</p>
          <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4 }}>
            Click Run Analysis — now uses real milestone completion, overdue, and file data
          </p>
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Hero card */}
          <div style={{ borderRadius:12, border:`1px solid ${r.border}`, padding:"1.25rem", background:r.bg }}>
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"1.5rem" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <GaugeRing score={data.riskScore} color={r.hex} size={160} />
                <p style={{ fontSize:"0.75rem", fontWeight:700, color:r.hex, marginTop:-4 }}>Risk Score</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <PieChart width={110} height={110}>
                  <Pie data={pieData} cx={51} cy={51} innerRadius={30} outerRadius={48} startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
                    {pieData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                  </Pie>
                </PieChart>
                <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:-4 }}>Score split</p>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.625rem", marginBottom:"0.625rem", flexWrap:"wrap" }}>
                  <p style={{ fontSize:"1.75rem", fontWeight:900, color:r.hex }}>{data.riskLevel} Risk</p>
                  <span style={{ fontSize:"0.8rem", fontWeight:700, padding:"0.25rem 0.75rem", borderRadius:99, border:`1px solid ${r.border}`, color:r.hex, background:"var(--bg-card)" }}>{data.prediction}</span>
                </div>
                <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.6, marginBottom:"0.75rem" }}>{data.description}</p>
                <div style={{ borderRadius:8, border:`1px solid ${r.border}`, padding:"0.625rem 0.875rem", background:"var(--bg-card)" }}>
                  <p style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>⚡ Action Required</p>
                  <p style={{ fontSize:"0.85rem", color:"var(--text-primary)", lineHeight:1.6 }}>{data.actionRequired}</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop:"1rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", marginBottom:6 }}>
                <span style={{ color:"var(--text-muted)" }}>Risk Score Progress</span>
                <span style={{ fontWeight:700, color:r.hex }}>{data.riskScore} / 100</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width:`${data.riskScore}%`, background:r.hex, transition:"width 1s ease" }}/>
              </div>
            </div>
          </div>

          {/* Milestone summary pills — only shown if milestone data exists */}
          {hasMilestones && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))", gap:"0.625rem" }}>
              {[
                { label:"Total",     value: data.stats.totalMilestones,    color:"#6366f1" },
                { label:"Approved",  value: data.stats.approvedMilestones, color:"#22c55e" },
                { label:"Submitted", value: data.stats.submittedMilestones,color:"#3b82f6" },
                { label:"Overdue",   value: data.stats.overdueMilestones,  color:"#ef4444" },
                { label:"Completion",value: `${data.stats.milestoneCompletionRate}%`, color: data.stats.milestoneCompletionRate >= 70 ? "#22c55e" : data.stats.milestoneCompletionRate >= 40 ? "#f59e0b" : "#ef4444" },
              ].map((item, i) => (
                <div key={i} style={{ background:"var(--bg-card)", border:`1px solid var(--border)`, borderRadius:10, padding:"0.75rem", textAlign:"center" }}>
                  <p style={{ fontSize:"1.4rem", fontWeight:900, color: item.color, lineHeight:1 }}>{item.value}</p>
                  <p style={{ fontSize:"0.7rem", color:"var(--text-muted)", fontWeight:600, marginTop:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bar chart */}
          <div className="card" style={{ padding:"1.125rem" }}>
            <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
              {hasMilestones ? "Weekly Milestone Breakdown" : "Project Stats Overview"}
            </p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginBottom:"1rem" }}>
              {hasMilestones ? "Real milestone data from your project" : "Hover each bar for details"}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statsData} margin={{ top:4, right:8, left:-20, bottom:4 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<Tip/>} cursor={{ fill:"var(--bg-elevated)" }}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {statsData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Factors */}
          {data.factors?.length > 0 && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"1rem" }}>Key Risk Factors</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {data.factors.map((f,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <span style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background: f.impact==="positive" ? "#22c55e" : "#ef4444" }}/>
                    <span style={{ fontSize:"0.875rem", color:"var(--text-primary)", flex:1 }}>{f.factor}</span>
                    <div style={{ width:100, height:6, background:"var(--border)", borderRadius:99, flexShrink:0 }}>
                      <div style={{ height:"100%", borderRadius:99, background: f.impact==="positive" ? "#22c55e" : "#ef4444", width: f.weight==="high"?"90%":f.weight==="medium"?"60%":"35%", transition:"width 0.7s ease" }}/>
                    </div>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, padding:"0.15rem 0.45rem", borderRadius:99, flexShrink:0,
                      background: f.weight==="high"?"rgba(239,68,68,0.12)":f.weight==="medium"?"rgba(245,158,11,0.12)":"var(--border)",
                      color: f.weight==="high"?"#ef4444":f.weight==="medium"?"#f59e0b":"var(--text-muted)" }}>
                      {f.weight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--text-muted)" }}>{data.algorithm} · Python AI Microservice</p>
        </div>
      )}
    </div>
  );
}
