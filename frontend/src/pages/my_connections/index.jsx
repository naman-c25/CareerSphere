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

const BASE_URL = "http://localhost:9090";

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

  return (
    <UserLayout>
      <div className={styles.connectionsContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Network</h1>
          <p className={styles.pageSubtitle}>Manage your professional connections</p>
        </div>

        {successMsg && <div className={styles.successToast}>{successMsg}</div>}
        {profileState.isError && <div className={styles.errorToast}>{profileState.message}</div>}

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{accepted.length}</span>
            <span className={styles.statLabel}>Accepted</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{pending.length}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{sent.length}</span>
            <span className={styles.statLabel}>Requests Sent</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "incoming" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("incoming")}
          >
            Requests Received
            {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${activeTab === "accepted" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("accepted")}
          >
            My Connections
          </button>
          <button
            className={`${styles.tab} ${activeTab === "sent" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent Requests
          </button>
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Incoming / Pending */}
          {activeTab === "incoming" && (
            <>
              {pending.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📭</div>
                  <p>No pending connection requests.</p>
                  <button className={styles.discoverBtn} onClick={() => router.push("/discover")}>
                    Discover People
                  </button>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {pending.map((req) => {
                    const u = req.userId;
                    return (
                      <div key={req._id} className={styles.connectionCard}>
                        <img
                          src={
                            u?.profilePicture && u.profilePicture !== "default.jpg"
                              ? `${BASE_URL}/${u.profilePicture}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=1e3a8a&color=fff&size=80`
                          }
                          alt={u?.name}
                          className={styles.cardAvatar}
                          onClick={() => router.push(`/view_profile/${u?.username}`)}
                        />
                        <div className={styles.cardInfo}>
                          <h3
                            className={styles.cardName}
                            onClick={() => router.push(`/view_profile/${u?.username}`)}
                          >
                            {u?.name || "Unknown"}
                          </h3>
                          <p className={styles.cardUsername}>@{u?.username}</p>
                        </div>
                        <div className={styles.cardActions}>
                          <button className={styles.acceptBtn} onClick={() => handleAccept(req._id)}>
                            ✓ Accept
                          </button>
                          <button className={styles.rejectBtn} onClick={() => handleReject(req._id)}>
                            ✕ Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Accepted Connections */}
          {activeTab === "accepted" && (
            <>
              {accepted.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🤝</div>
                  <p>No connections yet. Start connecting with people!</p>
                  <button className={styles.discoverBtn} onClick={() => router.push("/discover")}>
                    Discover People
                  </button>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {accepted.map((req) => {
                    const u = req.userId;
                    return (
                      <div key={req._id} className={styles.connectionCard}>
                        <img
                          src={
                            u?.profilePicture && u.profilePicture !== "default.jpg"
                              ? `${BASE_URL}/${u.profilePicture}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=10b981&color=fff&size=80`
                          }
                          alt={u?.name}
                          className={styles.cardAvatar}
                          onClick={() => router.push(`/view_profile/${u?.username}`)}
                        />
                        <div className={styles.cardInfo}>
                          <h3
                            className={styles.cardName}
                            onClick={() => router.push(`/view_profile/${u?.username}`)}
                          >
                            {u?.name || "Unknown"}
                          </h3>
                          <p className={styles.cardUsername}>@{u?.username}</p>
                        </div>
                        <div className={styles.cardActions}>
                          <span className={styles.connectedBadge}>✓ Connected</span>
                          <button
                            className={styles.viewProfileBtn}
                            onClick={() => router.push(`/view_profile/${u?.username}`)}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Sent Requests */}
          {activeTab === "sent" && (
            <>
              {sent.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📤</div>
                  <p>You haven't sent any requests yet.</p>
                  <button className={styles.discoverBtn} onClick={() => router.push("/discover")}>
                    Discover People
                  </button>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {sent.map((req) => {
                    const u = req.connectionId;
                    return (
                      <div key={req._id} className={styles.connectionCard}>
                        <img
                          src={
                            u?.profilePicture && u.profilePicture !== "default.jpg"
                              ? `${BASE_URL}/${u.profilePicture}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || "U")}&background=6366f1&color=fff&size=80`
                          }
                          alt={u?.name}
                          className={styles.cardAvatar}
                          onClick={() => router.push(`/view_profile/${u?.username}`)}
                        />
                        <div className={styles.cardInfo}>
                          <h3
                            className={styles.cardName}
                            onClick={() => router.push(`/view_profile/${u?.username}`)}
                          >
                            {u?.name || "Unknown"}
                          </h3>
                          <p className={styles.cardUsername}>@{u?.username}</p>
                        </div>
                        <div className={styles.cardActions}>
                          <span
                            className={
                              req.status_accepted === true
                                ? styles.connectedBadge
                                : styles.pendingBadge
                            }
                          >
                            {req.status_accepted === true ? "✓ Connected" : "⏳ Pending"}
                          </span>
                          {req.status_accepted === true && (
                            <button
                              className={styles.viewProfileBtn}
                              onClick={() => router.push(`/view_profile/${u?.username}`)}
                            >
                              View Profile
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
