import { useState } from "react";
import { axiosInstance } from "../../lib/axios";

export default function EvalReportTab({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [copied,  setCopied]  = useState(false);

  const generate = async () => {
    if (!projectId) { setError("No project selected."); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const res = await axiosInstance.get(`/ai/eval-report/${projectId}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Report generation failed.");
    } finally { setLoading(false); }
  };

  const copyReport = () => {
    if (!data?.report) return;
    navigator.clipboard.writeText(data.report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadReport = () => {
    if (!data?.report) return;
    const blob = new Blob([data.report], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${(data.projectTitle || "project").replace(/\s+/g,"_")}_evaluation_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{ width:40, height:40, background:"#10b981", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>Auto-Generate Evaluation Report</p>
            <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>
              Full report: milestones, evaluation scores, strengths, recommendations
            </p>
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary">
          {loading
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Generating…</>
            : <><svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>Generate Report</>}
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
          <div style={{ width:52, height:52, background:"#d1fae5", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <svg width="26" height="26" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>Generate Evaluation Report</p>
          <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", marginTop:4, maxWidth:340, margin:"0.5rem auto 0" }}>
            Automatically generates a complete project evaluation report using milestone data, evaluation scores, and project files.
          </p>
        </div>
      )}

      {data && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Summary pills */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px,1fr))", gap:"0.625rem" }}>
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem" }}>
              <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Student</p>
              <p style={{ fontSize:"0.9rem", fontWeight:700, color:"var(--text-primary)" }}>{data.studentName}</p>
            </div>
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem" }}>
              <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Supervisor</p>
              <p style={{ fontSize:"0.9rem", fontWeight:700, color:"var(--text-primary)" }}>{data.supervisorName}</p>
            </div>
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem" }}>
              <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>Milestones</p>
              <p style={{ fontSize:"0.9rem", fontWeight:700, color:"var(--text-primary)" }}>
                {data.milestoneStats?.approved ?? 0}/{data.milestoneStats?.total ?? 0} approved
              </p>
            </div>
            {data.evaluation && (
              <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem" }}>
                <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>
                  {data.evaluation.isFinalized ? "Final Score" : "Draft Score"}
                </p>
                <p style={{ fontSize:"0.9rem", fontWeight:700, color: data.evaluation.isFinalized ? "#16a34a" : "#d97706" }}>
                  {data.evaluation.totalScore}/100 ({data.evaluation.grade})
                </p>
              </div>
            )}
          </div>

          {/* Report actions */}
          <div style={{ display:"flex", gap:"0.625rem", flexWrap:"wrap" }}>
            <button onClick={copyReport} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.5rem 0.875rem", background: copied ? "#dcfce7" : "var(--bg-elevated)", color: copied ? "#16a34a" : "var(--text-secondary)", border:"1px solid var(--border)", borderRadius:8, fontSize:"0.845rem", fontWeight:600, cursor:"pointer", transition:"all 0.12s" }}>
              {copied
                ? <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copied!</>
                : <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy Report</>}
            </button>
            <button onClick={downloadReport} style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.5rem 0.875rem", background:"var(--bg-elevated)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:8, fontSize:"0.845rem", fontWeight:600, cursor:"pointer" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download .txt
            </button>
          </div>

          {/* Report text */}
          <div style={{ background:"#0f172a", borderRadius:12, padding:"1.25rem", overflow:"auto", maxHeight:500 }}>
            <pre style={{ fontFamily:"'Courier New', monospace", fontSize:"0.78rem", color:"#e2e8f0", lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word", margin:0 }}>
              {data.report}
            </pre>
          </div>

          <p style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--text-muted)" }}>
            Auto-generated · Supervisor must review and sign off before official use
          </p>
        </div>
      )}
    </div>
  );
}
