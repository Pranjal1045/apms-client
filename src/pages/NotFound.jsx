import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const NotFound = () => (
  <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
    <div style={{ textAlign: "center" }} className="fade-in">
      <p style={{ fontSize: "6rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1, marginBottom: "0.5rem", opacity: 0.15 }}>404</p>
      <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.75rem" }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
        <BookOpen size={15} /> Go to Dashboard
      </Link>
    </div>
  </div>
);
export default NotFound;
