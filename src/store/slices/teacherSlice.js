import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const getTeacherDashboardStats = createAsyncThunk(
  "getTeacherDashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/teacher/fetch-dashboard-stats");
      return res.data.data?.dashboardStats || res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch dashboard stats");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchAssignedStudents = createAsyncThunk(
  "fetchAssignedStudents",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/teacher/assigned-students");
      return res.data.data?.students || res.data.data || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch assigned students");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const getTeacherRequests = createAsyncThunk(
  "getTeacherRequests",
  async (supervisorId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/teacher/requests?supervisor=${supervisorId}`);
      return res.data.data?.requests || res.data.data || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch requests");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

// ✅ Teacher can ONLY reject — accept is done by Admin
export const rejectRequest = createAsyncThunk(
  "rejectRequest",
  async (requestId, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/teacher/requests/${requestId}/reject`);
      toast.success(res.data.message || "Request rejected");
      return res.data.data?.request || res.data.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const markComplete = createAsyncThunk(
  "markComplete",
  async (projectId, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/teacher/mark-complete/${projectId}`);
      toast.success(res.data.message || "Marked as completed");
      return { projectId };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark complete");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const downloadTeacherFile = createAsyncThunk(
  "downloadTeacherFile",
  async ({ fileUrl, originalName }, thunkAPI) => {
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
  }
);

export const getFiles = createAsyncThunk(
  "getTeacherFiles",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/teacher/files`);
      return res.data?.data?.files || res.data.data || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch files");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const addFeedback = createAsyncThunk(
  "addFeedback",
  async ({ projectId, payload }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/teacher/feedback/${projectId}`, payload);
      toast.success(res.data.message || "Feedback posted");
      return { projectId, feedback: res.data.data?.feedback || res.data.data };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post feedback");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

export const getAssignedStudents = createAsyncThunk(
  "getAssignedStudents",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/teacher/assigned-students`);
      return res.data.data?.students || res.data.data || [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch assigned students");
      return thunkAPI.rejectWithValue(error.response?.data?.message);
    }
  }
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    assignedStudents: [],
    files: [],
    list: [],
    dashboardStats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAssignedStudents.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(getAssignedStudents.fulfilled, (state, action) => { state.loading = false; state.assignedStudents = action.payload?.students || action.payload || []; })
      .addCase(getAssignedStudents.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(addFeedback.fulfilled, (state, action) => {
        const { projectId, feedback } = action.payload;
        state.assignedStudents = state.assignedStudents.map(s =>
          s.project?._id === projectId ? { ...s, project: { ...s.project, feedback } } : s
        );
      })

      .addCase(markComplete.fulfilled, (state, action) => {
        const { projectId } = action.payload;
        state.assignedStudents = state.assignedStudents.map(s =>
          s.project?._id === projectId ? { ...s, project: { ...s.project, status: "completed" } } : s
        );
      })

      .addCase(getTeacherDashboardStats.fulfilled, (state, action) => { state.dashboardStats = action.payload; })
      .addCase(getFiles.fulfilled,                 (state, action) => { state.files = action.payload?.files || action.payload || []; })

      .addCase(getTeacherRequests.fulfilled, (state, action) => {
        state.list = action.payload?.requests || action.payload || [];
      })

      // ✅ Reject removes from list; no accept case (admin handles that)
      .addCase(rejectRequest.fulfilled, (state, action) => {
        const rejected = action.payload;
        if (rejected?._id) {
          state.list = state.list.map(r =>
            r._id === rejected._id ? { ...r, status: "rejected" } : r
          );
        }
      });
  },
});

export default teacherSlice.reducer;
