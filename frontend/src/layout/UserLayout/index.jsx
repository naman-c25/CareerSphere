import React, { useEffect, useState } from "react";
import styles from "./styles.module.css";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/config/redux/reducer/authReducer";

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
        <div className={styles.brand} onClick={() => router.push("/")}>
          CareerSphere
        </div>

        {isLoggedIn ? (
          <>
            <div className={styles.navLinks}>
              {navLinks.map((link) => (
                <div
                  key={link.path}
                  className={`${styles.navLink} ${router.pathname === link.path ? styles.activeLink : ""}`}
                  onClick={() => router.push(link.path)}
                >
                  {link.label}
                </div>
              ))}
            </div>

            <div className={styles.navRight}>
              <div
                className={styles.profileBtn}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <div className={styles.avatarCircle}>Me</div>
                <span className={styles.chevron}>{menuOpen ? "▲" : "▼"}</span>
              </div>

              {menuOpen && (
                <div className={styles.dropdownMenu}>
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
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.loginBtn} onClick={() => router.push("/login")}>
            Sign In
          </div>
        )}
      </nav>
      <div className={styles.pageContent}>{children}</div>
    </>
  );
}
