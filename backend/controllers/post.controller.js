import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";
import User from "../models/users.model.js";

/**
 * Health Check
 */
export const activeCheck = async (req, res) => {
  return res.status(200).json({ message: "RUNNING" });
};

/**
 * Create Post
 */
export const createPost = async (req, res) => {
  const { token, body } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const post = new Post({
      userId: user._id,
      body,
      media: req.file ? req.file.filename : "",
      fileType: req.file ? req.file.mimetype.split("/")[0] : "",
      likes: 0,
    });

    await post.save();

    return res.status(201).json({
      message: "Post Created",
      post,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get All Posts
 */
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("userId", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Post
 */
export const deletePost = async (req, res) => {
  const { token, postId } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(post.userId) !== String(user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.deleteOne();

    return res.json({ message: "Post deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Comment on Post
 */
export const commentPost = async (req, res) => {
  const { token, postId, text } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({
      postId,
      userId: user._id,
      text,
    });

    await comment.save();

    return res.status(201).json({
      message: "Comment added",
      comment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get Comments By Post
 */
export const get_comments_by_post = async (req, res) => {
  const { postId } = req.query;

  try {
    const comments = await Comment.find({ postId })
      .populate("userId", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.json(comments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Comment
 */
export const delete_comment_of_user = async (req, res) => {
  const { token, commentId } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) return res.status(404).json({ message: "User not found" });

    const comment = await Comment.findById(commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    if (String(comment.userId) !== String(user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await comment.deleteOne();

    return res.json({ message: "Comment deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Increment Likes
 */
export const increment_likes = async (req, res) => {
  const { postId } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Post not found" });

    post.likes += 1;
    await post.save();

    return res.json({ message: "Like added", likes: post.likes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};