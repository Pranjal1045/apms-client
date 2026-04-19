import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageSquare, CheckCircle, X, Loader, Search, User } from "lucide-react";
import { addFeedback, getAssignedStudents, markComplete } from "../../store/slices/teacherSlice";

const TYPE_CONFIG = {
  general:  { color: "#2563eb", bg: "#dbeafe", label: "General",    emoji: "💬" },
  positive: { color: "#16a34a", bg: "#dcfce7", label: "Positive",   emoji: "✅" },
  negative: { color: "#dc2626", bg: "#fee2e2", label: "Needs Work", emoji: "⚠️" },
};

const AssignedStudents = () => {
  const [sortBy, setSortBy] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ title: "", message: "", type: "general" });

  const dispatch = useDispatch();
  useEffect(() => { dispatch(getAssignedStudents()); }, [dispatch]);

  const { assignedStudents, loading, error } = useSelector((state) => state.teacher);

  const getStatusBadge = (status) => {
    if (status === "completed") return { bg: "#dcfce7", color: "#16a34a", label: "Completed" };
    if (status === "approved")  return { bg: "#dbeafe", color: "#2563eb", label: "Active" };
    return { bg: "#fef9c3", color: "#ca8a04", label: "Pending" };
  };

  const closeModal = () => {
    setShowFeedbackModal(false);
    setShowCompleteModal(false);
    setSelectedStudent(null);
    setFeedbackData({ title: "", message: "", type: "general" });
  };

  const submitFeedback = () => {
    if (selectedStudent?.project?._id && feedbackData.title && feedbackData.message) {
      dispatch(addFeedback({ projectId: selectedStudent.project._id, payload: feedbackData }));
      closeModal();
    }
  };

  const confirmMarkComplete = () => {
    if (selectedStudent?.project?._id) {
      dispatch(markComplete(selectedStudent.project._id));
      closeModal();
    }
  };

  const sortedStudents = [...(assignedStudents || [])]
    .filter(s => {
      const matchesSearch =
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.project?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || s.project?.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "lastActivity") return new Date(b.project?.updatedAt) - new Date(a.project?.updatedAt);
      return 0;
    });

  const all = assignedStudents || [];
  const stats = [
    { label: "Total",     value: all.length,                                             color: "#2563eb" },
    { label: "Completed", value: all.filter(s => s.project?.status === "completed").length, color: "#16a34a" },
    { label: "Active",    value: all.filter(s => s.project?.status === "approved").length,  color: "#d97706" },
    { label: "Pending",   value: all.filter(s => !["completed","approved"].includes(s.project?.status)).length, color: "#7c3aed" },
  ];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", gap:"0.75rem", color:"var(--text-muted)" }}>
      <Loader size={20} className="animate-spin" style={{ color:"var(--accent)" }} />
      <span>Loading students…</span>
    </div>
  );
  if (error) return <div style={{ textAlign:"center", padding:"3rem", color:"var(--danger)" }}>Error loading students</div>;

  return (
    <>
      <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
        {/* Header */}
        <div>
          <h1 className="page-title">Assigned Students</h1>
          <p className="page-subtitle">Manage your assigned students and their projects</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.75rem" }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"0.875rem 1rem", borderTop:`3px solid ${s.color}` }}>
              <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>{s.label}</p>
              <p style={{ fontSize:"1.6rem", fontWeight:800, color:s.color, lineHeight:1.2, marginTop:"0.2rem" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <Search size={15} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }} />
            <input type="text" placeholder="Search by name or project…" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="input"
              style={{ paddingLeft:"2rem", width:"100%" }} />
          </div>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width:160 }}>
            <option value="all">All Status</option>
            <option value="approved">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width:160 }}>
            <option value="name">Sort: Name</option>
            <option value="lastActivity">Sort: Activity</option>
          </select>
        </div>

        {/* Grid */}
        {sortedStudents.length === 0 ? (
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"3rem", textAlign:"center", color:"var(--text-muted)" }}>
            <User size={36} style={{ opacity:0.2, margin:"0 auto 0.75rem" }} />
            <p>No assigned students found</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))", gap:"1rem" }}>
            {sortedStudents.map(student => {
              const badge = getStatusBadge(student.project?.status);
              const initials = student.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "S";
              return (
                <div key={student._id} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"1.125rem", transition:"box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.875rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"var(--accent)", fontSize:"0.9rem" }}>{initials}</div>
                      <div>
                        <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9rem" }}>{student.name}</p>
                        <p style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>{student.email}</p>
                      </div>
                    </div>
                    <span style={{ padding:"0.25rem 0.625rem", borderRadius:99, fontSize:"0.72rem", fontWeight:700, background:badge.bg, color:badge.color }}>{badge.label}</span>
                  </div>
                  <div style={{ background:"var(--bg-elevated)", borderRadius:8, padding:"0.625rem 0.75rem", marginBottom:"0.875rem" }}>
                    <p style={{ fontWeight:600, color:"var(--text-secondary)", fontSize:"0.845rem", marginBottom:"0.2rem" }}>{student.project?.title || "No project title"}</p>
                    <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Updated {new Date(student.project?.updatedAt || new Date()).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display:"flex", gap:"0.625rem" }}>
                    <button onClick={() => { setSelectedStudent(student); setFeedbackData({ title:"", message:"", type:"general" }); setShowFeedbackModal(true); }}
                      className="btn-primary" style={{ flex:1, gap:"0.4rem" }}>
                      <MessageSquare size={14} /> Feedback
                    </button>
                    <button onClick={() => { setSelectedStudent(student); setShowCompleteModal(true); }}
                      disabled={student.project?.status === "completed"}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem", padding:"0.5rem 0.875rem", borderRadius:8, border:"none",
                        cursor: student.project?.status === "completed" ? "not-allowed" : "pointer",
                        background: student.project?.status === "completed" ? "var(--bg-elevated)" : "#16a34a",
                        color: student.project?.status === "completed" ? "var(--text-muted)" : "#fff",
                        fontSize:"0.845rem", fontWeight:600 }}>
                      <CheckCircle size={14} /> Complete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FEEDBACK MODAL */}
        {showFeedbackModal && selectedStudent && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}
            onClick={closeModal}>
            <div style={{ background:"var(--bg-card)", borderRadius:16, width:"100%", maxWidth:480, boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:"var(--accent-light)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <MessageSquare size={16} style={{ color:"var(--accent)" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.95rem" }}>Provide Feedback</p>
                    <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{selectedStudent.name}</p>
                  </div>
                </div>
                <button onClick={closeModal} style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--bg-elevated)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ padding:"1.25rem 1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
                {/* Project info */}
                <div style={{ background:"var(--bg-elevated)", borderRadius:10, padding:"0.75rem 1rem", display:"flex", gap:"2rem", flexWrap:"wrap" }}>
                  <div>
                    <p style={{ fontSize:"0.7rem", color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Project</p>
                    <p style={{ fontSize:"0.845rem", color:"var(--text-primary)", fontWeight:500, marginTop:2 }}>{selectedStudent.project?.title || "—"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:"0.7rem", color:"var(--text-muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Updated</p>
                    <p style={{ fontSize:"0.845rem", color:"var(--text-primary)", fontWeight:500, marginTop:2 }}>
                      {new Date(selectedStudent.project?.updatedAt || new Date()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Type selector */}
                <div>
                  <p style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.5rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>Feedback Type</p>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setFeedbackData(p => ({ ...p, type: key }))}
                        style={{ flex:1, padding:"0.5rem 0.25rem", borderRadius:8,
                          border:`2px solid ${feedbackData.type === key ? cfg.color : "var(--border)"}`,
                          background: feedbackData.type === key ? cfg.bg : "var(--bg-elevated)",
                          color: feedbackData.type === key ? cfg.color : "var(--text-muted)",
                          fontSize:"0.75rem", fontWeight:700, cursor:"pointer", transition:"all 0.15s",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:"0.2rem" }}>
                        <span style={{ fontSize:"1rem" }}>{cfg.emoji}</span>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:"0.4rem" }}>Title</label>
                  <input type="text" value={feedbackData.title}
                    onChange={e => setFeedbackData(p => ({ ...p, title: e.target.value }))}
                    className="input" style={{ width:"100%" }}
                    placeholder="e.g. Great progress on Chapter 2" />
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:"0.4rem" }}>Message</label>
                  <textarea value={feedbackData.message}
                    onChange={e => setFeedbackData(p => ({ ...p, message: e.target.value }))}
                    rows={4} className="input"
                    style={{ width:"100%", resize:"none", fontFamily:"inherit" }}
                    placeholder="Write detailed feedback for the student…" />
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:"0.75rem", paddingTop:"0.25rem" }}>
                  <button onClick={closeModal}
                    style={{ flex:1, padding:"0.625rem", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontWeight:600, cursor:"pointer", fontSize:"0.875rem" }}>
                    Cancel
                  </button>
                  <button onClick={submitFeedback} className="btn-primary"
                    disabled={!feedbackData.title || !feedbackData.message}
                    style={{ flex:2, opacity:(!feedbackData.title || !feedbackData.message) ? 0.5 : 1 }}>
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPLETE MODAL */}
        {showCompleteModal && selectedStudent && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"1rem" }}
            onClick={closeModal}>
            <div style={{ background:"var(--bg-card)", borderRadius:16, width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.95rem" }}>Mark as Completed?</p>
                <button onClick={closeModal} style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--bg-elevated)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding:"1.25rem 1.5rem" }}>
                <div style={{ background:"var(--bg-elevated)", borderRadius:10, padding:"0.875rem 1rem", marginBottom:"1rem" }}>
                  <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginBottom:"0.15rem" }}>Student</p>
                  <p style={{ fontWeight:600, color:"var(--text-primary)" }}>{selectedStudent.name}</p>
                  <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:"0.5rem", marginBottom:"0.15rem" }}>Project</p>
                  <p style={{ fontWeight:600, color:"var(--text-primary)" }}>{selectedStudent.project?.title || "No title"}</p>
                </div>
                <p style={{ fontSize:"0.845rem", color:"var(--text-muted)", marginBottom:"1.25rem" }}>
                  This will mark the project as completed. This action cannot be undone.
                </p>
                <div style={{ display:"flex", gap:"0.75rem" }}>
                  <button onClick={closeModal}
                    style={{ flex:1, padding:"0.625rem", borderRadius:8, border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontWeight:600, cursor:"pointer", fontSize:"0.875rem" }}>
                    Cancel
                  </button>
                  <button onClick={confirmMarkComplete}
                    style={{ flex:2, padding:"0.625rem", borderRadius:8, border:"none", background:"#16a34a", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:"0.875rem" }}>
                    ✓ Mark as Completed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default AssignedStudents;
