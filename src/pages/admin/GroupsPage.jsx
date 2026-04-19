import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllGroups } from "../../store/slices/groupSlice";
import { UsersRound, Search, Shield, ChevronDown, ChevronUp } from "lucide-react";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const GroupsPage = () => {
  const dispatch = useDispatch();
  const { allGroups, isLoading } = useSelector(s => s.group);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { dispatch(fetchAllGroups()); }, [dispatch]);

  const filtered = (allGroups || []).filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.groupLeader?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { forming: "var(--warning)", active: "var(--success)", completed: "var(--accent)" };

  return (
    <div className="fade-in" style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Student Groups</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{allGroups?.length || 0} groups registered</p>
        </div>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…" style={{ paddingLeft: "2.25rem", width: "240px" }} />
        </div>
      </div>

      {!filtered.length ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text-muted)" }}>
          <UsersRound size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
          <p>No groups found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((g, i) => {
            const isOpen = expanded === g._id;
            return (
              <div key={g._id || i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                {/* Header row */}
                <button onClick={() => setExpanded(isOpen ? null : g._id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: `${statusColor[g.status]}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <UsersRound size={18} style={{ color: statusColor[g.status] || "var(--text-muted)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem", marginBottom: "0.1rem" }}>{g.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Led by {g.groupLeader?.name || "—"} · {g.members?.length || 0}/{g.maxMembers || 4} members · Created {fmt(g.createdAt)}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.55rem", borderRadius: "4px", background: `${statusColor[g.status]}18`, color: statusColor[g.status], fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {g.status}
                  </span>
                  {g.project && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      Has project
                    </span>
                  )}
                  {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "1rem 1.25rem", background: "var(--bg-elevated)" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Members</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {g.members?.map((m, mi) => {
                        const isLeader = m._id === g.groupLeader?._id || m._id === g.groupLeader?.toString();
                        return (
                          <div key={m._id || mi} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS[mi % 5]}, #1e2230)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                              {m.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <p style={{ fontSize: "0.845rem", color: "var(--text-secondary)" }}>{m.name}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.rollNumber || m.email}</p>
                            {isLeader && <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.68rem", color: "var(--success)", fontFamily: "inherit", fontWeight: 600 }}><Shield size={10} /> Leader</span>}
                          </div>
                        );
                      })}
                    </div>
                    {g.project && (
                      <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" }}>Linked Project</p>
                        <p style={{ fontSize: "0.845rem", color: "var(--accent)" }}>{g.project.title || "Untitled"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const COLORS = ["var(--accent)", "var(--accent)", "var(--success)", "var(--warning)", "var(--danger)"];

export default GroupsPage;
