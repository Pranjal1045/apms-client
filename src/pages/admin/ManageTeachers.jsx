import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AddTeacher from "../../components/modal/AddTeacher";
import { deleteTeacher, getAllUsers, updateTeacher } from "../../store/slices/adminSlice";
import { toggleTeacherModal } from "../../store/slices/popupSlice";
import { BadgeCheck, Plus, Users, X, AlertTriangle, TriangleAlert } from "lucide-react";
import { toast } from "react-toastify";

const ManageTeachers = () => {
  const { users } = useSelector(s => s.admin);
  const { isCreateTeacherModalOpen } = useSelector(s => s.popup);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", department: "", experties: "", maxStudents: 10 });
  const dispatch = useDispatch();

  useEffect(() => { dispatch(getAllUsers()); }, [dispatch]);

  const teachers = useMemo(() => (users || []).filter(u => u.role?.toLowerCase() === "teacher"), [users]);
  const departments = useMemo(() => Array.from(new Set(teachers.map(t => t.department).filter(Boolean))), [teachers]);

  const filtered = teachers.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (t.name || "").toLowerCase().includes(q) || (t.email || "").toLowerCase().includes(q);
    return matchSearch && (filterDept === "all" || t.department === filterDept);
  });

  const handleEdit = t => {
    setEditingTeacher(t);
    setFormData({ name: t.name, email: t.email, department: t.department || "", experties: Array.isArray(t.experties) ? t.experties[0] : (t.experties || ""), maxStudents: t.maxStudents || 10 });
    setShowModal(true);
  };
  const handleClose = () => { setShowModal(false); setEditingTeacher(null); setFormData({ name: "", email: "", department: "", experties: "", maxStudents: 10 }); };
  const handleSubmit = e => {
    e.preventDefault();
    if (editingTeacher) dispatch(updateTeacher({ id: editingTeacher._id, data: formData })).then(() => toast.success("Teacher updated"));
    handleClose();
  };
  const confirmDelete = () => {
    if (teacherToDelete) { dispatch(deleteTeacher(teacherToDelete._id)).then(() => toast.success("Teacher deleted")); setShowDeleteModal(false); setTeacherToDelete(null); }
  };

  const DEPTS = ["Computer Science & Engineering","Information Technology","Electrical Engineering","Electronics Engineering","Civil Engineering","Mechanical Engineering"];

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Manage Teachers</h1>
          <p className="page-subtitle">Add, edit, and manage teacher accounts</p>
        </div>
        <button className="btn-primary" onClick={() => dispatch(toggleTeacherModal())}><Plus size={15} /> Add Teacher</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          { label: "Total Teachers", value: teachers.length, icon: Users, color: "var(--accent)" },
          { label: "With Capacity", value: teachers.filter(t => (t.assignedStudents?.length || 0) < (t.maxStudents || 0)).length, icon: BadgeCheck, color: "var(--success)" },
          { label: "Full Capacity", value: teachers.filter(t => (t.assignedStudents?.length || 0) >= (t.maxStudents || 0)).length, icon: TriangleAlert, color: "var(--warning)" },
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

      <div className="card" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label">Search Teachers</label>
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

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 className="section-title">Teachers List ({filtered.length})</h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {["Teacher Info", "Department", "Expertise", "Students", "Capacity", "Actions"].map(h => (
                  <th key={h} className="table-header-cell">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="table-cell" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No teachers found</td></tr>
              ) : filtered.map(t => {
                const assigned = t.assignedStudents?.length || 0;
                const max = t.maxStudents || 0;
                const pct = max > 0 ? Math.round((assigned / max) * 100) : 0;
                return (
                  <tr key={t._id} className="table-row">
                    <td className="table-cell">
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{t.email}</div>
                    </td>
                    <td className="table-cell">{t.department || "—"}</td>
                    <td className="table-cell">{Array.isArray(t.experties) ? t.experties.join(", ") : (t.experties || "—")}</td>
                    <td className="table-cell">{assigned}</td>
                    <td className="table-cell">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--danger)" : pct > 70 ? "var(--warning)" : "var(--success)" }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{assigned}/{max}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn-outline btn-small" onClick={() => handleEdit(t)}>Edit</button>
                        <button className="btn-danger btn-small" onClick={() => { setTeacherToDelete(t); setShowDeleteModal(true); }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>Edit Teacher</h3>
              <button onClick={handleClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
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
              <div><label className="label">Expertise</label><input className="input" placeholder="e.g. Machine Learning, Web Dev" value={formData.experties} onChange={e => setFormData({ ...formData, experties: e.target.value })} /></div>
              <div><label className="label">Max Students</label><input className="input" type="number" min={1} max={20} value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })} /></div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn-outline" onClick={handleClose}>Cancel</button>
                <button type="submit" className="btn-primary">Update Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && teacherToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
            </div>
            <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Delete Teacher</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.25rem" }}>Delete <strong>{teacherToDelete.name}</strong>? This cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isCreateTeacherModalOpen && <AddTeacher />}
    </div>
  );
};

export default ManageTeachers;
