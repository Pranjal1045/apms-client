import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteNotification, getNotifications, markAllAsRead, markAsRead } from "../../store/slices/notificationSlice";
import { Bell, BellOff, Check, Trash2, MessageSquare, Clock, CheckCircle, User, Settings } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

const typeIcon = (type) => {
  const props = { size: 16 };
  switch (type) {
    case "feedback": return <MessageSquare {...props} style={{ color: "var(--accent)" }} />;
    case "deadline": return <Clock {...props} style={{ color: "var(--danger)" }} />;
    case "approval": return <CheckCircle {...props} style={{ color: "var(--success)" }} />;
    case "request": return <User {...props} style={{ color: "var(--accent)" }} />;
    default: return <Bell {...props} style={{ color: "var(--text-muted)" }} />;
  }
};

const priorityColor = { high: "var(--danger)", medium: "var(--warning)", low: "var(--accent)" };

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(s => s.notification.list || []);
  const unreadCount = useSelector(s => s.notification.unreadCount || 0);

  useEffect(() => { dispatch(getNotifications()); }, [dispatch]);

  return (
    <div className="fade-in" style={{ maxWidth: "720px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Notifications</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{unreadCount} unread · {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => dispatch(markAllAsRead())} className="btn-secondary btn-small" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {!notifications.length ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
          <BellOff size={40} style={{ color: "var(--text-muted)", opacity: 0.4, marginBottom: "1rem" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>You have no notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {notifications.map((n, i) => (
            <div key={n._id || i}
              style={{ background: n.isRead ? "var(--bg-card)" : "rgba(0,212,255,0.04)", border: `1px solid ${n.isRead ? "var(--border)" : "rgba(0,212,255,0.15)"}`, borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
              {/* Priority indicator */}
              <div style={{ width: "3px", borderRadius: "2px", alignSelf: "stretch", flexShrink: 0, background: priorityColor[n.priority] || "var(--border)" }} />
              {/* Icon */}
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {typeIcon(n.type)}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: n.isRead ? 400 : 600, lineHeight: 1.5 }}>
                    {n.message}
                    {!n.isRead && <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", marginLeft: "0.4rem", verticalAlign: "middle" }} />}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{fmt(n.createdAt)}</span>
                  <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "var(--bg-elevated)", color: "var(--text-muted)", fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{n.type || "general"}</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                {!n.isRead && (
                  <button onClick={() => dispatch(markAsRead(n._id))}
                    title="Mark as read"
                    style={{ padding: "5px", background: "none", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", color: "var(--accent)", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(0,212,255,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}>
                    <Check size={13} />
                  </button>
                )}
                <button onClick={() => dispatch(deleteNotification(n._id))}
                  title="Delete"
                  style={{ padding: "5px", background: "none", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", color: "var(--danger)", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(244,63,94,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
