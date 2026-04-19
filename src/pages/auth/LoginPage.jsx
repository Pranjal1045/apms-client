import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, clearError } from "../../store/slices/authSlice";
import { Eye, EyeOff, LogIn, GraduationCap, Loader, BookOpen, UserCheck, ShieldCheck } from "lucide-react";

const ROLES = [
  { label: "Student",  value: "Student",  icon: BookOpen,    color: "#16a34a" },
  { label: "Teacher",  value: "Teacher",  icon: UserCheck,   color: "#2563eb" },
  { label: "Admin",    value: "Admin",    icon: ShieldCheck, color: "#7c3aed" },
];

const LoginPage = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState("Student");
  const [showPwd,  setShowPwd]  = useState(false);

  const { loading, error, isLoggingIn } = useSelector(s => s.auth);
  const isLoading = loading || isLoggingIn;
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  useEffect(() => { dispatch(clearError()); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password, role }));
    if (login.fulfilled.match(result)) {
      const r = result.payload?.role || role;
      if (r === "Admin") navigate("/admin");
      else if (r === "Teacher") navigate("/teacher");
      else navigate("/student");
    }
  };

  const inpStyle = {
    width: "100%", padding: "0.65rem 0.875rem",
    background: "var(--bg-elevated)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", color: "var(--text-primary)",
    fontSize: "0.9rem", outline: "none",
    transition: "border-color 0.12s, box-shadow 0.12s",
    fontFamily: "inherit", letterSpacing: "-0.01em", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>

      {/* ── Left brand panel ── */}
      <div style={{
        flex: "0 0 42%", minWidth: 300,
        background: "linear-gradient(135deg, #0a0f1e 0%, #111827 50%, #1a1040 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "3rem 3.5rem", position: "relative", overflow: "hidden",
      }}>
        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 300, height: 300, background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 200, height: 200, background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }}/>

        <div style={{ position: "relative" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={22} color="#fff"/>
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.03em", lineHeight: 1 }}>FYP Management</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Academic System</p>
            </div>
          </div>

          <h1 style={{ color: "#fff", fontSize: "2.25rem", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: "1rem" }}>
            Your Final Year<br/>Project Hub
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: 320 }}>
            Streamline supervision, track milestones, collaborate in real-time, and get AI-powered insights — all in one place.
          </p>
        </div>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { icon: "🤝", label: "Group collaboration & real-time chat" },
            { icon: "🤖", label: "AI-powered progress analysis" },
            { icon: "📊", label: "Visual analytics & performance tracking" },
            { icon: "📅", label: "Milestone & meeting management" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <span style={{ fontSize: "1rem" }}>{icon}</span>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.845rem" }}>{label}</span>
            </div>
          ))}
          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.7rem", marginTop: "1.5rem" }}>© {new Date().getFullYear()} FYP Management System</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg-base)" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", marginBottom: "0.375rem" }}>Welcome back</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Sign in to access your dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-border)", color: "var(--danger)", padding: "0.75rem 1rem", borderRadius: "var(--radius)", fontSize: "0.845rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

            {/* ── Role selector ── */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                Sign in as
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                {ROLES.map(({ label, value, icon: Icon, color }) => {
                  const active = role === value;
                  return (
                    <button key={value} type="button" onClick={() => setRole(value)}
                      style={{
                        padding: "0.65rem 0.5rem",
                        borderRadius: "var(--radius)",
                        border: active ? `2px solid ${color}` : "2px solid var(--border)",
                        background: active ? `${color}12` : "var(--bg-elevated)",
                        color: active ? color : "var(--text-muted)",
                        fontWeight: active ? 700 : 500,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.35rem",
                        transition: "all 0.15s",
                      }}>
                      <Icon size={16}/>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.4rem", letterSpacing: "-0.01em" }}>
                Email address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@university.edu" style={inpStyle}
                onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "var(--bg-surface)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--bg-elevated)"; }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>Forgot password?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter your password"
                  style={{ ...inpStyle, paddingRight: "2.75rem" }}
                  onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.1)"; e.target.style.background = "var(--bg-surface)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; e.target.style.background = "var(--bg-elevated)"; }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex" }}>
                  {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              style={{
                width: "100%", padding: "0.75rem", marginTop: "0.25rem",
                background: isLoading ? "var(--text-faint)" : "linear-gradient(135deg, var(--accent), #7c3aed)",
                color: "#fff", border: "none", borderRadius: "var(--radius)",
                fontSize: "0.9rem", fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "opacity 0.12s, transform 0.12s", fontFamily: "inherit", letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {isLoading ? <><Loader size={16} className="animate-spin"/> Signing in…</> : <><LogIn size={16}/> Sign In</>}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <p style={{ fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.35rem", fontSize: "0.84rem" }}>Don't have an account?</p>
            <p>Students can <Link to="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>register here</Link>. Teachers and Admins are added by the system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
