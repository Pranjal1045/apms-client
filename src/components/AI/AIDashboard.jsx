import { useState } from "react";
import ProgressAnalyzer    from "./ProgressAnalyzer";
import PlagiarismChecker   from "./PlagiarismChecker";
import FeedbackGenerator   from "./FeedbackGenerator";
import ChatbotTab          from "./ChatbotTab";
import ReportSummarizerTab from "./ReportSummarizerTab";
import SmartReportGrader   from "./SmartReportGrader";
import MilestoneRiskTab    from "./MilestoneRiskTab";
import EvalPredictorTab    from "./EvalPredictorTab";
import EvalReportTab       from "./EvalReportTab";

const AIDashboard = ({ projectId, role = "Student" }) => {
  const [activeTab, setActiveTab] = useState("progress");

  const tabs = [
    {
      id: "progress",
      label: "Progress Analyzer",
      roles: ["Student", "Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      description: "Risk score using real milestone completion, overdue, and file data",
      accent: "#3b82f6",
    },
    {
      id: "milestone-risk",
      label: "Milestone Risk",
      roles: ["Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
      description: "Analyzes weekly milestone health — approved, overdue, rejected, log entries",
      accent: "#6366f1",
    },
    {
      id: "eval-predict",
      label: "Score Predictor",
      roles: ["Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
      description: "Predicts evaluation scores across all 4 categories from project data",
      accent: "#0ea5e9",
    },
    {
      id: "eval-report",
      label: "Eval Report",
      roles: ["Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      description: "Auto-generates a full evaluation report with milestone data and scores",
      accent: "#10b981",
    },
    {
      id: "chatbot",
      label: "AI Chatbot",
      roles: ["Student", "Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      description: "Python NLP chatbot — asks about your real project data",
      accent: "#8b5cf6",
    },
    {
      id: "summarizer",
      label: "Report Summarizer",
      roles: ["Student", "Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      description: "Python extractive summarization — TF-IDF sentence scoring",
      accent: "#6366f1",
    },
    {
      id: "plagiarism",
      label: "Plagiarism Checker",
      roles: ["Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
      description: "Python TF-IDF + Cosine Similarity plagiarism detection",
      accent: "#ec4899",
    },
    {
      id: "feedback",
      label: "Feedback Generator",
      roles: ["Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
      description: "Generate structured academic feedback instantly — includes milestone context",
      accent: "#f59e0b",
    },
    {
      id: "grader",
      label: "Report Grader",
      roles: ["Student", "Teacher", "Admin"],
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
      description: "Smart academic report grader — vocabulary, structure, readability",
      accent: "#6366f1",
    },
  ];

  const visibleTabs = tabs.filter(t => t.roles.includes(role));

  const roleConfig = {
    Admin:   { bg: "rgba(168,85,247,0.12)",  text: "#c084fc", border: "rgba(168,85,247,0.3)",  dot: "#a855f7" },
    Teacher: { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa", border: "rgba(59,130,246,0.3)",  dot: "#3b82f6" },
    Student: { bg: "rgba(16,185,129,0.12)",  text: "#34d399", border: "rgba(16,185,129,0.3)",  dot: "#10b981" },
  };
  const rc = roleConfig[role] || roleConfig.Student;
  const activeTabObj = visibleTabs.find(t => t.id === activeTab);
  const activeAccent = activeTabObj?.accent || "#3b82f6";
  const activeDesc   = activeTabObj?.description || "";

  if (!projectId && role === "Student") {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ width: 64, height: 64, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg style={{ width: 32, height: 32, color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>No Project Found</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>Submit a project proposal first to unlock AI-powered analysis and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.25rem" }}>
            <div style={{ width: 28, height: 28, background: "#2563eb", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg style={{ width: 16, height: 16, color: "#fff" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>AI Features</h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Powered by Python AI Microservice — all features use your real project data
          </p>
        </div>

        {/* Role badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.375rem 0.875rem", borderRadius: 999,
          border: `1px solid ${rc.border}`, background: rc.bg,
          fontSize: "0.75rem", fontWeight: 600, color: rc.text, flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: rc.dot, display: "inline-block" }} />
          {role}
        </div>
      </div>

      {/* ── Tab Navigation container ─────────────────────────────────────────── */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>

        {/* Scrollable tab bar */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)", overflowX: "auto" }}>
          <div style={{ display: "flex", minWidth: "max-content" }}>
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "1rem 1.125rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${isActive ? tab.accent : "transparent"}`,
                    color: isActive ? tab.accent : "var(--text-muted)",
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  <span style={{ display: "flex", color: isActive ? tab.accent : "var(--text-faint)" }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Description bar */}
        {activeDesc && (
          <div style={{
            padding: "0.5rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: `${activeAccent}12`,
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <svg style={{ width: 14, height: 14, color: activeAccent, flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: "0.75rem", color: activeAccent, opacity: 0.9 }}>{activeDesc}</p>
          </div>
        )}

        {/* Tab Content */}
        <div style={{ padding: "1.5rem" }}>
          {activeTab === "progress"       && <ProgressAnalyzer    projectId={projectId} />}
          {activeTab === "milestone-risk" && <MilestoneRiskTab    projectId={projectId} />}
          {activeTab === "eval-predict"   && <EvalPredictorTab    projectId={projectId} />}
          {activeTab === "eval-report"    && <EvalReportTab       projectId={projectId} />}
          {activeTab === "chatbot"        && <ChatbotTab          projectId={projectId} />}
          {activeTab === "summarizer"     && <ReportSummarizerTab />}
          {activeTab === "plagiarism"     && <PlagiarismChecker   projectId={projectId} />}
          {activeTab === "feedback"       && <FeedbackGenerator   projectId={projectId} />}
          {activeTab === "grader"         && <SmartReportGrader   projectId={projectId} />}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
