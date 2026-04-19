import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProject, uploadFiles, downloadFile } from "../../store/slices/studentSlice";
import { Upload, File, FileText, Archive, FileCode, FilePlus, Download, X, Loader, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

const getExt = (name) => name?.split(".").pop().toLowerCase() || "";

const FileIcon = ({ name, size = 20 }) => {
  const ext = getExt(name);
  const color = ext === "pdf" ? "var(--danger)" : ["doc","docx"].includes(ext) ? "var(--accent)" : ["ppt","pptx"].includes(ext) ? "var(--warning)" : ["zip","rar","gz"].includes(ext) ? "var(--accent)" : "var(--text-muted)";
  return <File size={size} style={{ color }} />;
};

const DropZone = ({ label, icon: Icon, accept, onPick, color }) => (
  <label style={{ border: `1px dashed ${color}44`, borderRadius: "10px", padding: "1.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6rem", cursor: "pointer", background: `${color}06`, transition: "background 0.2s, border-color 0.2s" }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}88`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}06`; e.currentTarget.style.borderColor = `${color}44`; }}>
    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={22} style={{ color }} />
    </div>
    <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{label}</p>
    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>{accept.toUpperCase().replace(/\./g, "").replace(/,/g, " · ")}</p>
    <input type="file" className="hidden" accept={accept} onChange={onPick} multiple style={{ display: "none" }} />
  </label>
);

const UploadFiles = () => {
  const dispatch = useDispatch();
  const { project, files, isUploading } = useSelector(s => s.student);
  const [selected, setSelected] = useState([]);

  useEffect(() => { if (!project) dispatch(fetchProject()); }, [dispatch]);

  const handlePick = (e) => {
    const list = Array.from(e.target.files || []);
    setSelected(prev => [...prev, ...list.filter(f => !prev.find(p => p.name === f.name))]);
    e.target.value = "";
  };

  const handleUpload = () => {
    if (!selected.length) return;
    if (!project?._id) return;
    dispatch(uploadFiles({ projectId: project._id, files: selected })).then(() => {
      dispatch(fetchProject());
    });
    setSelected([]);
  };

  const handleDownloadFile = (file) => {
    try {
      if (!file.fileUrl) {
        toast.error("Download link not available");
        return;
      }
      // Files are stored on Cloudinary — open the URL directly for download
      const a = document.createElement("a");
      a.href = file.fileUrl;
      a.download = file.originalName || "download";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      toast.error("Download failed");
    }
  };
  const uploadedFiles = Array.isArray(files) ? files : project?.files || [];

  return (
    <div className="fade-in" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "inherit", fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>Upload Project Files</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Upload your project documents — reports, presentations, and source code.</p>
      </div>

      {!project ? (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "10px", padding: "1rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.25rem" }}>
          <AlertCircle size={18} style={{ color: "var(--warning)", flexShrink: 0 }} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>You need to submit a project proposal before uploading files.</p>
        </div>
      ) : (
        <>
          {/* Drop zones */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "1rem" }}>Select Files to Upload</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.875rem" }}>
              <DropZone label="Report" icon={FileText} accept=".pdf,.doc,.docx" onPick={handlePick} color="var(--accent)" />
              <DropZone label="Presentation" icon={Archive} accept=".ppt,.pptx,.pdf" onPick={handlePick} color="var(--accent)" />
              <DropZone label="Source Code" icon={FileCode} accept=".zip,.rar,.tar,.gz" onPick={handlePick} color="var(--success)" />
            </div>

            {/* Selected preview */}
            {selected.length > 0 && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "inherit", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                  Ready to Upload ({selected.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selected.map((f) => (
                    <div key={f.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.875rem", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <FileIcon name={f.name} size={18} />
                      <p style={{ flex: 1, fontSize: "0.855rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{(f.size / 1048576).toFixed(1)} MB</p>
                      <button onClick={() => setSelected(p => p.filter(x => x.name !== f.name))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px", display: "flex" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "0.875rem", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleUpload} disabled={isUploading} className="btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: isUploading ? 0.7 : 1 }}>
                    {isUploading ? <><Loader size={15} className="animate-spin" /> Uploading…</> : <><Upload size={15} /> Upload {selected.length} file{selected.length !== 1 ? "s" : ""}</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded files */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontFamily: "inherit", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                Uploaded Files <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.82rem" }}>({uploadedFiles.length})</span>
              </p>
            </div>
            {uploadedFiles.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem", color: "var(--text-muted)" }}>
                <FilePlus size={36} style={{ opacity: 0.3, marginBottom: "0.75rem" }} />
                <p style={{ fontSize: "0.875rem" }}>No files uploaded yet.</p>
              </div>
            ) : (
              <div>
                {uploadedFiles.map((file, i) => (
                  <div key={file._id || i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1.25rem", borderBottom: i < uploadedFiles.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileIcon name={file.originalName} size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.originalName}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{file.fileType || "File"} · {fmt(file.uploadedAt)}</p>
                    </div>
                    <button onClick={() => handleDownloadFile (file)} className="btn-outline btn-small"
                      style={{ display: "flex", alignItems: "center", gap: "0.35rem", whiteSpace: "nowrap" }}>
                      <Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UploadFiles;
