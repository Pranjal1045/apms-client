import { useDispatch, useSelector } from "react-redux";
import { getTeacherRequests, rejectRequest } from "../../store/slices/teacherSlice";
import { useEffect, useState } from "react";
import { FileText, Info, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const statusBadge = (status) => {
  if (status === "pending")  return "badge badge-pending";
  if (status === "accepted") return "badge badge-approved";
  if (status === "rejected") return "badge badge-rejected";
  return "badge";
};

const PendingRequests = () => {
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [loadingMap, setLoadingMap]   = useState({});
  const dispatch  = useDispatch();
  const { list }  = useSelector(s => s.teacher);
  const { authUser } = useSelector(s => s.auth);

  useEffect(() => {
    dispatch(getTeacherRequests(authUser._id));
  }, [dispatch, authUser._id]);

  const setLoading = (id, key, val) =>
    setLoadingMap(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));

  const handleReject = async (req) => {
    setLoading(req._id, "rejecting", true);
    try {
      await dispatch(rejectRequest(req._id)).unwrap();
    } finally {
      setLoading(req._id, "rejecting", false);
    }
  };

  const filtered = (list || []).filter(req => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (req?.student?.name || "").toLowerCase().includes(q) ||
      (req?.latestProject?.title || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || req.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = (list || []).filter(r => r.status === "pending").length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Supervision Requests</h1>
          <p className="page-subtitle">Students who have requested you as their supervisor</p>
        </div>
        {pendingCount > 0 && (
          <span className="badge badge-pending" style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* ── Info banner explaining the flow ── */}
      <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius)", padding: "0.875rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <Info size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
            How the supervisor assignment flow works
          </p>
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Students can send you a request. You can <strong>reject</strong> requests you do not want to accept.
            The <strong>Admin</strong> is the one who formally assigns supervisors — once Admin assigns you to a student, the request is automatically marked as accepted.
            You <strong>cannot accept</strong> requests directly — only reject them.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Search</label>
          <input className="input" type="text" placeholder="Search by student name or project title..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ minWidth: 160 }}>
          <label className="label">Status</label>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Request list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <FileText size={40} style={{ color: "var(--text-faint)", margin: "0 auto 1rem" }} />
            <h3 style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.5rem" }}>No requests found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {filterStatus === "pending" ? "No pending requests at this time." : "No requests match your filters."}
            </p>
          </div>
        ) : filtered.map(req => {
          const lm = loadingMap[req._id] || {};
          const project = req.latestProject;
          const projectStatus = project?.status || null;
          const supervisorAlreadyAssigned = !!project?.supervisor;
          const isPending = req.status === "pending";

          return (
            <div key={req._id} className="card" style={{ borderLeft: `3px solid ${req.status === "pending" ? "var(--warning)" : req.status === "accepted" ? "var(--success)" : "var(--danger)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>

                {/* Student info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--accent)", fontSize: "1rem", flexShrink: 0 }}>
                      {req?.student?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                        {req?.student?.name || "Unknown Student"}
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{req?.student?.email}</p>
                    </div>
                    <span className={statusBadge(req.status)}>
                      {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                    </span>
                  </div>

                  {/* Project info */}
                  {project && (
                    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius)", padding: "0.625rem 0.875rem", marginBottom: "0.5rem" }}>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>Project</p>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>{project.title}</p>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span className={`badge badge-${projectStatus === "approved" ? "approved" : projectStatus === "rejected" ? "rejected" : "pending"}`}>
                          Project: {projectStatus?.charAt(0).toUpperCase() + projectStatus?.slice(1) || "Unknown"}
                        </span>
                        {supervisorAlreadyAssigned && (
                          <span className="badge badge-completed">Supervisor Assigned</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student message */}
                  {req.message && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontStyle: "italic", marginTop: "0.35rem" }}>
                      "{req.message}"
                    </p>
                  )}

                  <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "0.5rem" }}>
                    Requested: {req.createdAt ? new Date(req.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </p>

                  {/* Context messages */}
                  {req.status === "pending" && supervisorAlreadyAssigned && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <CheckCircle size={14} style={{ color: "var(--success)" }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: 500 }}>Admin has already assigned a supervisor to this student</span>
                    </div>
                  )}
                  {req.status === "pending" && projectStatus === "pending" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <Clock size={14} style={{ color: "var(--warning)" }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 500 }}>Project proposal is still pending admin approval</span>
                    </div>
                  )}
                  {req.status === "accepted" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <CheckCircle size={14} style={{ color: "var(--success)" }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: 500 }}>Admin has assigned you as this student's supervisor</span>
                    </div>
                  )}
                  {req.status === "rejected" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <XCircle size={14} style={{ color: "var(--danger)" }} />
                      <span style={{ fontSize: "0.8rem", color: "var(--danger)", fontWeight: 500 }}>You rejected this request</span>
                    </div>
                  )}
                </div>

                {/* Actions — only Reject for pending requests */}
                {isPending && !supervisorAlreadyAssigned && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 140, alignItems: "flex-end" }}>
                    <button
                      className="btn-danger"
                      disabled={lm.rejecting}
                      onClick={() => handleReject(req)}
                      style={{ width: "100%" }}>
                      {lm.rejecting ? "Rejecting…" : "Reject Request"}
                    </button>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-faint)", textAlign: "center" }}>
                      Admin assigns supervisors
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingRequests;
