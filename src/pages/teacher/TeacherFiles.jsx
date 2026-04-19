import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownToLine, LayoutGrid, List } from "lucide-react";
import { FileText, FileSpreadsheet, FileArchive, File } from "lucide-react";
import { getFiles, downloadTeacherFile } from "../../store/slices/teacherSlice";
import { toast } from "react-toastify";


const TeacherFiles = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const filesFromStore = useSelector((state) => state.teacher.files) || [];

  useEffect(() => {
    dispatch(getFiles());
  }, [dispatch]);

  const deriveTypeFormatName = (name) => {
    if (!name) return "other";
    const parts = name.split(".");
    return (parts[parts.length - 1] || "").toLowerCase();
  };

  const normalizeFile = (f) => {
    const type = deriveTypeFormatName(f.originalName) || f.fileType || "other";

    let category = "other";

    if (["pdf", "doc", "docx", "txt"].includes(type)) {
      category = "report";
    } else if (["ppt", "pptx"].includes(type)) {
      category = "presentation";
    } else if (
      ["zip", "rar", "7z", "js", "ts", "html", "css", "json"].includes(type)
    ) {
      category = "code";
    } else if (["jpeg", "jpg", "png", "avif", "gif"].includes(type)) {
      category = "image";
    }

    return {
      id: f._id,
      name: f.originalName,
      type: type.toUpperCase(),
      size: f.size || "-",
      student: f.studentName || "-",
      uploadDate: f.uploadedAt || f.createdAt || new Date().toISOString(),
      category,
      projectId: f.projectId || f.project?._id,
      fileId: f._id,
      fileUrl: f.fileUrl || f.path || null,
      originalName: f.originalName,
    };
  };

  const files = useMemo(
    () => (filesFromStore || []).map(normalizeFile),
    [filesFromStore]
  );

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="w-8 h-8 text-blue-500" />;
      case "ppt":
      case "pptx":
        return <FileSpreadsheet className="w-8 h-8 text-orange-500" />;
      case "zip":
      case "rar":
        return <FileArchive className="w-8 h-8 text-yellow-500" />;
      default:
        return <File className="w-8 h-8 text-muted" />;
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesType =
      filterType === "all" ? true : file.category === filterType;
    const matchesSearch = file.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch && matchesType;
  });

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
  const fileStats = [
    {
      label: "Total Files",
      count: files.length,
      bg: "bg-blue-50",
      text: "text-blue-600",
      value: "text-blue-700",
    },
    {
      label: "Reports",
      count: files.filter((f) => f.category === "report").length,
      bg: "bg-green-50",
      text: "text-green-600",
      value: "text-green-700",
    },
    {
      label: "Presentations",
      count: files.filter((f) => f.category === "presentation").length,
      bg: "bg-orange-50",
      text: "text-orange-600",
      value: "text-orange-700",
    },
    {
      label: "Code Files",
      count: files.filter((f) => f.category === "code").length,
      bg: "bg-purple-50",
      text: "text-purple-600",
      value: "text-purple-700",
    },
    {
      label: "Images",
      count: files.filter((f) => f.category === "image").length,
      bg: "bg-pink-50",
      text: "text-pink-600",
      value: "text-pink-700",
    },
  ];

  const tableHeadData = [
    "File Name",
    "Student",
    "Type",
    "Upload Date",
    "Actions",
  ];

  return (
    <>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h1 className="card-title">Student Files</h1>
              <p className="card-subtitle">
                Manage files shared with and received from students
              </p>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-4 w-full">
              <select
                className="input w-48"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Files</option>
                <option value="report">Reports</option>
                <option value="presentation">Presentation</option>
                <option value="code">Code</option>
                <option value="image">Images</option>
              </select>

              <input
                type="text"
                className="input flex-1"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg ${
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-slate-100 text-secondary"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg ${
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-slate-100 text-secondary"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FILE STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            {fileStats.map((item, i) => {
              return (
                <div key={i} className={`${item.bg} p-4 rounded-lg`}>
                  <p className={`text-sm ${item.text}`}>{item.label}</p>
                  <p className={`text-2xl ${item.value} font-bold`}>
                    {item.count}
                  </p>
                </div>
              );
            })}
          </div>

          {/* FILES DISPLAY */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFiles.map((file) => (
                <div key={file.id} className="card">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3">{getFileIcon(file.type)}</div>
                    <h3
                      className="font-medium text-primary mb-1 truncate w-full"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <p className="text-sm text-secondary mb-1">{file.student}</p>
                    <p className="text-xs text-muted mb-1">{file.size}</p>
                    <p className="text-xs text-muted mb-4">
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="rounded-lg text-white bg-blue-600 text-lg font-medium w-full flex items-center justify-center py-3 gap-3 hover:bg-blue-700 duration-300 transition-all"
                      >
                        <ArrowDownToLine size={22} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="min-w-full border border-slate-200 font-semibold">
                <thead className="bg-elevated text-secondary">
                  <tr>
                    {tableHeadData.map((t) => (
                      <th key={t} className="py-3 px-4 text-left font-semibold">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="border-t hover:bg-elevated transition-colors"
                    >
                      <td className="py-3 px-4 items-center gap-3">
                        {getFileIcon(file.type)}{" "}
                        <span className="font-medium">{file.name}</span>
                      </td>
                      <td className="py-3 px-4">{file.student}</td>
                      <td className="py-3 px-4">{file.type}</td>
                      <td className="py-3 px-4">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="btn-primary btn-small"
                          onClick={() => handleDownloadFile(file)}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TeacherFiles;