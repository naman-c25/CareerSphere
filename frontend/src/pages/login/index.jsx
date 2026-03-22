import UserLayout from '@/layout/UserLayout'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser, registerUser } from '@/config/redux/action/authAction'
import { reset } from '@/config/redux/reducer/authReducer'
import styles from "./style.module.css"
import { motion, AnimatePresence } from 'framer-motion'

export default function LoginComponent() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
  })

  const authState = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const router = useRouter()

  useEffect(() => {
    if (authState.loggedIn) {
      router.push("/dashboard")
    }
  }, [authState.loggedIn, router])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode)
    dispatch(reset())
    setForm({ username: '', name: '', email: '', password: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(reset())
    if (isLogin) {
      dispatch(loginUser({ email: form.email, password: form.password }))
    } else {
      dispatch(registerUser({
        username: form.username,
        name: form.name,
        email: form.email,
        password: form.password,
      }))
    }
  }

  return (
    <UserLayout>
      <div className={styles.container}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className={styles.formPanel}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className={styles.tabs}>
              {["Login", "Sign Up"].map((label, i) => {
                const active = i === 0 ? isLogin : !isLogin
                return (
                  <motion.button
                    key={label}
                    className={`${styles.tab} ${active ? styles.activeTab : ''}`}
                    onClick={() => handleTabSwitch(i === 0)}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                  >
                    {label}
                  </motion.button>
                )
              })}
            </div>

            <motion.h2
              className={styles.title}
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </motion.h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    className={styles.row}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={form.username}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={handleChange}
                      className={styles.input}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.input
                type="email"
                name="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                required
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
              />

              <motion.input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                required
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.15 }}
              />

              <AnimatePresence>
                {authState.isError && (
                  <motion.p
                    className={styles.error}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    ✕ {authState.message}
                  </motion.p>
                )}
                {authState.isSuccess && !authState.loggedIn && (
                  <motion.p
                    className={styles.success}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    ✓ {authState.message}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className={styles.submitBtn}
                disabled={authState.isLoading}
                whileHover={{ scale: authState.isLoading ? 1 : 1.02 }}
                whileTap={{ scale: authState.isLoading ? 1 : 0.97 }}
              >
                {authState.isLoading
                  ? (isLogin ? 'Logging in...' : 'Creating account...')
                  : (isLogin ? 'Login →' : 'Sign Up →')}
              </motion.button>
            </form>

            <p className={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span
                className={styles.switchLink}
                onClick={() => handleTabSwitch(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </span>
            </p>
          </motion.div>

          <motion.div
            className={styles.bluePanel}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              className={styles.panelIcon}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              🌐
            </motion.div>
            <h2 className={styles.panelTitle}>CareerSphere</h2>
            <p className={styles.panelSub}>Connect. Grow. Succeed.</p>
            <div className={styles.panelFeatures}>
              {[
                { icon: "✦", text: "Real professional stories" },
                { icon: "✦", text: "Genuine connections" },
                { icon: "✦", text: "No bluffs, just truth" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className={styles.panelFeatureItem}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </UserLayout>
  )
}
