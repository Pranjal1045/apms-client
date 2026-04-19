import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { approveProject, rejectProject } from "../../store/slices/adminSlice";
import { downloadProjectFile } from "../../store/slices/projectSlice";
import { Folder, AlertTriangle, CheckCircle2, X, FileDown, Eye } from "lucide-react";
import { toast } from "react-toastify";

const statusBadge = s => {
  if (s === "completed") return "badge badge-completed";
  if (s === "approved")  return "badge badge-approved";
  if (s === "pending")   return "badge badge-pending";
  if (s === "rejected")  return "badge badge-rejected";
  return "badge";
};

const fmt = d => d ? new Date(d).toLocaleDateString("en-GB") : "Not Set";

const ProjectsPage = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupervisor, setFilterSupervisor] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [reportSearch, setReportSearch] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.admin);

  const supervisors = useMemo(() => Array.from(new Set((projects || []).map(p => p?.supervisor?.name).filter(Boolean))), [projects]);

  const filtered = (projects || []).filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (p.title || "").toLowerCase().includes(q) || (p.student?.name || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchSup = filterSupervisor === "all" || p.supervisor?.name === filterSupervisor;
    return matchSearch && matchStatus && matchSup;
  });

  const files = useMemo(() => (projects || []).flatMap(p =>
    (p.files || []).map(f => ({ projectId: p._id, fileId: f._id, fileUrl: f.fileUrl, originalName: f.originalName, fileType: f.fileType, uploadedAt: f.uploadedAt, projectTitle: p.title, studentName: p.student?.name }))
  ), [projects]);

  const filteredFiles = files.filter(f => {
    const q = reportSearch.toLowerCase();
    return (f.originalName || "").toLowerCase().includes(q) || (f.projectTitle || "").toLowerCase().includes(q) || (f.studentName || "").toLowerCase().includes(q);
  });

  const handleDownload = f => {
    // Files are on Cloudinary — pass fileUrl directly to the thunk
    dispatch(downloadProjectFile({ fileUrl: f.fileUrl, originalName: f.originalName }));
  };

  const handleStatusChange = (id, newStatus) => {
    if (newStatus === "approved") dispatch(approveProject(id)).then(() => toast.success("Project approved"));
    else dispatch(rejectProject(id)).then(() => toast.success("Project rejected"));
  };

  const stats = [
    { label: "Total Projects", value: (projects||[]).length, icon: Folder, color: "var(--accent)" },
    { label: "Pending Review", value: (projects||[]).filter(p => p.status === "pending").length, icon: AlertTriangle, color: "var(--warning)" },
    { label: "Completed", value: (projects||[]).filter(p => p.status === "completed").length, icon: CheckCircle2, color: "var(--success)" },
    { label: "Rejected", value: (projects||[]).filter(p => p.status === "rejected").length, icon: X, color: "var(--danger)" },
  ];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">All Projects</h1>
          <p className="page-subtitle">View and manage all student projects across the platform</p>
        </div>
        <button className="btn-primary" onClick={() => setIsReportsOpen(true)}><FileDown size={15} /> Download Reports</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Search Projects</label>
          <input className="input" type="text" placeholder="Search by project title or student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ minWidth: 170 }}>
          <label className="label">Filter by Status</label>
          <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Projects</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ minWidth: 170 }}>
          <label className="label">Filter Supervisor</label>
          <select className="input" value={filterSupervisor} onChange={e => setFilterSupervisor(e.target.value)}>
            <option value="all">All Supervisors</option>
            {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">Projects Overview ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {["Project Details", "Student", "Supervisor", "Deadline", "Status", "Actions"].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No projects found matching your criteria</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell" style={{ maxWidth: 280 }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{p.description}</div>
                  </td>
                  <td className="table-cell">
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.student?.name || "—"}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Updated: {fmt(p.updatedAt)}</div>
                  </td>
                  <td className="table-cell">
                    {p.supervisor?.name
                      ? <span className="badge badge-approved">{p.supervisor.name}</span>
                      : <span style={{ color: "var(--text-faint)", fontSize: "0.85rem" }}>Unassigned</span>}
                  </td>
                  <td className="table-cell">{p.deadline ? fmt(p.deadline) : <span className="badge badge-pending">Not Set</span>}</td>
                  <td className="table-cell"><span className={statusBadge(p.status)} style={{ textTransform: "capitalize" }}>{p.status}</span></td>
                  <td className="table-cell">
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button className="btn-primary btn-small" onClick={() => { setCurrentProject(p); setShowViewModal(true); }}><Eye size={13} /> View</button>
                      {p.status === "pending" && (<>
                        <button className="btn-success btn-small" onClick={() => handleStatusChange(p._id, "approved")}>Approve</button>
                        <button className="btn-danger btn-small" onClick={() => handleStatusChange(p._id, "rejected")}>Reject</button>
                      </>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && currentProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Project Details</h3>
              <button onClick={() => setShowViewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Title</label>
                <div className="input" style={{ background: "var(--bg-elevated)", cursor: "default" }}>{currentProject.title || "—"}</div>
              </div>
              <div>
                <label className="label">Description</label>
                <div className="input" style={{ background: "var(--bg-elevated)", cursor: "default", minHeight: 80, whiteSpace: "pre-wrap" }}>{currentProject.description || "—"}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><label className="label">Student</label><div className="input" style={{ background: "var(--bg-elevated)", cursor: "default" }}>{currentProject.student?.name || "—"}</div></div>
                <div><label className="label">Supervisor</label><div className="input" style={{ background: "var(--bg-elevated)", cursor: "default" }}>{currentProject.supervisor?.name || "Not Assigned"}</div></div>
                <div><label className="label">Status</label><div style={{ marginTop: 6 }}><span className={statusBadge(currentProject.status)} style={{ textTransform: "capitalize" }}>{currentProject.status}</span></div></div>
                <div><label className="label">Deadline</label><div className="input" style={{ background: "var(--bg-elevated)", cursor: "default" }}>{currentProject.deadline ? fmt(currentProject.deadline) : "Not Set"}</div></div>
              </div>
              <div>
                <label className="label">Uploaded Files ({(currentProject.files || []).length})</label>
                {(currentProject.files || []).length === 0
                  ? <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No files uploaded</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {currentProject.files.map(f => (
                      <div key={f._id} style={{ padding: "0.5rem 0.75rem", background: "var(--bg-elevated)", borderRadius: "var(--radius)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        📄 {f.originalName}
                      </div>
                    ))}
                  </div>}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                {currentProject.status === "pending" && (<>
                  <button className="btn-success btn-small" onClick={() => { handleStatusChange(currentProject._id, "approved"); setShowViewModal(false); }}>Approve</button>
                  <button className="btn-danger btn-small" onClick={() => { handleStatusChange(currentProject._id, "rejected"); setShowViewModal(false); }}>Reject</button>
                </>)}
                <button className="btn-outline" onClick={() => setShowViewModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {isReportsOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>All Uploaded Files</h3>
              <button onClick={() => setIsReportsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <input className="input" type="text" placeholder="Search by file name, project, or student..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} />
            </div>
            {filteredFiles.length === 0
              ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>No files found.</p>
              : <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredFiles.map(f => (
                  <div key={`${f.projectId}-${f.fileId}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--bg-elevated)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>📄 {f.originalName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{f.projectTitle} · {f.studentName}</div>
                    </div>
                    <button className="btn-outline btn-small" onClick={() => handleDownload(f)}>Download</button>
                  </div>
                ))}
              </div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
