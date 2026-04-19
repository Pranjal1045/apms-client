import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useDispatch, useSelector } from "react-redux";
import AddStudent from "../../components/modal/AddStudent";
import AddTeacher from "../../components/modal/AddTeacher";
import { getDashboardStats, getAllProjects } from "../../store/slices/adminSlice";
import { getNotifications } from "../../store/slices/notificationSlice";
import { toggleStudentModal, toggleTeacherModal } from "../../store/slices/popupSlice";
import { fetchAllGroups } from "../../store/slices/groupSlice";
import { Users, GraduationCap, AlertCircle, FolderOpen, AlertTriangle, PlusCircle, CheckCircle2, UsersRound, Loader } from "lucide-react";
import { Link } from "react-router-dom";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const STATUS_COLORS = { Pending: "#d97706", Approved: "#16a34a", Rejected: "#dc2626", Completed: "#2563eb" };
const CHART_COLORS = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed"];

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="stat-card">
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>{label}</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value ?? "—"}</p>
      </div>
      <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "var(--accent-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} style={{ color: "var(--accent)" }} />
      </div>
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "var(--shadow-md)" }}>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ fontSize: "0.875rem", fontWeight: 600, color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const AdminDashboard = () => {
  const { isCreateStudentModalOpen, isCreateTeacherModalOpen } = useSelector(s => s.popup);
  const { stats, projects, loading } = useSelector(s => s.admin);
  const notifications = useSelector(s => s.notification.list || []);
  const { allGroups } = useSelector(s => s.group);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getNotifications());
    dispatch(getAllProjects());
    dispatch(fetchAllGroups());
  }, [dispatch]);

  const nearingDeadlines = useMemo(() => {
    const now = new Date();
    return (projects || []).filter(p => {
      if (!p.deadline) return false;
      const diff = new Date(p.deadline) - now;
      return diff >= 0 && diff <= 3 * 86400000;
    }).length;
  }, [projects]);

  const statusDist = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, Rejected: 0, Completed: 0 };
    (projects || []).forEach(p => {
      const k = p.status?.charAt(0).toUpperCase() + p.status?.slice(1);
      if (counts[k] !== undefined) counts[k]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const supervisorData = useMemo(() => {
    const map = new Map();
    (projects || []).forEach(p => {
      if (!p?.supervisor?.name) return;
      map.set(p.supervisor.name.split(" ")[0], (map.get(p.supervisor.name.split(" ")[0]) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [projects]);

  const recentProjects = useMemo(() => (projects || []).slice(0, 5), [projects]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: "0.625rem" }}>
      <Loader size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
      <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Loading…</span>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.875rem" }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview and management tools.</p>
        </div>
        <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
          <button onClick={() => dispatch(toggleStudentModal())} className="btn-primary btn-small" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <PlusCircle size={14} /> Add Student
          </button>
          <button onClick={() => dispatch(toggleTeacherModal())} className="btn-outline btn-small" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <PlusCircle size={14} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.875rem", marginBottom: "1.25rem" }}>
        <StatCard label="Total Students"   value={stats?.totalStudents ?? 0}    icon={Users} />
        <StatCard label="Total Teachers"   value={stats?.totalTeachers ?? 0}    icon={GraduationCap} />
        <StatCard label="Total Projects"   value={stats?.totalProjects ?? 0}    icon={FolderOpen} />
        <StatCard label="Pending Requests" value={stats?.pendingRequests ?? 0}  icon={AlertCircle} />
        <StatCard label="Completed"        value={stats?.completedProjects ?? 0} icon={CheckCircle2} />
        <StatCard label="Near Deadline"    value={nearingDeadlines}             icon={AlertTriangle} />
        <StatCard label="Groups"           value={allGroups?.length ?? 0}       icon={UsersRound} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div className="card">
          <p className="section-title" style={{ marginBottom: "1rem" }}>Supervisor Workload</p>
          {supervisorData.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={supervisorData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--bg-elevated)" }} />
                <Bar dataKey="count" name="Projects" radius={[4,4,0,0]}>
                  {supervisorData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>No data yet</p>}
        </div>

        <div className="card">
          <p className="section-title" style={{ marginBottom: "1rem" }}>Project Status</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <ResponsiveContainer width="55%" height={170}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusDist.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {statusDist.map(({ name, value }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: STATUS_COLORS[name] || "#666", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{name}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-title">Recent Projects</p>
            <Link to="/admin/projects" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>View all →</Link>
          </div>
          {recentProjects.map((p, i) => {
            const sColor = { pending: "var(--warning)", approved: "var(--success)", rejected: "var(--danger)", completed: "var(--accent)" };
            return (
              <div key={p._id || i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1rem", borderBottom: i < recentProjects.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: sColor[p.status] || "#666", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.845rem", color: "var(--text-primary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.student?.name}</p>
                </div>
                <span style={{ fontSize: "0.8rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "var(--bg-elevated)", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{p.status}</span>
              </div>
            );
          })}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <p className="section-title">System Notifications</p>
          </div>
          <div style={{ padding: "0.625rem 1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {notifications.slice(0,5).map((n, i) => (
              <div key={n._id || i} style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0.625rem", background: "var(--bg-elevated)", borderRadius: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: n.priority === "high" ? "var(--danger)" : n.priority === "medium" ? "var(--warning)" : "var(--accent)", flexShrink: 0, marginTop: "6px" }} />
                <div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{fmt(n.createdAt)}</p>
                </div>
              </div>
            ))}
            {!notifications.length && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem" }}>No notifications</p>}
          </div>
        </div>
      </div>

      {isCreateStudentModalOpen && <AddStudent />}
      {isCreateTeacherModalOpen && <AddTeacher />}
    </div>
  );
};
export default AdminDashboard;
