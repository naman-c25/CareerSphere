import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/config/redux/reducer/authReducer";
import { motion, AnimatePresence } from "framer-motion";

export default function UserLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!(token || authState.loggedIn));
  }, [authState.loggedIn]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  const navLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Discover", path: "/discover" },
    { label: "Connections", path: "/my_connections" },
  ];

  return (
    <>
      <nav className={styles.navbar}>
        <motion.div
          className={styles.brand}
          onClick={() => router.push("/")}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          CareerSphere
        </motion.div>

        {isLoggedIn ? (
          <>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <motion.div
                  key={link.path}
                  className={`${styles.navLink} ${router.pathname === link.path ? styles.activeLink : ""}`}
                  onClick={() => router.push(link.path)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {link.label}
                </motion.div>
              ))}
            </div>

            <div className={styles.navRight}>
              <motion.div
                className={styles.profileBtn}
                onClick={() => setMenuOpen((prev) => !prev)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={styles.avatarCircle}>Me</div>
                <span className={styles.chevron}>{menuOpen ? "▲" : "▼"}</span>
              </motion.div>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className={styles.dropdownMenu}
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  >
                    <div
                      className={styles.dropdownItem}
                      onClick={() => { setMenuOpen(false); router.push("/dashboard"); }}
                    >
                      My Profile
                    </div>
                    <div className={styles.dropdownDivider} />
                    <div
                      className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                    >
                      Logout
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <motion.div
            className={styles.loginBtn}
            onClick={() => router.push("/login")}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign In
          </motion.div>
        )}
      </nav>
      <div className={styles.pageContent}>{children}</div>
    </>
  );
}
