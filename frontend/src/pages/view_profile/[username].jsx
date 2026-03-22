import React, { useEffect, useState } from "react";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import {
  getUserAndProfile,
  getUserProfileByUsername,
  sendConnectionRequest,
  getMyConnectionRequests,
  updateProfileData,
  downloadResume,
  uploadProfilePicture,
} from "@/config/redux/action/userAction";
import { resetProfileState } from "@/config/redux/reducer/profileReducer";
import styles from "./styles.module.css";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = "http://localhost:9090";

export default function ViewProfile() {
  const router = useRouter();
  const { username } = router.query;
  const dispatch = useDispatch();

  const profileState = useSelector((state) => state.profile);
  const [token, setToken] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", currentPost: "" });
  const [addWorkMode, setAddWorkMode] = useState(false);
  const [workForm, setWorkForm] = useState({ company: "", position: "", years: "" });
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    dispatch(getUserAndProfile(t));
    dispatch(getMyConnectionRequests(t));
  }, []);

  useEffect(() => {
    if (!username) return;
    dispatch(getUserProfileByUsername(username));
  }, [username]);

  useEffect(() => {
    const me = profileState.profile;
    const viewed = profileState.viewedProfile;
    if (!me || !viewed) return;
    const mine = String(me.userId?._id) === String(viewed.userId?._id);
    setIsOwner(mine);
    if (mine && viewed) {
      setEditForm({ bio: viewed.bio || "", currentPost: viewed.currentPost || "" });
    }
    const sentIds = (profileState.sentRequests || []).map((r) => String(r.connectionId?._id || r.connectionId));
    setRequestSent(sentIds.includes(String(viewed.userId?._id)));
  }, [profileState.profile, profileState.viewedProfile, profileState.sentRequests]);

  const handleConnect = async () => {
    if (!profileState.viewedProfile) return;
    const result = await dispatch(sendConnectionRequest({ token, connectionId: profileState.viewedProfile.userId?._id }));
    if (!result.error) {
      setRequestSent(true);
      showSuccess("Connection request sent!");
    }
  };

  const handleEditSave = async () => {
    await dispatch(updateProfileData({ token, ...editForm }));
    dispatch(getUserProfileByUsername(username));
    setEditMode(false);
    showSuccess("Profile updated!");
  };

  const handleAddWork = async () => {
    if (!workForm.company || !workForm.position || !workForm.years) return;
    const currentWork = profileState.viewedProfile?.pastWork || [];
    await dispatch(updateProfileData({ token, pastWork: [...currentWork, workForm] }));
    dispatch(getUserProfileByUsername(username));
    setWorkForm({ company: "", position: "", years: "" });
    setAddWorkMode(false);
    showSuccess("Work experience added!");
  };

  const handlePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("token", token);
    fd.append("profile_picture", file);
    await dispatch(uploadProfilePicture(fd));
    dispatch(getUserAndProfile(token));
    dispatch(getUserProfileByUsername(username));
    showSuccess("Profile picture updated!");
  };

  const handleDownloadResume = async () => {
    const userId = profileState.viewedProfile?.userId?._id;
    if (!userId) return;
    const result = await dispatch(downloadResume(userId));
    if (!result.error) {
      const url = `${BASE_URL}/${result.payload}`;
      window.open(url, "_blank");
      showSuccess("Resume downloaded!");
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(""); dispatch(resetProfileState()); }, 3000);
  };

  const viewed = profileState.viewedProfile;

  return (
    <UserLayout>
      <div className={styles.profileContainer}>
        {profileState.isLoading && !viewed ? (
          <div className={styles.skeletonPage}>
            <div className={styles.skeletonCover} />
            <div className={styles.skeletonProfileRow}>
              <div className={styles.skeletonAvatar} />
              <div className={styles.skeletonLines}>
                <div className={styles.skeletonLine} style={{ width: 160 }} />
                <div className={styles.skeletonLine} style={{ width: 100, marginTop: 8 }} />
              </div>
            </div>
          </div>
        ) : !viewed ? (
          <motion.div
            className={styles.notFound}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.notFoundIcon}>🔍</div>
            <p>Profile not found.</p>
            <motion.button
              className={styles.backBtn}
              onClick={() => router.back()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              ← Go Back
            </motion.button>
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  className={styles.successToast}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ✓ {successMsg}
                </motion.div>
              )}
              {profileState.isError && (
                <motion.div
                  className={styles.errorToast}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {profileState.message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Profile Hero */}
            <motion.div
              className={styles.profileHero}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.heroCover} />
              <div className={styles.heroContent}>
                <div className={styles.avatarSection}>
                  <motion.div
                    className={styles.avatarWrap}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <motion.img
                      src={
                        viewed.userId?.profilePicture && viewed.userId.profilePicture !== "default.jpg"
                          ? `${BASE_URL}/${viewed.userId.profilePicture}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewed.userId?.name || "U")}&background=1e3a8a&color=fff&size=120`
                      }
                      alt="avatar"
                      className={styles.heroAvatar}
                      whileHover={{ scale: 1.04 }}
                    />
                    {isOwner && (
                      <label className={styles.changePhotoBtn}>
                        <input type="file" accept="image/*" onChange={handlePicUpload} style={{ display: "none" }} />
                        📷
                      </label>
                    )}
                  </motion.div>
                </div>

                <div className={styles.heroInfo}>
                  <div className={styles.heroTop}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25, duration: 0.45 }}
                    >
                      <h1 className={styles.heroName}>{viewed.userId?.name}</h1>
                      <p className={styles.heroUsername}>@{viewed.userId?.username}</p>
                      {viewed.currentPost && <p className={styles.heroRole}>{viewed.currentPost}</p>}
                    </motion.div>
                    <motion.div
                      className={styles.heroActions}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.45 }}
                    >
                      {isOwner ? (
                        <>
                          <motion.button
                            className={styles.editBtn}
                            onClick={() => setEditMode(!editMode)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {editMode ? "Cancel" : "✏️ Edit Profile"}
                          </motion.button>
                          <motion.button
                            className={styles.resumeBtn}
                            onClick={handleDownloadResume}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            📄 Download Resume
                          </motion.button>
                        </>
                      ) : (
                        <motion.button
                          className={requestSent ? styles.requestedBtn : styles.connectBtn}
                          disabled={requestSent}
                          onClick={handleConnect}
                          whileHover={{ scale: requestSent ? 1 : 1.05 }}
                          whileTap={{ scale: requestSent ? 1 : 0.96 }}
                        >
                          {requestSent ? "✓ Request Sent" : "Connect"}
                        </motion.button>
                      )}
                    </motion.div>
                  </div>

                  {viewed.bio && !editMode && (
                    <motion.p
                      className={styles.heroBio}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {viewed.bio}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Edit Profile Form */}
              <AnimatePresence>
                {editMode && isOwner && (
                  <motion.div
                    className={styles.editForm}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className={styles.editFormTitle}>Edit Profile</h3>
                    <div className={styles.editFormGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Bio</label>
                        <textarea
                          className={styles.editTextarea}
                          value={editForm.bio}
                          onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                          placeholder="Tell your story..."
                          rows={3}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Current Position</label>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editForm.currentPost}
                          onChange={(e) => setEditForm((p) => ({ ...p, currentPost: e.target.value }))}
                          placeholder="e.g. Software Engineer at Google"
                        />
                      </div>
                    </div>
                    <motion.button
                      className={styles.saveBtn}
                      onClick={handleEditSave}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Save Changes
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* About */}
            {viewed.bio && (
              <motion.div
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.aboutText}>{viewed.bio}</p>
              </motion.div>
            )}

            {/* Work Experience */}
            <motion.div
              className={styles.section}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Work Experience</h2>
                {isOwner && (
                  <motion.button
                    className={styles.addBtn}
                    onClick={() => setAddWorkMode(!addWorkMode)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {addWorkMode ? "Cancel" : "+ Add"}
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {addWorkMode && isOwner && (
                  <motion.div
                    className={styles.addWorkForm}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.editFormGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Company</label>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={workForm.company}
                          onChange={(e) => setWorkForm((p) => ({ ...p, company: e.target.value }))}
                          placeholder="Company name"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Position</label>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={workForm.position}
                          onChange={(e) => setWorkForm((p) => ({ ...p, position: e.target.value }))}
                          placeholder="Job title"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Years</label>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={workForm.years}
                          onChange={(e) => setWorkForm((p) => ({ ...p, years: e.target.value }))}
                          placeholder="e.g. 2020 - 2023"
                        />
                      </div>
                    </div>
                    <motion.button
                      className={styles.saveBtn}
                      onClick={handleAddWork}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Add Work
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!viewed.pastWork || viewed.pastWork.length === 0 ? (
                <div className={styles.emptySection}>No work experience added yet.</div>
              ) : (
                <div className={styles.workList}>
                  {viewed.pastWork.map((w, i) => (
                    <motion.div
                      key={i}
                      className={styles.workItem}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.35 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className={styles.workIcon}>🏢</div>
                      <div className={styles.workDetails}>
                        <h4 className={styles.workPosition}>{w.position}</h4>
                        <p className={styles.workCompany}>{w.company}</p>
                        <p className={styles.workYears}>{w.years}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Education */}
            {viewed.education && viewed.education.length > 0 && (
              <motion.div
                className={styles.section}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <h2 className={styles.sectionTitle}>Education</h2>
                <div className={styles.workList}>
                  {viewed.education.map((e, i) => (
                    <motion.div
                      key={i}
                      className={styles.workItem}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ x: 4 }}
                    >
                      <div className={styles.workIcon}>🎓</div>
                      <div className={styles.workDetails}>
                        <h4 className={styles.workPosition}>{e.degree} in {e.fieldOfStudy}</h4>
                        <p className={styles.workCompany}>{e.school}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
