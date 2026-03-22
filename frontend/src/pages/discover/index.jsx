import React, { useEffect, useState } from "react";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { getAllUsers, sendConnectionRequest, getUserAndProfile, getMyConnectionRequests } from "@/config/redux/action/userAction";
import { resetProfileState } from "@/config/redux/reducer/profileReducer";
import styles from "./styles.module.css";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Discover() {
  const router = useRouter();
  const dispatch = useDispatch();

  const profileState = useSelector((state) => state.profile);
  const [token, setToken] = useState(null);
  const [search, setSearch] = useState("");
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    dispatch(getUserAndProfile(t));
    dispatch(getAllUsers());
    dispatch(getMyConnectionRequests(t));
  }, []);

  useEffect(() => {
    const sent = new Set(
      (profileState.sentRequests || []).map((r) => String(r.connectionId?._id || r.connectionId))
    );
    setRequestedIds(sent);
  }, [profileState.sentRequests]);

  const handleConnect = async (connectionId) => {
    const result = await dispatch(sendConnectionRequest({ token, connectionId }));
    if (!result.error) {
      setRequestedIds((prev) => new Set([...prev, String(connectionId)]));
      setSuccessMsg("Connection request sent!");
      setTimeout(() => {
        setSuccessMsg("");
        dispatch(resetProfileState());
      }, 2500);
    }
  };

  const myUserId = profileState.profile?.userId?._id;
  const allUsers = profileState.allUsers || [];

  const filteredUsers = allUsers.filter((u) => {
    if (String(u.userId?._id) === String(myUserId)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.userId?.name?.toLowerCase().includes(q) ||
      u.userId?.username?.toLowerCase().includes(q) ||
      u.currentPost?.toLowerCase().includes(q)
    );
  });

  return (
    <UserLayout>
      <div className={styles.discoverContainer}>
        <motion.div
          className={styles.discoverHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.discoverTitle}>
            Discover <span>People</span>
          </h1>
          <p className={styles.discoverSubtitle}>Grow your professional network</p>
          <motion.div
            className={styles.searchWrap}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name, username or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </motion.div>
        </motion.div>

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

        {profileState.isLoading && allUsers.length === 0 ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonLine} style={{ width: "60%", margin: "0 auto" }} />
                <div className={styles.skeletonLine} style={{ width: "45%", margin: "0.4rem auto 0" }} />
                <div className={styles.skeletonBtn} />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.emptyIcon}>🔭</div>
            <p>{search ? "No users found matching your search." : "No other users yet."}</p>
          </motion.div>
        ) : (
          <div className={styles.grid}>
            {filteredUsers.map((u, i) => {
              const isConnected = requestedIds.has(String(u.userId?._id));
              return (
                <motion.div
                  key={u._id}
                  className={styles.userCard}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(59, 130, 246, 0.18)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={styles.cardCover} />
                  <div className={styles.cardAvatarWrap}>
                    <motion.img
                      src={
                        u.userId?.profilePicture && u.userId.profilePicture !== "default.jpg"
                          ? `${BASE_URL}/${u.userId.profilePicture}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userId?.name || "U")}&background=1e3a8a&color=fff&size=100`
                      }
                      alt={u.userId?.name}
                      className={styles.cardAvatar}
                      onClick={() => router.push(`/view_profile/${u.userId?.username}`)}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <h3
                      className={styles.cardName}
                      onClick={() => router.push(`/view_profile/${u.userId?.username}`)}
                    >
                      {u.userId?.name}
                    </h3>
                    <p className={styles.cardUsername}>@{u.userId?.username}</p>
                    {u.currentPost && <p className={styles.cardRole}>{u.currentPost}</p>}
                    {u.bio && <p className={styles.cardBio}>{u.bio}</p>}
                    {u.pastWork && u.pastWork.length > 0 && (
                      <p className={styles.cardWork}>
                        {u.pastWork[0].position} @ {u.pastWork[0].company}
                      </p>
                    )}
                  </div>
                  <div className={styles.cardFooter}>
                    <motion.button
                      className={styles.viewBtn}
                      onClick={() => router.push(`/view_profile/${u.userId?.username}`)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      View Profile
                    </motion.button>
                    <motion.button
                      className={isConnected ? styles.requestedBtn : styles.connectBtn}
                      disabled={isConnected}
                      onClick={() => !isConnected && handleConnect(u.userId?._id)}
                      whileHover={{ scale: isConnected ? 1 : 1.05 }}
                      whileTap={{ scale: isConnected ? 1 : 0.95 }}
                    >
                      {isConnected ? "✓ Requested" : "+ Connect"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
