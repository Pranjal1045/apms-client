// FILE: client/src/components/AI/SmartReportGrader.jsx
//
// recharts is already in your package.json — no install needed.
//
// ADD TO AIDashboard.jsx:
//   import SmartReportGrader from "./SmartReportGrader";
//   Add tab entry:  { id:"grader", label:"Report Grader", roles:["Student","Teacher","Admin"], ... }
//   Render:  {activeTab === "grader" && <SmartReportGrader projectId={projectId} />}

import { useState, useEffect, useRef } from "react";
import { axiosInstance } from "../../lib/axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  RadialBarChart, RadialBar,
} from "recharts";
import { useSelector } from "react-redux";


// ── Constants ─────────────────────────────────────────────────────────────────
const GRADE_CFG = {
  A: { hex: "#16a34a", bg: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)", text: "#4ade80",  pill: "badge-approved"  },
  B: { hex: "#2563eb", bg: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", text: "#60a5fa",   pill: "badge-completed"    },
  C: { hex: "#d97706", bg: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.3)", text: "#fbbf24",  pill: "bg-amber-100 text-amber-800"  },
  D: { hex: "#ea580c", bg: "rgba(234,88,12,0.12)", border: "1px solid rgba(234,88,12,0.3)", text: "#fb923c", pill: "badge-pending"},
  F: { hex: "#dc2626", bg: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", text: "#f87171",    pill: "badge-rejected"      },
};

const CRITERIA = [
  { key: "academicVocabulary", label: "Academic Vocabulary", max: 25, hex: "#6366f1" },
  { key: "documentStructure",  label: "Document Structure",  max: 20, hex: "#0ea5e9" },
  { key: "coherenceFlow",      label: "Coherence & Flow",    max: 20, hex: "#10b981" },
  { key: "contentDepth",       label: "Content Depth",       max: 20, hex: "var(--warning)" },
  { key: "readability",        label: "Readability",         max: 15, hex: "#ec4899" },
];

const LEVEL_PILL = {
  "Excellent":    "badge-approved",
  "Good":         "badge-completed",
  "Satisfactory": "bg-amber-100 text-amber-800",
  "Needs Work":   "badge-rejected",
};

// ── Animated SVG ring ─────────────────────────────────────────────────────────
function Ring({ score, max, hex, size = 76 }) {
  const r = (size - 12) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const [d, setD] = useState(0);
  useEffect(() => { const t = setTimeout(() => setD(score / max), 150); return () => clearTimeout(t); }, [score, max]);
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={8}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - d)}
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dashoffset 1s ease" }}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={hex}>{score}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9"  fontWeight="500" fill="#94a3b8">/{max}</text>
    </svg>
  );
}

// ── Big grade ring hero ───────────────────────────────────────────────────────
function GradeRing({ grade, pct, hex }) {
  const r = 58, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  const [d, setD] = useState(0);
  useEffect(() => { const t = setTimeout(() => setD(pct / 100), 250); return () => clearTimeout(t); }, [pct]);
  return (
    <svg width={140} height={140}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={hex} strokeWidth={10}
        strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ * (1 - d)}
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }}
      />
      <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="36" fontWeight="900" fill={hex}>{grade}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="15" fontWeight="700" fill={hex}>{pct}%</text>
    </svg>
  );
}

// ── Custom tooltips ───────────────────────────────────────────────────────────
const RadarTip = ({ active, payload }) =>
  active && payload?.length
    ? <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
        <p className="font-semibold text-secondary">{payload[0]?.payload?.subject}</p>
        <p className="font-bold" style={{ color: "#6366f1" }}>{payload[0]?.value}%</p>
      </div>
    : null;

const BarTip = ({ active, payload, label }) =>
  active && payload?.length
    ? <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
        <p className="font-semibold text-secondary">{label} words/sentence</p>
        <p className="font-bold text-indigo-600">{payload[0]?.value} sentence(s)</p>
      </div>
    : null;

// ── Main export ───────────────────────────────────────────────────────────────
export default function SmartReportGrader({ projectId }) {
  const { project } = useSelector((s) => s.student);
  const [mode,    setMode]    = useState("upload");
  const [text,    setText]    = useState("");
  const [file,    setFile]    = useState(null);
  const [dragOver,setDragOver]= useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState("overview");
  const fileInputRef = useRef();

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const textReady = chars >= 100;
  const fileReady = !!file;
  const ready = mode === "upload" ? fileReady : textReady;

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf","docx","txt"].includes(ext)) { setError("Only PDF, DOCX, or TXT files are supported."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File size must be under 10 MB."); return; }
    setFile(f); setError(null); setResult(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const run = async () => {
    if (!ready) return;
    setLoading(true); setError(null); setResult(null); setTab("overview");
    try {
      let data;
      if (mode === "upload" && file) {
        const fd = new FormData();
        fd.append("reportFile", file);
        fd.append("projectId", projectId || project?._id || "");
        const res = await axiosInstance.post("/ai/grade-report", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        data = res.data;
      } else {
        const res = await axiosInstance.post("/ai/grade-report", {
          text: text.trim(),
          projectId: projectId || project?._id || null,
        });
        data = res.data;
      }
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.message || "Grading failed. Please try again or contact support.");
    } finally { setLoading(false); }
  };

  const gc  = result ? (GRADE_CFG[result.grade] || GRADE_CFG.C) : null;

  // radial bar data — normalised to 100
  const radialData = result
    ? CRITERIA.map((c) => ({
        name:  c.label,
        short: c.label.split(" ")[0],
        value: Math.round((result.criteria[c.key]?.score / c.max) * 100),
        raw:   result.criteria[c.key]?.score,
        max:   c.max,
        fill:  c.hex,
      }))
    : [];

  return (
    <div className="space-y-5">

      {/* ─ Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-primary">Smart Report Grader</h2>
          <p className="text-xs text-muted mt-0.5">
            Pure Python · Vocab + Structure + Coherence + Depth + Readability · No external API
          </p>
        </div>
      </div>

      {/* ─ Mode toggle ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 rounded-xl p-1" style={{ background: "var(--bg-elevated)" }}>
        {[
          { id:"upload", icon:"📎", label:"Upload File", sub:"PDF, DOCX, TXT" },
          { id:"paste",  icon:"📋", label:"Paste Text",  sub:"Type or paste"  },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setError(null); setResult(null); }}
            style={{
              flex: 1, padding: "0.5rem 0.75rem", borderRadius: 8, border: "none", cursor: "pointer",
              transition: "all 0.15s",
              background: mode===m.id ? "#6366f1" : "transparent",
              color: mode===m.id ? "#fff" : "var(--text-secondary)",
              fontWeight: 600, fontSize: "0.82rem"
            }}>
            {m.icon} {m.label}
            <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 400, opacity: 0.75, marginTop: 2 }}>{m.sub}</span>
          </button>
        ))}
      </div>

      {/* ─ Input ──────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {mode === "upload" ? (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
              className="hidden" onChange={e => handleFile(e.target.files[0])} />
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? "#6366f1" : file ? "#10b981" : "var(--border)",
                background: dragOver ? "rgba(99,102,241,0.05)" : file ? "rgba(16,185,129,0.05)" : "var(--bg-elevated)",
              }}>
              {file ? (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-sm font-bold text-primary">{file.name}</p>
                  <p className="text-xs text-muted mt-1">{(file.size/1024).toFixed(1)} KB · Click to change</p>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                    style={{ marginTop:"0.75rem", fontSize:"0.75rem", color:"#ef4444", background:"none", border:"1px solid #ef4444", borderRadius:6, padding:"0.2rem 0.6rem", cursor:"pointer" }}>
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-3">📂</div>
                  <p className="text-sm font-bold text-primary">
                    {dragOver ? "Drop your report here" : "Click or drag & drop your report"}
                  </p>
                  <p className="text-xs text-muted mt-2">Supports PDF, DOCX, TXT · Max 10 MB</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-secondary uppercase tracking-wide">Paste your report text</label>
              <span className="text-xs text-faint">{words} words · {chars} chars</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(null); setError(null); }}
              placeholder="Paste your FYP report chapter, abstract, or any section here. The AI will grade it across 5 academic dimensions and produce detailed charts…"
              rows={7}
              className="input"
              style={{ resize: "vertical", lineHeight: 1.6 }}
            />
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-faint">Minimum 100 characters required</span>
                <span className={textReady ? "text-green-600 font-semibold" : "text-amber-600 font-medium"}>
                  {textReady ? "✓ Ready to grade" : `${100 - chars} more chars needed`}
                </span>
              </div>
              <div style={{ width: "100%", background: "var(--border)", borderRadius: 999, height: 6 }}>
                <div
                  style={{ height: 6, borderRadius: 999, transition: "all 0.3s", width: `${Math.min(100, (chars / 100) * 100)}%`, background: textReady ? "#10b981" : "#f59e0b" }}
                />
              </div>
            </div>
          </>
        )}

        <button
          onClick={run}
          disabled={loading || !ready}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", padding:"0.75rem 1.25rem", background: loading||!ready ? "var(--border)" : "#6366f1", color:loading||!ready?"var(--text-muted)":"#fff", borderRadius:12, border:"none", fontWeight:700, fontSize:"0.875rem", cursor:loading||!ready?"not-allowed":"pointer" }}
        >
          {loading
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Grading your report…</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>Grade My Report</>}
        </button>
      </div>

      {/* ─ Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="alert-danger" style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-700">Grading failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ─ Results ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-5">

          {/* ── Hero grade card ──────────────────────────────────────────── */}
          <div style={{ borderRadius:16, border: gc.border, padding:"1.5rem", background: gc.bg }}>
            <div className="flex flex-col sm:flex-row items-center gap-6">

              <GradeRing grade={result.grade} pct={result.percentage} hex={gc.hex} />

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                  <span style={{ fontSize:"1.5rem", fontWeight:900, color: gc.text }}>{result.gradeLabel}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${gc.pill}`}>
                    Grade {result.grade}
                  </span>
                </div>
                <p className="text-sm text-muted mb-4">
                  {result.totalScore}/100 points
                  {result.projectTitle && <> · <span className="font-medium text-secondary">{result.projectTitle}</span></>}
                </p>

                {/* 5 mini score pills */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {CRITERIA.map((c) => {
                    const s = result.criteria[c.key];
                    return (
                      <div key={c.key}
                        style={{ display:"flex", alignItems:"center", gap:6, border:"1px solid var(--border)", borderRadius:999, padding:"0.2rem 0.625rem", fontSize:"0.75rem", fontWeight:600, color:"var(--text-secondary)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: c.hex }} />
                        {c.label.split(" ")[0]}: {s?.score}/{c.max}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ border:"1px solid var(--border)", borderRadius:12, padding:"0.75rem 1rem", textAlign:"center", fontSize:"0.75rem", flexShrink:0 }}>
                <p style={{ color:"var(--text-muted)", marginBottom:2 }}>Algorithm</p>
                <p style={{ fontWeight:700, color:"var(--text-secondary)" }}>Pure Python NLP</p>
                <p style={{ color:"var(--text-muted)", marginTop:2 }}>No external API</p>
              </div>
            </div>
          </div>

          {/* ── Sub-tab bar ──────────────────────────────────────────────── */}
          <div style={{ display:"flex", gap:"0.25rem", background:"var(--bg-elevated)", borderRadius:12, padding:"0.25rem" }}>
            {[
              { id: "overview",  label: "Charts overview"   },
              { id: "criteria",  label: "Criteria breakdown" },
              { id: "sentences", label: "Sentence analysis"  },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  flex: 1, padding: "0.5rem", fontSize: "0.75rem", fontWeight: 600, borderRadius: 8,
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: tab === t.id ? "var(--bg-card)" : "transparent",
                  color: tab === t.id ? "#6366f1" : "var(--text-muted)"
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── TAB: Charts overview ─────────────────────────────────────── */}
          {tab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Radar chart */}
                <div className="card" style={{ padding:"1.25rem" }}>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Performance radar</p>
                  <p className="text-xs text-faint mb-4">All 5 dimensions normalised to 100%</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={result.radarData} margin={{ top: 8, right: 30, bottom: 8, left: 30 }}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 600, fill: "#64748b" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} tickCount={4} />
                      <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2}
                        dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
                      <RechartTooltip content={<RadarTip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radial bar chart */}
                <div className="card" style={{ padding:"1.25rem" }}>
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Score breakdown</p>
                  <p className="text-xs text-faint mb-4">Each bar = % of that criterion's max score</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart innerRadius={20} outerRadius={95}
                      data={radialData} startAngle={180} endAngle={-180} barSize={13}>
                      <RadialBar dataKey="value" background={{ fill: "#f8fafc" }} cornerRadius={5} label={false} />
                      <RechartTooltip
                        content={({ active, payload }) =>
                          active && payload?.length
                            ? <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
                                <p className="font-semibold text-secondary">{payload[0]?.payload?.name}</p>
                                <p className="font-bold" style={{ color: payload[0]?.payload?.fill }}>
                                  {payload[0]?.payload?.raw}/{payload[0]?.payload?.max} ({payload[0]?.value}%)
                                </p>
                              </div>
                            : null
                        }
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
                    {radialData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                        <span className="text-xs text-muted">{d.short}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths + Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div style={{ borderRadius:16, border:"1px solid rgba(16,185,129,0.3)", padding:"1.25rem", background:"rgba(16,185,129,0.07)" }}>
                  <p style={{ fontSize:"0.72rem", fontWeight:700, color:"#4ade80", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.75rem" }}>✓ Strengths</p>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} style={{ display:"flex", gap:8, fontSize:"0.875rem", color:"var(--text-secondary)" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", marginTop:6, flexShrink:0, display:"inline-block" }} />{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ borderRadius:16, border:"1px solid rgba(217,119,6,0.3)", padding:"1.25rem", background:"rgba(217,119,6,0.07)" }}>
                  <p style={{ fontSize:"0.72rem", fontWeight:700, color:"#fbbf24", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.75rem" }}>↑ Improvements needed</p>
                  <ul className="space-y-2">
                    {result.improvements.map((s, i) => (
                      <li key={i} style={{ display:"flex", gap:8, fontSize:"0.875rem", color:"var(--text-secondary)" }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", marginTop:6, flexShrink:0, display:"inline-block" }} />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Criteria breakdown ───────────────────────────────────── */}
          {tab === "criteria" && (
            <div className="space-y-3">
              {CRITERIA.map((c) => {
                const cr  = result.criteria[c.key];
                const pct = Math.round((cr?.score / c.max) * 100);
                const lp  = LEVEL_PILL[cr?.level] || LEVEL_PILL["Satisfactory"];
                return (
                  <div key={c.key} className="card" style={{ padding:"1.25rem" }}>
                    <div className="flex gap-4 items-start">
                      <Ring score={cr?.score ?? 0} max={c.max} hex={c.hex} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="text-sm font-bold text-primary">{c.label}</h3>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${lp}`}>{cr?.level}</span>
                        </div>
                        <div style={{ width:"100%", background:"var(--border)", borderRadius:999, height:8, marginBottom:8 }}>
                          <div className="h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%`, background: c.hex }} />
                        </div>
                        <p className="text-xs text-muted leading-relaxed mb-3">{cr?.comment}</p>

                        {/* Criterion-specific stats */}
                        <div className="flex flex-wrap gap-2">
                          {c.key === "academicVocabulary" && <>
                            <Chip label="Density"      val={`${cr?.density}%`}      hex={c.hex} />
                            <Chip label="Unique terms" val={cr?.uniqueTerms}        hex={c.hex} />
                            <Chip label="Total words"  val={cr?.totalWords}         hex={c.hex} />
                          </>}
                          {c.key === "documentStructure" && <>
                            <Chip label="Sections"     val={cr?.sectionCount}       hex={c.hex} />
                            {cr?.sectionsFound?.slice(0,5).map((s) => <Chip key={s} label={s} val="" hex={c.hex} />)}
                          </>}
                          {c.key === "coherenceFlow" && <>
                            <Chip label="Transitions"  val={cr?.transitionCount}    hex={c.hex} />
                            <Chip label="Density"      val={`${cr?.density}%`}      hex={c.hex} />
                          </>}
                          {c.key === "contentDepth" && <>
                            <Chip label="Words"        val={cr?.wordCount}          hex={c.hex} />
                            <Chip label="Concepts"     val={cr?.uniqueConcepts}     hex={c.hex} />
                            <Chip label="TTR"          val={cr?.typeTokenRatio}     hex={c.hex} />
                          </>}
                          {c.key === "readability" && <>
                            <Chip label="Flesch"       val={cr?.fleschReadingEase}  hex={c.hex} />
                            <Chip label="Grade level"  val={cr?.fleschKincaidGrade} hex={c.hex} />
                            <Chip label="Avg sent."    val={`${cr?.avgSentenceLength}w`} hex={c.hex} />
                          </>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── TAB: Sentence analysis ────────────────────────────────────── */}
          {tab === "sentences" && result.sentenceStats && (
            <div className="space-y-4">
              {/* 3 stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total sentences", val: result.sentenceStats.totalSentences, color: "text-indigo-600" },
                  { label: "Avg length",       val: `${result.sentenceStats.avgLength}w`, color: "text-sky-600"   },
                  { label: "Very long (36+)",  val: result.sentenceStats.longCount,
                    color: result.sentenceStats.longCount > 3 ? "text-red-600" : "text-green-600" },
                ].map((s) => (
                  <div key={s.label} className="card" style={{ padding:"1rem", textAlign:"center" }}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                    <p className="text-xs text-muted mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart — sentence length distribution */}
              <div className="card" style={{ padding:"1.25rem" }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Sentence length distribution</p>
                <p className="text-xs text-faint mb-4">Ideal academic range is 16–25 words per sentence</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={result.sentenceStats.distribution}
                    margin={{ top: 4, right: 16, left: 0, bottom: 16 }} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }}
                      axisLine={false} tickLine={false}
                      label={{ value: "words per sentence", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RechartTooltip content={<BarTip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {result.sentenceStats.distribution.map((_, i) => {
                        const palette = ["#a5b4fc", "#818cf8", "#6366f1", "var(--warning)", "#ef4444"];
                        return <Cell key={i} fill={palette[i] || "#6366f1"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sentence tips */}
              <div className="card" style={{ padding:"1.25rem" }}>
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Writing tips</p>
                <ul className="space-y-2.5">
                  {result.sentenceStats.longCount > 3 && (
                    <li className="flex gap-2 text-sm rounded-lg p-3" style={{ color:"#f87171", background:"rgba(220,38,38,0.12)" }}>
                      <span className="flex-shrink-0 font-bold">!</span>
                      {result.sentenceStats.longCount} sentences exceed 36 words — split them for better readability.
                    </li>
                  )}
                  {result.sentenceStats.shortCount > 4 && (
                    <li className="flex gap-2 text-sm rounded-lg p-3" style={{ color:"#fbbf24", background:"rgba(217,119,6,0.12)" }}>
                      <span className="flex-shrink-0 font-bold">~</span>
                      {result.sentenceStats.shortCount} very short sentences — try combining related ideas.
                    </li>
                  )}
                  {result.sentenceStats.avgLength >= 16 && result.sentenceStats.avgLength <= 25 && (
                    <li className="flex gap-2 text-sm rounded-lg p-3" style={{ color:"#4ade80", background:"rgba(22,163,74,0.12)" }}>
                      <span className="flex-shrink-0">✓</span>
                      Average sentence length ({result.sentenceStats.avgLength} words) is in the ideal academic range.
                    </li>
                  )}
                  {result.sentenceStats.longCount <= 3 && result.sentenceStats.shortCount <= 4 && (
                    <li className="flex gap-2 text-sm rounded-lg p-3" style={{ color:"#4ade80", background:"rgba(22,163,74,0.12)" }}>
                      <span className="flex-shrink-0">✓</span>
                      Good sentence variety — your writing has a natural academic flow.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-faint pt-2">{result.algorithm}</p>
        </div>
      )}
    </div>
  );
}

// ── Tiny chip ─────────────────────────────────────────────────────────────────
function Chip({ label, val, hex }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium"
      style={{ borderColor: hex + "50", background: hex + "14", color: hex }}>
      {val !== "" && <span className="font-bold">{val}</span>}
      <span style={{ opacity: 0.75 }}>{label}</span>
    </span>
  );
}
