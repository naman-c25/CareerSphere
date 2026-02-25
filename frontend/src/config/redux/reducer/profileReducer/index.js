import { createSlice } from "@reduxjs/toolkit";
import {
  getUserAndProfile,
  updateProfileData,
  updateUserInfo,
  getAllUsers,
  sendConnectionRequest,
  getMyConnectionRequests,
  getIncomingRequests,
  acceptOrRejectConnection,
  getUserProfileByUsername,
  downloadResume,
  uploadProfilePicture,
} from "../../action/userAction";

const initialState = {
  profile: null,
  allUsers: [],
  viewedProfile: null,
  sentRequests: [],
  incomingRequests: [],
  resumeFile: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    resetProfileState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearViewedProfile: (state) => {
      state.viewedProfile = null;
    },
    clearResume: (state) => {
      state.resumeFile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getUserAndProfile
      .addCase(getUserAndProfile.pending, (state) => { state.isLoading = true; })
      .addCase(getUserAndProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(getUserAndProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to load profile";
      })

      // updateProfileData
      .addCase(updateProfileData.pending, (state) => { state.isLoading = true; })
      .addCase(updateProfileData.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Profile updated successfully!";
      })
      .addCase(updateProfileData.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to update profile";
      })

      // updateUserInfo
      .addCase(updateUserInfo.fulfilled, (state) => {
        state.isSuccess = true;
        state.message = "Info updated!";
      })
      .addCase(updateUserInfo.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to update info";
      })

      // getAllUsers
      .addCase(getAllUsers.pending, (state) => { state.isLoading = true; })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allUsers = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to load users";
      })

      // sendConnectionRequest
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.message = "Connection request sent!";
        if (action.payload?.connectionId) {
          state.sentRequests = [...state.sentRequests, { connectionId: { _id: action.payload.connectionId } }];
        }
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to send request";
      })

      // getMyConnectionRequests
      .addCase(getMyConnectionRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload;
      })

      // getIncomingRequests
      .addCase(getIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
      })

      // acceptOrRejectConnection
      .addCase(acceptOrRejectConnection.fulfilled, (state, action) => {
        const { requestId } = action.payload;
        state.incomingRequests = state.incomingRequests.filter((r) => r._id !== requestId);
        state.isSuccess = true;
        state.message = action.payload.message || "Updated";
      })
      .addCase(acceptOrRejectConnection.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Failed to update";
      })

      // getUserProfileByUsername
      .addCase(getUserProfileByUsername.pending, (state) => { state.isLoading = true; })
      .addCase(getUserProfileByUsername.fulfilled, (state, action) => {
        state.isLoading = false;
        state.viewedProfile = action.payload;
      })
      .addCase(getUserProfileByUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Profile not found";
      })

      // downloadResume
      .addCase(downloadResume.fulfilled, (state, action) => {
        state.resumeFile = action.payload;
      })
      .addCase(downloadResume.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Resume generation failed";
      })

      // uploadProfilePicture
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.message = "Profile picture updated!";
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload?.message || "Upload failed";
      });
  },
});

export const { resetProfileState, clearViewedProfile, clearResume } = profileSlice.actions;
export default profileSlice.reducer;
