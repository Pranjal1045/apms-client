import { useEffect, useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { Award, Save, Loader, CheckCircle2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ScoreSlider = ({ label, name, value, onChange, max = 25 }) => (
  <div style={{ marginBottom: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
      <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</label>
      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)", minWidth: 40, textAlign: "right" }}>{value}/{max}</span>
    </div>
    <input type="range" min={0} max={max} value={value}
      onChange={e => onChange(name, Number(e.target.value))}
      style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer", height: 6 }} />
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>0</span>
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{max}</span>
    </div>
  </div>
);

const gradeColor = {
  "A+": "var(--success)", A: "var(--success)", "B+": "var(--accent)", B: "var(--accent)",
  "C+": "var(--warning)", C: "var(--warning)", D: "var(--danger)", F: "var(--danger)"
};

const computeGrade = (t) =>
  t >= 90 ? "A+" : t >= 80 ? "A" : t >= 70 ? "B+" : t >= 60 ? "B" :
  t >= 50 ? "C+" : t >= 40 ? "C" : t >= 33 ? "D" : "F";

const defaultScores = () => ({ proposalQuality: 0, progressAndEffort: 0, reportQuality: 0, technicalSkill: 0 });

const EvaluationManagePage = () => {
  const { authUser } = useSelector(s => s.auth);
  const [projects,    setProjects]    = useState([]);  // list of supervised projects (with members)
  const [selected,    setSelected]    = useState(null); // selected project
  const [evaluation,  setEvaluation]  = useState(null);
  const [overallScores, setOverallScores] = useState(defaultScores());
  const [memberScores,  setMemberScores]  = useState({}); // studentId -> scores obj
  const [remarks,     setRemarks]     = useState("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [usePerMember, setUsePerMember] = useState(false);

  useEffect(() => {
    axiosInstance.get("/teacher/assigned-students")
      .then(async res => {
        const students = res.data.data.students || [];
        // Group by project
        const projectMap = new Map();
        for (const s of students) {
          const pId = s.project?._id || s.project;
          if (!pId) continue;
          if (!projectMap.has(String(pId))) {
            projectMap.set(String(pId), {
              _id: pId,
              title: s.project?.title || "Untitled Project",
              status: s.project?.status,
              members: [],
            });
          }
          projectMap.get(String(pId)).members.push(s);
        }
        setProjects(Array.from(projectMap.values()));
      })
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const selectProject = async (proj) => {
    setSelected(proj);
    setExpandedMember(null);
    const projectId = proj._id;
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(`/evaluation/${projectId}`);
      const ev = res.data.data.evaluation;
      if (ev) {
        setOverallScores({
          proposalQuality: ev.scores.proposalQuality,
          progressAndEffort: ev.scores.progressAndEffort,
          reportQuality: ev.scores.reportQuality,
          technicalSkill: ev.scores.technicalSkill,
        });
        setRemarks(ev.remarks || "");
        setEvaluation(ev);
        // Load per-member scores if they exist
        if (ev.memberEvaluations?.length > 0) {
          const ms = {};
          ev.memberEvaluations.forEach(me => {
            ms[me.student?._id || me.student] = { ...me.scores };
          });
          setMemberScores(ms);
          setUsePerMember(true);
        } else {
          setMemberScores({});
          setUsePerMember(false);
        }
      } else {
        setOverallScores(defaultScores());
        setMemberScores({});
        setRemarks("");
        setEvaluation(null);
        setUsePerMember(false);
      }
    } catch { setEvaluation(null); }
  };

  const handleOverallChange = (name, val) => setOverallScores(p => ({ ...p, [name]: val }));

  const handleMemberChange = (studentId, name, val) => {
    setMemberScores(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || defaultScores()), [name]: val },
    }));
  };

  const getMemberScores = (studentId) => memberScores[studentId] || defaultScores();
  const getMemberTotal  = (studentId) => Object.values(getMemberScores(studentId)).reduce((a, b) => a + b, 0);

  const overallTotal = Object.values(overallScores).reduce((a, b) => a + b, 0);
  const overallGrade = computeGrade(overallTotal);

  const save = async (finalize = false) => {
    const projectId = selected?._id;
    if (!projectId) return toast.error("No project selected");
    setSaving(true);
    try {
      // Build member evaluations array
      let memberEvaluations = [];
      if (usePerMember && selected.members?.length > 0) {
        memberEvaluations = selected.members.map(m => ({
          student: m._id,
          scores: getMemberScores(m._id),
        }));
      }

      await axiosInstance.put(`/evaluation/${projectId}`, {
        scores: overallScores,
        memberEvaluations,
        remarks,
        isFinalized: finalize,
      });
      toast.success(finalize ? "Evaluation finalized — all group members notified!" : "Draft saved successfully");
      if (finalize) setEvaluation(p => ({ ...(p || {}), isFinalized: true }));
    } catch (e) { toast.error(e.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <Loader size={28} style={{ color: "var(--accent)" }} className="animate-spin" />
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: "960px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Project Evaluation</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Grade projects with overall scores and individual member evaluations for group projects.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem" }}>
        {/* Project list */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)", padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award size={14} style={{ color: "var(--accent)" }}/> Projects
          </p>
          {!projects.length ? (
            <p style={{ padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No projects yet.</p>
          ) : (
            projects.map(proj => {
              const isSelected = selected?._id?.toString() === proj._id?.toString();
              return (
                <button key={proj._id} onClick={() => selectProject(proj)}
                  style={{ width: "100%", padding: "0.875rem 1rem", background: isSelected ? "rgba(37,99,235,0.06)" : "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent", transition: "all 0.15s" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: isSelected ? "var(--accent)" : "var(--text-primary)" }}>{proj.title}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Users size={11}/> {proj.members?.length || 0} member{proj.members?.length !== 1 ? "s" : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Evaluation panel */}
        {!selected ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem", color: "var(--text-muted)", flexDirection: "column", gap: "0.75rem" }}>
            <Award size={40} style={{ opacity: 0.2 }}/>
            <p>Select a project to begin evaluation</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Finalized banner */}
            {evaluation?.isFinalized && (
              <div style={{ background: "var(--success-light)", border: "1px solid var(--success-border)", borderRadius: 8, padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontSize: "0.875rem", fontWeight: 600 }}>
                <CheckCircle2 size={16}/> This evaluation is finalized.
              </div>
            )}

            {/* Overall score card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>Overall Project Score</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.6rem", fontWeight: 900, color: gradeColor[overallGrade] || "var(--accent)" }}>{overallGrade}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{overallTotal}/100</span>
                </div>
              </div>
              <ScoreSlider label="Proposal Quality" name="proposalQuality" value={overallScores.proposalQuality} onChange={handleOverallChange}/>
              <ScoreSlider label="Progress & Effort" name="progressAndEffort" value={overallScores.progressAndEffort} onChange={handleOverallChange}/>
              <ScoreSlider label="Report Quality" name="reportQuality" value={overallScores.reportQuality} onChange={handleOverallChange}/>
              <ScoreSlider label="Technical Skill" name="technicalSkill" value={overallScores.technicalSkill} onChange={handleOverallChange}/>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "0.4rem" }}>Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} maxLength={1000}
                  placeholder="Add evaluation remarks…"
                  style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "0.625rem 0.875rem", color: "var(--text-primary)", fontSize: "0.875rem", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }}/>
              </div>
            </div>

            {/* Per-member evaluation (group projects) */}
            {selected.members?.length > 1 && (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: usePerMember ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Users size={15} style={{ color: "var(--accent)" }}/> Individual Member Scores
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Optionally give each member a separate score</p>
                  </div>
                  <button onClick={() => setUsePerMember(!usePerMember)}
                    style={{ padding: "0.4rem 0.875rem", background: usePerMember ? "var(--accent)" : "var(--bg-elevated)", color: usePerMember ? "#fff" : "var(--text-secondary)", border: `1px solid ${usePerMember ? "var(--accent)" : "var(--border)"}`, borderRadius: 6, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                    {usePerMember ? "Enabled" : "Enable"}
                  </button>
                </div>

                {usePerMember && selected.members.map((member, idx) => {
                  const isExpanded = expandedMember === member._id;
                  const mTotal = getMemberTotal(member._id);
                  const mGrade = computeGrade(mTotal);
                  return (
                    <div key={member._id} style={{ borderBottom: idx < selected.members.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <button onClick={() => setExpandedMember(isExpanded ? null : member._id)}
                        style={{ width: "100%", padding: "0.875rem 1.25rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.875rem", textAlign: "left" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, hsl(${idx * 47 + 220},80%,50%), hsl(${idx * 47 + 260},80%,50%))`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "0.9rem", flexShrink: 0 }}>
                          {(member.name || "?")[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem" }}>{member.name}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{member.email}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{ fontWeight: 800, color: gradeColor[mGrade] || "var(--accent)", fontSize: "1.1rem" }}>{mGrade}</span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{mTotal}/100</span>
                          {isExpanded ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }}/> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }}/>}
                        </div>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: "0 1.25rem 1.25rem" }}>
                          <ScoreSlider label="Proposal Quality"   name="proposalQuality"   value={getMemberScores(member._id).proposalQuality}   onChange={(n, v) => handleMemberChange(member._id, n, v)}/>
                          <ScoreSlider label="Progress & Effort"  name="progressAndEffort" value={getMemberScores(member._id).progressAndEffort}  onChange={(n, v) => handleMemberChange(member._id, n, v)}/>
                          <ScoreSlider label="Report Quality"     name="reportQuality"     value={getMemberScores(member._id).reportQuality}     onChange={(n, v) => handleMemberChange(member._id, n, v)}/>
                          <ScoreSlider label="Technical Skill"    name="technicalSkill"    value={getMemberScores(member._id).technicalSkill}    onChange={(n, v) => handleMemberChange(member._id, n, v)}/>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action buttons */}
            {!evaluation?.isFinalized && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => save(false)} disabled={saving}
                  style={{ flex: 1, padding: "0.75rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {saving ? <Loader size={15} className="animate-spin"/> : <Save size={15}/>} Save Draft
                </button>
                <button onClick={() => save(true)} disabled={saving}
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.75rem", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {saving ? <Loader size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>} Finalize & Notify All Members
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationManagePage;
