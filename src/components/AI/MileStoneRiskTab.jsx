import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const RISK = {
  Low:    { hex:"#22c55e", bg:"rgba(34,197,94,0.08)",  border:"rgba(34,197,94,0.25)"  },
  Medium: { hex:"#f59e0b", bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)" },
  High:   { hex:"#ef4444", bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)"  },
};

const STATUS_STYLE = {
  approved:  { bg:"#dcfce7", color:"#16a34a", label:"Approved"  },
  submitted: { bg:"#dbeafe", color:"#2563eb", label:"Submitted" },
  rejected:  { bg:"#fee2e2", color:"#dc2626", label:"Rejected"  },
  active:    { bg:"#fef9c3", color:"#ca8a04", label:"Active"    },
  upcoming:  { bg:"#f3f4f6", color:"#6b7280", label:"Upcoming"  },
};

const Tip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:13 }}>{label}</p>
      <p style={{ fontWeight:700, color:"var(--accent)", fontSize:13 }}>{payload[0]?.value}</p>
    </div>
  ) : null;

export default function MilestoneRiskTab({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);

  const analyze = async () => {
    if (!projectId) { setError("No project selected."); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axiosInstance.get(`/ai/milestone-risk/${projectId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Milestone risk analysis failed.");
    } finally { setLoading(false); }
  };

  const r = data ? (RISK[data.riskLevel] || RISK.Medium) : null;

  const chartData = data ? [
    { name:"Approved",   value: data.stats.approved,  fill:"#22c55e" },
    { name:"Submitted",  value: data.stats.submitted, fill:"#3b82f6" },
    { name:"Active",     value: data.stats.active,    fill:"#f59e0b" },
    { name:"Overdue",    value: data.stats.overdue,   fill:"#ef4444" },
    { name:"Rejected",   value: data.stats.rejected,  fill:"#f97316" },
    { name:"Upcoming",   value: data.stats.upcoming,  fill:"#8b5cf6" },
  ] : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:40, height:40, background:"#6366f1", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>Milestone Risk Predictor</p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>
              Analyzes weekly milestone completion, overdue, log entries
            </p>
          </div>
        </div>
        <button onClick={analyze} disabled={loading} className="btn-primary">
          {loading
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyzing…</>
            : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Analyze Milestones</>}
        </button>
      </div>

      {error && (
        <div className="alert-danger" style={{ display:"flex", gap:"0.625rem", alignItems:"flex-start" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p style={{ fontSize:"0.85rem" }}>{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div style={{ border:"2px dashed var(--border)", borderRadius:12, padding:"3rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, background:"#ede9fe", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="26" height="26" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>Milestone Risk Analysis</p>
          <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4 }}>
            Click to analyze weekly milestone health — approved, overdue, rejected, and log entries
          </p>
        </div>
      )}

      {data && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Risk hero */}
          <div style={{ borderRadius:12, border:`1px solid ${r.border}`, padding:"1.25rem", background:r.bg }}>
            <div style={{ display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap", marginBottom:"1rem" }}>
              <div style={{ width:56, height:56, borderRadius:12, background: r.hex + "22", border:`2px solid ${r.hex}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ fontSize:"1.5rem", fontWeight:900, color:r.hex }}>{data.riskScore}</span>
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:4 }}>
                  <p style={{ fontSize:"1.4rem", fontWeight:900, color:r.hex }}>{data.riskLevel} Risk</p>
                  <span style={{ fontSize:"0.78rem", fontWeight:700, padding:"0.2rem 0.65rem", borderRadius:99, border:`1px solid ${r.border}`, color:r.hex, background:"var(--bg-card)" }}>{data.prediction}</span>
                </div>
                <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.5 }}>{data.description}</p>
              </div>
            </div>
            <div style={{ borderRadius:8, border:`1px solid ${r.border}`, padding:"0.625rem 0.875rem", background:"var(--bg-card)" }}>
              <p style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>⚡ Recommended Action</p>
              <p style={{ fontSize:"0.85rem", color:"var(--text-primary)", lineHeight:1.6 }}>{data.actionRequired}</p>
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))", gap:"0.625rem" }}>
            {[
              { label:"Total",      value: data.stats.total,          color:"#6366f1" },
              { label:"Approved",   value: data.stats.approved,       color:"#22c55e" },
              { label:"Submitted",  value: data.stats.submitted,      color:"#3b82f6" },
              { label:"Overdue",    value: data.stats.overdue,        color: data.stats.overdue > 0 ? "#ef4444" : "#22c55e" },
              { label:"Completion", value:`${data.stats.completionRate}%`, color: data.stats.completionRate >= 70 ? "#22c55e" : data.stats.completionRate >= 40 ? "#f59e0b" : "#ef4444" },
              { label:"With Logs",  value: data.stats.withLogs,       color:"#8b5cf6" },
            ].map((item, i) => (
              <div key={i} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.75rem", textAlign:"center" }}>
                <p style={{ fontSize:"1.3rem", fontWeight:900, color:item.color, lineHeight:1 }}>{item.value}</p>
                <p style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:600, marginTop:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="card" style={{ padding:"1.125rem" }}>
            <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"1rem" }}>
              Milestone Status Distribution
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top:4, right:8, left:-20, bottom:4 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<Tip/>} cursor={{ fill:"var(--bg-elevated)" }}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {chartData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Per-milestone table */}
          {data.milestones?.length > 0 && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.875rem" }}>
                Weekly Milestone Detail
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {data.milestones.map((m, i) => {
                  const ss = STATUS_STYLE[m.status] || STATUS_STYLE.active;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.625rem 0.75rem", borderRadius:8, background:"var(--bg-elevated)", border: m.isOverdue ? "1px solid #fecaca" : "1px solid var(--border)" }}>
                      <span style={{ width:28, height:28, borderRadius:6, background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:800, color:"var(--text-muted)", flexShrink:0 }}>
                        W{m.weekNumber}
                      </span>
                      <span style={{ flex:1, fontSize:"0.845rem", fontWeight:600, color:"var(--text-primary)", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {m.title}
                      </span>
                      <span style={{ fontSize:"0.72rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:99, background: ss.bg, color: ss.color, flexShrink:0 }}>
                        {ss.label}
                      </span>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", flexShrink:0 }}>
                        {m.logCount} log{m.logCount !== 1 ? "s" : ""}
                      </span>
                      {m.isOverdue && (
                        <span style={{ fontSize:"0.68rem", fontWeight:700, color:"#dc2626", background:"#fee2e2", padding:"0.1rem 0.4rem", borderRadius:99, flexShrink:0 }}>OVERDUE</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Factors */}
          {data.factors?.length > 0 && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"1rem" }}>Risk Factors</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
                {data.factors.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                    <span style={{ width:9, height:9, borderRadius:"50%", flexShrink:0, background: f.impact==="positive"?"#22c55e":"#ef4444" }}/>
                    <span style={{ fontSize:"0.875rem", color:"var(--text-primary)", flex:1 }}>{f.factor}</span>
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
        </div>
      )}
    </div>
  );
}
