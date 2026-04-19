import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../store/slices/studentSlice";
import { Link } from "react-router-dom";
import { FolderOpen, Users, Calendar, MessageSquare, Bell, ChevronRight, AlertTriangle, UsersRound, TrendingUp, Loader } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

const StatusBadge = ({ status }) => {
  const cls = { approved: "badge-approved", pending: "badge-pending", rejected: "badge-rejected", completed: "badge-completed" };
  return <span className={`badge ${cls[status?.toLowerCase()] || "badge-pending"}`}>{status || "—"}</span>;
};

const StatCard = ({ label, value, icon: Icon, accent = "var(--accent)", sub }) => (
  <div className="stat-card">
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.35rem" }}>{label}</p>
        <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</p>
        {sub && <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.15rem" }}>{sub}</p>}
      </div>
      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={16} style={{ color: accent }} />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, to, children }) => (
  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.1rem", borderBottom: "1px solid var(--border)" }}>
      <p className="section-title">{title}</p>
      {to && (
        <Link to={to} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
          View all <ChevronRight size={13} />
        </Link>
      )}
    </div>
    <div style={{ padding: "1rem 1.1rem" }}>{children}</div>
  </div>
);

const Empty = ({ icon: Icon, msg }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", color: "var(--text-faint)", gap: "0.5rem" }}>
    <Icon size={24} style={{ opacity: 0.4 }} />
    <p style={{ fontSize: "0.82rem" }}>{msg}</p>
  </div>
);

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, isLoading } = useSelector(s => s.student);
  const { authUser } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  const data = dashboardStats || {};
  const project = data.project || null;
  const group = data.group || null;
  const progress = project?.progress ?? 0;

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", flexDirection: "column", gap: "0.75rem" }}>
      <Loader size={22} style={{ color: "var(--accent)" }} className="animate-spin" />
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 className="page-title">Welcome back, {authUser?.name?.split(" ")[0] || "Student"}</h1>
        <p className="page-subtitle">
          {project ? `Project status: ${project.status}` : "No project submitted yet."}{group ? ` · Group: ${group.name}` : ""}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <StatCard label="Project" value={project?.title || "No Project"} icon={FolderOpen} sub={project ? undefined : "Submit a proposal"} />
        <StatCard label="Status" value={project ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : "—"} icon={TrendingUp} />
        <StatCard label="Supervisor" value={data.supervisorName || "Not Assigned"} icon={Users} />
        <StatCard label="Group" value={group?.name || "No Group"} icon={UsersRound} sub={group ? `${group.members?.length || 0} members` : "Join or create"} />
      </div>

      {/* Progress bar */}
      {project && (
        <div className="card" style={{ marginBottom: "1.25rem", padding: "0.875rem 1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)" }}>Project Progress</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <StatusBadge status={project.status} />
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--accent)" }}>{progress}%</span>
            </div>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Project overview */}
          <SectionCard title="Project Overview" to={project ? "/student/upload-files" : "/student/submit-proposal"}>
            {!project ? (
              <Empty icon={FolderOpen} msg="No project submitted yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  {[
                    ["Title", project.title],
                    ["Deadline", project.deadline ? fmt(project.deadline) : "Not set"],
                    ["Files", `${project.files?.length || 0} uploaded`],
                    ["Type", project.isGroupProject ? "Group Project" : "Individual"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", padding: "0.625rem 0.75rem" }}>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>{k}</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.35rem" }}>Description</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{project.description}</p>
                </div>
                {project.isGroupProject && project.members?.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Group Members</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {project.members.map((m, i) => (
                        <span key={m._id || i} style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius-sm)", padding: "0.2rem 0.55rem", fontSize: "0.78rem", fontWeight: 500 }}>
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Feedback */}
          <SectionCard title="Latest Feedback" to="/student/feedback">
            {!data.feedbackNotifications?.length ? (
              <Empty icon={MessageSquare} msg="No feedback yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {data.feedbackNotifications.map((fb, i) => (
                  <div key={fb._id || i} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.75rem 0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{fb.title || "Feedback"}</p>
                      <span className={`badge ${fb.type === "positive" ? "badge-approved" : fb.type === "negative" ? "badge-rejected" : "badge-completed"}`}>{fb.type || "general"}</span>
                    </div>
                    <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.3rem" }}>{fb.message}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-faint)" }}>{fb.supervisorName} · {fmt(fb.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {/* Group */}
          <SectionCard title="My Group" to="/student/group">
            {!group ? (
              <div style={{ textAlign: "center" }}>
                <Empty icon={UsersRound} msg="Not in any group yet." />
                <Link to="/student/group" className="btn-primary btn-small" style={{ textDecoration: "none", marginTop: "0.5rem", display: "inline-flex" }}>Join or Create</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "0.375rem" }}>{group.name}</p>
                {group.members?.slice(0, 4).map((m, i) => (
                  <div key={m._id || i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{m.name}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Deadlines */}
          <SectionCard title="Upcoming Deadlines">
            {!data.upcomingDeadlines?.length ? (
              <Empty icon={Calendar} msg="No upcoming deadlines." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.upcomingDeadlines.map((d, i) => {
                  const dl = d.deadline ? Math.ceil((new Date(d.deadline) - new Date()) / 86400000) : null;
                  const urgent = dl !== null && dl <= 3;
                  return (
                    <div key={d._id || i} style={{ display: "flex", gap: "0.6rem", alignItems: "center", padding: "0.5rem 0.625rem", background: urgent ? "var(--danger-light)" : "var(--bg-elevated)", borderRadius: "var(--radius)", border: urgent ? "1px solid var(--danger-border)" : "1px solid var(--border)" }}>
                      {urgent ? <AlertTriangle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} /> : <Calendar size={14} style={{ color: "var(--warning)", flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title || "Deadline"}</p>
                        <p style={{ fontSize: "0.8rem", color: urgent ? "var(--danger)" : "var(--text-muted)" }}>{dl !== null ? `${dl}d left` : fmt(d.deadline)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" to="/student/notifications">
            {!data.topNotifications?.length ? (
              <Empty icon={Bell} msg="No notifications." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.topNotifications.map((n, i) => (
                  <div key={n._id || i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", padding: "0.5rem 0.625rem", background: "var(--bg-elevated)", borderRadius: "var(--radius)" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: "6px" }} />
                    <div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.message}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-faint)", marginTop: "0.1rem" }}>{fmt(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
