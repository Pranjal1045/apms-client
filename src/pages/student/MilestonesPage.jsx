import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject } from "../../store/slices/studentSlice";
import { axiosInstance } from "../../lib/axios";
import {
  CheckCircle2, Clock, AlertCircle, Calendar, Loader,
  Send, ChevronDown, ChevronUp, PenLine, BookOpen,
  Users, User, Info, RotateCcw, Stamp, Lock,
} from "lucide-react";
import { toast } from "react-toastify";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS = {
  upcoming: { icon: Calendar,      color: "var(--text-muted)",   bg: "rgba(100,116,139,0.1)", label: "Upcoming"       },
  active:   { icon: PenLine,       color: "var(--accent)",       bg: "rgba(37,99,235,0.1)",   label: "Active – Log Work" },
  submitted:{ icon: Clock,         color: "var(--warning)",      bg: "rgba(217,119,6,0.1)",   label: "Awaiting Sign-Off" },
  approved: { icon: Stamp,         color: "var(--success)",      bg: "rgba(22,163,74,0.1)",   label: "Signed Off ✓"   },
  rejected: { icon: RotateCcw,     color: "var(--danger)",       bg: "rgba(220,38,38,0.1)",   label: "Returned – Revise" },
};

const fmt    = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtDay = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short" }) : "—";

// ─── Log Entry Form ───────────────────────────────────────────────────────────
const LogEntryForm = ({ milestone, myEntry, onSaved, saving, setSaving }) => {
  const [form, setForm] = useState({
    workDone:   myEntry?.workDone   || "",
    hoursSpent: myEntry?.hoursSpent ?? "",
    challenges: myEntry?.challenges || "",
  });

  const isDirty = form.workDone !== (myEntry?.workDone || "") ||
    String(form.hoursSpent) !== String(myEntry?.hoursSpent ?? "") ||
    form.challenges !== (myEntry?.challenges || "");

  const save = async () => {
    if (!form.workDone.trim()) { toast.error("Please describe what you worked on"); return; }
    setSaving(milestone._id);
    try {
      const res = await axiosInstance.patch(`/milestone/${milestone._id}/log`, {
        workDone:   form.workDone.trim(),
        hoursSpent: Number(form.hoursSpent) || 0,
        challenges: form.challenges.trim(),
      });
      onSaved(res.data.data.milestone);
      toast.success("Work log saved!");
    } catch (e) { toast.error(e.response?.data?.message || "Failed to save"); }
    finally { setSaving(null); }
  };

  const locked = ["submitted", "approved"].includes(milestone.status);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
      <div>
        <label className="label" style={{ display:"flex", justifyContent:"space-between" }}>
          <span>What did you work on this week? *</span>
          <span style={{ fontSize:"0.72rem", color:"var(--text-faint)", fontWeight:400 }}>{form.workDone.length}/2000</span>
        </label>
        <textarea
          className="input"
          rows={4}
          style={{ resize:"vertical", opacity: locked ? 0.7 : 1 }}
          disabled={locked}
          value={form.workDone}
          onChange={e => setForm(p => ({ ...p, workDone: e.target.value }))}
          maxLength={2000}
          placeholder="Describe your work in detail — what you implemented, researched, designed, tested..."
        />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
        <div>
          <label className="label">Hours Spent</label>
          <input type="number" className="input" min={0} max={168} disabled={locked}
            style={{ opacity: locked ? 0.7 : 1 }}
            value={form.hoursSpent}
            onChange={e => setForm(p => ({ ...p, hoursSpent: e.target.value }))}
            placeholder="e.g. 12" />
        </div>
        <div>
          <label className="label">Challenges / Blockers</label>
          <input className="input" disabled={locked}
            style={{ opacity: locked ? 0.7 : 1 }}
            value={form.challenges}
            onChange={e => setForm(p => ({ ...p, challenges: e.target.value }))}
            maxLength={1000}
            placeholder="Any issues or blockers?" />
        </div>
      </div>
      {!locked && (
        <div style={{ display:"flex", justifyContent:"flex-end" }}>
          <button onClick={save} disabled={saving === milestone._id || !isDirty || !form.workDone.trim()}
            className="btn-primary" style={{ fontSize:"0.82rem" }}>
            {saving === milestone._id ? <Loader size={13} className="animate-spin"/> : <PenLine size={13}/>}
            {myEntry ? "Update Log" : "Save Log Entry"}
          </button>
        </div>
      )}
      {locked && (
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.78rem", color:"var(--text-muted)" }}>
          <Lock size={12}/> {milestone.status === "approved" ? "Log locked — signed off by supervisor." : "Log locked — awaiting supervisor review."}
        </div>
      )}
    </div>
  );
};

// ─── Submit Modal ─────────────────────────────────────────────────────────────
const SubmitModal = ({ milestone, project, onClose, onSubmitted }) => {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const allMembers    = project.members?.length ? project.members : [project.student];
  const loggedIds     = (milestone.logEntries || []).map(e => e.member?._id || e.member);
  const unloggedCount = allMembers.filter(m => !loggedIds.includes((m._id || m).toString())).length;

  const submit = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/milestone/${milestone._id}/submit`, { submissionNote: note });
      onSubmitted(res.data.data.milestone);
      toast.success(res.data.message);
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to submit"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth:"520px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"rgba(37,99,235,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Send size={18} style={{ color:"var(--accent)" }}/>
          </div>
          <div>
            <h3 style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)" }}>Submit Week {milestone.weekNumber} for Sign-Off</h3>
            <p style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{milestone.title}</p>
          </div>
        </div>

        {/* Member log status */}
        {allMembers.length > 1 && (
          <div style={{ background:"var(--bg-elevated)", borderRadius:"var(--radius)", padding:"0.85rem", marginBottom:"1rem" }}>
            <p style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:"0.5rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <Users size={13}/> Group Members' Log Status
            </p>
            {allMembers.map(m => {
              const id = m._id?.toString() || m.toString();
              const hasLog = loggedIds.map(l => l?.toString()).includes(id);
              return (
                <div key={id} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.8rem", color: hasLog?"var(--success)":"var(--danger)", marginBottom:"0.2rem" }}>
                  {hasLog ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                  {m.name || "Member"} {hasLog ? "— logged ✓" : "— no log entry yet"}
                </div>
              );
            })}
          </div>
        )}

        {unloggedCount > 0 && (
          <div className="alert-warning" style={{ marginBottom:"1rem", fontSize:"0.82rem" }}>
            ⚠ {unloggedCount} member{unloggedCount>1?"s have":" has"} not logged their work yet. You can still submit, but it's best to have all members log first.
          </div>
        )}

        <div style={{ marginBottom:"1rem" }}>
          <label className="label">Summary Note to Supervisor <span style={{ color:"var(--text-faint)", fontWeight:400 }}>(optional)</span></label>
          <textarea className="input" value={note} onChange={e=>setNote(e.target.value)} rows={3}
            style={{ resize:"vertical" }} maxLength={1000}
            placeholder="Overall summary of the week — what was achieved, any important notes for the supervisor..." />
        </div>

        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary">
            {loading ? <Loader size={14} className="animate-spin"/> : <Stamp size={14}/>}
            Request Sign-Off
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Milestone Card ───────────────────────────────────────────────────────────
const MilestoneCard = ({ milestone, authUser, project, onUpdate }) => {
  const [expanded, setExpanded]   = useState(false);
  const [saving, setSaving]       = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const cfg    = STATUS[milestone.status] || STATUS.upcoming;
  const Icon   = cfg.icon;
  const uid    = authUser._id;
  const myEntry = (milestone.logEntries || []).find(e => (e.member?._id || e.member)?.toString() === uid);

  const canLog    = ["active", "rejected"].includes(milestone.status); // Can also log if returned
  const canSubmit = ["active"].includes(milestone.status) && (milestone.logEntries?.length > 0);
  // Returned milestone: can edit log entries then resubmit
  const canResubmit = milestone.status === "rejected";

  // Auto-expand current active or returned milestone
  useEffect(() => {
    if (["active", "rejected"].includes(milestone.status)) setExpanded(true);
  }, [milestone.status]);

  const weekRange = `${fmtDay(milestone.weekStartDate)} → ${fmtDay(milestone.weekEndDate)}`;

  return (
    <>
      <div style={{
        background:"var(--bg-card)", border:`1px solid ${
          milestone.status==="approved" ? "var(--success-border)" :
          milestone.status==="submitted" ? "var(--warning-border)" :
          milestone.status==="rejected"  ? "var(--danger-border)"  :
          milestone.status==="active"    ? "var(--accent-border)"  :
          "var(--border)"}`,
        borderRadius:"var(--radius-lg)", overflow:"hidden",
        boxShadow: milestone.status==="active" ? "0 0 0 2px rgba(37,99,235,0.1)" : "var(--shadow-sm)",
      }}>

        {/* Card header */}
        <div style={{ padding:"1rem 1.25rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"1rem" }}
          onClick={() => setExpanded(e => !e)}>
          {/* Status circle */}
          <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:cfg.bg,
            border:`2px solid ${cfg.color}`, display:"flex", alignItems:"center",
            justifyContent:"center", flexShrink:0 }}>
            <Icon size={17} style={{ color:cfg.color }}/>
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap", marginBottom:"0.2rem" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text-faint)",
                textTransform:"uppercase", letterSpacing:"0.08em" }}>Week {milestone.weekNumber}</span>
              <span style={{ fontSize:"0.68rem", padding:"0.15rem 0.5rem", borderRadius:"99px",
                background:cfg.bg, color:cfg.color, fontWeight:600, textTransform:"uppercase",
                letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{cfg.label}</span>
            </div>
            <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem", marginBottom:"0.15rem" }}>{milestone.title}</p>
            <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{weekRange}</p>
          </div>

          {/* My log indicator */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.25rem", flexShrink:0 }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"50%",
              background: myEntry ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.1)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <PenLine size={13} style={{ color: myEntry ? "var(--success)" : "var(--text-faint)" }}/>
            </div>
            <span style={{ fontSize:"0.6rem", color: myEntry?"var(--success)":"var(--text-faint)", fontWeight:600 }}>
              {myEntry ? "Logged" : "No Log"}
            </span>
          </div>

          <div style={{ color:"var(--text-muted)" }}>{expanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</div>
        </div>

        {/* Expanded body */}
        {expanded && (
          <div style={{ borderTop:"1px solid var(--border)" }}>

            {/* Description */}
            {milestone.description && (
              <div style={{ padding:"0.85rem 1.25rem", background:"var(--bg-elevated)", borderBottom:"1px solid var(--border)" }}>
                <p style={{ fontSize:"0.82rem", color:"var(--text-secondary)", lineHeight:1.6 }}>
                  <strong style={{ color:"var(--text-primary)" }}>Objectives: </strong>{milestone.description}
                </p>
              </div>
            )}

            <div style={{ padding:"1rem 1.25rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>

              {/* Supervisor note (if returned) */}
              {milestone.status === "rejected" && milestone.supervisorNote && (
                <div style={{ background:"var(--danger-light)", border:"1px solid var(--danger-border)", borderRadius:"var(--radius)", padding:"0.85rem 1rem" }}>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--danger)", marginBottom:"0.3rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <RotateCcw size={12}/> RETURNED FOR REVISION
                  </p>
                  <p style={{ fontSize:"0.84rem", color:"var(--text-secondary)" }}>{milestone.supervisorNote}</p>
                </div>
              )}

              {/* Supervisor sign-off note */}
              {milestone.status === "approved" && (
                <div style={{ background:"var(--success-light)", border:"1px solid var(--success-border)", borderRadius:"var(--radius)", padding:"0.85rem 1rem" }}>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--success)", marginBottom:"0.3rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    <Stamp size={12}/> SIGNED OFF by {milestone.signedOffBy?.name || "Supervisor"} · {fmt(milestone.signedOffAt)}
                  </p>
                  {milestone.supervisorNote && <p style={{ fontSize:"0.84rem", color:"var(--text-secondary)" }}>{milestone.supervisorNote}</p>}
                </div>
              )}

              {/* My log entry form */}
              <div>
                <p style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-secondary)",
                  textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.75rem",
                  display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <BookOpen size={13}/> My Work Log Entry
                </p>
                <LogEntryForm
                  milestone={milestone}
                  myEntry={myEntry}
                  onSaved={onUpdate}
                  saving={saving}
                  setSaving={setSaving}
                />
              </div>

              {/* All team members' entries (group projects) */}
              {milestone.logEntries?.length > 0 && project.members?.length > 1 && (
                <div>
                  <p style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-secondary)",
                    textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.75rem",
                    display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <Users size={13}/> Team Log Entries
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                    {milestone.logEntries.map(entry => {
                      const isMe = (entry.member?._id || entry.member)?.toString() === uid;
                      return (
                        <div key={entry._id} style={{ background:"var(--bg-elevated)", borderRadius:"var(--radius)", padding:"0.85rem 1rem",
                          border: isMe ? "1px solid var(--accent-border)" : "1px solid transparent" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                            <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-primary)", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                              <User size={12} style={{ color:"var(--text-muted)" }}/> {entry.member?.name || "Member"} {isMe && <span style={{ fontSize:"0.68rem", color:"var(--accent)", fontWeight:700 }}>(you)</span>}
                            </span>
                            <span style={{ fontSize:"0.72rem", color:"var(--text-faint)" }}>{entry.hoursSpent}h · {fmtDay(entry.submittedAt)}</span>
                          </div>
                          <p style={{ fontSize:"0.82rem", color:"var(--text-secondary)", lineHeight:1.6, marginBottom: entry.challenges ? "0.4rem" : 0 }}>{entry.workDone}</p>
                          {entry.challenges && (
                            <p style={{ fontSize:"0.78rem", color:"var(--warning)", marginTop:"0.3rem" }}>⚠ {entry.challenges}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submission note (already submitted) */}
              {["submitted","approved"].includes(milestone.status) && milestone.submissionNote && (
                <div style={{ background:"rgba(37,99,235,0.06)", border:"1px solid rgba(37,99,235,0.2)", borderRadius:"var(--radius)", padding:"0.85rem 1rem" }}>
                  <p style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--accent)", marginBottom:"0.25rem" }}>Summary Note Sent to Supervisor</p>
                  <p style={{ fontSize:"0.82rem", color:"var(--text-secondary)" }}>{milestone.submissionNote}</p>
                </div>
              )}

              {/* Submit / Resubmit CTA */}
              {(canSubmit || canResubmit) && (
                <div style={{ borderTop:"1px solid var(--border)", paddingTop:"1rem", display:"flex", justifyContent:"flex-end" }}>
                  <button onClick={() => setShowSubmit(true)} className="btn-primary">
                    <Stamp size={14}/>
                    {canResubmit ? "Update & Request Re-Sign-Off" : "Submit for Supervisor Sign-Off"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSubmit && (
        <SubmitModal
          milestone={milestone}
          project={project}
          onClose={() => setShowSubmit(false)}
          onSubmitted={updated => { onUpdate(updated); setShowSubmit(false); }}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MilestonesPage = () => {
  const dispatch = useDispatch();
  const { project } = useSelector(s => s.student);
  const { authUser } = useSelector(s => s.auth);
  const [milestones, setMilestones]   = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => { if (!project) dispatch(fetchProject()); }, [dispatch]);
  useEffect(() => { if (project?._id) load(); }, [project]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/milestone/${project._id}`);
      setMilestones(res.data.data.milestones || []);
      setProjectData(res.data.data.project || project);
    } catch { toast.error("Failed to load milestones"); }
    finally { setLoading(false); }
  };

  const handleUpdate = useCallback((updated) => {
    setMilestones(prev => prev.map(m => m._id === updated._id ? updated : m));
  }, []);

  // Stats
  const total     = milestones.length;
  const approved  = milestones.filter(m => m.status === "approved").length;
  const submitted = milestones.filter(m => m.status === "submitted").length;
  const active    = milestones.filter(m => m.status === "active").length;
  const pct       = total ? Math.round((approved / total) * 100) : 0;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <Loader size={28} style={{ color:"var(--accent)" }} className="animate-spin"/>
    </div>
  );

  if (!project) return (
    <div className="fade-in" style={{ maxWidth:"600px" }}>
      <div className="alert-warning">Submit a project proposal first to view milestones.</div>
    </div>
  );

  const proj = projectData || project;
  const isGroup = proj.isGroupProject || proj.members?.length > 1;

  return (
    <div className="fade-in" style={{ maxWidth:"800px" }}>

      {/* Header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.3rem" }}>
          <BookOpen size={22} style={{ color:"var(--accent)" }}/>
          <h1 style={{ fontSize:"1.4rem", fontWeight:800, color:"var(--text-primary)" }}>Weekly Progress Logbook</h1>
          {isGroup && (
            <span style={{ fontSize:"0.72rem", fontWeight:700, padding:"0.2rem 0.6rem", borderRadius:"99px",
              background:"rgba(37,99,235,0.1)", color:"var(--accent)", border:"1px solid var(--accent-border)" }}>
              <Users size={10} style={{ display:"inline", marginRight:"3px" }}/> Group Project
            </span>
          )}
        </div>
        <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>
          Log your work each week, then submit to your supervisor for sign-off — just like a physical logbook.
        </p>
      </div>

      {/* How it works banner */}
      <div style={{ background:"rgba(37,99,235,0.05)", border:"1px solid var(--accent-border)",
        borderRadius:"var(--radius-lg)", padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
        <p style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--accent)", marginBottom:"0.5rem",
          display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <Info size={13}/> HOW IT WORKS
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"0.5rem" }}>
          {[
            { step:"1", text:"Supervisor sets weekly milestones with objectives" },
            { step:"2", text:"You log your work each day in the active week" },
            { step:"3", text:"Submit at week end with a summary note" },
            { step:"4", text:"Supervisor reviews and signs off — logged forever" },
          ].map(s => (
            <div key={s.step} style={{ display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
              <span style={{ fontSize:"0.65rem", fontWeight:800, color:"#fff", background:"var(--accent)",
                borderRadius:"50%", width:"18px", height:"18px", display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0, marginTop:"1px" }}>{s.step}</span>
              <p style={{ fontSize:"0.75rem", color:"var(--text-secondary)", lineHeight:1.5 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.75rem", marginBottom:"1.25rem" }}>
        {[
          { label:"Total Weeks",   value:total,    color:"var(--text-primary)" },
          { label:"Signed Off",    value:approved, color:"var(--success)" },
          { label:"In Review",     value:submitted, color:"var(--warning)" },
          { label:"Active Now",    value:active,   color:"var(--accent)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"0.85rem 1rem", textAlign:"center" }}>
            <p style={{ fontSize:"1.4rem", fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:"0.68rem", color:"var(--text-muted)", marginTop:"0.3rem", fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card" style={{ padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.5rem" }}>
            <span style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)" }}>Supervisor Sign-Off Progress</span>
            <span style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--accent)" }}>{approved}/{total} weeks signed off ({pct}%)</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%`, background:"var(--success)" }}/></div>
          {/* Week markers */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.4rem" }}>
            {milestones.map(m => (
              <div key={m._id} title={`Week ${m.weekNumber}: ${m.title}`}
                style={{ flex:1, height:"4px", borderRadius:"2px", margin:"0 1px",
                  background: m.status==="approved"?"var(--success)":m.status==="submitted"?"var(--warning)":
                    m.status==="active"?"var(--accent)":"var(--border)" }} />
            ))}
          </div>
        </div>
      )}

      {/* Milestone cards */}
      {!milestones.length ? (
        <div className="card" style={{ padding:"4rem", textAlign:"center", color:"var(--text-muted)" }}>
          <BookOpen size={40} style={{ opacity:0.25, margin:"0 auto 1rem" }}/>
          <p style={{ fontWeight:600, marginBottom:"0.4rem" }}>No weekly milestones yet</p>
          <p style={{ fontSize:"0.875rem" }}>Your supervisor will set up weekly milestones for your project. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
          {milestones.map(m => (
            <MilestoneCard
              key={m._id}
              milestone={m}
              authUser={authUser}
              project={proj}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestonesPage;
