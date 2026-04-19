import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const downloadProjectFile = createAsyncThunk(
  "downloadProjectFile",
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
const projectSlice = createSlice({
  name: "project",
  initialState: {
    projects: [],
    selected: null,
  },
  reducers: {},
  extraReducers: (builder) => {},
});

export default projectSlice.reducer;
