import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Megaphone, Pin, AlertTriangle, Info, Loader } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
const priorityCfg = {
  normal:    { color: "var(--accent)", bg: "rgba(0,212,255,0.08)",  label: "Info" },
  important: { color: "var(--warning)", bg: "rgba(245,158,11,0.08)", label: "Important" },
  urgent:    { color: "var(--danger)", bg: "rgba(244,63,94,0.08)",  label: "Urgent" },
};

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/announcement")
      .then(res => setAnnouncements(res.data.data.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}><Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: "760px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Announcements</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Official notices from the administration.</p>
      </div>
      {!announcements.length ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "4rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <Megaphone size={40} style={{ opacity: 0.3 }} /><p>No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {announcements.map((a) => {
            const cfg = priorityCfg[a.priority] || priorityCfg.normal;
            return (
              <div key={a._id} style={{ background: "var(--bg-card)", border: `1px solid ${a.priority !== "normal" ? cfg.color + "44" : "var(--border)"}`, borderRadius: "10px", padding: "1.1rem 1.25rem", borderLeft: `3px solid ${cfg.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {a.isPinned && <Pin size={13} style={{ color: "var(--warning)" }} />}
                    <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{a.title}</p>
                  </div>
                  <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "4px", background: cfg.bg, color: cfg.color, fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>{cfg.label}</span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "0.6rem" }}>{a.content}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Posted by {a.postedBy?.name || "Admin"} · {fmt(a.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AnnouncementsPage;
