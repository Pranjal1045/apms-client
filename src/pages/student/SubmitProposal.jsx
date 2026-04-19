import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitProjectProposal } from "../../store/slices/studentSlice";
import { fetchMyGroup } from "../../store/slices/groupSlice";
import { FileText, Users, Info, Loader, CheckCircle, Lock, AlertTriangle } from "lucide-react";

const SubmitProposal = () => {
  const dispatch = useDispatch();
  const { myGroup } = useSelector(s => s.group);
  const { project, isLoading } = useSelector(s => s.student);
  const { authUser } = useSelector(s => s.auth);

  const [formData, setFormData] = useState({ title: "", description: "", isGroupProject: false });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { dispatch(fetchMyGroup()); }, [dispatch]);

  const isLeader = myGroup
    ? (myGroup.groupLeader?._id === authUser?._id || myGroup.groupLeader === authUser?._id ||
       myGroup.groupLeader?._id?.toString() === authUser?._id?.toString())
    : false;

  const isNonLeaderMember = myGroup && !isLeader;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    try {
      await dispatch(submitProjectProposal(formData)).unwrap();
      setSubmitted(true);
      setFormData({ title: "", description: "", isGroupProject: false });
    } catch (_) {}
  };

  // ── Already has a project (leader just submitted) ──────────────────────
  if (submitted) return (
    <div style={{ maxWidth: "560px", margin: "4rem auto", textAlign: "center" }} className="fade-in">
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--success-light)", border: "1px solid var(--success-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
        <CheckCircle size={30} style={{ color: "var(--success)" }} />
      </div>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Proposal Submitted!</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Your project proposal has been submitted and is pending review by the admin.
        {formData.isGroupProject && " All group members have been linked to this project."}
      </p>
    </div>
  );

  // ── Non-leader member: show their group's project status ───────────────
  if (isNonLeaderMember) {
    const leaderName = myGroup.groupLeader?.name || "the group leader";

    return (
      <div className="fade-in" style={{ maxWidth: "680px" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Submit Project Proposal</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Group project submission status</p>
        </div>

        {/* Non-leader info banner */}
        <div style={{ background: "var(--warning-light)", border: "1px solid var(--warning-border)", borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <Lock size={20} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem" }}>
              Only the group leader can submit the proposal
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              You are a member of <strong>{myGroup.name}</strong>. The group leader <strong>{leaderName}</strong> is responsible for submitting the project proposal. Once submitted, it will automatically be linked to all group members including you.
            </p>
          </div>
        </div>

        {/* Group info card */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Your Group — {myGroup.name}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.875rem" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Group Leader</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{leaderName}</p>
            </div>
            <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.875rem" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total Members</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>{myGroup.members?.length || 0}</p>
            </div>
          </div>

          {/* Project status if already submitted */}
          {project ? (
            <div style={{ background: "var(--success-light)", border: "1px solid var(--success-border)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <CheckCircle size={16} style={{ color: "var(--success)" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--success)" }}>Project Proposal Submitted</span>
              </div>
              <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{project.title}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Status: <span style={{ textTransform: "capitalize", fontWeight: 600,
                  color: project.status === "approved" ? "var(--success)" :
                         project.status === "rejected" ? "var(--danger)" : "var(--warning)"
                }}>{project.status}</span>
              </p>
            </div>
          ) : (
            <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-border)", borderRadius: "8px", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <AlertTriangle size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem" }}>No proposal submitted yet</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Ask <strong>{leaderName}</strong> to go to Submit Proposal and submit the group project. It will automatically appear on your dashboard too.
                </p>
              </div>
            </div>
          )}

          {/* Members list */}
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Group Members</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {myGroup.members?.map((m, i) => (
                <span key={m._id || i} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: (m._id || m) === (myGroup.groupLeader?._id || myGroup.groupLeader) ? "var(--success)" : "var(--accent)", flexShrink: 0 }} />
                  {m.name}
                  {(m._id || m) === (myGroup.groupLeader?._id || myGroup.groupLeader) && (
                    <span style={{ fontSize: "0.7rem", color: "var(--success)", fontWeight: 600 }}>Leader</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── No group — solo student OR leader ─────────────────────────────────
  return (
    <div className="fade-in" style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Submit Project Proposal</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Fill in your project details. Be clear and specific — your supervisor will review this.</p>
      </div>

      {/* Group leader info banner */}
      {myGroup && isLeader && (
        <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent-border)", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Info size={17} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            You are the leader of <strong style={{ color: "var(--text-primary)" }}>{myGroup.name}</strong>. You can submit this as a group project — all {myGroup.members?.length} members will be linked to this proposal.
          </p>
        </div>
      )}

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.75rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Project Type toggle — only for group leader */}
          {myGroup && isLeader && (
            <div>
              <label className="label">Project Type</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  { value: false, label: "Individual", icon: FileText, desc: "Personal project" },
                  { value: true,  label: "Group Project", icon: Users, desc: `With ${myGroup.members?.length} members` },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button key={String(value)} type="button"
                    onClick={() => setFormData(p => ({ ...p, isGroupProject: value }))}
                    style={{ flex: 1, padding: "0.875rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem",
                      border: formData.isGroupProject === value ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: formData.isGroupProject === value ? "var(--accent-light)" : "var(--bg-elevated)",
                      transition: "all 0.2s" }}>
                    <Icon size={18} style={{ color: formData.isGroupProject === value ? "var(--accent)" : "var(--text-muted)" }} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: formData.isGroupProject === value ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group members preview */}
          {formData.isGroupProject && myGroup && (
            <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.875rem" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Members who will be linked</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {myGroup.members?.map((m, i) => (
                  <span key={m._id || i} style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: "6px", padding: "0.25rem 0.65rem", fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                    {m.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="label">Project Title</label>
            <input className="input" name="title" value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. AI-Powered Student Attendance System" required maxLength={200} />
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{formData.title.length}/200 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="label">Project Description</label>
            <textarea className="input" name="description" value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your project's objectives, scope, technology stack, and expected outcomes..."
              required maxLength={2000}
              style={{ minHeight: "140px", resize: "vertical", lineHeight: 1.6 }} />
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{formData.description.length}/2000 characters</p>
          </div>

          {/* Guidelines */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.875rem" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Proposal Guidelines</p>
            {[
              "Clearly state the problem your project solves",
              "Mention the technology stack you plan to use",
              "Describe expected outcomes and deliverables",
              "Keep the title concise and descriptive",
            ].map((tip, i) => (
              <p key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem", display: "flex", gap: "0.4rem" }}>
                <span style={{ color: "var(--accent)" }}>→</span> {tip}
              </p>
            ))}
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
            <button type="submit" disabled={isLoading} className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? <><Loader size={15} className="animate-spin" /> Submitting…</> : "Submit Proposal"}
            </button>
            <button type="button" className="btn-outline"
              onClick={() => setFormData({ title: "", description: "", isGroupProject: false })}>
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitProposal;
