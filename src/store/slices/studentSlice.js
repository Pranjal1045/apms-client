import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const submitProjectProposal = createAsyncThunk("student/submitProjectProposal", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/student/project-proposal", data);
    toast.success(res.data.message || "Proposal submitted successfully!");
    return res.data.data?.project || res.data.data || res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to submit project proposal");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const fetchProject = createAsyncThunk("student/fetchproject", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/student/project");
    return res.data.data?.project;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const getSupervisor = createAsyncThunk("student/getSupervisor", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/student/supervisor");
    return res.data.data?.supervisor;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const fetchAllSupervisors = createAsyncThunk("student/fetchAllSupervisors", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/student/fetch-supervisors");
    return res.data.data?.supervisors;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const fetchMyRequests = createAsyncThunk("student/fetchMyRequests", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/student/my-requests");
    return res.data.data?.requests || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const requestSupervisor = createAsyncThunk("student/requestSupervisor", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/student/request-supervisor", data);
    toast.success(res.data.message || "Request sent!");
    thunkAPI.dispatch(getSupervisor());
    return res.data.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to request supervisor");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const uploadFiles = createAsyncThunk("student/uploadFiles", async ({ projectId, files }, thunkAPI) => {
  try {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    const res = await axiosInstance.post(`/student/upload/${projectId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message || "Files uploaded successfully");
    return res.data.data?.project || res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to upload files");
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Upload failed");
  }
});

export const fetchDashboardStats = createAsyncThunk("fetchDashboardStats", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/student/fetch-dashboard-stats");
    return res.data.data || res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const getFeedback = createAsyncThunk("getFeedback", async (projectId, thunkAPI) => {
  try {
    const res = await axiosInstance.get(`/student/feedback/${projectId}`);
    return res.data.data?.feedback || res.data.data || res.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch feedback");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const downloadFile = createAsyncThunk("downloadfile", async ({ fileUrl, originalName }, thunkAPI) => {
  try {
    if (!fileUrl) throw new Error("File URL not available");
    // Files are on Cloudinary — trigger browser download directly from the URL
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = originalName || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return { success: true };
  } catch (error) {
    toast.error("Failed to download file");
    return thunkAPI.rejectWithValue(error.message);
  }
});

const studentSlice = createSlice({
  name: "student",
  initialState: {
    project: null,
    files: [],
    supervisors: [],
    myRequests: [],
    dashboardStats: null,   // FIX: was [] — now null so components can distinguish "not loaded yet"
    supervisor: null,
    deadlines: [],
    feedback: [],
    status: null,
    isLoading: false,        // FIX: was missing — StudentDashboard references this
    isUploading: false,
    isSubmitting: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Submit proposal
      .addCase(submitProjectProposal.pending, (state) => { state.isSubmitting = true; })
      .addCase(submitProjectProposal.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.project = action.payload?.project || action.payload;
      })
      .addCase(submitProjectProposal.rejected, (state) => { state.isSubmitting = false; })
      // Fetch project
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.project = action.payload || null;
        state.files = action.payload?.files || [];
      })
      // Supervisor
      .addCase(getSupervisor.fulfilled, (state, action) => {
        state.supervisor = action.payload || null;
      })
      .addCase(fetchAllSupervisors.fulfilled, (state, action) => {
        state.supervisors = action.payload || [];
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.myRequests = action.payload || [];
      })
      .addCase(requestSupervisor.fulfilled, (state) => {
        // will re-fetch requests after dispatch
      })
      // Upload files
      .addCase(uploadFiles.pending, (state) => { state.isUploading = true; })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.isUploading = false;
        const newFiles = action.payload?.files || action.payload?.project?.files || [];
        state.files = Array.isArray(newFiles) ? newFiles : [];
        if (action.payload?.project) state.project = action.payload.project;
      })
      .addCase(uploadFiles.rejected, (state) => { state.isUploading = false; })
      // Feedback
      .addCase(getFeedback.fulfilled, (state, action) => {
        state.feedback = action.payload || [];
      })
      // Dashboard stats — FIX: isLoading states added
      .addCase(fetchDashboardStats.pending, (state) => { state.isLoading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload || null;
      })
      .addCase(fetchDashboardStats.rejected, (state) => { state.isLoading = false; });
  },
});

export default studentSlice.reducer;
