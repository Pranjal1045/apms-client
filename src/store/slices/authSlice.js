import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const register = createAsyncThunk("auth/register", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/auth/register", data);
    toast.success(res.data.message || "Account created successfully!");
    return res.data.user;
  } catch (error) {
    toast.error(error.response?.data?.message || "Registration failed");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const login = createAsyncThunk("auth/login", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/auth/login", data);
    toast.success(res.data.message || "Logged in successfully!");
    return res.data.user;
  } catch (error) {
    toast.error(error.response?.data?.message || "Login failed");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const forgotPassword = createAsyncThunk("auth/password/forgot", async (email, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/auth/password/forgot", email);
    toast.success(res.data.message);
    return null;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to send reset email");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const resetPassword = createAsyncThunk("auth/password/reset", async ({ token, password, confirmPassword }, thunkAPI) => {
  try {
    const res = await axiosInstance.put(`/auth/password/reset?token=${token}`, { password, confirmPassword });
    // ✅ FIX: return success message only, do NOT auto-login after reset
    return res.data.message || "Password reset successfully";
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to reset password. Link may have expired.");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

export const getUser = createAsyncThunk("auth/me", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data.user;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Not authenticated");
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await axiosInstance.get("/auth/logout");
    return null;
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to logout");
    return thunkAPI.rejectWithValue(error.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
    error: null,
  },

  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending,    (state) => { state.isSigningUp = true; })
      .addCase(register.fulfilled,  (state, action) => { state.isSigningUp = false; state.authUser = action.payload; })
      .addCase(register.rejected,   (state) => { state.isSigningUp = false; })
      // Login
      .addCase(login.pending,       (state) => { state.isLoggingIn = true; })
      .addCase(login.fulfilled,     (state, action) => { state.isLoggingIn = false; state.authUser = action.payload; })
      .addCase(login.rejected,      (state) => { state.isLoggingIn = false; })
      // Get user — ✅ FIX: do NOT set authUser = null on pending (causes flash redirect)
      .addCase(getUser.pending,     (state) => { state.isCheckingAuth = true; })
      .addCase(getUser.fulfilled,   (state, action) => { state.isCheckingAuth = false; state.authUser = action.payload; })
      .addCase(getUser.rejected,    (state) => { state.isCheckingAuth = false; state.authUser = null; })
      // Logout
      .addCase(logout.fulfilled,    (state) => { state.authUser = null; })
      .addCase(logout.rejected,     (state) => { /* keep user logged in if logout fails */ })
      // Forgot password
      .addCase(forgotPassword.pending,   (state) => { state.isRequestingForToken = true; })
      .addCase(forgotPassword.fulfilled, (state) => { state.isRequestingForToken = false; })
      .addCase(forgotPassword.rejected,  (state) => { state.isRequestingForToken = false; })
      // Reset password — ✅ FIX: do NOT set authUser after reset (prevents auto-redirect to dashboard)
      .addCase(resetPassword.pending,    (state) => { state.isUpdatingPassword = true; })
      .addCase(resetPassword.fulfilled,  (state) => { state.isUpdatingPassword = false; })
      .addCase(resetPassword.rejected,   (state) => { state.isUpdatingPassword = false; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
