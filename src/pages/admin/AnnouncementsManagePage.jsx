import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Megaphone, Pin, Trash2, Plus, X, Loader } from "lucide-react";
import { toast } from "react-toastify";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

const AnnouncementsManagePage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", targetRole: "All", priority: "normal", isPinned: false, expiresAt: "" });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try { const res = await axiosInstance.get("/announcement"); setAnnouncements(res.data.data.announcements || []); }
    catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return toast.error("Title and content are required");
    setSubmitting(true);
    try {
      await axiosInstance.post("/announcement", form);
      toast.success("Announcement posted!");
      setShowForm(false);
      setForm({ title: "", content: "", targetRole: "All", priority: "normal", isPinned: false, expiresAt: "" });
      fetchAnnouncements();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to post"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try { await axiosInstance.delete(`/announcement/${id}`); setAnnouncements(prev => prev.filter(a => a._id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const priorityColor = { normal: "var(--accent)", important: "var(--warning)", urgent: "var(--danger)" };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}><Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Announcements</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Post notices to students and teachers.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "540px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>New Announcement</p>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><label className="label">Title *</label><input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" required maxLength={200} /></div>
              <div><label className="label">Content *</label><textarea className="input" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your announcement..." style={{ minHeight: "100px", resize: "vertical" }} required maxLength={2000} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="label">Target Audience</label>
                  <select className="input" value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} style={{ background: "var(--bg-elevated)" }}>
                    <option value="All">Everyone</option>
                    <option value="Student">Students Only</option>
                    <option value="Teacher">Teachers Only</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} style={{ background: "var(--bg-elevated)" }}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div><label className="label">Expires On (optional)</label><input type="date" className="input" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={{ colorScheme: "dark" }} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", paddingTop: "1.5rem" }}>
                  <input type="checkbox" id="pinned" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }} />
                  <label htmlFor="pinned" style={{ fontSize: "0.875rem", color: "var(--text-secondary)", cursor: "pointer" }}>Pin announcement</label>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                  {submitting ? <Loader size={14} className="animate-spin" /> : "Post Announcement"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!announcements.length ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <Megaphone size={40} style={{ opacity: 0.3 }} /><p>No announcements posted yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {announcements.map(a => (
            <div key={a._id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem 1.25rem", borderLeft: `3px solid ${priorityColor[a.priority] || "var(--accent)"}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.35rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {a.isPinned && <Pin size={13} style={{ color: "var(--warning)" }} />}
                  <p style={{ fontWeight: 700, color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.9rem" }}>{a.title}</p>
                </div>
                <button onClick={() => handleDelete(a._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px", opacity: 0.7 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}>
                  <Trash2 size={15} />
                </button>
              </div>
              <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.5rem" }}>{a.content}</p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{fmt(a.createdAt)}</span>
                <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "var(--bg-elevated)", color: priorityColor[a.priority] || "var(--accent)" }}>{a.priority}</span>
                <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "var(--bg-elevated)", color: "var(--text-muted)" }}>→ {a.targetRole}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default AnnouncementsManagePage;
