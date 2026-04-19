import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../store/slices/authSlice";
import { Loader, GraduationCap, Eye, EyeOff, BookOpen, UserCheck, ShieldCheck } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electrical Engineering",
  "Electronics & Communication Engineering",
  "Electronics Instrumentation & Control Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Aeronautical Engineering",
  "Petroleum Engineering",
  "Petrochemical Engineering",
];

// Must match what your server actually accepts (no server-side secret check — frontend only)
const ADMIN_SECRET = "APMS@Admin2026";

const ROLES = [
  { label: "Student",  value: "Student",  icon: BookOpen,    color: "#16a34a", desc: "Track your FYP progress and collaborate with your group." },
  { label: "Teacher",  value: "Teacher",  icon: UserCheck,   color: "#2563eb", desc: "Supervise student projects and evaluate their progress." },
  { label: "Admin",    value: "Admin",    icon: ShieldCheck, color: "#7c3aed", desc: "Full system access. Requires the institution secret key." },
];

/* ── shared input helpers ── */
const baseInp = {
  width: "100%", padding: "0.6rem 0.875rem",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
  transition: "border-color 0.12s, box-shadow 0.12s",
  letterSpacing: "-0.01em", boxSizing: "border-box",
};
const errInp  = { ...baseInp, borderColor: "var(--danger)", boxShadow: "0 0 0 3px rgba(220,38,38,0.08)" };
const onFocus = e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "var(--bg-surface)"; };
const onBlur  = e => { e.target.style.borderColor = e.target.dataset.err ? "var(--danger)" : "var(--border)"; e.target.style.boxShadow = e.target.dataset.err ? "0 0 0 3px rgba(220,38,38,0.08)" : "none"; e.target.style.background = "var(--bg-elevated)"; };

const Label = ({ children, required }) => (
  <label style={{ display: "block", fontSize: "0.79rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.35rem", letterSpacing: "-0.01em" }}>
    {children}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
  </label>
);
const ErrMsg = ({ msg }) => msg
  ? <p style={{ fontSize: "0.74rem", color: "var(--danger)", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>⚠ {msg}</p>
  : null;

const PwdInput = ({ name, value, onChange, placeholder, show, onToggle, hasErr }) => (
  <div style={{ position: "relative" }}>
    <input type={show ? "text" : "password"} name={name} value={value} onChange={onChange}
      placeholder={placeholder}
      style={{ ...(hasErr ? errInp : baseInp), paddingRight: "2.5rem" }}
      data-err={hasErr ? "1" : ""}
      onFocus={onFocus} onBlur={onBlur}/>
    <button type="button" onClick={onToggle}
      style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0 }}>
      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  </div>
);

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { isSigningUp } = useSelector(s => s.auth);
  const [show, setShow] = useState({ pwd: false, confirm: false, adminKey: false });
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "Student", department: "", rollNumber: "", adminKey: "",
  });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.department) e.department = "Please select a department";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "Must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (form.role === "Admin") {
      if (!form.adminKey) e.adminKey = "Admin secret key is required";
      else if (form.adminKey !== ADMIN_SECRET) e.adminKey = "Invalid secret key — contact your administrator";
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const result = await dispatch(register({
      name: form.name, email: form.email, password: form.password,
      role: form.role, department: form.department,
      rollNumber: form.role === "Student" ? form.rollNumber : undefined,
    }));
    if (!result.error) {
      navigate(form.role === "Admin" ? "/admin" : form.role === "Teacher" ? "/teacher" : "/student");
    }
  };

  const activeRole = ROLES.find(r => r.value === form.role);

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* ── Left brand panel ── */}
      <div style={{
        flex: "0 0 36%", minWidth: 280,
        background: "linear-gradient(135deg, #0a0f1e 0%, #111827 50%, #1a1040 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "2.5rem 3rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: "20%", left: "5%", width: 260, height: 260, background: "radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: "9px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={20} color="#fff"/>
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.03em", lineHeight: 1 }}>FYP Management</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Academic System</p>
            </div>
          </div>

          <h1 style={{ color: "#fff", fontSize: "1.9rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
            Create Your<br/>Account
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.875rem", lineHeight: 1.65, maxWidth: 260, marginBottom: "2rem" }}>
            Join the platform and start managing your Final Year Project with AI-powered tools.
          </p>

          {/* Dynamic role info card */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "1rem 1.125rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: `${activeRole.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <activeRole.icon size={13} style={{ color: activeRole.color }}/>
              </div>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.845rem" }}>Registering as {form.role}</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.78rem", lineHeight: 1.55 }}>{activeRole.desc}</p>
          </div>
        </div>

        <p style={{ position: "relative", color: "rgba(255,255,255,0.18)", fontSize: "0.68rem" }}>
          © {new Date().getFullYear()} FYP Management System
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-base)", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 460, paddingTop: "1rem", paddingBottom: "1rem" }}>

          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>Create Account</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>

            {/* ── Role selector ── */}
            <div>
              <Label required>Register as</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                {ROLES.map(({ label, value, icon: Icon, color }) => {
                  const active = form.role === value;
                  return (
                    <button key={value} type="button"
                      onClick={() => { setForm(p => ({ ...p, role: value, adminKey: "" })); setErrors({}); }}
                      style={{
                        padding: "0.65rem 0.4rem", borderRadius: "var(--radius)",
                        border: active ? `2px solid ${color}` : "2px solid var(--border)",
                        background: active ? `${color}10` : "var(--bg-elevated)",
                        color: active ? color : "var(--text-muted)",
                        fontWeight: active ? 700 : 500, fontSize: "0.8rem",
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem",
                        transition: "all 0.15s",
                      }}>
                      <Icon size={15}/>{label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Full Name ── */}
            <div>
              <Label required>Full Name</Label>
              <input name="name" value={form.name} onChange={set} placeholder="Your full name"
                style={errors.name ? errInp : baseInp} data-err={errors.name ? "1" : ""}
                onFocus={onFocus} onBlur={onBlur}/>
              <ErrMsg msg={errors.name}/>
            </div>

            {/* ── Email ── */}
            <div>
              <Label required>Email Address</Label>
              <input type="email" name="email" value={form.email} onChange={set} placeholder="you@university.edu"
                style={errors.email ? errInp : baseInp} data-err={errors.email ? "1" : ""}
                onFocus={onFocus} onBlur={onBlur}/>
              <ErrMsg msg={errors.email}/>
            </div>

            {/* ── Department + Roll Number ── */}
            <div style={{ display: "grid", gridTemplateColumns: form.role === "Student" ? "1fr 1fr" : "1fr", gap: "0.75rem" }}>
              <div>
                <Label required>Department</Label>
                <select name="department" value={form.department} onChange={set}
                  style={{ ...(errors.department ? errInp : baseInp), appearance: "none", cursor: "pointer" }}
                  data-err={errors.department ? "1" : ""} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ErrMsg msg={errors.department}/>
              </div>
              {form.role === "Student" && (
                <div>
                  <Label>Roll Number</Label>
                  <input name="rollNumber" value={form.rollNumber} onChange={set} placeholder="e.g. 22EUCCS304"
                    style={baseInp} onFocus={onFocus} onBlur={onBlur}/>
                </div>
              )}
            </div>

            {/* ── Admin Secret Key ── */}
            {form.role === "Admin" && (
              <div>
                <Label required>Admin Secret Key</Label>
                <div style={{ marginBottom: "0.5rem", padding: "0.6rem 0.75rem", background: "var(--warning-light)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius)", fontSize: "0.78rem", color: "var(--warning)", display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                  <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
                  Contact your system administrator for the secret key.
                </div>
                <PwdInput name="adminKey" value={form.adminKey}
                  onChange={e => { set(e); if (errors.adminKey) setErrors(p => ({ ...p, adminKey: "" })); }}
                  placeholder="Enter admin secret key"
                  show={show.adminKey} onToggle={() => setShow(p => ({ ...p, adminKey: !p.adminKey }))}
                  hasErr={!!errors.adminKey}/>
                <ErrMsg msg={errors.adminKey}/>
              </div>
            )}

            {/* ── Passwords ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <Label required>Password</Label>
                <PwdInput name="password" value={form.password}
                  onChange={e => { set(e); if (errors.password) setErrors(p => ({ ...p, password: "" })); }}
                  placeholder="Min 8 characters"
                  show={show.pwd} onToggle={() => setShow(p => ({ ...p, pwd: !p.pwd }))}
                  hasErr={!!errors.password}/>
                <ErrMsg msg={errors.password}/>
              </div>
              <div>
                <Label required>Confirm Password</Label>
                <PwdInput name="confirmPassword" value={form.confirmPassword}
                  onChange={e => { set(e); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: "" })); }}
                  placeholder="Repeat password"
                  show={show.confirm} onToggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
                  hasErr={!!errors.confirmPassword}/>
                <ErrMsg msg={errors.confirmPassword}/>
              </div>
            </div>

            {/* ── Submit ── */}
            <button type="submit" disabled={isSigningUp}
              style={{
                width: "100%", padding: "0.72rem", marginTop: "0.35rem",
                background: isSigningUp ? "var(--text-faint)" : "linear-gradient(135deg, var(--accent), #7c3aed)",
                color: "#fff", border: "none", borderRadius: "var(--radius)",
                fontSize: "0.9rem", fontWeight: 700,
                cursor: isSigningUp ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                fontFamily: "inherit", letterSpacing: "-0.01em",
                transition: "opacity 0.12s, transform 0.12s",
              }}
              onMouseEnter={e => { if (!isSigningUp) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {isSigningUp
                ? <><Loader size={16} className="animate-spin"/> Creating account…</>
                : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.845rem", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
