import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllProjects, getAllUsers } from "../../store/slices/adminSlice";
import { fetchAllGroups } from "../../store/slices/groupSlice";
import { axiosInstance } from "../../lib/axios";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from "recharts";
import { BarChart3, TrendingUp, Users, FolderOpen, UsersRound, Award, Star, Activity } from "lucide-react";

const GRADE_COLORS = { "A+": "#16a34a", A: "#22c55e", "B+": "#2563eb", B: "#3b82f6", "C+": "#d97706", C: "#f59e0b", D: "#dc2626", F: "#7f1d1d" };
const CHART_COLORS = ["#2563eb","#7c3aed","#0891b2","#16a34a","#d97706","#dc2626","#db2777","#ea580c"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "0.6rem 0.875rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: "0.875rem", fontWeight: 700, color: p.color || "var(--accent)" }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, accent }) => (
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", overflow: "hidden", position: "relative" }}>
    {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent }}/>}
    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: subtitle ? "0.2rem" : "1rem", marginTop: accent ? "0.4rem" : 0 }}>{title}</p>
    {subtitle && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{subtitle}</p>}
    {children}
  </div>
);

const KpiCard = ({ label, value, color, icon: Icon, sub }) => (
  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "1rem 1.125rem", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }}/>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} style={{ color }}/>
      </div>
    </div>
    <p style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{sub}</p>}
  </div>
);

const AnalyticsPage = () => {
  const dispatch = useDispatch();
  const { projects, users } = useSelector(s => s.admin);
  const { allGroups } = useSelector(s => s.group);
  const [evaluations, setEvaluations] = useState([]);
  const [evLoading, setEvLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    dispatch(getAllProjects());
    dispatch(getAllUsers());
    dispatch(fetchAllGroups());
    axiosInstance.get("/evaluation")
      .then(res => setEvaluations(res.data.data.evaluations || []))
      .catch(() => {})
      .finally(() => setEvLoading(false));
  }, [dispatch]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const statusDist = useMemo(() => {
    const counts = { Pending: 0, Approved: 0, Rejected: 0, Completed: 0 };
    (projects || []).forEach(p => {
      const k = p.status?.charAt(0).toUpperCase() + p.status?.slice(1);
      if (counts[k] !== undefined) counts[k]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const departmentDist = useMemo(() => {
    const map = new Map();
    (users || []).filter(u => u.role === "Student").forEach(u => {
      const d = u.department || "Unknown";
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [users]);

  const supervisorLoad = useMemo(() => {
    return (users || []).filter(u => u.role === "Teacher").map(t => ({
      name: t.name?.split(" ")[0] || "Teacher",
      assigned: t.assignedStudents?.length || 0,
      capacity: t.maxStudents || 10,
    })).sort((a, b) => b.assigned - a.assigned).slice(0, 8);
  }, [users]);

  const monthlySubmissions = useMemo(() => {
    const months = {};
    (projects || []).forEach(p => {
      const m = new Date(p.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, count]) => ({ month, count }));
  }, [projects]);

  const groupStats = useMemo(() => ({
    total: allGroups?.length || 0,
    forming: allGroups?.filter(g => g.status === "forming").length || 0,
    active: allGroups?.filter(g => g.status === "active").length || 0,
    avgSize: allGroups?.length ? (allGroups.reduce((s, g) => s + (g.members?.length || 0), 0) / allGroups.length).toFixed(1) : 0,
  }), [allGroups]);

  // ── Evaluation analytics ────────────────────────────────────────────────────
  const gradeDistribution = useMemo(() => {
    const counts = { "A+": 0, A: 0, "B+": 0, B: 0, "C+": 0, C: 0, D: 0, F: 0 };
    evaluations.forEach(ev => {
      if (ev.grade && counts[ev.grade] !== undefined) counts[ev.grade]++;
      // Also count member evaluations
      (ev.memberEvaluations || []).forEach(me => {
        if (me.grade && counts[me.grade] !== undefined) counts[me.grade]++;
      });
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value, color: GRADE_COLORS[name] }));
  }, [evaluations]);

  const topGroups = useMemo(() => {
    return [...evaluations]
      .filter(ev => ev.totalScore > 0)
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .slice(0, 10)
      .map(ev => ({
        name: (ev.project?.title || "Project").slice(0, 20),
        score: ev.totalScore || 0,
        grade: ev.grade || "—",
        student: ev.student?.name || "—",
      }));
  }, [evaluations]);

  const scoreByCategory = useMemo(() => {
    if (!evaluations.length) return [];
    const totals = { proposalQuality: 0, progressAndEffort: 0, reportQuality: 0, technicalSkill: 0 };
    let count = 0;
    evaluations.forEach(ev => {
      if (ev.scores) {
        Object.keys(totals).forEach(k => { totals[k] += ev.scores[k] || 0; });
        count++;
      }
    });
    if (!count) return [];
    return [
      { subject: "Proposal", score: Math.round(totals.proposalQuality / count * 4), fullMark: 100 },
      { subject: "Progress", score: Math.round(totals.progressAndEffort / count * 4), fullMark: 100 },
      { subject: "Report", score: Math.round(totals.reportQuality / count * 4), fullMark: 100 },
      { subject: "Technical", score: Math.round(totals.technicalSkill / count * 4), fullMark: 100 },
    ];
  }, [evaluations]);

  const deptPerformance = useMemo(() => {
    const map = new Map();
    evaluations.forEach(ev => {
      const dept = ev.student?.department || "Unknown";
      if (!map.has(dept)) map.set(dept, { total: 0, count: 0 });
      const d = map.get(dept);
      d.total += ev.totalScore || 0;
      d.count++;
    });
    return Array.from(map.entries())
      .map(([dept, { total, count }]) => ({ dept: dept.slice(0, 12), avg: Math.round(total / count), count }))
      .sort((a, b) => b.avg - a.avg);
  }, [evaluations]);

  const totalStudents = (users || []).filter(u => u.role === "Student").length;
  const totalTeachers = (users || []).filter(u => u.role === "Teacher").length;
  const completionRate = projects?.length ? Math.round((projects.filter(p => p.status === "completed").length / projects.length) * 100) : 0;
  const avgScore = evaluations.length ? Math.round(evaluations.reduce((s, e) => s + (e.totalScore || 0), 0) / evaluations.length) : 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "performance", label: "Evaluation Performance" },
    { id: "groups", label: "Groups & Supervisors" },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1140 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>System Analytics</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Comprehensive metrics and performance analytics across all projects and evaluations.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "0.6rem 1.125rem", background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid var(--accent)" : "2px solid transparent", color: activeTab === t.id ? "var(--accent)" : "var(--text-muted)", fontWeight: activeTab === t.id ? 700 : 500, fontSize: "0.875rem", cursor: "pointer", transition: "all 0.15s", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.875rem", marginBottom: "1.5rem" }}>
        <KpiCard label="Total Students" value={totalStudents} color="#2563eb" icon={Users}/>
        <KpiCard label="Total Teachers" value={totalTeachers} color="#16a34a" icon={Users}/>
        <KpiCard label="Completion Rate" value={`${completionRate}%`} color="#7c3aed" icon={TrendingUp}/>
        <KpiCard label="Evaluated Projects" value={evaluations.length} color="#0891b2" icon={Award}/>
        <KpiCard label="Avg Eval Score" value={avgScore ? `${avgScore}/100` : "—"} color="#d97706" icon={Star} sub={evaluations.length ? `${evaluations.length} finalized` : "No evals yet"}/>
        <KpiCard label="Active Groups" value={groupStats.active} color="#db2777" icon={UsersRound}/>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <ChartCard title="Monthly Project Submissions" subtitle="Last 6 months" accent="linear-gradient(90deg,#2563eb,#7c3aed)">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlySubmissions} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 4 }} name="Submissions"/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Project Status Distribution" accent="linear-gradient(90deg,#7c3aed,#db2777)">
              <div style={{ display: "flex", alignItems: "center" }}>
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                      {statusDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {statusDist.map(({ name, value }, i) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length] }}/>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{name}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginLeft: "auto" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Students per Department" subtitle="Enrollment distribution across all departments" accent="linear-gradient(90deg,#0891b2,#16a34a)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={departmentDist} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={100}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Students">
                  {departmentDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}

      {/* ── PERFORMANCE TAB ── */}
      {activeTab === "performance" && (
        <>
          {evLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                <Activity size={32} style={{ marginBottom: "0.5rem", opacity: 0.4 }}/><br/>Loading evaluation data…
              </div>
            </div>
          ) : !evaluations.length ? (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
              <Award size={40} style={{ opacity: 0.2, marginBottom: "0.75rem" }}/><br/>
              No finalized evaluations yet. Evaluation analytics will appear here once supervisors finalize project scores.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
                {/* Grade distribution */}
                <ChartCard title="Grade Distribution" subtitle="Across all finalized evaluations" accent="linear-gradient(90deg,#16a34a,#2563eb)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={gradeDistribution} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="value" name="Count" radius={[4,4,0,0]}>
                        {gradeDistribution.map((d, i) => <Cell key={i} fill={d.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                {/* Radar — category averages */}
                <ChartCard title="Average Scores by Category" subtitle="Normalised to 100 scale" accent="linear-gradient(90deg,#7c3aed,#db2777)">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={scoreByCategory} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <PolarGrid stroke="var(--border)"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 11 }}/>
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }}/>
                      <Radar name="Avg Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2}/>
                      <Tooltip content={<CustomTooltip/>}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Top performing projects bar chart */}
              <div style={{ marginBottom: "1.25rem" }}>
                <ChartCard title="Top Project Scores" subtitle="Ranked by total evaluation score" accent="linear-gradient(90deg,#d97706,#16a34a)">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topGroups} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} width={120}/>
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const d = topGroups.find(t => t.name === label);
                        return (
                          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "0.6rem 0.875rem" }}>
                            <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{label}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>Student: {d?.student}</p>
                            <p style={{ fontSize: "0.875rem", fontWeight: 700, color: GRADE_COLORS[d?.grade] || "var(--accent)" }}>
                              Score: {payload[0].value}/100 ({d?.grade})
                            </p>
                          </div>
                        );
                      }}/>
                      <Bar dataKey="score" radius={[0,4,4,0]} name="Score">
                        {topGroups.map((d, i) => (
                          <Cell key={i} fill={GRADE_COLORS[d.grade] || "#2563eb"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Department performance */}
              {deptPerformance.length > 0 && (
                <ChartCard title="Average Score by Department" subtitle="Which departments perform best" accent="linear-gradient(90deg,#0891b2,#7c3aed)">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={deptPerformance} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="dept" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="avg" name="Avg Score" radius={[4,4,0,0]}>
                        {deptPerformance.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Top performers table */}
              <div style={{ marginTop: "1.25rem" }}>
                <ChartCard title="🏆 Top 5 Students by Score" accent="linear-gradient(90deg,#f59e0b,#ef4444)">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {[...evaluations].sort((a,b) => (b.totalScore||0)-(a.totalScore||0)).slice(0,5).map((ev, rank) => {
                      const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                      return (
                        <div key={ev._id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 0", borderBottom: rank < 4 ? "1px solid var(--border)" : "none" }}>
                          <span style={{ fontSize: "1.25rem", minWidth: 32 }}>{medals[rank]}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{ev.student?.name || "—"}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ev.student?.department} · {ev.project?.title?.slice(0,35)}</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span style={{ fontWeight: 900, fontSize: "1.2rem", color: GRADE_COLORS[ev.grade] || "var(--accent)" }}>{ev.grade}</span>
                            <span style={{ fontWeight: 700, color: "var(--text-secondary)" }}>{ev.totalScore}/100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              </div>
            </>
          )}
        </>
      )}

      {/* ── GROUPS & SUPERVISORS TAB ── */}
      {activeTab === "groups" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <ChartCard title="Group Status Breakdown" accent="linear-gradient(90deg,#db2777,#7c3aed)">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              {[
                { label: "Forming", value: groupStats.forming, color: "#d97706" },
                { label: "Active", value: groupStats.active, color: "#2563eb" },
                { label: "Completed", value: groupStats.total - groupStats.forming - groupStats.active, color: "#16a34a" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color }}>{value}</span>
                  </div>
                  <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: groupStats.total ? `${(value / groupStats.total) * 100}%` : "0%", background: color, borderRadius: 4, transition: "width 0.6s" }}/>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Total Groups</span>
                <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{groupStats.total}</span>
              </div>
              <div style={{ padding: "0.75rem", background: "var(--bg-elevated)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Avg Group Size</span>
                <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>{groupStats.avgSize} members</span>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Supervisor Workload" subtitle="Assigned students per supervisor" accent="linear-gradient(90deg,#0891b2,#16a34a)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={supervisorLoad} margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end"/>
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="assigned" name="Students" radius={[4,4,0,0]}>
                  {supervisorLoad.map((d, i) => (
                    <Cell key={i} fill={d.assigned >= d.capacity ? "#dc2626" : d.assigned >= d.capacity * 0.8 ? "#d97706" : "#2563eb"}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
