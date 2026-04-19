import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProject, getSupervisor, fetchAllSupervisors,
  requestSupervisor, fetchMyRequests
} from "../../store/slices/studentSlice";
import { UserCheck, Send, X, Search, Loader, Clock, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

const SupervisorPage = () => {
  const dispatch = useDispatch();
  const { authUser }  = useSelector(s => s.auth);
  const { project, supervisors, supervisor, myRequests } = useSelector(s => s.student);
  const [modal, setModal]   = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch]   = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    dispatch(fetchProject());
    dispatch(getSupervisor());
    dispatch(fetchAllSupervisors());
    dispatch(fetchMyRequests());
  }, [dispatch]);

  const hasSupervisor  = useMemo(() => !!(supervisor?._id), [supervisor]);

  // The one pending/rejected request this student has sent (if any)
  const pendingRequest = useMemo(() =>
    (myRequests || []).find(r => r.status === "pending"), [myRequests]
  );
  const latestRequest  = useMemo(() =>
    (myRequests || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
  [myRequests]);

  // Student can only send a request if:
  // 1. No supervisor assigned yet
  // 2. No pending request already out
  // 3. Project is approved
  const canRequest = !hasSupervisor && !pendingRequest && project?.status === "approved";

  const filtered = useMemo(() => (supervisors || []).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    (s.experties || []).some(e => e.toLowerCase().includes(search.toLowerCase()))
  ), [supervisors, search]);

  const handleRequest = async () => {
    if (!modal || sending) return;
    setSending(true);
    const msg = message.trim() ||
      `${authUser?.name || "Student"} has requested ${modal.name} to be their supervisor.`;
    try {
      await dispatch(requestSupervisor({ teacherId: modal._id, message: msg })).unwrap();
      dispatch(fetchMyRequests());
      setModal(null);
      setMessage("");
    } catch (_) {}
    setSending(false);
  };

  return (
    <div className="fade-in" style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">My Supervisor</h1>
        <p className="page-subtitle">View your assigned supervisor or send a request from the list below.</p>
      </div>

      {/* ── Current Supervisor card ── */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.875rem" }}>
          <UserCheck size={17} style={{ color: "var(--accent)" }} />
          <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>Assigned Supervisor</p>
          {hasSupervisor && <span className="badge badge-approved">Assigned</span>}
        </div>

        {hasSupervisor ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, var(--success), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {supervisor.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>{supervisor.name}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{supervisor.email}</p>
              {supervisor.department && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Dept: {supervisor.department}</p>}
            </div>
            {supervisor.experties?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", justifyContent: "flex-end" }}>
                {supervisor.experties.slice(0, 3).map((e, i) => (
                  <span key={i} style={{ background: "var(--success-light)", border: "1px solid var(--success-border)", color: "var(--success)", borderRadius: 5, padding: "0.2rem 0.55rem", fontSize: "0.75rem" }}>{e}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            No supervisor assigned yet. The admin will assign one after reviewing your request.
          </p>
        )}
      </div>

      {/* ── Request status card (shown when there's an active request) ── */}
      {!hasSupervisor && latestRequest && (
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: `3px solid ${
          latestRequest.status === "pending"  ? "var(--warning)" :
          latestRequest.status === "accepted" ? "var(--success)" : "var(--danger)"
        }` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <div style={{ marginTop: 2 }}>
              {latestRequest.status === "pending"  && <Clock size={18} style={{ color: "var(--warning)" }} />}
              {latestRequest.status === "accepted" && <CheckCircle size={18} style={{ color: "var(--success)" }} />}
              {latestRequest.status === "rejected" && <XCircle size={18} style={{ color: "var(--danger)" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                {latestRequest.status === "pending"  && "Request Pending"}
                {latestRequest.status === "accepted" && "Request Accepted — Awaiting Admin Confirmation"}
                {latestRequest.status === "rejected" && "Request Rejected"}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                {latestRequest.status === "pending" && (
                  <>You sent a request to <strong>{latestRequest.supervisor?.name}</strong>. It is pending. The admin will review and formally assign your supervisor.</>
                )}
                {latestRequest.status === "accepted" && (
                  <>Your request to <strong>{latestRequest.supervisor?.name}</strong> has been accepted. Admin will finalize the assignment shortly.</>
                )}
                {latestRequest.status === "rejected" && (
                  <><strong>{latestRequest.supervisor?.name}</strong> has rejected your request. You can now send a request to a different supervisor.</>
                )}
              </p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--text-muted)" }}>
                  {latestRequest.supervisor?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{latestRequest.supervisor?.name}</p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{latestRequest.supervisor?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Project not approved warning ── */}
      {!hasSupervisor && !pendingRequest && project && project.status !== "approved" && (
        <div className="alert-warning" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, marginBottom: "0.15rem" }}>Project not yet approved</p>
            <p style={{ fontSize: "0.85rem" }}>Your project proposal must be approved by the admin before you can request a supervisor. Current status: <strong style={{ textTransform: "capitalize" }}>{project.status}</strong></p>
          </div>
        </div>
      )}

      {/* ── No project warning ── */}
      {!hasSupervisor && !pendingRequest && !project && (
        <div className="alert-warning" style={{ marginBottom: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: "0.875rem" }}>You must submit and get a project proposal approved before requesting a supervisor.</p>
        </div>
      )}

      {/* ── Available Supervisors list ── */}
      {!hasSupervisor && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>
              Available Supervisors
              <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.875rem" }}> ({filtered.length})</span>
            </p>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input className="input" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, dept, expertise…"
                style={{ paddingLeft: "2rem", width: 260 }} />
            </div>
          </div>

          {/* Info banner if pending request exists */}
          {pendingRequest && (
            <div className="alert-info" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: "0.85rem" }}>
                You already have a pending request sent to <strong>{pendingRequest.supervisor?.name}</strong>. You cannot send another request until this one is resolved.
              </p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "0.875rem" }}>
            {filtered.map((sup, i) => {
              const pct = Math.round(((sup.currentLoad || 0) / (sup.maxStudents || 10)) * 100);
              // Disable request button if: already has pending request, no approved project, supervisor full, or supervisor assigned
              const isRequested = pendingRequest?.supervisor?._id === sup._id || pendingRequest?.supervisor === sup._id;
              const buttonDisabled = !canRequest || !sup.available;
              const disabledReason = hasSupervisor ? "Supervisor already assigned"
                : pendingRequest ? `Pending request sent to ${pendingRequest.supervisor?.name}`
                : !project ? "Submit a project first"
                : project?.status !== "approved" ? "Project not yet approved"
                : !sup.available ? "Supervisor is at capacity"
                : null;

              return (
                <div key={sup._id || i} className="card" style={{ transition: "border-color 0.2s", position: "relative" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-strong)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-light)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>
                      {sup.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>{sup.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{sup.department || "No department"}</p>
                    </div>
                    <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: 4, fontWeight: 600, whiteSpace: "nowrap",
                      background: sup.available ? "var(--success-light)" : "var(--danger-light)",
                      color: sup.available ? "var(--success)" : "var(--danger)",
                      border: `1px solid ${sup.available ? "var(--success-border)" : "var(--danger-border)"}` }}>
                      {sup.available ? "Available" : "Full"}
                    </span>
                  </div>

                  {sup.experties?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
                      {sup.experties.slice(0, 4).map((e, ei) => (
                        <span key={ei} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 5, padding: "0.15rem 0.5rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{e}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Capacity</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{sup.currentLoad}/{sup.maxStudents}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 90 ? "var(--danger)" : pct >= 60 ? "var(--warning)" : "var(--accent)" }} />
                    </div>
                  </div>

                  <button onClick={() => { setModal(sup); setMessage(""); }} disabled={buttonDisabled}
                    className={buttonDisabled ? "btn-outline btn-small" : "btn-primary btn-small"}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", opacity: buttonDisabled ? 0.55 : 1, cursor: buttonDisabled ? "not-allowed" : "pointer" }}>
                    {isRequested
                      ? <><Clock size={13} /> Request Sent</>
                      : <><Send size={13} /> Request as Supervisor</>}
                  </button>

                  {disabledReason && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.4rem" }}>
                      {disabledReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Request modal ── */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>Send Request</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>to {modal.name}</p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>

            <div className="alert-info" style={{ marginBottom: "1rem", fontSize: "0.82rem" }}>
              <strong>Note:</strong> Once sent, you cannot send another request until this one is resolved. The admin will formally assign your supervisor.
            </div>

            <div>
              <label className="label">Message <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
              <textarea className="input" value={message} onChange={e => setMessage(e.target.value)}
                placeholder={`Explain briefly why you'd like ${modal.name} as your supervisor…`}
                maxLength={250} style={{ minHeight: 100, resize: "vertical" }} />
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: "right" }}>{message.length}/250</p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={handleRequest} disabled={sending} className="btn-primary" style={{ flex: 1 }}>
                {sending ? <><Loader size={14} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send Request</>}
              </button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPage;
