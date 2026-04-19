import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { Calendar, Clock, CheckCircle2, XCircle, Video, MapPin, Plus, X, Loader, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

const fmt = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const statusCfg = {
  pending:   { color: "var(--warning)", bg: "rgba(245,158,11,0.1)",  label: "Pending" },
  accepted:  { color: "var(--success)", bg: "rgba(0,229,160,0.1)",   label: "Accepted" },
  rejected:  { color: "var(--danger)", bg: "rgba(244,63,94,0.1)",   label: "Rejected" },
  completed: { color: "var(--accent)", bg: "rgba(0,212,255,0.1)",   label: "Completed" },
  cancelled: { color: "var(--text-muted)", bg: "rgba(139,148,168,0.1)", label: "Cancelled" },
};

const MeetingsPage = () => {
  const { project } = useSelector(s => s.student);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", agenda: "", proposedDate: "", location: "" });

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/meeting/student");
      setMeetings(res.data.data.meetings || []);
    } catch { toast.error("Failed to load meetings"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?._id) return toast.error("You need a project before requesting a meeting");
    if (!form.title || !form.proposedDate) return toast.error("Title and date are required");
    setSubmitting(true);
    try {
      await axiosInstance.post("/meeting/request", { ...form, projectId: project._id });
      toast.success("Meeting requested successfully!");
      setShowForm(false);
      setForm({ title: "", agenda: "", proposedDate: "", location: "" });
      fetchMeetings();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to request meeting"); }
    finally { setSubmitting(false); }
  };

  const complete = async (id) => {
    try {
      await axiosInstance.put(`/meeting/${id}/complete`);
      setMeetings(prev => prev.map(m => m._id === id ? { ...m, status: "completed" } : m));
      toast.success("Meeting marked as completed");
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: "760px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Meetings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Schedule and track meetings with your supervisor.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={15} /> Request Meeting
        </button>
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>Request a Meeting</p>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Meeting Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Progress Review — Week 8" required />
              </div>
              <div>
                <label className="label">Agenda / Description</label>
                <textarea className="input" value={form.agenda} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))} placeholder="What would you like to discuss?" style={{ minHeight: "80px", resize: "vertical" }} maxLength={500} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Proposed Date & Time *</label>
                  <input type="datetime-local" className="input" value={form.proposedDate} onChange={e => setForm(p => ({ ...p, proposedDate: e.target.value }))} required style={{ colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="label">Location / Mode</label>
                  <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Online / Room 204" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                  {submitting ? <><Loader size={14} className="animate-spin" /> Requesting…</> : "Send Request"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!meetings.length ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
          <p style={{ fontSize: "0.9rem" }}>No meetings yet. Request a meeting with your supervisor to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {meetings.map((m) => {
            const cfg = statusCfg[m.status] || statusCfg.pending;
            return (
              <div key={m._id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.1rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.6rem" }}>
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.925rem" }}>{m.title}</p>
                  <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: cfg.bg, color: cfg.color, fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{cfg.label}</span>
                </div>
                {m.agenda && <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.6rem" }}>{m.agenda}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.4rem", marginBottom: "0.6rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Clock size={12} /> Proposed: {fmt(m.proposedDate)}
                  </p>
                  {m.confirmedDate && (
                    <p style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CheckCircle2 size={12} /> Confirmed: {fmt(m.confirmedDate)}
                    </p>
                  )}
                  {m.location && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <MapPin size={12} /> {m.location}
                    </p>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <MessageSquare size={12} /> Supervisor: {m.supervisor?.name || "—"}
                  </p>
                </div>
                {m.meetingLink && (
                  <a href={m.meetingLink} target="_blank" rel="noreferrer" className="btn-secondary btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none", marginBottom: "0.5rem" }}>
                    <Video size={13} /> Join Meeting
                  </a>
                )}
                {m.status === "rejected" && m.rejectionReason && (
                  <p style={{ fontSize: "0.8rem", color: "var(--danger)", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                    Reason: {m.rejectionReason}
                  </p>
                )}
                {m.status === "accepted" && (
                  <button onClick={() => complete(m._id)} className="btn-success btn-small" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <CheckCircle2 size={13} /> Mark Completed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
