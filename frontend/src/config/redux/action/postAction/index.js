import { clientServer } from "@/config";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllPosts = createAsyncThunk("post/getAllPosts", async (_, thunkAPI) => {
  try {
    const response = await clientServer.get("/posts");
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch posts" });
  }
});

export const createPost = createAsyncThunk("post/createPost", async (formData, thunkAPI) => {
  try {
    const response = await clientServer.post("/post", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return thunkAPI.fulfillWithValue(response.data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to create post" });
  }
});

export const deletePost = createAsyncThunk("post/deletePost", async ({ token, postId }, thunkAPI) => {
  try {
    await clientServer.post("/delete_post", { token, postId });
    return thunkAPI.fulfillWithValue(postId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete post" });
  }
});

export const likePost = createAsyncThunk("post/likePost", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.post("/increment_post_like", { postId });
    return thunkAPI.fulfillWithValue({ postId, likes: response.data.likes });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to like post" });
  }
});

export const commentOnPost = createAsyncThunk("post/commentOnPost", async ({ token, postId, text }, thunkAPI) => {
  try {
    const response = await clientServer.post("/comment", { token, postId, text });
    return thunkAPI.fulfillWithValue(response.data.comment);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to add comment" });
  }
});

export const getCommentsByPost = createAsyncThunk("post/getCommentsByPost", async (postId, thunkAPI) => {
  try {
    const response = await clientServer.get(`/get_comments?postId=${postId}`);
    return thunkAPI.fulfillWithValue({ postId, comments: response.data });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to fetch comments" });
  }
});

export const deleteComment = createAsyncThunk("post/deleteComment", async ({ token, commentId }, thunkAPI) => {
  try {
    await clientServer.delete("/delete_comment", { data: { token, commentId } });
    return thunkAPI.fulfillWithValue(commentId);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: "Failed to delete comment" });
  }
});
