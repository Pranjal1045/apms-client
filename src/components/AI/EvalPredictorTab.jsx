import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const GRADE_COLOR = { "A+":"#16a34a","A":"#22c55e","B+":"#2563eb","B":"#3b82f6","C+":"#d97706","C":"#f59e0b","D":"#ea580c","F":"#dc2626" };
const CONFIDENCE_STYLE = {
  high:   { bg:"#dcfce7", color:"#16a34a", label:"High Confidence"   },
  medium: { bg:"#fef9c3", color:"#ca8a04", label:"Medium Confidence" },
  low:    { bg:"#fee2e2", color:"#dc2626", label:"Low Confidence"    },
  actual: { bg:"#dbeafe", color:"#2563eb", label:"Finalized Score"   },
};

export default function EvalPredictorTab({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);

  const predict = async () => {
    if (!projectId) { setError("No project selected."); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axiosInstance.get(`/ai/predict-evaluation/${projectId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Prediction failed.");
    } finally { setLoading(false); }
  };

  const pred = data?.prediction;
  const scores = pred?.predictedScores || pred?.scores || null;
  const total  = pred?.predictedTotal  ?? pred?.actualScore ?? null;
  const grade  = pred?.predictedGrade  ?? null;
  const gradeColor = grade ? (GRADE_COLOR[grade] || "#6b7280") : "#6b7280";
  const confStyle  = pred ? (CONFIDENCE_STYLE[pred.confidence] || CONFIDENCE_STYLE.medium) : null;

  const radarData = scores ? [
    { subject:"Proposal",   value: scores.proposalQuality   ?? 0, max:25 },
    { subject:"Progress",   value: scores.progressAndEffort ?? 0, max:25 },
    { subject:"Report",     value: scores.reportQuality     ?? 0, max:25 },
    { subject:"Technical",  value: scores.technicalSkill    ?? 0, max:25 },
  ] : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:40, height:40, background:"#0ea5e9", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>Evaluation Score Predictor</p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>
              Predicts scores across all 4 categories based on milestone & file data
            </p>
          </div>
        </div>
        <button onClick={predict} disabled={loading} className="btn-primary">
          {loading
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Predicting…</>
            : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Predict Score</>}
        </button>
      </div>

      {error && (
        <div className="alert-danger" style={{ display:"flex", gap:"0.625rem", alignItems:"flex-start" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink:0, marginTop:1 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p style={{ fontSize:"0.85rem" }}>{error}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div style={{ border:"2px dashed var(--border)", borderRadius:12, padding:"3rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, background:"#e0f2fe", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="26" height="26" fill="none" stroke="#0ea5e9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>Predict Evaluation Score</p>
          <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4 }}>
            Uses milestone completion, files, and feedback to predict all 4 evaluation categories
          </p>
        </div>
      )}

      {data && pred && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Finalized notice */}
          {pred.isFinalized && (
            <div className="alert-info" style={{ display:"flex", gap:"0.625rem", alignItems:"center" }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              <p style={{ fontSize:"0.85rem", fontWeight:600 }}>{pred.message}</p>
            </div>
          )}

          {/* Score hero */}
          <div style={{ borderRadius:12, border:"1px solid var(--border)", padding:"1.5rem", background:"var(--bg-card)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
              <div>
                <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>
                  {pred.isFinalized ? "Actual Score" : "Predicted Score"}
                </p>
                <div style={{ display:"flex", alignItems:"baseline", gap:"0.5rem" }}>
                  <span style={{ fontSize:"3rem", fontWeight:900, color: gradeColor, lineHeight:1 }}>{total}</span>
                  <span style={{ fontSize:"1rem", color:"var(--text-muted)", fontWeight:600 }}>/100</span>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{ width:72, height:72, borderRadius:16, background: gradeColor + "18", border:`3px solid ${gradeColor}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:"1.75rem", fontWeight:900, color: gradeColor }}>{grade ?? "?"}</span>
                </div>
                <p style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginTop:4, fontWeight:600 }}>Grade</p>
              </div>
              {confStyle && (
                <div style={{ padding:"0.4rem 0.875rem", borderRadius:99, background: confStyle.bg, color: confStyle.color, fontSize:"0.78rem", fontWeight:700 }}>
                  {confStyle.label}
                </div>
              )}
            </div>
          </div>

          {/* Score breakdown */}
          {scores && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))", gap:"0.625rem" }}>
              {[
                { label:"Proposal Quality",   key:"proposalQuality",   color:"#6366f1" },
                { label:"Progress & Effort",  key:"progressAndEffort", color:"#22c55e" },
                { label:"Report Quality",     key:"reportQuality",     color:"#0ea5e9" },
                { label:"Technical Skill",    key:"technicalSkill",    color:"#f59e0b" },
              ].map((cat, i) => {
                const val = scores[cat.key] ?? 0;
                const pct = (val / 25) * 100;
                return (
                  <div key={i} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem" }}>
                    <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6 }}>{cat.label}</p>
                    <div style={{ display:"flex", alignItems:"baseline", gap:"0.25rem", marginBottom:8 }}>
                      <span style={{ fontSize:"1.5rem", fontWeight:900, color:cat.color, lineHeight:1 }}>{val}</span>
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>/25</span>
                    </div>
                    <div style={{ height:6, background:"var(--border)", borderRadius:99, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:cat.color, borderRadius:99, transition:"width 0.8s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Radar chart */}
          {radarData.length > 0 && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.5rem" }}>Score Radar</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top:10, right:30, bottom:10, left:30 }}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"var(--text-muted)", fontWeight:600 }}/>
                  <Tooltip formatter={(v) => [`${v}/25`, "Score"]}/>
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestone summary */}
          {data.milestoneStats && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.875rem" }}>Milestone Signals Used</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(110px,1fr))", gap:"0.5rem" }}>
                {[
                  { label:"Total Milestones",   value: data.milestoneStats.total           },
                  { label:"Approved",            value: data.milestoneStats.approved        },
                  { label:"Completion Rate",     value:`${data.milestoneStats.completionRate}%` },
                  { label:"Overdue",             value: data.milestoneStats.overdue,        danger: (data.milestoneStats.overdue ?? 0) > 0 },
                ].map((item, i) => (
                  <div key={i} style={{ textAlign:"center", padding:"0.625rem", background:"var(--bg-elevated)", borderRadius:8 }}>
                    <p style={{ fontSize:"1.1rem", fontWeight:800, color: item.danger ? "#ef4444" : "var(--text-primary)" }}>{item.value}</p>
                    <p style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:600, marginTop:2 }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {pred.recommendations?.length > 0 && (
            <div className="alert-warning" style={{ borderRadius:10 }}>
              <p style={{ fontWeight:700, fontSize:"0.82rem", marginBottom:"0.5rem" }}>📌 Recommendations to Improve Score</p>
              <ul style={{ paddingLeft:"1.25rem", display:"flex", flexDirection:"column", gap:"0.3rem" }}>
                {pred.recommendations.map((rec, i) => (
                  <li key={i} style={{ fontSize:"0.845rem" }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {!pred.isFinalized && (
            <p style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--text-muted)" }}>
              AI prediction — based on milestone completion, files &amp; feedback · Actual score set by supervisor
            </p>
          )}
        </div>
      )}
    </div>
  );
}
