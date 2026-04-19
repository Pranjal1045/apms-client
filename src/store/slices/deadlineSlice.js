import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const createDeadline = createAsyncThunk(
  "createDeadline",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/deadline/create-deadline/${id}`,
        data
      );
      toast.success(res.data.message || "Deadline updated");
      return res.data.data?.deadline || res.data.data || res.data;
    } catch (error) {
      toast.error(
        error.response.data.message || "Failed to update or create deadline"
      );
      return thunkAPI.rejectWithValue(error.response.data.message);
    }
  }
);

const deadlineSlice = createSlice({
  name: "deadline",
  initialState: {
    deadlines: [],
    nearby: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(createDeadline.fulfilled, (state, action) => {
      const item = action.payload;
      if (item) state.deadlines.push(item);
    });
  },
});

export default deadlineSlice.reducer;
