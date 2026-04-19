import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Calendar } from "lucide-react";
import { getAllProjects } from "../../store/slices/adminSlice";
import { createDeadline } from "../../store/slices/deadlineSlice";
import { toast } from "react-toastify";

const DeadlinesPage = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector(s => s.admin);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewProjects, setViewProjects] = useState([]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { dispatch(getAllProjects()); }, [dispatch]);
  useEffect(() => { if (projects) setViewProjects(projects); }, [projects]);

  const fmt = d => d ? new Date(d).toLocaleDateString("en-GB") : null;

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return viewProjects || [];
    const q = searchTerm.toLowerCase();
    return (viewProjects || []).filter(p =>
      p.title?.toLowerCase().includes(q) || p.student?.name?.toLowerCase().includes(q)
    );
  }, [searchTerm, viewProjects]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedProject || !deadlineDate) { toast.error("Please select a project and deadline date"); return; }
    try {
      await dispatch(createDeadline({ id: selectedProject._id, data: { name: selectedProject.student?.name, dueDate: deadlineDate, project: selectedProject._id } })).unwrap();
      setViewProjects(prev => prev.map(p => p._id === selectedProject._id ? { ...p, deadline: deadlineDate } : p));
      toast.success("Deadline saved successfully");
    } catch { toast.error("Failed to save deadline"); }
    finally {
      setShowModal(false); setSelectedProject(null); setQuery(""); setDeadlineDate("");
    }
  };

  const deadlineSet = viewProjects.filter(p => !!p.deadline).length;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Manage Deadlines</h1>
          <p className="page-subtitle">Create and monitor project deadlines</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Calendar size={15} /> Create/Update Deadline
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          { label: "Total Projects", value: viewProjects.length },
          { label: "Deadlines Set", value: deadlineSet },
          { label: "Not Set", value: viewProjects.length - deadlineSet },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card">
        <label className="label">Search Deadlines</label>
        <input className="input" type="text" placeholder="Search by project or student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">Project Deadlines ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {["Student", "Project Title", "Supervisor", "Deadline", "Updated"].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No projects found</td></tr>
              ) : filtered.map(row => (
                <tr key={row._id} className="table-row">
                  <td className="table-cell">
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.student?.name || "—"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{row.student?.email || "—"}</div>
                  </td>
                  <td className="table-cell" style={{ maxWidth: 260 }}>{row.title}</td>
                  <td className="table-cell">
                    {row.supervisor?.name
                      ? <span className="badge badge-approved">{row.supervisor.name}</span>
                      : <span className="badge badge-pending">Not Assigned</span>}
                  </td>
                  <td className="table-cell">
                    {fmt(row.deadline)
                      ? <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{fmt(row.deadline)}</span>
                      : <span className="badge badge-pending">Not Set</span>}
                  </td>
                  <td className="table-cell" style={{ fontSize: "0.8rem" }}>{fmt(row.updatedAt) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Create / Update Deadline</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Search Project</label>
                <input className="input" type="text" placeholder="Type to search projects..." value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedProject(null); }} />
                {query && !selectedProject && (
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", marginTop: 4, maxHeight: 220, overflowY: "auto", background: "var(--bg-card)" }}>
                    {(projects || []).filter(p => p.title?.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map(p => (
                      <button key={p._id} type="button" onClick={() => { setSelectedProject(p); setQuery(p.title); setDeadlineDate(p.deadline ? new Date(p.deadline).toISOString().slice(0,10) : ""); }}
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.875rem", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)", color: "var(--text-primary)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{p.title}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{p.student?.name} · {p.supervisor?.name || "No supervisor"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProject && (
                <div className="alert-info" style={{ fontSize: "0.875rem" }}>
                  <strong>{selectedProject.title}</strong> — {selectedProject.student?.name} · Status: {selectedProject.status}
                </div>
              )}
              <div>
                <label className="label">Deadline Date</label>
                <input className="input" type="date" disabled={!selectedProject} value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!selectedProject || !deadlineDate}>Save Deadline</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlinesPage;
