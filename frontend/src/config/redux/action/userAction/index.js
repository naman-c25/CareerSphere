import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getUserAndProfile = createAsyncThunk("profile/getProfile", async (token, thunkAPI) => {
  try {
    const response = await clientServer.post("/get_user_and_profile", { token });
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch profile" });
  }
});

export const updateProfileData = createAsyncThunk("profile/updateProfileData", async (data, thunkAPI) => {
  try {
    const response = await clientServer.post("/update_profile_data", data);
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update profile" });
  }
});

export const updateUserInfo = createAsyncThunk("profile/updateUserInfo", async (data, thunkAPI) => {
  try {
    const response = await clientServer.post("/user_update", data);
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update user" });
  }
});

export const getAllUsers = createAsyncThunk("profile/getAllUsers", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/users/get_all_users");
    return thunkAPI.fulfillWithValue(response.data.profiles || []);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch users" });
  }
});

export const sendConnectionRequest = createAsyncThunk(
  "profile/sendConnectionRequest",
  async ({ token, connectionId }, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/send_connection_request", { token, connectionId });
      return thunkAPI.fulfillWithValue({ connectionId, message: response.data.message });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to send request" });
    }
  }
);

export const getMyConnectionRequests = createAsyncThunk("profile/getMyConnectionRequests", async (token, thunkAPI) => {
  try {
    const response = await clientServer.post("/user/get_connection_request", { token });
    return thunkAPI.fulfillWithValue(response.data.connections || []);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch sent requests" });
  }
});

export const getIncomingRequests = createAsyncThunk("profile/getIncomingRequests", async (token, thunkAPI) => {
  try {
    const response = await clientServer.post("/user/user_connection_request", { token });
    return thunkAPI.fulfillWithValue(response.data || []);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch incoming requests" });
  }
});

export const acceptOrRejectConnection = createAsyncThunk(
  "profile/acceptOrRejectConnection",
  async ({ token, requestId, action_type }, thunkAPI) => {
    try {
      const response = await clientServer.post("/user/accept_connection_request", { token, requestId, action_type });
      return thunkAPI.fulfillWithValue({ requestId, action_type, message: response.data.message });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to update connection" });
    }
  }
);

export const getUserProfileByUsername = createAsyncThunk(
  "profile/getUserProfileByUsername",
  async (username, thunkAPI) => {
    try {
      const response = await clientServer.get(`/user/get_profile_based_on_username?username=${username}`);
      return thunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch profile" });
    }
  }
);

export const downloadResume = createAsyncThunk("profile/downloadResume", async (userId, thunkAPI) => {
  try {
    const response = await clientServer.get(`/user/download_resume?id=${userId}`);
    return thunkAPI.fulfillWithValue(response.data.message);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to generate resume" });
  }
});

export const uploadProfilePicture = createAsyncThunk("profile/uploadProfilePicture", async (formData, thunkAPI) => {
  try {
    const response = await clientServer.post("/update_profile_picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to upload picture" });
  }
});
