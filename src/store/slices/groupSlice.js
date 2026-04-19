import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const createGroup = createAsyncThunk("group/create", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/group/create", data);
    toast.success(res.data.message);
    return res.data.data.group;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to create group");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const joinGroup = createAsyncThunk("group/join", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/group/join", data);
    toast.success(res.data.message);
    return res.data.data.group;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to join group");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const fetchMyGroup = createAsyncThunk("group/myGroup", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/group/my-group");
    return res.data.data.group;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const leaveGroup = createAsyncThunk("group/leave", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.delete("/group/leave");
    toast.success(res.data.message);
    return null;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to leave group");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const removeMember = createAsyncThunk("group/removeMember", async (memberId, thunkAPI) => {
  try {
    const res = await axiosInstance.delete(`/group/remove/${memberId}`);
    toast.success(res.data.message);
    return memberId;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to remove member");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const regenerateInviteCode = createAsyncThunk("group/regenerateCode", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.put("/group/regenerate-code");
    toast.success(res.data.message);
    return res.data.data.inviteCode;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to regenerate code");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const fetchAllGroups = createAsyncThunk("group/allGroups", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/group/all");
    return res.data.data.groups;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

const groupSlice = createSlice({
  name: "group",
  initialState: {
    myGroup: null,
    allGroups: [],
    isLoading: false,
    isCreating: false,
    isJoining: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGroup.pending, (state) => { state.isCreating = true; })
      .addCase(createGroup.fulfilled, (state, action) => { state.isCreating = false; state.myGroup = action.payload; })
      .addCase(createGroup.rejected, (state) => { state.isCreating = false; })
      .addCase(joinGroup.pending, (state) => { state.isJoining = true; })
      .addCase(joinGroup.fulfilled, (state, action) => { state.isJoining = false; state.myGroup = action.payload; })
      .addCase(joinGroup.rejected, (state) => { state.isJoining = false; })
      .addCase(fetchMyGroup.pending, (state) => { state.isLoading = true; })
      .addCase(fetchMyGroup.fulfilled, (state, action) => { state.isLoading = false; state.myGroup = action.payload; })
      .addCase(fetchMyGroup.rejected, (state) => { state.isLoading = false; })
      .addCase(leaveGroup.fulfilled, (state) => { state.myGroup = null; })
      .addCase(removeMember.fulfilled, (state, action) => {
        if (state.myGroup) {
          state.myGroup.members = state.myGroup.members.filter(m => m._id !== action.payload);
        }
      })
      .addCase(regenerateInviteCode.fulfilled, (state, action) => {
        if (state.myGroup) state.myGroup.inviteCode = action.payload;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => { state.allGroups = action.payload; });
  },
});

export default groupSlice.reducer;
