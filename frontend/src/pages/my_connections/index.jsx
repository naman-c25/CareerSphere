import React, { useEffect, useState } from "react";
import UserLayout from "@/layout/UserLayout";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import {
  getUserAndProfile,
  getMyConnectionRequests,
  getIncomingRequests,
  acceptOrRejectConnection,
} from "@/config/redux/action/userAction";
import { resetProfileState } from "@/config/redux/reducer/profileReducer";
import styles from "./styles.module.css";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

export default function MyConnections() {
  const router = useRouter();
  const dispatch = useDispatch();

  const profileState = useSelector((state) => state.profile);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("incoming");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    dispatch(getUserAndProfile(t));
    dispatch(getMyConnectionRequests(t));
    dispatch(getIncomingRequests(t));
  }, []);

  const handleAccept = async (requestId) => {
    await dispatch(acceptOrRejectConnection({ token, requestId, action_type: "accept" }));
    showSuccess("Connection accepted!");
    dispatch(getIncomingRequests(token));
    dispatch(getMyConnectionRequests(token));
  };

  const handleReject = async (requestId) => {
    await dispatch(acceptOrRejectConnection({ token, requestId, action_type: "reject" }));
    showSuccess("Request removed.");
    dispatch(getIncomingRequests(token));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(""); dispatch(resetProfileState()); }, 2500);
  };

  const incoming = profileState.incomingRequests || [];
  const sent = profileState.sentRequests || [];
  const accepted = incoming.filter((r) => r.status_accepted === true);
  const pending = incoming.filter((r) => r.status_accepted === null || r.status_accepted === undefined || r.status_accepted === false);

  const tabs = [
    { id: "incoming", label: "Requests Received", count: pending.length },
    { id: "accepted", label: "My Connections", count: null },
    { id: "sent", label: "Sent Requests", count: null },
  ];

  const renderConnectionCard = (key, u, actions, index) => (
    <motion.div
      key={key}
      className={styles.connectionCard}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
    >
      <motion.img
        src={
          u?.profilePicture && u.profilePicture !== "default.jpg"
            ? `${BASE_URL}/${u.profilePicture}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=1e3a8a&color=fff&size=80`
        }
        alt={u?.name}
        className={styles.cardAvatar}
        onClick={() => router.push(`/view_profile/${u?.username}`)}
        whileHover={{ scale: 1.06 }}
      />
      <div className={styles.cardInfo}>
        <h3 className={styles.cardName} onClick={() => router.push(`/view_profile/${u?.username}`)}>
          {u?.name || "Unknown"}
        </h3>
        <p className={styles.cardUsername}>@{u?.username}</p>
      </div>
      <div className={styles.cardActions}>{actions}</div>
    </motion.div>
  );

  return (
    <UserLayout>
      <div className={styles.connectionsContainer}>
        <motion.div
          className={styles.pageHeader}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.pageTitle}>My <span>Network</span></h1>
          <p className={styles.pageSubtitle}>Manage your professional connections</p>
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

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          {[
            { num: accepted.length, label: "Accepted" },
            { num: pending.length, label: "Pending" },
            { num: sent.length, label: "Requests Sent" },
          ].map((s, i) => (
            <motion.div
              key={i}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -3 }}
            >
              <span className={styles.statNum}>{s.num}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <motion.div
          className={styles.tabs}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.97 }}
            >
              {tab.label}
              {tab.count > 0 && <span className={styles.badge}>{tab.count}</span>}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          className={styles.tabContent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <AnimatePresence mode="wait">
            {/* Incoming / Pending */}
            {activeTab === "incoming" && (
              <motion.div
                key="incoming"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {pending.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <p>No pending connection requests.</p>
                    <motion.button
                      className={styles.discoverBtn}
                      onClick={() => router.push("/discover")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Discover People
                    </motion.button>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {pending.map((req, i) =>
                      renderConnectionCard(req._id, req.userId, (
                        <>
                          <motion.button className={styles.acceptBtn} onClick={() => handleAccept(req._id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            ✓ Accept
                          </motion.button>
                          <motion.button className={styles.rejectBtn} onClick={() => handleReject(req._id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            ✕ Decline
                          </motion.button>
                        </>
                      ), i)
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Accepted Connections */}
            {activeTab === "accepted" && (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {accepted.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🤝</div>
                    <p>No connections yet. Start connecting with people!</p>
                    <motion.button className={styles.discoverBtn} onClick={() => router.push("/discover")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      Discover People
                    </motion.button>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {accepted.map((req, i) =>
                      renderConnectionCard(req._id, req.userId, (
                        <>
                          <span className={styles.connectedBadge}>✓ Connected</span>
                          <motion.button className={styles.viewProfileBtn} onClick={() => router.push(`/view_profile/${req.userId?.username}`)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                            View Profile
                          </motion.button>
                        </>
                      ), i)
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Sent Requests */}
            {activeTab === "sent" && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                {sent.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📤</div>
                    <p>You haven't sent any requests yet.</p>
                    <motion.button className={styles.discoverBtn} onClick={() => router.push("/discover")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      Discover People
                    </motion.button>
                  </div>
                ) : (
                  <div className={styles.cardGrid}>
                    {sent.map((req, i) => {
                      const u = req.connectionId;
                      return renderConnectionCard(req._id, u, (
                        <>
                          <span className={req.status_accepted === true ? styles.connectedBadge : styles.pendingBadge}>
                            {req.status_accepted === true ? "✓ Connected" : "⏳ Pending"}
                          </span>
                          {req.status_accepted === true && (
                            <motion.button className={styles.viewProfileBtn} onClick={() => router.push(`/view_profile/${u?.username}`)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                              View Profile
                            </motion.button>
                          )}
                        </>
                      ), i);
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </UserLayout>
  );
}
