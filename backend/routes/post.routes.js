import { Router } from "express";
import multer from "multer";
import {
  activeCheck,
  createPost,
  getAllPosts,
  deletePost,
  commentPost,
  get_comments_by_post,
  delete_comment_of_user,
  increment_likes,
} from "../controllers/post.controller.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.get("/", activeCheck);
router.post("/post", upload.single("media"), createPost);
router.get("/posts", getAllPosts);
router.post("/delete_post", deletePost);
router.post("/comment", commentPost);
router.get("/get_comments", get_comments_by_post);
router.delete("/delete_comment", delete_comment_of_user);
router.post("/increment_post_like", increment_likes);

export default router;