import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import studentReducer from "./slices/studentSlice";
import teacherReducer from "./slices/teacherSlice";
import adminReducer from "./slices/adminSlice";
import notificationReducer from "./slices/notificationSlice";
import projectReducer from "./slices/projectSlice";
import deadlineReducer from "./slices/deadlineSlice";
import requestReducer from "./slices/requestSlice";
import popupReducer from "./slices/popupSlice";
import groupReducer from "./slices/groupSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    student: studentReducer,
    teacher: teacherReducer,
    admin: adminReducer,
    notification: notificationReducer,
    project: projectReducer,
    deadline: deadlineReducer,
    request: requestReducer,
    popup: popupReducer,
    group: groupReducer,
  },
});

export default store;
