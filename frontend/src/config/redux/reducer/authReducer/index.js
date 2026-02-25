import { createSlice } from "@reduxjs/toolkit";
import { loginUser, registerUser } from "../../action/authAction";

const initialState = {
  user: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  loggedIn: false,
  message: "",
  profileFetched: false,
  connections: [],
  connectionRequest: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = "";
    },

    logout: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.loggedIn = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "Logged out successfully";
    },
  },

  extraReducers: (builder) => {
    builder

      // ========================
      // LOGIN USER
      // ========================

      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "Knocking the door...";
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.loggedIn = true;
        state.user = action.payload; // token or user data
        state.message = "Login is Successful";
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.loggedIn = false;
        state.message =
          action.payload?.message || "Login Failed";
      })

      // ========================
      // REGISTER USER
      // ========================

      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "Creating your account...";
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;

        // If register returns token
        if (typeof action.payload === "string") {
          state.loggedIn = true;
          state.user = action.payload;
          state.message = "Registration & Login Successful";
        } else {
          // If only message returned
          state.loggedIn = false;
          state.message = "Registration Successful";
        }
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.loggedIn = false;
        state.message =
          action.payload?.message || "Registration Failed";
      });
  },
});

export const { reset, logout } = authSlice.actions;
export default authSlice.reducer;