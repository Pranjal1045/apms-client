import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { Award, Star, TrendingUp, Loader, Lock } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const gradeColor = { "A+": "var(--success)", A: "var(--success)", "B+": "var(--accent)", B: "var(--accent)", "C+": "var(--warning)", C: "var(--warning)", D: "var(--danger)", F: "var(--danger)" };

const ScoreBar = ({ label, score, max = 25 }) => {
  const pct = Math.round((score / max) * 100);
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.845rem", color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: "0.845rem", fontWeight: 700, color: "var(--text-primary)" }}>{score}/{max}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? "linear-gradient(90deg,#00e5a0,#00d4ff)" : pct >= 50 ? "linear-gradient(90deg,#00d4ff,#7c5cfc)" : "linear-gradient(90deg,#f59e0b,#f43f5e)" }} />
      </div>
    </div>
  );
};

const EvaluationPage = () => {
  const { project } = useSelector(s => s.student);
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (project?._id) fetchEvaluation();
    else setLoading(false);
  }, [project]);

  const fetchEvaluation = async () => {
    try {
      const res = await axiosInstance.get(`/evaluation/${project._id}`);
      setEvaluation(res.data.data.evaluation);
    } catch { }
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" /></div>;

  if (!project) return (
    <div className="fade-in" style={{ maxWidth: "600px" }}>
      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "1.25rem", color: "var(--text-secondary)" }}>
        Submit a project proposal first to see your evaluation.
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Project Evaluation</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Your project grade and scores from your supervisor.</p>
      </div>

      {!evaluation ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.875rem" }}>
          <Lock size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: "0.9rem" }}>No evaluation submitted yet.</p>
          <p style={{ fontSize: "0.8rem" }}>Your supervisor will evaluate your project once it is nearing completion.</p>
        </div>
      ) : (
        <>
          {/* Grade Card */}
          <div style={{ background: evaluation.isFinalized ? `linear-gradient(135deg, ${gradeColor[evaluation.grade] || "var(--accent)"}22, var(--bg-card))` : "var(--bg-card)", border: `1px solid ${evaluation.isFinalized ? (gradeColor[evaluation.grade] || "var(--accent)") + "44" : "var(--border)"}`, borderRadius: "12px", padding: "1.75rem", marginBottom: "1.25rem", textAlign: "center" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: `${gradeColor[evaluation.grade] || "var(--accent)"}22`, border: `3px solid ${gradeColor[evaluation.grade] || "var(--accent)"}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <span style={{ fontFamily: "inherit", fontSize: "2rem", fontWeight: 900, color: gradeColor[evaluation.grade] || "var(--accent)" }}>{evaluation.grade}</span>
            </div>
            <p style={{ fontFamily: "inherit", fontSize: "2.5rem", fontWeight: 900, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{evaluation.totalScore}<span style={{ fontSize: "1.25rem", color: "var(--text-muted)", fontWeight: 400 }}>/100</span></p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
              Evaluated by {evaluation.supervisor?.name || "Your Supervisor"} · {fmt(evaluation.updatedAt)}
            </p>
            {evaluation.isFinalized ? (
              <span style={{ display: "inline-block", background: "rgba(0,229,160,0.12)", border: "1px solid rgba(0,229,160,0.3)", color: "var(--success)", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontFamily: "inherit", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>✓ Finalized</span>
            ) : (
              <span style={{ display: "inline-block", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--warning)", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontFamily: "inherit", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Draft — Not Yet Finalized</span>
            )}
          </div>

          {/* Score breakdown */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={16} style={{ color: "var(--accent)" }} /> Score Breakdown
            </p>
            <ScoreBar label="Proposal Quality" score={evaluation.scores?.proposalQuality || 0} />
            <ScoreBar label="Progress & Effort" score={evaluation.scores?.progressAndEffort || 0} />
            <ScoreBar label="Report Quality" score={evaluation.scores?.reportQuality || 0} />
            <ScoreBar label="Technical Skill" score={evaluation.scores?.technicalSkill || 0} />
          </div>

          {/* Remarks */}
          {evaluation.remarks && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Star size={15} style={{ color: "var(--warning)" }} /> Supervisor Remarks
              </p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{evaluation.remarks}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluationPage;
