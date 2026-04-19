import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import {
  Plus, Loader, CheckCircle2, Clock, Calendar, PenLine,
  ChevronDown, ChevronUp, Trash2, Edit3, Stamp, RotateCcw,
  Users, User, BookOpen, Info, AlertCircle, Check, X,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS = {
  upcoming: { icon: Calendar,   color:"var(--text-muted)",  bg:"rgba(100,116,139,0.1)", label:"Upcoming"        },
  active:   { icon: PenLine,    color:"var(--accent)",      bg:"rgba(37,99,235,0.1)",   label:"Active"          },
  submitted:{ icon: Clock,      color:"var(--warning)",     bg:"rgba(217,119,6,0.1)",   label:"Awaiting Sign-Off", urgent:true },
  approved: { icon: Stamp,      color:"var(--success)",     bg:"rgba(22,163,74,0.1)",   label:"Signed Off ✓"   },
  rejected: { icon: RotateCcw,  color:"var(--danger)",      bg:"rgba(220,38,38,0.1)",   label:"Returned"        },
};

const fmt    = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtDay = (d) => d ? new Date(d).toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short" }) : "—";

// ─── Add/Edit Milestone Modal ─────────────────────────────────────────────────
const MilestoneFormModal = ({ projectId, existingWeeks, milestone, onClose, onSaved }) => {
  const isEdit = !!milestone;
  const nextWeek = (existingWeeks.length ? Math.max(...existingWeeks) + 1 : 1);

  const getWeekDates = (wkNum) => {
    // Calculate week start (Mon) and end (Sun) for given week offset from today's week
    const now   = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + (wkNum - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().slice(0,10),
      end:   sunday.toISOString().slice(0,10),
    };
  };

  const defaultDates = getWeekDates(nextWeek);
  const [form, setForm] = useState({
    weekNumber:    milestone?.weekNumber ?? nextWeek,
    title:         milestone?.title || "",
    description:   milestone?.description || "",
    weekStartDate: milestone?.weekStartDate ? milestone.weekStartDate.slice(0,10) : defaultDates.start,
    weekEndDate:   milestone?.weekEndDate   ? milestone.weekEndDate.slice(0,10)   : defaultDates.end,
  });
  const [saving, setSaving] = useState(false);

  // Auto-fill dates when week number changes (only for new milestones)
  const handleWeekChange = (val) => {
    const wk = parseInt(val) || 1;
    if (!isEdit) {
      const dates = getWeekDates(wk);
      setForm(p => ({ ...p, weekNumber: wk, weekStartDate: dates.start, weekEndDate: dates.end }));
    } else {
      setForm(p => ({ ...p, weekNumber: wk }));
    }
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.weekStartDate || !form.weekEndDate) { toast.error("Start and end dates are required"); return; }
    if (new Date(form.weekEndDate) < new Date(form.weekStartDate)) { toast.error("End date must be after start date"); return; }
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await axiosInstance.put(`/milestone/${milestone._id}`, {
          title: form.title, description: form.description,
          weekStartDate: form.weekStartDate, weekEndDate: form.weekEndDate,
        });
        toast.success("Milestone updated");
      } else {
        res = await axiosInstance.post(`/milestone/${projectId}`, form);
        toast.success(`Week ${form.weekNumber} milestone created — students notified`);
      }
      onSaved(res.data.data.milestone, isEdit);
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth:"520px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"rgba(37,99,235,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            {isEdit ? <Edit3 size={18} style={{ color:"var(--accent)" }}/> : <Plus size={18} style={{ color:"var(--accent)" }}/>}
          </div>
          <h3 style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)" }}>
            {isEdit ? `Edit Week ${milestone.weekNumber}` : "Add Weekly Milestone"}
          </h3>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {!isEdit && (
            <div>
              <label className="label">Week Number</label>
              <input type="number" className="input" min={1} max={52} value={form.weekNumber}
                onChange={e => handleWeekChange(e.target.value)}
                placeholder="e.g. 1" />
              {existingWeeks.includes(form.weekNumber) && (
                <p style={{ fontSize:"0.75rem", color:"var(--danger)", marginTop:"0.25rem" }}>
                  Week {form.weekNumber} already exists for this project
                </p>
              )}
            </div>
          )}
          <div>
            <label className="label">Milestone Title *</label>
            <input className="input" value={form.title} maxLength={120}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Literature Review & Problem Statement" />
          </div>
          <div>
            <label className="label">Objectives / Expected Deliverables</label>
            <textarea className="input" value={form.description} rows={3} maxLength={1000}
              style={{ resize:"vertical" }}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What should the student(s) complete this week? Be specific..." />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
            <div>
              <label className="label">Week Start Date *</label>
              <input type="date" className="input" value={form.weekStartDate}
                onChange={e => setForm(p => ({ ...p, weekStartDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Week End Date *</label>
              <input type="date" className="input" value={form.weekEndDate}
                onChange={e => setForm(p => ({ ...p, weekEndDate: e.target.value }))} />
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"flex-end", marginTop:"1.5rem" }}>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={save} disabled={saving || (!isEdit && existingWeeks.includes(form.weekNumber))} className="btn-primary">
            {saving ? <Loader size={14} className="animate-spin"/> : isEdit ? <Edit3 size={14}/> : <Plus size={14}/>}
            {isEdit ? "Save Changes" : "Create Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Sign-Off Modal ───────────────────────────────────────────────────────────
const SignOffModal = ({ milestone, onClose, onReviewed }) => {
  const [action, setAction]   = useState(null);
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (action === "reject" && !note.trim()) { toast.error("Provide feedback when returning for revision"); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.patch(`/milestone/${milestone._id}/review`, {
        action, supervisorNote: note,
      });
      toast.success(action === "approve"
        ? `Week ${milestone.weekNumber} signed off! Student notified.`
        : "Returned for revision. Student notified.");
      onReviewed(res.data.data.milestone);
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setLoading(false); }
  };

  const allMembers = milestone.logEntries || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth:"600px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1.25rem" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"rgba(37,99,235,0.1)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Stamp size={18} style={{ color:"var(--accent)" }}/>
          </div>
          <div>
            <h3 style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)" }}>
              Sign Off — Week {milestone.weekNumber}
            </h3>
            <p style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>{milestone.title}</p>
          </div>
        </div>

        {/* Summary note from student */}
        {milestone.submissionNote && (
          <div style={{ background:"rgba(37,99,235,0.05)", border:"1px solid rgba(37,99,235,0.2)",
            borderRadius:"var(--radius)", padding:"0.85rem", marginBottom:"1rem" }}>
            <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--accent)", marginBottom:"0.3rem" }}>
              Student's Summary Note
            </p>
            <p style={{ fontSize:"0.84rem", color:"var(--text-secondary)" }}>{milestone.submissionNote}</p>
            {milestone.submittedBy && (
              <p style={{ fontSize:"0.72rem", color:"var(--text-faint)", marginTop:"0.25rem" }}>
                Submitted by {milestone.submittedBy.name} · {fmt(milestone.submittedAt)}
              </p>
            )}
          </div>
        )}

        {/* Member log entries */}
        {allMembers.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-secondary)",
              textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.6rem" }}>
              Work Log Entries ({allMembers.length})
            </p>
            <div style={{ maxHeight:"240px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {allMembers.map(entry => (
                <div key={entry._id} style={{ background:"var(--bg-elevated)", borderRadius:"var(--radius)", padding:"0.75rem 0.9rem" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.35rem" }}>
                    <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-primary)", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <User size={11} style={{ color:"var(--text-muted)" }}/> {entry.member?.name || "Member"}
                    </span>
                    <span style={{ fontSize:"0.72rem", color:"var(--text-faint)" }}>{entry.hoursSpent}h · {fmtDay(entry.submittedAt)}</span>
                  </div>
                  <p style={{ fontSize:"0.82rem", color:"var(--text-secondary)", lineHeight:1.5 }}>{entry.workDone}</p>
                  {entry.challenges && (
                    <p style={{ fontSize:"0.78rem", color:"var(--warning)", marginTop:"0.3rem" }}>⚠ {entry.challenges}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action choice */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1rem" }}>
          <button onClick={() => setAction("approve")} style={{
            padding:"0.85rem", borderRadius:"var(--radius-lg)", cursor:"pointer", transition:"all 0.15s",
            border:`2px solid ${action==="approve"?"var(--success)":"var(--border)"}`,
            background: action==="approve" ? "var(--success-light)" : "transparent",
            color: action==="approve" ? "var(--success)" : "var(--text-secondary)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem",
          }}>
            <Check size={22}/>
            <span style={{ fontSize:"0.84rem", fontWeight:700 }}>Sign Off</span>
            <span style={{ fontSize:"0.72rem", opacity:0.75 }}>Approve & mark complete</span>
          </button>
          <button onClick={() => setAction("reject")} style={{
            padding:"0.85rem", borderRadius:"var(--radius-lg)", cursor:"pointer", transition:"all 0.15s",
            border:`2px solid ${action==="reject"?"var(--danger)":"var(--border)"}`,
            background: action==="reject" ? "var(--danger-light)" : "transparent",
            color: action==="reject" ? "var(--danger)" : "var(--text-secondary)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:"0.35rem",
          }}>
            <RotateCcw size={22}/>
            <span style={{ fontSize:"0.84rem", fontWeight:700 }}>Return</span>
            <span style={{ fontSize:"0.72rem", opacity:0.75 }}>Request revision</span>
          </button>
        </div>

        {action && (
          <div style={{ marginBottom:"1rem" }}>
            <label className="label">
              {action === "approve" ? "Sign-Off Note (optional)" : "Feedback / Reason *"}
            </label>
            <textarea className="input" value={note} onChange={e => setNote(e.target.value)} rows={3}
              style={{ resize:"vertical" }} maxLength={1000}
              placeholder={action === "approve"
                ? "Great work this week! Well done on..."
                : "Please add more detail to your work description. Also..."} />
          </div>
        )}

        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
          <button onClick={onClose} className="btn-outline">Cancel</button>
          {action && (
            <button onClick={submit} disabled={loading}
              style={{ display:"inline-flex", alignItems:"center", gap:"0.375rem",
                background: action==="approve"?"var(--success)":"var(--danger)",
                color:"#fff", padding:"0.5rem 1rem", borderRadius:"var(--radius)",
                border:"none", cursor:"pointer", fontSize:"0.875rem", fontWeight:500, fontFamily:"inherit" }}>
              {loading ? <Loader size={14} className="animate-spin"/>
                : action==="approve" ? <Stamp size={14}/> : <RotateCcw size={14}/>}
              {action==="approve" ? "Confirm Sign-Off" : "Return for Revision"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Project Panel ────────────────────────────────────────────────────────────
const ProjectPanel = ({ project, onUpdated }) => {
  const [expanded, setExpanded]   = useState(false);
  const [formModal, setFormModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [signOffTarget, setSignOffTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const milestones   = project.milestones || [];
  const total        = milestones.length;
  const approved     = milestones.filter(m => m.status === "approved").length;
  const needsReview  = milestones.filter(m => m.status === "submitted").length;
  const pct          = total ? Math.round((approved/total)*100) : 0;
  const existingWeeks = milestones.map(m => m.weekNumber);
  const isGroup      = project.isGroupProject || project.members?.length > 1;

  const studentLabel = isGroup
    ? `${project.group?.name || "Group"} · ${project.members?.map(m=>m.name).join(", ")}`
    : project.student?.name || "Unknown";

  // Auto-expand if there are submissions awaiting review
  useEffect(() => {
    if (needsReview > 0) setExpanded(true);
  }, [needsReview]);

  const handleDelete = async (m) => {
    if (!confirm(`Delete Week ${m.weekNumber}: "${m.title}"? This cannot be undone.`)) return;
    setDeletingId(m._id);
    try {
      await axiosInstance.delete(`/milestone/${m._id}`);
      onUpdated(project._id, milestones.filter(x => x._id !== m._id));
      toast.success("Milestone deleted");
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setDeletingId(null); }
  };

  const handleSaved = (saved, isEdit) => {
    const updated = isEdit
      ? milestones.map(m => m._id === saved._id ? saved : m)
      : [...milestones, saved].sort((a,b) => a.weekNumber - b.weekNumber);
    onUpdated(project._id, updated);
  };

  const handleReviewed = (reviewed) => {
    onUpdated(project._id, milestones.map(m => m._id === reviewed._id ? reviewed : m));
  };

  return (
    <>
      <div className="card" style={{ padding:0, overflow:"hidden",
        border: needsReview > 0 ? "1px solid var(--warning-border)" : "1px solid var(--border)" }}>

        {/* Project header */}
        <div style={{ padding:"1.1rem 1.25rem", display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:"1rem", cursor:"pointer",
          background: needsReview > 0 ? "rgba(217,119,6,0.03)" : "transparent" }}
          onClick={() => setExpanded(e => !e)}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", flexWrap:"wrap", marginBottom:"0.3rem" }}>
              {isGroup && <Users size={14} style={{ color:"var(--accent)", flexShrink:0 }}/>}
              <h3 style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.95rem" }}>{project.title}</h3>
              {needsReview > 0 && (
                <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"0.15rem 0.55rem",
                  borderRadius:"99px", background:"var(--warning)", color:"#fff", flexShrink:0 }}>
                  {needsReview} need{needsReview===1?"s":""} sign-off
                </span>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.78rem", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"0.3rem" }}>
                {isGroup ? <Users size={11}/> : <User size={11}/>} {studentLabel}
              </span>
              <span style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>
                {approved}/{total} weeks signed off
              </span>
            </div>
            {total > 0 && (
              <div style={{ marginTop:"0.5rem", display:"flex", gap:"2px", height:"4px" }}>
                {milestones.sort((a,b)=>a.weekNumber-b.weekNumber).map(m => (
                  <div key={m._id} title={`Week ${m.weekNumber}: ${STATUS[m.status]?.label}`}
                    style={{ flex:1, borderRadius:"2px",
                      background: m.status==="approved"?"var(--success)":m.status==="submitted"?"var(--warning)":
                        m.status==="active"?"var(--accent)":"var(--border)" }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexShrink:0 }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setFormModal(true)} className="btn-primary" style={{ fontSize:"0.78rem", padding:"0.35rem 0.75rem" }}>
              <Plus size={13}/> Add Week
            </button>
            <button onClick={() => setExpanded(e=>!e)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}>
              {expanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
            </button>
          </div>
        </div>

        {/* Milestones table */}
        {expanded && (
          <div style={{ borderTop:"1px solid var(--border)" }}>
            {milestones.length === 0 ? (
              <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--text-muted)", fontSize:"0.875rem" }}>
                <BookOpen size={32} style={{ opacity:0.2, margin:"0 auto 0.75rem", display:"block" }}/>
                No weekly milestones yet. Click "Add Week" to set up the first week's objectives.
              </div>
            ) : (
              milestones.sort((a,b)=>a.weekNumber-b.weekNumber).map((m, idx) => {
                const cfg  = STATUS[m.status] || STATUS.upcoming;
                const Icon = cfg.icon;
                const logCount = m.logEntries?.length || 0;
                const memberCount = project.members?.length || 1;

                return (
                  <div key={m._id} style={{
                    borderBottom: idx < milestones.length-1 ? "1px solid var(--border)" : "none",
                    padding:"0.9rem 1.25rem",
                    background: m.status==="submitted" ? "rgba(217,119,6,0.03)" : "transparent",
                  }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:"0.85rem" }}>
                      {/* Status icon */}
                      <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:cfg.bg,
                        border:`2px solid ${cfg.color}`, display:"flex", alignItems:"center",
                        justifyContent:"center", flexShrink:0, marginTop:"2px" }}>
                        <Icon size={15} style={{ color:cfg.color }}/>
                      </div>

                      {/* Content */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem", flexWrap:"wrap", marginBottom:"0.3rem" }}>
                          <div>
                            <span style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text-faint)",
                              textTransform:"uppercase", letterSpacing:"0.08em", marginRight:"0.5rem" }}>
                              Week {m.weekNumber}
                            </span>
                            <span style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.875rem" }}>{m.title}</span>
                          </div>
                          <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap", alignItems:"center" }}>
                            <span style={{ fontSize:"0.68rem", fontWeight:600, padding:"0.18rem 0.5rem",
                              borderRadius:"99px", background:cfg.bg, color:cfg.color,
                              textTransform:"uppercase", letterSpacing:"0.04em" }}>{cfg.label}</span>
                            <span style={{ fontSize:"0.68rem", color:"var(--text-faint)" }}>
                              {logCount}/{memberCount} logged
                            </span>
                          </div>
                        </div>

                        {m.description && (
                          <p style={{ fontSize:"0.8rem", color:"var(--text-secondary)", lineHeight:1.5, marginBottom:"0.5rem" }}>{m.description}</p>
                        )}

                        <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginBottom:"0.6rem" }}>
                          📅 {fmtDay(m.weekStartDate)} → {fmtDay(m.weekEndDate)}
                          {m.status==="approved" && m.signedOffAt ? ` · ✅ Signed off ${fmt(m.signedOffAt)} by ${m.signedOffBy?.name || "you"}` : ""}
                        </p>

                        {/* Student submission note */}
                        {m.submissionNote && m.status==="submitted" && (
                          <div style={{ background:"rgba(37,99,235,0.05)", border:"1px solid rgba(37,99,235,0.2)",
                            borderRadius:"var(--radius)", padding:"0.65rem 0.85rem", marginBottom:"0.65rem" }}>
                            <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--accent)", marginBottom:"0.25rem",
                              display:"flex", alignItems:"center", gap:"0.35rem" }}>
                              <MessageSquare size={11}/> Student's Summary
                            </p>
                            <p style={{ fontSize:"0.8rem", color:"var(--text-secondary)" }}>{m.submissionNote}</p>
                          </div>
                        )}

                        {/* My supervisor note (if any) */}
                        {m.supervisorNote && m.status !== "submitted" && (
                          <div style={{ background: m.status==="approved"?"var(--success-light)":"var(--danger-light)",
                            border:`1px solid ${m.status==="approved"?"var(--success-border)":"var(--danger-border)"}`,
                            borderRadius:"var(--radius)", padding:"0.65rem 0.85rem", marginBottom:"0.65rem" }}>
                            <p style={{ fontSize:"0.72rem", fontWeight:700,
                              color: m.status==="approved"?"var(--success)":"var(--danger)",
                              marginBottom:"0.2rem" }}>Your Note</p>
                            <p style={{ fontSize:"0.8rem", color:"var(--text-secondary)" }}>{m.supervisorNote}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", alignItems:"center" }}>
                          {m.status === "submitted" && (
                            <button onClick={() => setSignOffTarget(m)} className="btn-primary" style={{ fontSize:"0.78rem", padding:"0.35rem 0.75rem" }}>
                              <Stamp size={13}/> Review & Sign Off
                            </button>
                          )}
                          {m.status !== "approved" && (
                            <button onClick={() => setEditTarget(m)} className="btn-outline" style={{ fontSize:"0.78rem", padding:"0.35rem 0.6rem" }}>
                              <Edit3 size={12}/> Edit
                            </button>
                          )}
                          <button onClick={() => handleDelete(m)} disabled={deletingId===m._id} className="btn-danger" style={{ fontSize:"0.78rem", padding:"0.35rem 0.6rem" }}>
                            {deletingId===m._id ? <Loader size={12} className="animate-spin"/> : <Trash2 size={12}/>} Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {formModal && (
        <MilestoneFormModal
          projectId={project._id}
          existingWeeks={existingWeeks}
          onClose={() => setFormModal(false)}
          onSaved={handleSaved}
        />
      )}
      {editTarget && (
        <MilestoneFormModal
          projectId={project._id}
          existingWeeks={existingWeeks.filter(w => w !== editTarget.weekNumber)}
          milestone={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {signOffTarget && (
        <SignOffModal
          milestone={signOffTarget}
          onClose={() => setSignOffTarget(null)}
          onReviewed={handleReviewed}
        />
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TeacherMilestonesPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/milestone/teacher/all");
      setProjects(res.data.data.projects || []);
    } catch { toast.error("Failed to load milestones"); }
    finally { setLoading(false); }
  };

  const handleUpdated = useCallback((projectId, newMilestones) => {
    setProjects(prev => prev.map(p =>
      p._id === projectId ? { ...p, milestones: newMilestones } : p
    ));
  }, []);

  // Stats
  const allMs      = projects.flatMap(p => p.milestones || []);
  const totalMs    = allMs.length;
  const approvedMs = allMs.filter(m => m.status === "approved").length;
  const reviewMs   = allMs.filter(m => m.status === "submitted").length;
  const activeMs   = allMs.filter(m => m.status === "active").length;

  const filtered = filter === "needs_review"
    ? projects.filter(p => p.milestones?.some(m => m.status === "submitted"))
    : projects;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh" }}>
      <Loader size={28} style={{ color:"var(--accent)" }} className="animate-spin"/>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth:"900px" }}>

      {/* Header */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.3rem" }}>
          <BookOpen size={22} style={{ color:"var(--accent)" }}/>
          <h1 style={{ fontSize:"1.4rem", fontWeight:800, color:"var(--text-primary)" }}>Logbook Management</h1>
        </div>
        <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>
          Set weekly milestones, review student work logs, and sign off completed weeks.
        </p>
      </div>

      {/* Info banner */}
      <div style={{ background:"rgba(37,99,235,0.05)", border:"1px solid var(--accent-border)",
        borderRadius:"var(--radius-lg)", padding:"1rem 1.25rem", marginBottom:"1.25rem" }}>
        <p style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--accent)", marginBottom:"0.5rem",
          display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <Info size={13}/> SUPERVISOR WORKFLOW
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.5rem" }}>
          {[
            { n:"1", t:'Click "Add Week" to create weekly milestone with objectives and date range' },
            { n:"2", t:"Student logs their daily work and submits at week end for your review" },
            { n:"3", t:"Review their log entries and either sign off or return with feedback" },
            { n:"4", t:"Signed-off weeks build the permanent digital logbook — replaces paper sign-offs" },
          ].map(s => (
            <div key={s.n} style={{ display:"flex", gap:"0.5rem", alignItems:"flex-start" }}>
              <span style={{ fontSize:"0.65rem", fontWeight:800, color:"#fff", background:"var(--accent)",
                borderRadius:"50%", width:"18px", height:"18px", display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0, marginTop:"1px" }}>{s.n}</span>
              <p style={{ fontSize:"0.75rem", color:"var(--text-secondary)", lineHeight:1.5 }}>{s.t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.75rem", marginBottom:"1.25rem" }}>
        {[
          { label:"Total Weeks",    value:totalMs,    color:"var(--text-primary)" },
          { label:"Signed Off",     value:approvedMs, color:"var(--success)" },
          { label:"Needs Sign-Off", value:reviewMs,   color:"var(--warning)", alert:reviewMs>0 },
          { label:"Active",         value:activeMs,   color:"var(--accent)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:"0.85rem 1rem", textAlign:"center", position:"relative", overflow:"hidden",
            border: s.alert ? "1px solid var(--warning-border)" : "1px solid var(--border)" }}>
            {s.alert && <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background:"var(--warning)" }}/>}
            <p style={{ fontSize:"1.4rem", fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:"0.68rem", color:"var(--text-muted)", marginTop:"0.3rem", fontWeight:600,
              textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.25rem" }}>
        {[
          { id:"all",          label:`All Projects (${projects.length})` },
          { id:"needs_review", label:`Needs Sign-Off (${reviewMs})`, badge:reviewMs },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{
            padding:"0.45rem 0.9rem", borderRadius:"var(--radius)", fontSize:"0.82rem", fontWeight:500,
            cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", border:"none",
            background: filter===t.id ? "var(--accent)" : "var(--bg-elevated)",
            color: filter===t.id ? "#fff" : "var(--text-secondary)",
          }}>
            {t.label}
            {t.badge > 0 && filter !== t.id && (
              <span style={{ marginLeft:"0.4rem", background:"var(--warning)", color:"#fff",
                borderRadius:"99px", padding:"0.1rem 0.4rem", fontSize:"0.65rem", fontWeight:700 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Project panels */}
      {!filtered.length ? (
        <div className="card" style={{ padding:"4rem", textAlign:"center", color:"var(--text-muted)" }}>
          <BookOpen size={40} style={{ opacity:0.2, margin:"0 auto 1rem", display:"block" }}/>
          <p style={{ fontWeight:600, marginBottom:"0.4rem" }}>
            {filter === "needs_review" ? "No submissions awaiting sign-off" : "No supervised projects yet"}
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {filtered.map(p => (
            <ProjectPanel key={p._id} project={p} onUpdated={handleUpdated}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherMilestonesPage;
