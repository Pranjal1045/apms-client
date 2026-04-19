import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, getFeedback } from "../../store/slices/studentSlice";
import { BadgeCheck, AlertTriangle, MessageCircle, MessageSquare } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

const typeConfig = {
  positive: { icon: BadgeCheck, color: "var(--success)", bg: "rgba(0,229,160,0.08)", border: "rgba(0,229,160,0.2)", label: "Positive" },
  negative: { icon: AlertTriangle, color: "var(--danger)", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.2)", label: "Needs Revision" },
  general:  { icon: MessageCircle, color: "var(--accent)", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.2)", label: "General" },
};

const FeedbackPage = () => {
  const dispatch = useDispatch();
  const { project, feedback } = useSelector(s => s.student);

  useEffect(() => { dispatch(fetchProject()); }, [dispatch]);
  useEffect(() => { if (project?._id) dispatch(getFeedback(project._id)); }, [project]);

  const total = feedback?.length || 0;
  const positive = feedback?.filter(f => f.type === "positive").length || 0;
  const negative = feedback?.filter(f => f.type === "negative").length || 0;
  const general = feedback?.filter(f => f.type === "general").length || 0;

  return (
    <div className="fade-in" style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Supervisor Feedback</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>All feedback from your supervisor on your project.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Total", value: total, color: "var(--accent)" },
          { label: "Positive", value: positive, color: "var(--success)" },
          { label: "Needs Revision", value: negative, color: "var(--danger)" },
          { label: "General", value: general, color: "var(--accent)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.875rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}, transparent)` }} />
            <p style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "inherit", color: "var(--text-primary)" }}>{value}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Feedback list */}
      {!feedback?.length ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-muted)" }}>
          <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
          <p style={{ fontSize: "0.9rem" }}>No feedback yet. Your supervisor will post feedback here once your project is reviewed.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[...feedback].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((fb, i) => {
            const cfg = typeConfig[fb.type] || typeConfig.general;
            const Icon = cfg.icon;
            return (
              <div key={fb._id || i} style={{ background: "var(--bg-card)", border: `1px solid ${cfg.border}`, borderRadius: "10px", padding: "1.25rem", borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.6rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.925rem", color: "var(--text-primary)" }}>{fb.title || "Feedback"}</p>
                  </div>
                  <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "4px", background: cfg.bg, color: cfg.color, fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {cfg.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.75rem" }}>{fb.message}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {fb.supervisorName || "Supervisor"} · {fmt(fb.createdAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
