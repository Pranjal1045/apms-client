import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard, FileText, Upload, UserCheck, MessageSquare,
  Bell, Sparkles, Clock, Users, FolderOpen, GraduationCap,
  Link2, Calendar, BarChart3, UsersRound, CheckSquare,
  CalendarDays, MessageCircle, Award, HelpCircle, Megaphone, Star
} from "lucide-react";

const navConfig = {
  Student: [
    { name: "Dashboard",       path: "/student",                 icon: LayoutDashboard, section: "Main" },
    { name: "My Group",        path: "/student/group",           icon: UsersRound,      section: "Main" },
    { name: "Submit Proposal", path: "/student/submit-proposal", icon: FileText,        section: "Project" },
    { name: "Upload Files",    path: "/student/upload-files",    icon: Upload,          section: "Project" },
    { name: "Milestones",      path: "/student/milestones",      icon: CheckSquare,     section: "Project" },
    { name: "My Supervisor",   path: "/student/supervisor",      icon: UserCheck,       section: "Supervision" },
    { name: "Meetings",        path: "/student/meetings",        icon: CalendarDays,    section: "Supervision" },
    { name: "Chat",            path: "/student/chat",            icon: MessageCircle,   section: "Supervision" },
    { name: "Feedback",        path: "/student/feedback",        icon: MessageSquare,   section: "Supervision" },
    { name: "Evaluation",      path: "/student/evaluation",      icon: Award,           section: "Results" },
    { name: "Viva Prep",       path: "/student/viva",            icon: HelpCircle,      section: "Results" },
    { name: "Notifications",   path: "/student/notifications",   icon: Bell,            section: "Updates" },
    { name: "Announcements",   path: "/student/announcements",   icon: Megaphone,       section: "Updates" },
    { name: "AI Features",     path: "/student/ai-features",     icon: Sparkles,        section: "Tools" },
  ],
  Teacher: [
    { name: "Dashboard",         path: "/teacher",                   icon: LayoutDashboard, section: "Main" },
    { name: "Pending Requests",  path: "/teacher/pending-requests",  icon: Clock,           section: "Main" },
    { name: "My Students",       path: "/teacher/assigned-students", icon: Users,           section: "Students" },
    { name: "Meetings",          path: "/teacher/meetings",          icon: CalendarDays,    section: "Students" },
    { name: "Chat",              path: "/teacher/chat",              icon: MessageCircle,   section: "Students" },
    { name: "Evaluate Projects", path: "/teacher/evaluate",          icon: Award,           section: "Assessment" },
    { name: "Project Files",     path: "/teacher/files",             icon: FolderOpen,      section: "Assessment" },
    { name: "Milestones",        path: "/teacher/milestones",        icon: CheckSquare,     section: "Assessment" },
    { name: "Announcements",     path: "/teacher/announcements",     icon: Megaphone,       section: "Updates" },
    { name: "AI Features",       path: "/teacher/ai-features",       icon: Sparkles,        section: "Tools" },
  ],
  Admin: [
    { name: "Dashboard",         path: "/admin",                   icon: LayoutDashboard, section: "Main" },
    { name: "Students",          path: "/admin/students",          icon: Users,           section: "Management" },
    { name: "Teachers",          path: "/admin/teachers",          icon: GraduationCap,   section: "Management" },
    { name: "Groups",            path: "/admin/groups",            icon: UsersRound,      section: "Management" },
    { name: "Assign Supervisor", path: "/admin/assign-supervisor", icon: Link2,           section: "Management" },
    { name: "Deadlines",         path: "/admin/deadlines",         icon: Calendar,        section: "Management" },
    { name: "Projects",          path: "/admin/projects",          icon: FolderOpen,      section: "Management" },
    { name: "Announcements",     path: "/admin/announcements",     icon: Megaphone,       section: "Communication" },
    { name: "Evaluations",       path: "/admin/evaluations",       icon: Star,            section: "Reports" },
    { name: "Analytics",         path: "/admin/analytics",         icon: BarChart3,       section: "Reports" },
  ],
};

const Sidebar = ({ open, setOpen, userRole }) => {
  const unreadCount = useSelector(s => s.notification.unreadCount || 0);
  const items = navConfig[userRole] || [];

  // Group items by section
  const sections = items.reduce((acc, item) => {
    const sec = item.section || "Main";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      overflowX: "hidden", overflowY: "auto",
    }}>
      <nav style={{ flex: 1, padding: open ? "0.625rem" : "0.5rem" }}>
        {Object.entries(sections).map(([section, sectionItems]) => (
          <div key={section} style={{ marginBottom: "0.25rem" }}>
            {open && (
              <p style={{
                fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.1em", color: "var(--text-faint)",
                padding: "0.875rem 0.75rem 0.35rem",
              }}>{section}</p>
            )}
            {sectionItems.map(({ name, path, icon: Icon }) => {
              const isNotif = name === "Notifications";
              return (
                <NavLink key={path} to={path}
                  end={path === "/student" || path === "/teacher" || path === "/admin"}
                  onClick={() => { if (window.innerWidth < 1024) setOpen(false); }}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: open ? "0.625rem" : 0,
                    justifyContent: open ? "flex-start" : "center",
                    padding: open ? "0.475rem 0.75rem" : "0.6rem",
                    borderRadius: "var(--radius)",
                    textDecoration: "none",
                    color: isActive ? "var(--accent)" : "var(--text-muted)",
                    background: isActive ? "var(--accent-light)" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "0.82rem",
                    transition: "all 0.1s ease",
                    marginBottom: "1px",
                    position: "relative",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    letterSpacing: "-0.01em",
                  })}>
                  {({ isActive }) => (
                    <>
                      <Icon size={15} style={{ flexShrink: 0, minWidth: 15, opacity: isActive ? 1 : 0.7 }}/>
                      {open && (
                        <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.375rem", overflow: "hidden" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                          {isNotif && unreadCount > 0 && (
                            <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "var(--danger)", fontSize: "0.62rem", fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {open && (
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }}/>
            <p style={{ fontSize: "0.68rem", color: "var(--text-faint)", fontWeight: 500 }}>System Online</p>
          </div>
          <p style={{ fontSize: "0.65rem", color: "var(--text-faint)", letterSpacing: "0.02em" }}>FYP Management v2.1</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
