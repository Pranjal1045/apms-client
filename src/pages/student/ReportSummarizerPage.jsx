import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import { useSelector } from "react-redux";

const ReportSummarizerPage = () => {
  const { project } = useSelector((state) => state.student);
  const [text, setText] = useState("");
  const [numSentences, setNumSentences] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const summarize = async () => {
    if (!text.trim() || text.trim().length < 100) {
      setError("Please enter at least 100 characters of text to summarize.");
      return;
    }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axiosInstance.post('/ai/summarize-report', { text, numSentences, projectTitle: project?.title || '' });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Summarization failed. Make sure the AI service is running.");
    } finally { setLoading(false); }
  };

  const copy = () => {
    if (result?.summary) {
      navigator.clipboard.writeText(result.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary">AI Report Summarizer</h1>
          <p className="text-sm text-muted">Python Extractive Summarization — TF-IDF Sentence Scoring</p>
        </div>
      </div>

      {/* Input Card */}
      <div className=" rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-secondary">Paste Your Report / Abstract</label>
          <span className="text-xs text-faint">{wordCount} words</span>
        </div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setResult(null); setError(null); }}
          placeholder="Paste your project report, abstract, or any academic text here (minimum 100 characters)..."
          rows={8}
          className="w-full px-4 py-3 bg-elevated border border-slate-200 rounded-xl text-sm text-secondary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-secondary">Summary Length:</label>
            <div className="flex gap-2">
              {[3, 5, 7].map(n => (
                <button key={n} onClick={() => setNumSentences(n)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${numSentences === n ? "bg-blue-600 text-white border-blue-600" : " text-secondary border-slate-200 hover:border-blue-300"}`}>
                  {n} sentences
                </button>
              ))}
            </div>
          </div>
          <button onClick={summarize} disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
            {loading
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Summarizing...</>
              : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Summarize</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><p className="text-sm font-semibold text-red-700">Error</p><p className="text-sm text-red-600">{error}</p></div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Original Words", value: result.stats.originalWords, icon: "📄" },
              { label: "Summary Words", value: result.stats.summaryWords, icon: "✂️" },
              { label: "Compression", value: result.stats.compressionRate, icon: "📉" },
              { label: "Sentences", value: `${result.stats.sentencesExtracted}/${result.stats.totalSentences}`, icon: "🔢" },
            ].map((s, i) => (
              <div key={i} className=" rounded-xl border border-slate-200 p-3 text-center shadow-sm">
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-lg font-black text-blue-600">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Summary Output */}
          <div className=" rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">AI Generated Summary</h3>
                  <p className="text-xs text-faint">{result.algorithm}</p>
                </div>
              </div>
              <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-secondary  border border-slate-200 px-3 py-1.5 rounded-lg transition-all">
                {copied ? <><svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Copied!</span></> : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>}
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                <div className="w-1 bg-blue-200 rounded-full flex-shrink-0" />
                <p className="text-sm text-secondary leading-relaxed">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Key Topics */}
          {result.keyTopics?.length > 0 && (
            <div className=" rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">🏷️ Key Topics Detected</p>
              <div className="flex flex-wrap gap-2">
                {result.keyTopics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full capitalize">{topic}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportSummarizerPage;
