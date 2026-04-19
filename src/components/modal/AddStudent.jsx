import { useState } from "react";
import { useDispatch } from "react-redux";
import { createStudent } from "../../store/slices/adminSlice";
import { toggleStudentModal } from "../../store/slices/popupSlice";
import { X, UserPlus } from "lucide-react";

const AddStudent = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", department: "", rollNumber: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createStudent(formData));
    dispatch(toggleStudentModal());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserPlus size={16} style={{ color: "var(--accent)" }} />
            <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>Add Student</h3>
          </div>
          <button onClick={() => dispatch(toggleStudentModal())} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
            <X size={17} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[
            { label: "Full Name", name: "name", type: "text", placeholder: "Student full name" },
            { label: "Email Address", name: "email", type: "email", placeholder: "student@university.edu" },
            { label: "Password", name: "password", type: "password", placeholder: "Min 8 characters" },
            { label: "Department", name: "department", type: "text", placeholder: "e.g. Computer Science" },
            { label: "Roll Number (optional)", name: "rollNumber", type: "text", placeholder: "e.g. CS21-001" },
          ].map(({ label, name, type, placeholder }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input type={type} required={name !== "rollNumber"} value={formData[name]} onChange={e => setFormData(p => ({ ...p, [name]: e.target.value }))} className="input" placeholder={placeholder} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.25rem" }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Student</button>
            <button type="button" className="btn-outline" onClick={() => dispatch(toggleStudentModal())}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddStudent;
