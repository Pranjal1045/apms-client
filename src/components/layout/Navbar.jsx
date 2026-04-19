import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { getNotifications } from "../../store/slices/notificationSlice";
import { Bell, Menu, X, LogOut, ChevronDown, Sun, Moon, GraduationCap, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";

const notifIcon = (type) => {
  if (type === "approval")  return <CheckCircle size={13} style={{ color: "var(--success)", flexShrink: 0 }}/>;
  if (type === "rejection") return <AlertCircle size={13} style={{ color: "var(--danger)", flexShrink: 0 }}/>;
  if (type === "deadline")  return <AlertTriangle size={13} style={{ color: "var(--warning)", flexShrink: 0 }}/>;
  return <Info size={13} style={{ color: "var(--accent)", flexShrink: 0 }}/>;
};

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [isDark,      setIsDark]      = useState(() => localStorage.getItem("theme") === "dark");

  const { authUser }  = useSelector(s => s.auth);
  const notifications = useSelector(s => s.notification.list || []);
  const unreadCount   = useSelector(s => s.notification.unreadCount || 0);
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const profileRef    = useRef(null);
  const notifRef      = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (authUser) dispatch(getNotifications());
  }, [authUser]);

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => { dispatch(logout()).then(() => navigate("/login")); };
  const initials = authUser?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "U";
  const recentNotifs = notifications.slice(0, 6);

  const roleColors = { Admin: "#7c3aed", Teacher: "#0891b2", Student: "#16a34a" };
  const roleColor = roleColors[authUser?.role] || "var(--accent)";

  const notifPath = authUser?.role === "Student" ? "/student/notifications"
    : authUser?.role === "Teacher" ? "/teacher/notifications" : "/admin";

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
      height: "56px",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 1rem",
      gap: "0.625rem",
      boxShadow: "0 1px 0 var(--border)",
    }}>
      {/* Hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "6px", borderRadius: "var(--radius)", display: "flex", alignItems: "center", transition: "all 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}>
        {sidebarOpen ? <X size={18}/> : <Menu size={18}/>}
      </button>

      {/* Brand */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginRight: "auto" }}>
        <div style={{ width: 30, height: 30, borderRadius: "var(--radius)", background: "linear-gradient(135deg, var(--accent), #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <GraduationCap size={16} color="#fff"/>
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Academic</span>
          <span style={{ fontWeight: 500, fontSize: "0.62rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Project Management</span>
        </div>
      </Link>

      {/* Role badge */}
      {authUser?.role && (
        <div style={{ display: "none", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.6rem", background: `${roleColor}14`, border: `1px solid ${roleColor}30`, borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, color: roleColor, textTransform: "uppercase", letterSpacing: "0.06em" }}
          className="role-badge">
          {authUser.role}
        </div>
      )}

      {/* Theme toggle */}
      <button onClick={() => setIsDark(d => !d)}
        title={isDark ? "Switch to Light" : "Switch to Dark"}
        style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", padding: "5px", borderRadius: "var(--radius)", display: "flex", alignItems: "center", width: 32, height: 32, justifyContent: "center", transition: "all 0.12s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}>
        {isDark ? <Sun size={14}/> : <Moon size={14}/>}
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: "relative" }}>
        <button onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
          style={{ position: "relative", background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--text-muted)", padding: "5px", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, transition: "all 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <Bell size={15}/>
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: "var(--danger)", fontSize: "0.6rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--bg-surface)", padding: "0 2px" }}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 50, overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger-border)", borderRadius: 999, padding: "0.1rem 0.45rem" }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {recentNotifs.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <Bell size={24} style={{ opacity: 0.2, marginBottom: "0.5rem", display: "block", margin: "0 auto 0.5rem" }}/>
                  No notifications
                </div>
              ) : recentNotifs.map((n, i) => (
                <div key={n._id || i} style={{ padding: "0.7rem 1rem", borderBottom: "1px solid var(--border)", background: n.isRead ? "transparent" : "var(--accent-light)", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                  <div style={{ marginTop: 2 }}>{notifIcon(n.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{n.message}</p>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-faint)", marginTop: "0.2rem" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 4 }}/>}
                </div>
              ))}
            </div>
            <div style={{ padding: "0.625rem 1rem", borderTop: "1px solid var(--border)" }}>
              <Link to={notifPath} onClick={() => setNotifOpen(false)}
                style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600, letterSpacing: "-0.01em" }}>
                View all notifications →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div ref={profileRef} style={{ position: "relative" }}>
        <button onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
          style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3px 7px 3px 3px", cursor: "pointer", transition: "all 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}>
          <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            {initials}
          </div>
          <div style={{ textAlign: "left", maxWidth: 110 }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{authUser?.name?.split(" ")[0]}</p>
            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1 }}>{authUser?.role}</p>
          </div>
          <ChevronDown size={12} style={{ color: "var(--text-muted)" }}/>
        </button>

        {profileOpen && (
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", zIndex: 50, overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", background: `linear-gradient(135deg, ${roleColor}10, transparent)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius)", background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 800, color: "#fff" }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{authUser?.name}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{authUser?.email}</p>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: 999, background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {authUser?.role}
                </span>
                {authUser?.department && (
                  <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.45rem", borderRadius: 999, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {authUser.department}
                  </span>
                )}
              </div>
            </div>
            <div style={{ padding: "0.375rem" }}>
              <button onClick={handleLogout}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.625rem", background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: "0.845rem", fontWeight: 600, borderRadius: "var(--radius)", textAlign: "left", fontFamily: "inherit", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--danger-light)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                <LogOut size={14}/> Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
