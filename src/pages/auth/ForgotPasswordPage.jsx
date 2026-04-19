import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { BookOpen, Loader, CheckCircle, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../../store/slices/authSlice";

const ForgotPasswordPage = () => {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]        = useState("");
  const { isRequestingForToken } = useSelector(s => s.auth);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Invalid email address"); return; }
    setError("");
    try {
      await dispatch(forgotPassword({ email })).unwrap();
      setSubmitted(true);
    } catch (err) { setError(err || "Failed to send reset link. Please try again."); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "380px" }} className="fade-in">
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", background: submitted ? "var(--success)" : "var(--accent)", borderRadius: "12px", marginBottom: "0.875rem" }}>
            {submitted ? <CheckCircle size={24} color="#fff" /> : <BookOpen size={24} color="#fff" />}
          </div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{submitted ? "Check Your Email" : "Forgot Password?"}</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{submitted ? `Reset link sent to ${email}` : "Enter your email to receive a reset link."}</p>
        </div>
        <div className="card" style={{ padding: "1.75rem" }}>
          {submitted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <Link to="/login" className="btn-primary" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>Back to Login</Link>
              <button onClick={() => { setSubmitted(false); setEmail(""); }} className="btn-outline" style={{ width: "100%" }}>Send Another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {error && <div className="alert-danger">{error}</div>}
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} className={`input ${error ? "input-error" : ""}`} placeholder="you@university.edu" disabled={isRequestingForToken} />
              </div>
              <button type="submit" disabled={isRequestingForToken} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {isRequestingForToken ? <><Loader size={15} className="animate-spin" /> Sending…</> : "Send Reset Link"}
              </button>
            </form>
          )}
          <div style={{ textAlign: "center", marginTop: "1.1rem" }}>
            <Link to="/login" style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
