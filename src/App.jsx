import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import { getUser } from "./store/slices/authSlice";
import { fetchDashboardStats, fetchProject } from "./store/slices/studentSlice";
import { getAllProjects, getAllUsers } from "./store/slices/adminSlice";
import { connectSocket, disconnectSocket } from "./lib/socket";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import SubmitProposal from "./pages/student/SubmitProposal";
import UploadFiles from "./pages/student/UploadFiles";
import SupervisorPage from "./pages/student/SupervisorPage";
import FeedbackPage from "./pages/student/FeedbackPage";
import NotificationsPage from "./pages/student/NotificationsPage";
import ChatbotPage from "./pages/student/ChatbotPage";
import ReportSummarizerPage from "./pages/student/ReportSummarizerPage";
import GroupPage from "./pages/student/GroupPage";
import MilestonesPage from "./pages/student/MilestonesPage";
import MeetingsPage from "./pages/student/MeetingsPage";
import ChatPage from "./pages/student/ChatPage";
import EvaluationPage from "./pages/student/EvaluationPage";
import VivaPage from "./pages/student/VivaPage";
import AIDashboard from "./components/AI/AIDashboard";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherChatPage from "./pages/teacher/ChatPage";
import PendingRequests from "./pages/teacher/PendingRequests";
import AssignedStudents from "./pages/teacher/AssignedStudents";
import TeacherFiles from "./pages/teacher/TeacherFiles";
import TeacherAIWrapper from "./pages/teacher/TeacherAIWrapper";
import TeacherMeetingsPage from "./pages/teacher/MeetingsPage";
import TeacherMilestonesPage from "./pages/teacher/MilestonesPage";
import EvaluationManagePage from "./pages/teacher/EvaluationManagePage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import AssignSupervisor from "./pages/admin/AssignSupervisor";
import DeadlinesPage from "./pages/admin/DeadlinesPage";
import ProjectsPage from "./pages/admin/ProjectsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import GroupsPage from "./pages/admin/GroupsPage";
import AnnouncementsManagePage from "./pages/admin/AnnouncementsManagePage";
import EvaluationsPage from "./pages/admin/EvaluationsPage";

// Shared
import AnnouncementsPage from "./pages/shared/AnnouncementsPage";
import NotFound from "./pages/NotFound";

// ── Public routes that must NEVER redirect even if user is logged in ─────────
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authUser, isCheckingAuth } = useSelector(s => s.auth);
  // Still checking — show spinner instead of redirecting to login prematurely
  if (isCheckingAuth) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)" }}>
      <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" />
    </div>
  );
  if (!authUser) return <Navigate to="/login" replace />;
  if (allowedRoles?.length && !allowedRoles.includes(authUser.role)) {
    const paths = { Admin: "/admin", Teacher: "/teacher", Student: "/student" };
    return <Navigate to={paths[authUser.role] || "/login"} replace />;
  }
  return children;
};

const AIFeatureWrapper = () => {
  const { project } = useSelector(s => s.student);
  const { authUser } = useSelector(s => s.auth);
  return <AIDashboard projectId={project?._id || null} role={authUser?.role} />;
};

// ── Inner app — has access to router context (useLocation) ────────────────
const AppRoutes = () => {
  const { authUser, isCheckingAuth } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const isPublicPage = PUBLIC_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => { dispatch(getUser()); }, [dispatch]);

  useEffect(() => {
    if (authUser) {
      const token = document.cookie?.match(/token=([^;]+)/)?.[1];
      if (token) connectSocket(token);
      if (authUser.role === "Admin")   { dispatch(getAllUsers()); dispatch(getAllProjects()); }
      if (authUser.role === "Student") { dispatch(fetchDashboardStats()); dispatch(fetchProject()); }
    } else {
      disconnectSocket();
    }
  }, [authUser]);

  // Only show global loading spinner for protected pages during auth check
  if (isCheckingAuth && !isPublicPage) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)" }}>
      <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public auth pages — always accessible, no redirect ── */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/reset-password"   element={<ResetPasswordPage />} />

      {/* ── Student ── */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={["Student"]}><DashboardLayout userRole="Student" /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="group"             element={<GroupPage />} />
        <Route path="submit-proposal"   element={<SubmitProposal />} />
        <Route path="upload-files"      element={<UploadFiles />} />
        <Route path="milestones"        element={<MilestonesPage />} />
        <Route path="supervisor"        element={<SupervisorPage />} />
        <Route path="meetings"          element={<MeetingsPage />} />
        <Route path="chat"              element={<ChatPage />} />
        <Route path="feedback"          element={<FeedbackPage />} />
        <Route path="evaluation"        element={<EvaluationPage />} />
        <Route path="viva"              element={<VivaPage />} />
        <Route path="notifications"     element={<NotificationsPage />} />
        <Route path="announcements"     element={<AnnouncementsPage />} />
        <Route path="ai-features"       element={<AIFeatureWrapper />} />
        <Route path="chatbot"           element={<ChatbotPage />} />
        <Route path="report-summarizer" element={<ReportSummarizerPage />} />
      </Route>

      {/* ── Teacher ── */}
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={["Teacher"]}><DashboardLayout userRole="Teacher" /></ProtectedRoute>}>
        <Route index element={<TeacherDashboard />} />
        <Route path="pending-requests"  element={<PendingRequests />} />
        <Route path="assigned-students" element={<AssignedStudents />} />
        <Route path="meetings"          element={<TeacherMeetingsPage />} />
        <Route path="milestones"        element={<TeacherMilestonesPage />} />
        <Route path="evaluate"          element={<EvaluationManagePage />} />
        <Route path="files"             element={<TeacherFiles />} />
        <Route path="announcements"     element={<AnnouncementsPage />} />
        <Route path="ai-features"       element={<TeacherAIWrapper />} />
        <Route path="notifications"     element={<NotificationsPage />} />
        <Route path="chat"              element={<TeacherChatPage />} />
      </Route>

      {/* ── Admin ── */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><DashboardLayout userRole="Admin" /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students"          element={<ManageStudents />} />
        <Route path="teachers"          element={<ManageTeachers />} />
        <Route path="groups"            element={<GroupsPage />} />
        <Route path="assign-supervisor" element={<AssignSupervisor />} />
        <Route path="deadlines"         element={<DeadlinesPage />} />
        <Route path="projects"          element={<ProjectsPage />} />
        <Route path="announcements"     element={<AnnouncementsManagePage />} />
        <Route path="evaluations"       element={<EvaluationsPage />} />
        <Route path="analytics"         element={<AnalyticsPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ── Root — wraps everything in BrowserRouter ──────────────────────────────
const App = () => (
  <BrowserRouter>
    <AppRoutes />
    <ToastContainer position="bottom-right" theme="dark"
      toastStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "inherit" }} />
  </BrowserRouter>
);

export default App;
