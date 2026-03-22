import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { getAllPosts, createPost, deletePost, likePost, commentOnPost, getCommentsByPost, deleteComment } from "@/config/redux/action/postAction";
import { getUserAndProfile, getAllUsers, sendConnectionRequest } from "@/config/redux/action/userAction";
import { resetPostState } from "@/config/redux/reducer/postReducer";
import styles from "./styles.module.css";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } }),
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  const postState = useSelector((state) => state.post);
  const profileState = useSelector((state) => state.profile);

  const [token, setToken] = useState(null);
  const [postBody, setPostBody] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [shareMsg, setShareMsg] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    dispatch(getUserAndProfile(t));
    dispatch(getAllPosts());
    dispatch(getAllUsers());
  }, []);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postBody.trim() && !mediaFile) return;
    const fd = new FormData();
    fd.append("token", token);
    fd.append("body", postBody);
    if (mediaFile) fd.append("media", mediaFile);
    await dispatch(createPost(fd));
    dispatch(getAllPosts());
    setPostBody("");
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => dispatch(resetPostState()), 3000);
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => {
      const next = { ...prev, [postId]: !prev[postId] };
      if (next[postId]) dispatch(getCommentsByPost(postId));
      return next;
    });
  };

  const handleCommentSubmit = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    await dispatch(commentOnPost({ token, postId, text }));
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    dispatch(getCommentsByPost(postId));
  };

  const handleShare = (postId) => {
    const url = `${window.location.origin}/view_profile/${postId}`;
    navigator.clipboard?.writeText(url) || document.execCommand("copy");
    setShareMsg("Link copied to clipboard!");
    setTimeout(() => setShareMsg(""), 2500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const myProfile = profileState.profile;
  const myUserId = myProfile?.userId?._id;
  const allUsers = profileState.allUsers || [];
  const sentRequestIds = (profileState.sentRequests || []).map((r) => String(r.connectionId?._id || r.connectionId));
  const suggestedUsers = allUsers
    .filter((u) => String(u.userId?._id) !== String(myUserId) && !sentRequestIds.includes(String(u.userId?._id)))
    .slice(0, 5);

  return (
    <UserLayout>
      <div className={styles.dashboardContainer}>
        {/* LEFT SIDEBAR */}
        <motion.aside
          className={styles.leftSidebar}
          variants={slideIn}
          initial="hidden"
          animate="visible"
        >
          {myProfile ? (
            <motion.div
              className={styles.profileCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.profileCover} />
              <div className={styles.profileAvatarWrap}>
                <motion.img
                  src={
                    myProfile.userId?.profilePicture && myProfile.userId.profilePicture !== "default.jpg"
                      ? `${BASE_URL}/${myProfile.userId.profilePicture}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(myProfile.userId?.name || "U")}&background=1e3a8a&color=fff`
                  }
                  alt="avatar"
                  className={styles.profileAvatar}
                  whileHover={{ scale: 1.05 }}
                />
              </div>
              <div className={styles.profileInfo}>
                <h3 className={styles.profileName}>{myProfile.userId?.name}</h3>
                <p className={styles.profileUsername}>@{myProfile.userId?.username}</p>
                {myProfile.currentPost && <p className={styles.profilePosition}>{myProfile.currentPost}</p>}
                {myProfile.bio && <p className={styles.profileBio}>{myProfile.bio}</p>}
              </div>
              <div className={styles.profileStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNum}>
                    {postState.posts.filter((p) => String(p.userId?._id) === String(myUserId)).length}
                  </span>
                  <span className={styles.statLabel}>Posts</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNum}>{(profileState.sentRequests || []).length}</span>
                  <span className={styles.statLabel}>Connections</span>
                </div>
              </div>
              <motion.div
                className={styles.viewProfileBtn}
                onClick={() => router.push(`/view_profile/${myProfile.userId?.username}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View Full Profile
              </motion.div>
            </motion.div>
          ) : (
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonCover} />
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonLine} style={{ margin: "0.8rem auto 0.4rem", width: "60%" }} />
              <div className={styles.skeletonLine} style={{ margin: "0 auto", width: "40%" }} />
            </div>
          )}

          <motion.div
            className={styles.quickLinksCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <h4 className={styles.sideCardTitle}>Quick Links</h4>
            {[
              { icon: "🔍", label: "Discover People", path: "/discover" },
              { icon: "🤝", label: "My Connections", path: "/my_connections" },
              { icon: "✏️", label: "Edit Profile", path: `/view_profile/${myProfile?.userId?.username}` },
            ].map((link, i) => (
              <motion.div
                key={i}
                className={styles.quickLink}
                onClick={() => router.push(link.path)}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
              >
                {link.icon} {link.label}
              </motion.div>
            ))}
          </motion.div>
        </motion.aside>

        {/* MAIN FEED */}
        <main className={styles.mainFeed}>
          {/* Create Post */}
          <motion.div
            className={styles.createPostCard}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handlePostSubmit}>
              <div className={styles.createPostTop}>
                <img
                  src={
                    myProfile?.userId?.profilePicture && myProfile.userId.profilePicture !== "default.jpg"
                      ? `${BASE_URL}/${myProfile.userId.profilePicture}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(myProfile?.userId?.name || "U")}&background=1e3a8a&color=fff`
                  }
                  alt="me"
                  className={styles.createAvatarImg}
                />
                <textarea
                  className={styles.postTextarea}
                  placeholder={`What's on your mind, ${myProfile?.userId?.name?.split(" ")[0] || ""}?`}
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  rows={3}
                />
              </div>
              <AnimatePresence>
                {mediaPreview && (
                  <motion.div
                    className={styles.mediaPreviewWrap}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <img src={mediaPreview} alt="preview" className={styles.mediaPreview} />
                    <button type="button" className={styles.removeMedia}
                      onClick={() => { setMediaFile(null); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={styles.createPostActions}>
                <label className={styles.mediaLabel}>
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaChange} style={{ display: "none" }} />
                  <motion.span className={styles.mediaBtn} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    📷 Photo/Video
                  </motion.span>
                </label>
                <motion.button
                  type="submit"
                  className={styles.postBtn}
                  disabled={!postBody.trim() && !mediaFile}
                  whileHover={{ scale: (!postBody.trim() && !mediaFile) ? 1 : 1.05 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {postState.isLoading ? "Posting..." : "Post"}
                </motion.button>
              </div>
            </form>
          </motion.div>

          <AnimatePresence>
            {shareMsg && (
              <motion.div
                className={styles.shareToast}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {shareMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Post Feed */}
          {postState.isLoading && postState.posts.length === 0 ? (
            [1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonPost}>
                <div className={styles.skeletonPostHeader}>
                  <div className={styles.skeletonAvatarSm} />
                  <div>
                    <div className={styles.skeletonLine} style={{ width: 120 }} />
                    <div className={styles.skeletonLine} style={{ width: 80, marginTop: 6 }} />
                  </div>
                </div>
                <div className={styles.skeletonBody} />
              </div>
            ))
          ) : postState.posts.length === 0 ? (
            <motion.div
              className={styles.emptyFeed}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className={styles.emptyIcon}>📝</div>
              <p>No posts yet. Be the first to share something!</p>
            </motion.div>
          ) : (
            postState.posts.map((post, index) => {
              const isOwner = String(post.userId?._id) === String(myUserId);
              const comments = postState.comments[post._id] || [];
              const isExpanded = !!expandedComments[post._id];

              return (
                <motion.div
                  key={post._id}
                  className={styles.postCard}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  layout
                >
                  <div className={styles.postHeader}>
                    <div className={styles.postAuthorInfo}>
                      <motion.img
                        src={
                          post.userId?.profilePicture && post.userId.profilePicture !== "default.jpg"
                            ? `${BASE_URL}/${post.userId.profilePicture}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userId?.username || "U")}&background=1e3a8a&color=fff`
                        }
                        alt="author"
                        className={styles.postAuthorAvatar}
                        onClick={() => router.push(`/view_profile/${post.userId?.username}`)}
                        whileHover={{ scale: 1.08 }}
                      />
                      <div>
                        <p className={styles.postAuthorName} onClick={() => router.push(`/view_profile/${post.userId?.username}`)}>
                          {post.userId?.username || "Unknown"}
                        </p>
                        <p className={styles.postDate}>{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <div className={styles.postMenuWrap}>
                        <motion.button
                          className={styles.postMenuBtn}
                          onClick={() => setActiveDropdown(activeDropdown === post._id ? null : post._id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          •••
                        </motion.button>
                        <AnimatePresence>
                          {activeDropdown === post._id && (
                            <motion.div
                              className={styles.postDropdown}
                              initial={{ opacity: 0, scale: 0.9, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: -8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className={styles.postDropdownItem} onClick={() => { setActiveDropdown(null); dispatch(deletePost({ token, postId: post._id })); }}>
                                🗑 Delete Post
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div className={styles.postBody}>
                    <p className={styles.postText}>{post.body}</p>
                    {post.media && post.fileType === "image" && (
                      <motion.img
                        src={`${BASE_URL}/${post.media}`}
                        alt="media"
                        className={styles.postMedia}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                    {post.media && post.fileType === "video" && (
                      <video controls className={styles.postMedia}>
                        <source src={`${BASE_URL}/${post.media}`} />
                      </video>
                    )}
                  </div>

                  <div className={styles.postDivider} />
                  <div className={styles.postActions}>
                    <motion.button className={styles.actionBtn} onClick={() => dispatch(likePost(post._id))} whileTap={{ scale: 0.9 }}>
                      👍 Like {post.likes > 0 && <span className={styles.likeCount}>({post.likes})</span>}
                    </motion.button>
                    <motion.button className={styles.actionBtn} onClick={() => toggleComments(post._id)} whileTap={{ scale: 0.9 }}>
                      💬 Comment {comments.length > 0 && <span className={styles.likeCount}>({comments.length})</span>}
                    </motion.button>
                    <motion.button className={styles.actionBtn} onClick={() => handleShare(post._id)} whileTap={{ scale: 0.9 }}>
                      🔗 Share
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className={styles.commentsSection}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={styles.commentInputRow}>
                          <img
                            src={
                              myProfile?.userId?.profilePicture && myProfile.userId.profilePicture !== "default.jpg"
                                ? `${BASE_URL}/${myProfile.userId.profilePicture}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(myProfile?.userId?.name || "U")}&background=1e3a8a&color=fff`
                            }
                            alt="me"
                            className={styles.commentAvatar}
                          />
                          <div className={styles.commentInputWrap}>
                            <input
                              type="text"
                              className={styles.commentInput}
                              placeholder="Add a comment..."
                              value={commentInputs[post._id] || ""}
                              onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post._id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") handleCommentSubmit(post._id); }}
                            />
                            <motion.button
                              className={styles.commentSubmitBtn}
                              onClick={() => handleCommentSubmit(post._id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Post
                            </motion.button>
                          </div>
                        </div>

                        {comments.length === 0 ? (
                          <p className={styles.noComments}>Be the first to comment!</p>
                        ) : (
                          comments.map((c, ci) => (
                            <motion.div
                              key={c._id}
                              className={styles.commentItem}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ci * 0.05 }}
                            >
                              <img
                                src={
                                  c.userId?.profilePicture && c.userId.profilePicture !== "default.jpg"
                                    ? `${BASE_URL}/${c.userId.profilePicture}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.userId?.username || "U")}&background=6366f1&color=fff`
                                }
                                alt="commenter"
                                className={styles.commentAvatar}
                              />
                              <div className={styles.commentContent}>
                                <div className={styles.commentHeader}>
                                  <span className={styles.commentAuthor}>{c.userId?.username}</span>
                                  <span className={styles.commentDate}>{formatDate(c.createdAt)}</span>
                                  {String(c.userId?._id) === String(myUserId) && (
                                    <motion.button
                                      className={styles.deleteCommentBtn}
                                      onClick={() => dispatch(deleteComment({ token, commentId: c._id }))}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      ✕
                                    </motion.button>
                                  )}
                                </div>
                                <p className={styles.commentText}>{c.text}</p>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <motion.aside
          className={styles.rightSidebar}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={styles.discoverCard}>
            <h4 className={styles.sideCardTitle}>People You May Know</h4>
            {suggestedUsers.length === 0 ? (
              <p className={styles.noSuggestions}>You are connected with everyone!</p>
            ) : (
              suggestedUsers.map((u, i) => (
                <motion.div
                  key={u._id}
                  className={styles.suggestedUser}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <motion.img
                    src={
                      u.userId?.profilePicture && u.userId.profilePicture !== "default.jpg"
                        ? `${BASE_URL}/${u.userId.profilePicture}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userId?.name || "U")}&background=0ea5e9&color=fff`
                    }
                    alt="user"
                    className={styles.suggestedAvatar}
                    onClick={() => router.push(`/view_profile/${u.userId?.username}`)}
                    whileHover={{ scale: 1.08 }}
                  />
                  <div className={styles.suggestedInfo}>
                    <p className={styles.suggestedName} onClick={() => router.push(`/view_profile/${u.userId?.username}`)}>
                      {u.userId?.name}
                    </p>
                    {u.currentPost && <p className={styles.suggestedPosition}>{u.currentPost}</p>}
                  </div>
                  <motion.button
                    className={styles.connectBtn}
                    onClick={() => dispatch(sendConnectionRequest({ token, connectionId: u.userId?._id }))}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    +
                  </motion.button>
                </motion.div>
              ))
            )}
            <div className={styles.seeAllLink} onClick={() => router.push("/discover")}>
              See all people →
            </div>
          </div>
        </motion.aside>
      </div>
    </UserLayout>
  );
}
