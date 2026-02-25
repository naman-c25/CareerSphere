import { createSlice } from "@reduxjs/toolkit";
import {
  getAllPosts,
  createPost,
  deletePost,
  likePost,
  commentOnPost,
  getCommentsByPost,
  deleteComment,
} from "../../action/postAction";

const initialState = {
  posts: [],
  comments: {},
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    resetPostState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // getAllPosts
      .addCase(getAllPosts.pending, (state) => { state.isLoading = true; })
      .addCase(getAllPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload;
      })
      .addCase(getAllPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to load posts";
      })

      // createPost
      .addCase(createPost.pending, (state) => { state.isLoading = true; })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload?.post) {
          state.posts = [action.payload.post, ...state.posts];
        }
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || "Failed to create post";
      })

      // deletePost
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p._id !== action.payload);
      })

      // likePost
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, likes } = action.payload;
        const post = state.posts.find((p) => p._id === postId);
        if (post) post.likes = likes;
      })

      // getCommentsByPost
      .addCase(getCommentsByPost.fulfilled, (state, action) => {
        const { postId, comments } = action.payload;
        state.comments[postId] = comments;
      })

      // commentOnPost
      .addCase(commentOnPost.fulfilled, (state, action) => {
        const comment = action.payload;
        if (comment && comment.postId) {
          if (!state.comments[comment.postId]) {
            state.comments[comment.postId] = [];
          }
          state.comments[comment.postId] = [comment, ...state.comments[comment.postId]];
        }
      })

      // deleteComment
      .addCase(deleteComment.fulfilled, (state, action) => {
        const commentId = action.payload;
        for (const postId in state.comments) {
          state.comments[postId] = state.comments[postId].filter((c) => c._id !== commentId);
        }
      });
  },
});

export const { resetPostState } = postSlice.actions;
export default postSlice.reducer;
