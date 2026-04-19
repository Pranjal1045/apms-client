import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTeacherDashboardStats } from "../../store/slices/teacherSlice";
import { Link } from "react-router-dom";
import { Users, Clock, CheckCircle2, BookOpen, ChevronRight, Loader } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

const StatCard = ({ label, value, icon: Icon, sub, isText }) => (
  <div className="stat-card">
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>{label}</p>
        <p style={{
          fontSize: isText ? "1rem" : "1.75rem",
          fontWeight: isText ? 600 : 700,
          color: "var(--text-primary)",
          lineHeight: isText ? 1.3 : 1,
          wordBreak: "break-word",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical"
        }}>{value}</p>
        {sub && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{sub}</p>}
      </div>
      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "0.5rem" }}>
        <Icon size={16} style={{ color: "var(--accent)" }} />
      </div>
    </div>
  </div>
);

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading } = useSelector(s => s.teacher);
  const { authUser } = useSelector(s => s.auth);
  useEffect(() => { dispatch(getTeacherDashboardStats()); }, [dispatch]);

  const assigned = authUser?.assignedStudents?.length || 0;
  const capacity = authUser?.maxStudents || 10;
  const pct = Math.min(Math.round((assigned / capacity) * 100), 100);
  const notifications = dashboardStats?.recentNotifications || [];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: "0.625rem", color: "var(--text-muted)" }}>
      <Loader size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
      <span style={{ fontSize: "0.875rem" }}>Loading…</span>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Welcome, {authUser?.name?.split(" ")[0]}</h1>
        <p className="page-subtitle">Manage your students and provide project guidance.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <StatCard label="Assigned Students" value={assigned} icon={Users} sub={`${capacity - assigned} slots free`} />
        <StatCard label="Pending Requests" value={dashboardStats?.totalPendingRequests || 0} icon={Clock} sub="Awaiting response" />
        <StatCard label="Completed Projects" value={dashboardStats?.completedProjects || 0} icon={CheckCircle2} sub="Successfully supervised" />
        <StatCard label="Department" value={authUser?.department || "—"} icon={BookOpen} sub={authUser?.experties?.slice(0,2).join(", ") || "No expertise set"} isText={true} />
      </div>

      {/* Capacity */}
      <div className="card" style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <p className="section-title">Student Capacity</p>
          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: pct >= 90 ? "var(--danger)" : "var(--accent)" }}>{assigned}/{capacity}</p>
        </div>
        <div style={{ height: "8px", background: "var(--border)", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : "var(--accent)", borderRadius: "99px", transition: "width 0.6s ease" }} />
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>{pct}% capacity used</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <p className="section-title" style={{ marginBottom: "0.75rem" }}>Areas of Expertise</p>
          {authUser?.experties?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {authUser.experties.map((e, i) => (
                <span key={i} style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: "999px", padding: "0.2rem 0.65rem", fontSize: "0.78rem", fontWeight: 500 }}>{e}</span>
              ))}
            </div>
          ) : <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No expertise listed. Contact admin.</p>}
        </div>

        <div className="card">
          <p className="section-title" style={{ marginBottom: "0.75rem" }}>Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[
              ["/teacher/pending-requests", "Review Pending Requests"],
              ["/teacher/assigned-students", "View My Students"],
              ["/teacher/meetings", "Meeting Requests"],
              ["/teacher/evaluate", "Evaluate Projects"],
              ["/teacher/files", "Project Files"],
            ].map(([to, label]) => (
              <Link key={to} to={to} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.625rem", background: "var(--bg-elevated)", borderRadius: "6px", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.855rem", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                <span>{label}</span><ChevronRight size={14} style={{ opacity: 0.5 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <p className="section-title" style={{ marginBottom: "0.75rem" }}>Recent Notifications</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {notifications.slice(0, 5).map((n, i) => (
              <div key={i} style={{ padding: "0.625rem 0.75rem", background: "var(--bg-elevated)", borderRadius: "8px", borderLeft: "3px solid var(--accent)" }}>
                <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.message}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{fmt(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherDashboard;
