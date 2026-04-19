import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Award, Download, Loader, ChevronDown, ChevronUp, Users } from "lucide-react";
import { toast } from "react-toastify";

const gradeColor = {
  "A+": "var(--success)", A: "var(--success)", "B+": "var(--accent)", B: "var(--accent)",
  "C+": "var(--warning)", C: "var(--warning)", D: "var(--danger)", F: "var(--danger)"
};
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const GradeBadge = ({ grade, score }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
    <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, maxWidth: 80, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${score}%`, background: gradeColor[grade] || "var(--accent)", borderRadius: 3, transition: "width 0.4s" }}/>
    </div>
    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", minWidth: 24 }}>{score}</span>
    <span style={{ fontWeight: 900, color: gradeColor[grade] || "var(--accent)", fontSize: "0.95rem", minWidth: 26 }}>{grade}</span>
  </div>
);

const EvaluationsPage = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    axiosInstance.get("/evaluation")
      .then(res => setEvaluations(res.data.data.evaluations || []))
      .catch(() => toast.error("Failed to load evaluations"))
      .finally(() => setLoading(false));
  }, []);

  const exportPDF = async (projectId, name) => {
    try {
      const res = await axiosInstance.get(`/export/project/${projectId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.setAttribute("download", `${name || "project"}-report.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  const exportAll = async () => {
    try {
      const res = await axiosInstance.get("/export/all-projects", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a"); a.href = url;
      a.setAttribute("download", "all-projects-report.pdf");
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error("Export failed"); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" />
    </div>
  );

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((s, e) => s + (e.totalScore || 0), 0) / evaluations.length)
    : 0;

  const topProjects = [...evaluations].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0)).slice(0, 3);

  return (
    <div className="fade-in" style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Project Evaluations</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {evaluations.length} finalized · Average score: {avgScore}/100
          </p>
        </div>
        <button onClick={exportAll} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Download size={15}/> Export All PDF
        </button>
      </div>

      {/* Top performers */}
      {topProjects.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>
            🏆 Top Performing Projects
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "0.875rem" }}>
            {topProjects.map((ev, rank) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={ev._id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: rank === 0 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : rank === 1 ? "linear-gradient(90deg,#94a3b8,#cbd5e1)" : "linear-gradient(90deg,#b45309,#d97706)" }}/>
                  <p style={{ fontSize: "1.25rem", marginBottom: "0.3rem" }}>{medals[rank]}</p>
                  <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>{ev.project?.title || "—"}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{ev.student?.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: gradeColor[ev.grade] }}>{ev.grade}</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-secondary)" }}>{ev.totalScore}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!evaluations.length ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <Award size={40} style={{ opacity: 0.3 }}/><p>No finalized evaluations yet.</p>
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {evaluations.map((ev, i) => {
            const isExpanded = expanded === ev._id;
            const hasMembers = ev.memberEvaluations?.length > 0;
            const isGroupProject = ev.project?.isGroupProject;
            return (
              <div key={ev._id} style={{ borderBottom: i < evaluations.length - 1 ? "1px solid var(--border)" : "none" }}>
                {/* Main row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 0.8fr 1.2fr 0.7fr 0.6fr auto auto", gap: "0.5rem", alignItems: "center", padding: "0.875rem 1rem" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 600 }}>{ev.student?.name || "—"}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ev.student?.department}</p>
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.project?.title || "—"}</p>
                    {isGroupProject && (
                      <p style={{ fontSize: "0.7rem", color: "var(--accent)", display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.1rem" }}>
                        <Users size={10}/> Group Project
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: "0.845rem", color: "var(--text-muted)" }}>{ev.supervisor?.name || "—"}</p>
                  <GradeBadge grade={ev.grade} score={ev.totalScore || 0}/>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmt(ev.updatedAt)}</p>
                  <button onClick={() => exportPDF(ev.project?._id, ev.student?.name)} className="btn-outline btn-small" style={{ display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>
                    <Download size={12}/> PDF
                  </button>
                  {hasMembers && (
                    <button onClick={() => setExpanded(isExpanded ? null : ev._id)}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.5rem", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem" }}>
                      {isExpanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                      {ev.memberEvaluations.length}
                    </button>
                  )}
                </div>

                {/* Member evaluations expanded */}
                {isExpanded && hasMembers && (
                  <div style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "0.875rem 1rem" }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Users size={11}/> Individual Member Scores
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.625rem" }}>
                      {ev.memberEvaluations.map((me, idx) => (
                        <div key={me._id || idx} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,hsl(${idx*60+200},70%,50%),hsl(${idx*60+240},70%,50%))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>
                              {(me.student?.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{me.student?.name || "Unknown"}</p>
                              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{me.student?.email}</p>
                            </div>
                          </div>
                          <GradeBadge grade={me.grade} score={me.totalScore || 0}/>
                          <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem" }}>
                            <span>Proposal: {me.scores?.proposalQuality || 0}</span>
                            <span>Progress: {me.scores?.progressAndEffort || 0}</span>
                            <span>Report: {me.scores?.reportQuality || 0}</span>
                            <span>Technical: {me.scores?.technicalSkill || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvaluationsPage;
