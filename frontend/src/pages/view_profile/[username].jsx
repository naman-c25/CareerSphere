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
  updateUserInfo,
  downloadResume,
  uploadProfilePicture,
} from "@/config/redux/action/userAction";
import { resetProfileState, clearResume } from "@/config/redux/reducer/profileReducer";
import styles from "./styles.module.css";

const BASE_URL = "http://localhost:9090";

export default function ViewProfile() {
  const router = useRouter();
  const { username } = router.query;
  const dispatch = useDispatch();

  const profileState = useSelector((state) => state.profile);
  const [token, setToken] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Edit profile states
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", currentPost: "" });
  const [addWorkMode, setAddWorkMode] = useState(false);
  const [workForm, setWorkForm] = useState({ company: "", position: "", years: "" });
  const [picFile, setPicFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [resumeUrl, setResumeUrl] = useState(null);

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

  // Determine if viewer is profile owner
  useEffect(() => {
    const me = profileState.profile;
    const viewed = profileState.viewedProfile;
    if (!me || !viewed) return;
    const mine = String(me.userId?._id) === String(viewed.userId?._id);
    setIsOwner(mine);
    if (mine && viewed) {
      setEditForm({ bio: viewed.bio || "", currentPost: viewed.currentPost || "" });
    }
    // Check connection
    const sentIds = (profileState.sentRequests || []).map((r) => String(r.connectionId?._id || r.connectionId));
    setRequestSent(sentIds.includes(String(viewed.userId?._id)));
  }, [profileState.profile, profileState.viewedProfile, profileState.sentRequests]);

  // Resume handling
  useEffect(() => {
    if (profileState.resumeFile) {
      setResumeUrl(`${BASE_URL}/${profileState.resumeFile}`);
    }
  }, [profileState.resumeFile]);

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
    setPicFile(file);
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
          <div className={styles.notFound}>
            <div className={styles.notFoundIcon}>🔍</div>
            <p>Profile not found.</p>
            <button className={styles.backBtn} onClick={() => router.back()}>← Go Back</button>
          </div>
        ) : (
          <>
            {successMsg && <div className={styles.successToast}>{successMsg}</div>}
            {profileState.isError && <div className={styles.errorToast}>{profileState.message}</div>}

            {/* Profile Hero */}
            <div className={styles.profileHero}>
              <div className={styles.heroCover} />
              <div className={styles.heroContent}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrap}>
                    <img
                      src={
                        viewed.userId?.profilePicture && viewed.userId.profilePicture !== "default.jpg"
                          ? `${BASE_URL}/${viewed.userId.profilePicture}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(viewed.userId?.name || "U")}&background=1e3a8a&color=fff&size=120`
                      }
                      alt="avatar"
                      className={styles.heroAvatar}
                    />
                    {isOwner && (
                      <label className={styles.changePhotoBtn}>
                        <input type="file" accept="image/*" onChange={handlePicUpload} style={{ display: "none" }} />
                        📷
                      </label>
                    )}
                  </div>
                </div>

                <div className={styles.heroInfo}>
                  <div className={styles.heroTop}>
                    <div>
                      <h1 className={styles.heroName}>{viewed.userId?.name}</h1>
                      <p className={styles.heroUsername}>@{viewed.userId?.username}</p>
                      {viewed.currentPost && <p className={styles.heroRole}>{viewed.currentPost}</p>}
                    </div>
                    <div className={styles.heroActions}>
                      {isOwner ? (
                        <>
                          <button className={styles.editBtn} onClick={() => setEditMode(!editMode)}>
                            {editMode ? "Cancel" : "✏️ Edit Profile"}
                          </button>
                          <button className={styles.resumeBtn} onClick={handleDownloadResume}>
                            📄 Download Resume
                          </button>
                        </>
                      ) : (
                        <button
                          className={requestSent ? styles.requestedBtn : styles.connectBtn}
                          disabled={requestSent}
                          onClick={handleConnect}
                        >
                          {requestSent ? "✓ Request Sent" : "Connect"}
                        </button>
                      )}
                    </div>
                  </div>

                  {viewed.bio && !editMode && (
                    <p className={styles.heroBio}>{viewed.bio}</p>
                  )}
                </div>
              </div>

              {/* Edit Profile Form */}
              {editMode && isOwner && (
                <div className={styles.editForm}>
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
                  <button className={styles.saveBtn} onClick={handleEditSave}>
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* About */}
            {viewed.bio && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <p className={styles.aboutText}>{viewed.bio}</p>
              </div>
            )}

            {/* Work Experience */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Work Experience</h2>
                {isOwner && (
                  <button className={styles.addBtn} onClick={() => setAddWorkMode(!addWorkMode)}>
                    {addWorkMode ? "Cancel" : "+ Add"}
                  </button>
                )}
              </div>

              {addWorkMode && isOwner && (
                <div className={styles.addWorkForm}>
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
                  <button className={styles.saveBtn} onClick={handleAddWork}>
                    Add Work
                  </button>
                </div>
              )}

              {!viewed.pastWork || viewed.pastWork.length === 0 ? (
                <div className={styles.emptySection}>No work experience added yet.</div>
              ) : (
                <div className={styles.workList}>
                  {viewed.pastWork.map((w, i) => (
                    <div key={i} className={styles.workItem}>
                      <div className={styles.workIcon}>🏢</div>
                      <div className={styles.workDetails}>
                        <h4 className={styles.workPosition}>{w.position}</h4>
                        <p className={styles.workCompany}>{w.company}</p>
                        <p className={styles.workYears}>{w.years}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education */}
            {viewed.education && viewed.education.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Education</h2>
                <div className={styles.workList}>
                  {viewed.education.map((e, i) => (
                    <div key={i} className={styles.workItem}>
                      <div className={styles.workIcon}>🎓</div>
                      <div className={styles.workDetails}>
                        <h4 className={styles.workPosition}>{e.degree} in {e.fieldOfStudy}</h4>
                        <p className={styles.workCompany}>{e.school}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
}
