import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddStudent from "../../components/modal/AddStudent";
import { deleteStudent, getAllUsers, getAllProjects, updateStudent } from "../../store/slices/adminSlice";
import { CheckCircle, Plus, TriangleAlert, Users, X, AlertTriangle } from "lucide-react";
import { toggleStudentModal } from "../../store/slices/popupSlice";
import { toast } from "react-toastify";

const ManageStudents = () => {
  const { users, projects } = useSelector(s => s.admin);
  const { isCreateStudentModalOpen } = useSelector(s => s.popup);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", department: "" });
  const dispatch = useDispatch();

  useEffect(() => { dispatch(getAllUsers()); dispatch(getAllProjects()); }, [dispatch]);

  const students = useMemo(() => {
    return (users || []).filter(u => u.role?.toLowerCase() === "student").map(s => {
      // ✅ FIX: match by student OR members array (group projects)
      const proj = (projects || []).find(p =>
        p.student?._id === s._id ||
        p.student === s._id ||
        (p.members || []).some(m => (m?._id || m) === s._id || (m?._id?.toString?.() || m?.toString?.()) === s._id?.toString?.())
      );
      return { ...s, projectTitle: proj?.title || null, supervisor: proj?.supervisor || null, projectStatus: proj?.status || null };
    });
  }, [users, projects]);

  const departments = useMemo(() => Array.from(new Set(students.map(s => s.department).filter(Boolean))), [students]);

  const filtered = students.filter(s => {
    const q = searchTerm.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q)
      ? (filterDept === "all" || s.department === filterDept) : false;
  });

  const handleEdit = s => { setEditingStudent(s); setFormData({ name: s.name, email: s.email, department: s.department || "" }); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); setFormData({ name: "", email: "", department: "" }); };
  const handleSubmit = e => {
    e.preventDefault();
    if (editingStudent) dispatch(updateStudent({ id: editingStudent._id, data: formData })).then(() => toast.success("Student updated"));
    handleCloseModal();
  };
  const confirmDelete = () => {
    if (studentToDelete) { dispatch(deleteStudent(studentToDelete._id)).then(() => toast.success("Student deleted")); setShowDeleteModal(false); setStudentToDelete(null); }
  };

  const DEPTS = ["Computer Science & Engineering","Information Technology","Electrical Engineering","Electronics Engineering","Civil Engineering","Mechanical Engineering"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">Add, edit, and manage student accounts</p>
        </div>
        <button className="btn-primary" onClick={() => dispatch(toggleStudentModal())}><Plus size={15} /> Add Student</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "var(--accent)" },
          { label: "With Projects", value: students.filter(s => s.projectTitle).length, icon: CheckCircle, color: "var(--success)" },
          { label: "Unassigned", value: students.filter(s => !s.supervisor).length, icon: TriangleAlert, color: "var(--warning)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <label className="label">Search Students</label>
          <input className="input" type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div style={{ width: 200 }}>
          <label className="label">Filter by Department</label>
          <select className="input" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">Students List ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {["Student Info", "Department", "Supervisor", "Project", "Actions"].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="table-cell" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No students found</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="table-row">
                  <td className="table-cell">
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.email}</div>
                  </td>
                  <td className="table-cell">{s.department || "—"}</td>
                  <td className="table-cell">
                    {s.supervisor
                      ? <span className="badge badge-approved">{users?.find(u => u._id === (s.supervisor?._id || s.supervisor))?.name || "Assigned"}</span>
                      : <span className="badge badge-pending">{s.projectStatus === "rejected" ? "Rejected" : "Not Assigned"}</span>}
                  </td>
                  <td className="table-cell" style={{ maxWidth: 200, fontSize: "0.875rem" }}>{s.projectTitle || <span style={{ color: "var(--text-faint)" }}>No project</span>}</td>
                  <td className="table-cell">
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn-outline btn-small" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="btn-danger btn-small" onClick={() => { setStudentToDelete(s); setShowDeleteModal(true); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Edit Student</h3>
              <button onClick={handleCloseModal} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><label className="label">Full Name</label><input className="input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div>
                <label className="label">Department</label>
                <select className="input" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">Update Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
            </div>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Delete Student</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isCreateStudentModalOpen && <AddStudent />}
    </div>
  );
};

export default ManageStudents;
