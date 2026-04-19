import { useState } from "react";
import { useDispatch } from "react-redux";
import { createTeacher } from "../../store/slices/adminSlice";
import { toggleTeacherModal } from "../../store/slices/popupSlice";
import { X, GraduationCap } from "lucide-react";

const AddTeacher = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "", maxStudents: 10, experties: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createTeacher({ ...formData, maxStudents: Number(formData.maxStudents) }));
    dispatch(toggleTeacherModal());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GraduationCap size={16} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>Add Teacher</h3>
          </div>
          <button onClick={() => dispatch(toggleTeacherModal())} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={17} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[
            { label: "Full Name", name: "name", type: "text", placeholder: "Teacher full name" },
            { label: "Email Address", name: "email", type: "email", placeholder: "teacher@university.edu" },
            { label: "Password", name: "password", type: "password", placeholder: "Min 8 characters" },
            { label: "Department", name: "department", type: "text", placeholder: "e.g. Computer Science" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input type={type} required value={formData[name]} onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))} className="input" placeholder={placeholder} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
            <div>
              <label className="label">Max Students</label>
              <input type="number" min={1} max={30} value={formData.maxStudents} onChange={e => setFormData(p => ({ ...p, maxStudents: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Expertise (comma-sep)</label>
              <input type="text" value={formData.experties} onChange={e => setFormData(p => ({ ...p, experties: e.target.value }))} className="input" placeholder="AI, ML, Web Dev" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.25rem" }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Teacher</button>
            <button type="button" className="btn-outline" onClick={() => dispatch(toggleTeacherModal())}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddTeacher;
