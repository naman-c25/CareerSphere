import React, { useEffect, useState, useRef } from "react";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { getAllPosts, createPost, deletePost, likePost, commentOnPost, getCommentsByPost, deleteComment } from "@/config/redux/action/postAction";
import { getUserAndProfile, getAllUsers, sendConnectionRequest } from "@/config/redux/action/userAction";
import { resetPostState } from "@/config/redux/reducer/postReducer";
import styles from "./styles.module.css";

const BASE_URL = "http://localhost:9090";

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
        <aside className={styles.leftSidebar}>
          {myProfile ? (
            <div className={styles.profileCard}>
              <div className={styles.profileCover} />
              <div className={styles.profileAvatarWrap}>
                <img
                  src={
                    myProfile.userId?.profilePicture && myProfile.userId.profilePicture !== "default.jpg"
                      ? `${BASE_URL}/${myProfile.userId.profilePicture}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(myProfile.userId?.name || "U")}&background=1e3a8a&color=fff`
                  }
                  alt="avatar"
                  className={styles.profileAvatar}
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
              <div className={styles.viewProfileBtn} onClick={() => router.push(`/view_profile/${myProfile.userId?.username}`)}>
                View Full Profile
              </div>
            </div>
          ) : (
            <div className={styles.skeletonCard}>
              <div className={styles.skeletonCover} />
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonLine} style={{ margin: "0.8rem auto 0.4rem", width: "60%" }} />
              <div className={styles.skeletonLine} style={{ margin: "0 auto", width: "40%" }} />
            </div>
          )}

          <div className={styles.quickLinksCard}>
            <h4 className={styles.sideCardTitle}>Quick Links</h4>
            <div className={styles.quickLink} onClick={() => router.push("/discover")}>🔍 Discover People</div>
            <div className={styles.quickLink} onClick={() => router.push("/my_connections")}>🤝 My Connections</div>
            <div className={styles.quickLink} onClick={() => router.push(`/view_profile/${myProfile?.userId?.username}`)}>✏️ Edit Profile</div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className={styles.mainFeed}>
          {/* Create Post */}
          <div className={styles.createPostCard}>
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
              {mediaPreview && (
                <div className={styles.mediaPreviewWrap}>
                  <img src={mediaPreview} alt="preview" className={styles.mediaPreview} />
                  <button type="button" className={styles.removeMedia}
                    onClick={() => { setMediaFile(null); setMediaPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    ✕
                  </button>
                </div>
              )}
              <div className={styles.createPostActions}>
                <label className={styles.mediaLabel}>
                  <input type="file" accept="image/*,video/*" ref={fileInputRef} onChange={handleMediaChange} style={{ display: "none" }} />
                  <span className={styles.mediaBtn}>📷 Photo/Video</span>
                </label>
                <button type="submit" className={styles.postBtn} disabled={!postBody.trim() && !mediaFile}>
                  {postState.isLoading ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {shareMsg && <div className={styles.shareToast}>{shareMsg}</div>}

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
            <div className={styles.emptyFeed}>
              <div className={styles.emptyIcon}>📝</div>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            postState.posts.map((post) => {
              const isOwner = String(post.userId?._id) === String(myUserId);
              const comments = postState.comments[post._id] || [];
              const isExpanded = !!expandedComments[post._id];

              return (
                <div key={post._id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <div className={styles.postAuthorInfo}>
                      <img
                        src={
                          post.userId?.profilePicture && post.userId.profilePicture !== "default.jpg"
                            ? `${BASE_URL}/${post.userId.profilePicture}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(post.userId?.username || "U")}&background=1e3a8a&color=fff`
                        }
                        alt="author"
                        className={styles.postAuthorAvatar}
                        onClick={() => router.push(`/view_profile/${post.userId?.username}`)}
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
                        <button className={styles.postMenuBtn} onClick={() => setActiveDropdown(activeDropdown === post._id ? null : post._id)}>•••</button>
                        {activeDropdown === post._id && (
                          <div className={styles.postDropdown}>
                            <div className={styles.postDropdownItem} onClick={() => { setActiveDropdown(null); dispatch(deletePost({ token, postId: post._id })); }}>
                              🗑 Delete Post
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.postBody}>
                    <p className={styles.postText}>{post.body}</p>
                    {post.media && post.fileType === "image" && (
                      <img src={`${BASE_URL}/${post.media}`} alt="media" className={styles.postMedia} />
                    )}
                    {post.media && post.fileType === "video" && (
                      <video controls className={styles.postMedia}>
                        <source src={`${BASE_URL}/${post.media}`} />
                      </video>
                    )}
                  </div>

                  <div className={styles.postDivider} />
                  <div className={styles.postActions}>
                    <button className={styles.actionBtn} onClick={() => dispatch(likePost(post._id))}>
                      👍 Like {post.likes > 0 && <span className={styles.likeCount}>({post.likes})</span>}
                    </button>
                    <button className={styles.actionBtn} onClick={() => toggleComments(post._id)}>
                      💬 Comment {comments.length > 0 && <span className={styles.likeCount}>({comments.length})</span>}
                    </button>
                    <button className={styles.actionBtn} onClick={() => handleShare(post._id)}>
                      🔗 Share
                    </button>
                  </div>

                  {isExpanded && (
                    <div className={styles.commentsSection}>
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
                          <button className={styles.commentSubmitBtn} onClick={() => handleCommentSubmit(post._id)}>
                            Post
                          </button>
                        </div>
                      </div>

                      {comments.length === 0 ? (
                        <p className={styles.noComments}>Be the first to comment!</p>
                      ) : (
                        comments.map((c) => (
                          <div key={c._id} className={styles.commentItem}>
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
                                  <button className={styles.deleteCommentBtn} onClick={() => dispatch(deleteComment({ token, commentId: c._id }))}>✕</button>
                                )}
                              </div>
                              <p className={styles.commentText}>{c.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className={styles.rightSidebar}>
          <div className={styles.discoverCard}>
            <h4 className={styles.sideCardTitle}>People You May Know</h4>
            {suggestedUsers.length === 0 ? (
              <p className={styles.noSuggestions}>You are connected with everyone!</p>
            ) : (
              suggestedUsers.map((u) => (
                <div key={u._id} className={styles.suggestedUser}>
                  <img
                    src={
                      u.userId?.profilePicture && u.userId.profilePicture !== "default.jpg"
                        ? `${BASE_URL}/${u.userId.profilePicture}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userId?.name || "U")}&background=0ea5e9&color=fff`
                    }
                    alt="user"
                    className={styles.suggestedAvatar}
                    onClick={() => router.push(`/view_profile/${u.userId?.username}`)}
                  />
                  <div className={styles.suggestedInfo}>
                    <p className={styles.suggestedName} onClick={() => router.push(`/view_profile/${u.userId?.username}`)}>
                      {u.userId?.name}
                    </p>
                    {u.currentPost && <p className={styles.suggestedPosition}>{u.currentPost}</p>}
                  </div>
                  <button className={styles.connectBtn} onClick={() => dispatch(sendConnectionRequest({ token, connectionId: u.userId?._id }))}>
                    +
                  </button>
                </div>
              ))
            )}
            <div className={styles.seeAllLink} onClick={() => router.push("/discover")}>
              See all people →
            </div>
          </div>
        </aside>
      </div>
    </UserLayout>
  );
}
