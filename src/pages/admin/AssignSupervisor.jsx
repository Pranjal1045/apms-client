import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { CheckCircle, AlertTriangle, Users, Info, Clock } from "lucide-react";
import {
  assignSupervisor as assignSupervisorThunk,
  getAllUsers, getAllProjects, fetchAllRequests
} from "../../store/slices/adminSlice";

const AssignSupervisor = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm]       = useState("");
  const [filterStatus, setFilterStatus]   = useState("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState({});
  const [pendingFor, setPendingFor]       = useState(null);
  const { users, projects, allRequests }  = useSelector(s => s.admin);

  useEffect(() => {
    dispatch(getAllUsers());
    dispatch(getAllProjects());
    dispatch(fetchAllRequests());
  }, [dispatch]);

  const teachers = useMemo(() => {
    return (users || [])
      .filter(u => (u.role || "").toLowerCase() === "teacher")
      .map(t => ({
        ...t,
        assignedCount: Array.isArray(t.assignedStudents) ? t.assignedStudents.length : 0,
        capacityLeft: (t.maxStudents || 0) - (Array.isArray(t.assignedStudents) ? t.assignedStudents.length : 0),
      }));
  }, [users]);

  const studentProjects = useMemo(() => {
    return (projects || []).filter(p => !!p.student?._id).map(p => ({
      projectId:      p._id,
      title:          p.title,
      status:         p.status,
      supervisor:     p.supervisor?.name || null,
      supervisorId:   p.supervisor?._id  || null,
      studentId:      p.student?._id     || "",
      studentName:    p.student?.name    || "-",
      studentEmail:   p.student?.email   || "-",
      deadline:       p.deadline ? new Date(p.deadline).toLocaleDateString("en-GB") : "Not Set",
      updatedAt:      p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "-",
      isApproved:     p.status === "approved",
    }));
  }, [projects]);

  // Map studentId → their pending request (supervisor they requested)
  const pendingRequestMap = useMemo(() => {
    const map = {};
    (allRequests || []).forEach(r => {
      if (r.status === "pending") {
        map[r.student?._id || r.student] = r;
      }
    });
    return map;
  }, [allRequests]);

  // Map studentId → set of rejected supervisorIds (so admin sees rejection warnings)
  const rejectedSupervisorMap = useMemo(() => {
    const map = {};
    (allRequests || []).forEach(r => {
      if (r.status === "rejected") {
        const sid = r.student?._id || r.student;
        const tid = r.supervisor?._id || r.supervisor;
        if (sid && tid) {
          if (!map[sid]) map[sid] = new Set();
          map[sid].add(String(tid));
        }
      }
    });
    return map;
  }, [allRequests]);

  const filtered = studentProjects.filter(row => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (row.studentName || "").toLowerCase().includes(q) ||
      (row.title || "").toLowerCase().includes(q);
    const status = row.supervisor ? "assigned" : "unassigned";
    const matchFilter = filterStatus === "all" || status === filterStatus;
    return matchSearch && matchFilter;
  });

  const handleAssign = async (studentId, projectStatus, projectId) => {
    const supervisorId = selectedSupervisor[projectId];
    if (!studentId || !supervisorId) { toast.error("Please select a supervisor first"); return; }
    if (projectStatus !== "approved")  { toast.error("Can only assign to approved projects"); return; }
    setPendingFor(projectId);
    const res = await dispatch(assignSupervisorThunk({ studentId, supervisorId }));
    setPendingFor(null);
    if (assignSupervisorThunk.fulfilled.match(res)) {
      toast.success("Supervisor assigned successfully");
      setSelectedSupervisor(prev => { const s = { ...prev }; delete s[projectId]; return s; });
      dispatch(getAllUsers());
      dispatch(getAllProjects());
      dispatch(fetchAllRequests());
    } else {
      toast.error("Failed to assign supervisor");
    }
  };

  const stats = [
    { label: "Assigned",           value: studentProjects.filter(r => !!r.supervisor).length,  icon: CheckCircle,    color: "var(--success)" },
    { label: "Unassigned",         value: studentProjects.filter(r => !r.supervisor).length,   icon: AlertTriangle,  color: "var(--warning)" },
    { label: "Available Teachers", value: teachers.filter(t => t.capacityLeft > 0).length,     icon: Users,          color: "var(--accent)"  },
    { label: "Pending Requests",   value: Object.keys(pendingRequestMap).length,                icon: Clock,          color: "var(--warning)" },
  ];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div className="card">
        <h1 className="page-title">Assign Supervisor</h1>
        <p className="page-subtitle">Manage supervisor assignments for students and projects</p>
      </div>

      {/* Flow info */}
      <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius)", padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <Info size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Supervisor Assignment Flow</p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Students send requests to teachers. Teachers can only <strong>reject</strong> requests — they cannot accept.
            You as admin do the final assignment here. Once you assign, any pending request from that student is automatically accepted and all other pending requests are rejected.
            You can only assign to <strong>approved projects</strong>.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Search Students</label>
          <input className="input" type="text" placeholder="Search by student name or project title..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ width: 200 }}>
          <label className="label">Filter Status</label>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Students</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">Student Assignments ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {["Student", "Project Title", "Current Supervisor", "Student's Request", "Assign Supervisor", "Actions"].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No students found</td></tr>
              ) : filtered.map(row => {
                const pendingReq = pendingRequestMap[row.studentId];
                return (
                  <tr key={row.projectId} className="table-row">
                    {/* Student */}
                    <td className="table-cell">
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.studentName}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{row.studentEmail}</div>
                    </td>

                    {/* Project */}
                    <td className="table-cell" style={{ maxWidth: 200 }}>
                      <div style={{ fontSize: "0.875rem" }}>{row.title}</div>
                      <span className={`badge badge-${row.status === "approved" ? "approved" : row.status === "rejected" ? "rejected" : "pending"}`} style={{ marginTop: 4 }}>
                        {row.status}
                      </span>
                    </td>

                    {/* Current supervisor */}
                    <td className="table-cell">
                      {row.supervisor
                        ? <span className="badge badge-approved">{row.supervisor}</span>
                        : <span style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Not assigned</span>}
                    </td>

                    {/* Student's pending request — key info for admin */}
                    <td className="table-cell">
                      {pendingReq ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Clock size={13} style={{ color: "var(--warning)", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{pendingReq.supervisor?.name}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Pending request</p>
                          </div>
                        </div>
                      ) : row.supervisor ? (
                        <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>—</span>
                      ) : (
                        <span style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>No request sent</span>
                      )}
                    </td>

                    {/* Assign supervisor dropdown */}
                    <td className="table-cell">
                      <select
                        className="input"
                        style={{ minWidth: 170 }}
                        value={selectedSupervisor[row.projectId] || ""}
                        disabled={!!row.supervisor || row.status === "rejected" || !row.isApproved}
                        onChange={e => setSelectedSupervisor(prev => ({ ...prev, [row.projectId]: e.target.value }))}
                      >
                        <option value="" disabled>Select Supervisor</option>
                        {teachers.filter(t => t.capacityLeft > 0).map(t => {
                          const isRequested = pendingReq?.supervisor?._id === t._id || pendingReq?.supervisor === t._id;
                          const isRejected = rejectedSupervisorMap[row.studentId]?.has(String(t._id));
                          return (
                            <option key={t._id} value={t._id}>
                              {isRejected ? "⚠️ REJECTED — " : ""}{t.name} [{t.capacityLeft} slots]{isRequested ? " ← requested" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </td>

                    {/* Action */}
                    <td className="table-cell">
                      <button
                        className={row.supervisor ? "btn-outline btn-small" : "btn-primary btn-small"}
                        style={{ minWidth: 100 }}
                        disabled={
                          pendingFor === row.projectId ||
                          !!row.supervisor ||
                          row.status === "rejected" ||
                          !row.isApproved ||
                          !selectedSupervisor[row.projectId]
                        }
                        onClick={() => handleAssign(row.studentId, row.status, row.projectId)}
                      >
                        {pendingFor === row.projectId ? "Assigning…"
                          : row.supervisor      ? "✓ Assigned"
                          : !row.isApproved     ? "Not Approved"
                          : "Assign"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignSupervisor;
