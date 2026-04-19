import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { axiosInstance } from "../../lib/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function CompressionRing({ original, summary, size=130 }) {
  const pct  = original > 0 ? Math.round((summary / original) * 100) : 0;
  const kept = pct, removed = 100 - pct;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <PieChart width={size} height={size}>
        <Pie data={[{value:kept,fill:"#6366f1"},{value:removed,fill:"var(--border)"}]}
          cx={size/2-4} cy={size/2-4} innerRadius={size/2-26} outerRadius={size/2-12}
          startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
          <Cell fill="#6366f1"/><Cell fill="var(--border)"/>
        </Pie>
      </PieChart>
      <div style={{ textAlign:"center", marginTop:-4 }}>
        <p style={{ fontSize:"1.375rem", fontWeight:900, color:"#6366f1" }}>{100-pct}%</p>
        <p style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>compressed</p>
      </div>
    </div>
  );
}

const TopicTip = ({ active, payload }) =>
  active && payload?.length ? (
    <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px" }}>
      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:13, textTransform:"capitalize" }}>{payload[0]?.payload?.full}</p>
      <p style={{ color:"#6366f1", fontWeight:700, fontSize:13 }}>Relevance: {payload[0]?.value}%</p>
    </div>
  ) : null;

export default function ReportSummarizerTab() {
  const { project } = useSelector(s => s.student);
  const [mode,         setMode]         = useState("upload");
  const [text,         setText]         = useState("");
  const [file,         setFile]         = useState(null);
  const [numSentences, setNumSentences] = useState(5);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [copied,       setCopied]       = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const textReady = charCount >= 100;
  const fileReady = !!file;
  const ready = mode === "upload" ? fileReady : textReady;

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf","docx","txt"].includes(ext)) {
      setError("Only PDF, DOCX, or TXT files are supported.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB.");
      return;
    }
    setFile(f); setError(null); setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const summarize = async () => {
    if (!ready) return;
    setLoading(true); setError(null); setResult(null);
    try {
      let res;
      if (mode === "upload" && file) {
        const fd = new FormData();
        fd.append("reportFile", file);
        fd.append("numSentences", numSentences);
        fd.append("projectTitle", project?.title || "");
        res = await axiosInstance.post("/ai/summarize-report", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await axiosInstance.post("/ai/summarize-report", { text, numSentences, projectTitle: project?.title || "" });
      }
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Summarization failed. Please try again or contact support.");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result?.summary) { navigator.clipboard.writeText(result.summary); setCopied(true); setTimeout(()=>setCopied(false),2000); }
  };

  const COLORS = ["#6366f1","#0ea5e9","#10b981","#f59e0b","#ec4899","#8b5cf6","#06b6d4","#84cc16"];
  const topicData = result?.keyTopics?.map((t,i) => ({
    name: t.length > 14 ? t.slice(0,14)+"…" : t, full:t,
    value: Math.max(100 - i*11, 20), fill: COLORS[i % COLORS.length],
  })) || [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
        <div style={{ width:40, height:40, background:"#6366f1", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="20" height="20" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div>
          <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>AI Report Summarizer</p>
          <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginTop:2 }}>TF-IDF Extractive Summarization · Pure Python · No external API</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:"0.375rem", background:"var(--bg-elevated)", borderRadius:10, padding:"0.25rem" }}>
        {[
          { id:"upload", icon:"📎", label:"Upload File",  sub:"PDF, DOCX, TXT" },
          { id:"paste",  icon:"📋", label:"Paste Text",   sub:"Type or paste"  },
        ].map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setError(null); setResult(null); }}
            style={{ flex:1, padding:"0.5rem 0.75rem", borderRadius:8, border:"none", cursor:"pointer", transition:"all 0.15s",
              background: mode===m.id ? "#6366f1" : "transparent",
              color: mode===m.id ? "#fff" : "var(--text-secondary)",
              fontWeight:600, fontSize:"0.82rem" }}>
            {m.icon} {m.label}
            <span style={{ display:"block", fontSize:"0.7rem", fontWeight:400, opacity:0.75 }}>{m.sub}</span>
          </button>
        ))}
      </div>

      {/* Input card */}
      <div className="card" style={{ padding:"1.125rem", display:"flex", flexDirection:"column", gap:"0.875rem" }}>

        {mode === "upload" ? (
          <>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
              style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border:`2px dashed ${dragOver ? "#6366f1" : file ? "#10b981" : "var(--border)"}`,
                borderRadius:12, padding:"2rem 1.5rem", textAlign:"center", cursor:"pointer",
                background: dragOver ? "rgba(99,102,241,0.05)" : file ? "rgba(16,185,129,0.05)" : "var(--bg-elevated)",
                transition:"all 0.2s",
              }}>
              {file ? (
                <>
                  <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>📄</div>
                  <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>{file.name}</p>
                  <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginTop:4 }}>
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setResult(null); }}
                    style={{ marginTop:"0.75rem", fontSize:"0.75rem", color:"#ef4444", background:"none", border:"1px solid #ef4444", borderRadius:6, padding:"0.2rem 0.6rem", cursor:"pointer" }}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize:"2.5rem", marginBottom:"0.5rem" }}>📂</div>
                  <p style={{ fontWeight:700, color:"var(--text-primary)", fontSize:"0.9rem" }}>
                    {dragOver ? "Drop your file here" : "Click or drag & drop your report"}
                  </p>
                  <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginTop:6 }}>
                    Supports PDF, DOCX, TXT · Max 10 MB
                  </p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <label className="label" style={{ marginBottom:0 }}>Paste your report text</label>
              <span style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{wordCount} words · {charCount} chars</span>
            </div>
            <textarea value={text} onChange={e=>{setText(e.target.value);setResult(null);setError(null);}}
              placeholder="Paste your project report or abstract here (minimum 100 characters)…"
              rows={6} className="input" style={{ resize:"vertical" }}/>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", marginBottom:5 }}>
                <span style={{ color:"var(--text-muted)" }}>Minimum 100 characters</span>
                <span style={{ color: textReady ? "var(--green-text)" : "var(--amber-text)", fontWeight:600 }}>
                  {textReady ? "✓ Ready" : `${100-charCount} more needed`}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min(100,(charCount/100)*100)}%`, background: textReady ? "var(--green-text)" : "var(--amber-text)" }}/>
              </div>
            </div>
          </>
        )}

        {/* Controls */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"0.625rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <span style={{ fontSize:"0.8rem", color:"var(--text-muted)" }}>Length:</span>
            {[3,5,7].map(n => (
              <button key={n} onClick={()=>setNumSentences(n)}
                style={{ padding:"0.25rem 0.625rem", fontSize:"0.78rem", fontWeight:600, borderRadius:7, border:"1px solid", cursor:"pointer", transition:"all 0.15s",
                  background: numSentences===n ? "#6366f1" : "transparent",
                  color: numSentences===n ? "#fff" : "var(--text-secondary)",
                  borderColor: numSentences===n ? "#6366f1" : "var(--border)" }}>
                {n} sentences
              </button>
            ))}
          </div>
          <button onClick={summarize} disabled={loading||!ready}
            style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", padding:"0.5rem 1.125rem",
              background: loading||!ready ? "var(--border)" : "#6366f1",
              color:"#fff", borderRadius:8, border:"none", fontWeight:600, fontSize:"0.875rem",
              cursor: loading||!ready ? "not-allowed":"pointer" }}>
            {loading
              ? <><div className="spinner"/>Summarizing…</>
              : <><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Summarize</>}
          </button>
        </div>
      </div>

      {error && <div className="alert-danger">{error}</div>}

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
            <div className="card" style={{ padding:"1rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.875rem" }}>Summarization Stats</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem" }}>
                {[
                  { label:"Original",    value:`${result.stats.originalWords} words`,  color:"var(--text-primary)" },
                  { label:"Summary",     value:`${result.stats.summaryWords} words`,    color:"#6366f1" },
                  { label:"Compression", value:result.stats.compressionRate,            color:"var(--green-text)" },
                  { label:"Sentences",   value:`${result.stats.sentencesExtracted}/${result.stats.totalSentences}`, color:"var(--amber-text)" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"var(--bg-elevated)", borderRadius:8, padding:"0.625rem", textAlign:"center" }}>
                    <p style={{ fontSize:"1.125rem", fontWeight:900, color:s.color }}>{s.value}</p>
                    <p style={{ fontSize:"0.72rem", color:"var(--text-muted)", marginTop:2 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding:"1rem", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:"0.75rem", alignSelf:"flex-start" }}>Compression Ratio</p>
              <CompressionRing original={result.stats.originalWords} summary={result.stats.summaryWords}/>
              <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginTop:6, textAlign:"center" }}>{result.stats.originalWords} → {result.stats.summaryWords} words</p>
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"0.75rem 1rem", background:"rgba(99,102,241,0.08)", borderBottom:"1px solid rgba(99,102,241,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontWeight:700, color:"#6366f1", fontSize:"0.875rem" }}>AI Generated Summary</p>
              <button onClick={copy} style={{ fontSize:"0.78rem", color:"var(--text-muted)", background:"var(--bg-elevated)", border:"1px solid var(--border)", padding:"0.25rem 0.625rem", borderRadius:6, cursor:"pointer" }}>
                {copied ? <span style={{ color:"var(--green-text)" }}>✓ Copied!</span> : "Copy"}
              </button>
            </div>
            <div style={{ padding:"1rem 1.125rem", display:"flex", gap:"0.75rem" }}>
              <div style={{ width:3, background:"#6366f1", borderRadius:99, flexShrink:0 }}/>
              <p style={{ fontSize:"0.9rem", color:"var(--text-primary)", lineHeight:1.7 }}>{result.summary}</p>
            </div>
          </div>

          {topicData.length > 0 && (
            <div className="card" style={{ padding:"1.125rem" }}>
              <p style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>Key Topics Detected</p>
              <p style={{ fontSize:"0.78rem", color:"var(--text-muted)", marginBottom:"1rem" }}>Ranked by relevance (TF-IDF)</p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={topicData} margin={{ top:4, right:8, left:-20, bottom:4 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                  <XAxis dataKey="name" tick={{ fontSize:11, fill:"var(--text-muted)" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} axisLine={false} tickLine={false} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={<TopicTip/>} cursor={{ fill:"var(--bg-elevated)" }}/>
                  <Bar dataKey="value" radius={[6,6,0,0]}>{topicData.map((d,i)=><Cell key={i} fill={d.fill}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.375rem", marginTop:"0.75rem", paddingTop:"0.75rem", borderTop:"1px solid var(--border)" }}>
                {result.keyTopics.map((t,i) => (
                  <span key={i} style={{ padding:"0.2rem 0.625rem", fontSize:"0.75rem", fontWeight:600, borderRadius:99, background:`${topicData[i]?.fill}20`, color:topicData[i]?.fill, border:`1px solid ${topicData[i]?.fill}40`, textTransform:"capitalize" }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
