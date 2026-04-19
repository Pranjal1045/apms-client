import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { Lightbulb, ChevronDown, ChevronUp, Loader, RefreshCw, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

const categoryColor = { Introduction: "var(--accent)", Technical: "var(--accent)", Design: "var(--success)", Testing: "var(--warning)", "Future Work": "var(--danger)", Reflection: "var(--text-muted)", "Project-Specific": "var(--accent)" };

const VivaPage = () => {
  const { project } = useSelector(s => s.student);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState("");
  const [openCats, setOpenCats] = useState({});

  const generateQuestions = async () => {
    if (!project?._id) return toast.error("You need an approved project to generate viva questions");
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/ai/viva-questions/${project._id}`, { reportText });
      setData(res.data);
      const cats = {};
      (res.data.categories || []).forEach(c => { cats[c.category] = true; });
      setOpenCats(cats);
      toast.success(`Generated ${res.data.questions?.length} viva questions!`);
    } catch (e) { toast.error(e.response?.data?.message || "Failed to generate questions"); }
    finally { setLoading(false); }
  };

  const byCategory = {};
  (data?.questions || []).forEach(q => {
    if (!byCategory[q.category]) byCategory[q.category] = [];
    byCategory[q.category].push(q);
  });

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>AI Viva Question Generator</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Generate likely viva/defense questions based on your project. Practice your answers before the big day.</p>
      </div>

      {!project ? (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "1.25rem", color: "var(--text-secondary)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <AlertTriangle size={18} style={{ color: "var(--warning)", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "0.875rem" }}>Submit a project proposal first to use the viva question generator.</p>
        </div>
      ) : (
        <>
          {/* Input card */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.25rem" }}>Project: {project.title}</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem" }}>Questions are generated based on your project title, description, and optional report text.</p>
            <div style={{ marginBottom: "1rem" }}>
              <label className="label">Paste Report Text (optional — improves question quality)</label>
              <textarea className="input" value={reportText} onChange={e => setReportText(e.target.value)}
                placeholder="Paste a section of your project report here for more targeted questions..."
                style={{ minHeight: "100px", resize: "vertical", lineHeight: 1.6 }} maxLength={3000} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", textAlign: "right" }}>{reportText.length}/3000</p>
            </div>
            <button onClick={generateQuestions} disabled={loading} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {loading ? <><Loader size={15} className="animate-spin" /> Generating…</> : <><Lightbulb size={15} /> {data ? "Regenerate Questions" : "Generate Viva Questions"}</>}
            </button>
          </div>

          {/* Tips */}
          {data?.tips && (
            <div style={{ background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--accent)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen size={15} /> Exam Tips
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {data.tips.map((tip, i) => (
                  <p key={i} style={{ fontSize: "0.845rem", color: "var(--text-secondary)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>{i + 1}.</span> {tip}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Questions by category */}
          {Object.keys(byCategory).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                {data.totalQuestions} Questions Generated
              </p>
              {Object.entries(byCategory).map(([cat, questions]) => {
                const color = categoryColor[cat] || "var(--accent)";
                const isOpen = openCats[cat];
                return (
                  <div key={cat} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                    <button onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1.1rem", background: "none", border: "none", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{cat}</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>({questions.length} questions)</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
                    </button>
                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                        {questions.map((q, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.625rem 0.75rem", background: "var(--bg-elevated)", borderRadius: "8px", borderLeft: `3px solid ${color}` }}>
                            <span style={{ color, fontWeight: 700, fontFamily: "inherit", fontSize: "0.82rem", flexShrink: 0 }}>Q{i + 1}.</span>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{q.question}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VivaPage;
