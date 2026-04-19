import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createGroup, joinGroup, fetchMyGroup, leaveGroup,
  removeMember, regenerateInviteCode
} from "../../store/slices/groupSlice";
import { Users, Copy, RefreshCw, LogOut, UserMinus, Plus, Hash, Shield, Loader } from "lucide-react";
import { toast } from "react-toastify";

const GroupPage = () => {
  const dispatch = useDispatch();
  const { myGroup, isLoading, isCreating, isJoining } = useSelector(s => s.group);
  const { authUser } = useSelector(s => s.auth);
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);

  useEffect(() => { dispatch(fetchMyGroup()); }, [dispatch]);

  const isLeader = myGroup?.groupLeader?._id === authUser?._id ||
                   myGroup?.groupLeader?.toString() === authUser?._id;

  const copyCode = () => {
    navigator.clipboard.writeText(myGroup?.inviteCode || "");
    toast.success("Invite code copied!");
  };

  const handleCreate = () => {
    if (!groupName.trim()) return toast.error("Group name is required");
    dispatch(createGroup({ name: groupName, maxMembers }));
    setMode(null);
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return toast.error("Invite code is required");
    dispatch(joinGroup({ inviteCode }));
    setMode(null);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    );
  }

  // ── No group yet ─────────────────────────────────────────
  if (!myGroup) {
    return (
      <div className="fade-in" style={{ maxWidth: "560px", margin: "0 auto", padding: "1rem 0" }}>
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>Group Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.35rem" }}>Create a new group or join an existing one with an invite code.</p>
        </div>

        {/* Info card */}
        <div className="card" style={{ marginBottom: "1.5rem", borderLeft: "2px solid var(--accent)" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <Users size={20} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.35rem", fontFamily: "inherit" }}>About Groups</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                College projects are done in groups of up to 4 students. The group leader creates the group, shares the invite code with teammates, and then submits the project proposal on behalf of the group.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <button onClick={() => setMode("create")} className="card"
              style={{ textAlign: "center", cursor: "pointer", padding: "2rem 1rem", border: "1px solid rgba(0,212,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(0,212,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"; e.currentTarget.style.background = "var(--bg-card)"; }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={22} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "inherit", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Create Group</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Start a new group as leader</p>
              </div>
            </button>

            <button onClick={() => setMode("join")} className="card"
              style={{ textAlign: "center", cursor: "pointer", padding: "2rem 1rem", border: "1px solid rgba(124,92,252,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "rgba(124,92,252,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,92,252,0.2)"; e.currentTarget.style.background = "var(--bg-card)"; }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(124,92,252,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Hash size={22} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p style={{ fontFamily: "inherit", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Join Group</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Enter an invite code</p>
              </div>
            </button>
          </div>
        )}

        {/* Create form */}
        {mode === "create" && (
          <div className="card fade-in" style={{ border: "1px solid rgba(0,212,255,0.2)" }}>
            <h3 style={{ fontFamily: "inherit", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Create New Group</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Group Name</label>
                <input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Alpha Squad" />
              </div>
              <div>
                <label className="label">Max Members</label>
                <select className="input" value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))}
                  style={{ background: "var(--bg-elevated)" }}>
                  {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} members</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                <button onClick={handleCreate} disabled={isCreating} className="btn-primary" style={{ flex: 1, padding: "0.65rem" }}>
                  {isCreating ? <Loader size={16} className="animate-spin" /> : "Create Group"}
                </button>
                <button onClick={() => setMode(null)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Join form */}
        {mode === "join" && (
          <div className="card fade-in" style={{ border: "1px solid rgba(124,92,252,0.2)" }}>
            <h3 style={{ fontFamily: "inherit", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>Join a Group</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Invite Code</label>
                <input className="input" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2" style={{ fontFamily: "monospace", letterSpacing: "0.1em", fontSize: "1.1rem" }} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={handleJoin} disabled={isJoining} className="btn-primary"
                  style={{ flex: 1, padding: "0.65rem", background: "linear-gradient(135deg, var(--accent), #7c3aed)" }}>
                  {isJoining ? <Loader size={16} className="animate-spin" /> : "Join Group"}
                </button>
                <button onClick={() => setMode(null)} className="btn-outline">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Group details ──────────────────────────────────────────
  const memberCount = myGroup.members?.length || 0;
  const maxCount = myGroup.maxMembers || 4;
  const pct = Math.round((memberCount / maxCount) * 100);

  return (
    <div className="fade-in" style={{ maxWidth: "640px", margin: "0 auto", padding: "1rem 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)" }}>{myGroup.name}</h1>
            <span className={`badge badge-${myGroup.status}`}>{myGroup.status}</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {isLeader ? "You are the group leader" : `Led by ${myGroup.groupLeader?.name}`}
          </p>
        </div>
        {isLeader && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "rgba(0,229,160,0.1)", color: "var(--success)", border: "1px solid rgba(0,229,160,0.25)", borderRadius: "8px", padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit" }}>
            <Shield size={13} /> Leader
          </span>
        )}
      </div>

      {/* Invite code card */}
      {isLeader && myGroup.status === "forming" && (
        <div className="card" style={{ marginBottom: "1.25rem", border: "1px solid rgba(0,212,255,0.2)" }}>
          <p className="label" style={{ marginBottom: "0.75rem" }}>Invite Code — Share with teammates</p>
          <div className="invite-code">{myGroup.inviteCode}</div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button onClick={copyCode} className="btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Copy size={14} /> Copy Code
            </button>
            <button onClick={() => dispatch(regenerateInviteCode())} className="btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RefreshCw size={14} /> New Code
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "inherit", fontWeight: 700, color: "var(--text-primary)" }}>
            Members <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.875rem" }}>({memberCount}/{maxCount})</span>
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>{maxCount - memberCount} slot{maxCount - memberCount !== 1 ? "s" : ""} remaining</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {myGroup.members?.map((m, i) => {
            const isThisLeader = m._id === myGroup.groupLeader?._id || m._id === myGroup.groupLeader?.toString();
            const isMe = m._id === authUser?._id;
            return (
              <div key={m._id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.65rem 0.875rem", border: isMe ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${["var(--accent)","var(--accent)","var(--success)","var(--warning)"][i % 4]}, #1e2230)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {m.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {m.name} {isMe && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>(you)</span>}
                      {isThisLeader && <Shield size={11} style={{ color: "var(--success)" }} />}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{m.rollNumber || m.email}</p>
                  </div>
                </div>
                {isLeader && !isThisLeader && (
                  <button onClick={() => dispatch(removeMember(m._id))} className="btn-danger btn-small"
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                    <UserMinus size={12} /> Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave group */}
      {!isLeader && (
        <button onClick={() => dispatch(leaveGroup())} className="btn-danger"
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <LogOut size={15} /> Leave Group
        </button>
      )}
    </div>
  );
};

export default GroupPage;
