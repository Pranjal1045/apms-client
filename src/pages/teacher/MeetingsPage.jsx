import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Calendar, Check, X, Clock, Video, Loader, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

const fmt = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
const statusCfg = {
  pending:   { color: "var(--warning)", label: "Pending" },
  accepted:  { color: "var(--success)", label: "Accepted" },
  rejected:  { color: "var(--danger)", label: "Rejected" },
  completed: { color: "var(--accent)", label: "Completed" },
};

const TeacherMeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { meetingId, action }
  const [form, setForm] = useState({ confirmedDate: "", meetingLink: "", rejectionReason: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchMeetings(); }, []);

  const fetchMeetings = async () => {
    try { const res = await axiosInstance.get("/meeting/teacher"); setMeetings(res.data.data.meetings || []); }
    catch { toast.error("Failed to load meetings"); }
    finally { setLoading(false); }
  };

  const handleAction = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      if (modal.action === "accept") {
        await axiosInstance.put(`/meeting/${modal.meetingId}/accept`, { confirmedDate: form.confirmedDate, meetingLink: form.meetingLink });
        toast.success("Meeting accepted!");
      } else {
        await axiosInstance.put(`/meeting/${modal.meetingId}/reject`, { rejectionReason: form.rejectionReason });
        toast.success("Meeting rejected.");
      }
      setModal(null);
      setForm({ confirmedDate: "", meetingLink: "", rejectionReason: "" });
      fetchMeetings();
    } catch (e) { toast.error(e.response?.data?.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  const pending = meetings.filter(m => m.status === "pending");
  const others = meetings.filter(m => m.status !== "pending");

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><Loader size={28} style={{ color: "var(--success)" }} className="animate-spin" /></div>;

  const MeetingCard = ({ m }) => {
    const cfg = statusCfg[m.status] || statusCfg.pending;
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1.1rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div>
            <p style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.9rem", marginBottom: "0.15rem" }}>{m.title}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>From: {m.student?.name} · {m.project?.title?.slice(0, 30)}</p>
          </div>
          <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.6rem", borderRadius: "4px", background: `${cfg.color}18`, color: cfg.color, fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{cfg.label}</span>
        </div>
        {m.agenda && <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.5rem" }}>{m.agenda}</p>}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: m.status === "pending" ? "0.75rem" : 0 }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}><Clock size={12} /> {fmt(m.proposedDate)}</p>
          {m.confirmedDate && <p style={{ fontSize: "0.75rem", color: "var(--success)", display: "flex", alignItems: "center", gap: "0.3rem" }}><CheckCircle2 size={12} /> Confirmed: {fmt(m.confirmedDate)}</p>}
        </div>
        {m.status === "pending" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => { setModal({ meetingId: m._id, action: "accept" }); setForm({ confirmedDate: m.proposedDate?.slice(0, 16) || "", meetingLink: "", rejectionReason: "" }); }} className="btn-success btn-small" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Check size={13} /> Accept
            </button>
            <button onClick={() => setModal({ meetingId: m._id, action: "reject" })} className="btn-danger btn-small" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Meeting Requests</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Review and manage meeting requests from your students.</p>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "1.25rem" }}>
              {modal.action === "accept" ? "Accept Meeting" : "Reject Meeting"}
            </p>
            {modal.action === "accept" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div><label className="label">Confirm Date & Time</label><input type="datetime-local" className="input" value={form.confirmedDate} onChange={e => setForm(p => ({ ...p, confirmedDate: e.target.value }))} style={{ colorScheme: "dark" }} /></div>
                <div><label className="label">Meeting Link (optional)</label><input className="input" value={form.meetingLink} onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." /></div>
              </div>
            ) : (
              <div><label className="label">Reason for Rejection</label><textarea className="input" value={form.rejectionReason} onChange={e => setForm(p => ({ ...p, rejectionReason: e.target.value }))} placeholder="Please provide a reason..." style={{ minHeight: "80px", resize: "vertical" }} /></div>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={handleAction} disabled={submitting} className={modal.action === "accept" ? "btn-success" : "btn-danger"} style={{ flex: 1 }}>
                {submitting ? <Loader size={14} className="animate-spin" /> : modal.action === "accept" ? "Confirm Accept" : "Confirm Reject"}
              </button>
              <button onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--warning)", marginBottom: "0.75rem" }}>⏳ Pending ({pending.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>{pending.map(m => <MeetingCard key={m._id} m={m} />)}</div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>Past & Scheduled</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>{others.map(m => <MeetingCard key={m._id} m={m} />)}</div>
        </div>
      )}

      {!meetings.length && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: "0.75rem" }} /><p>No meeting requests yet.</p>
        </div>
      )}
    </div>
  );
};
export default TeacherMeetingsPage;
