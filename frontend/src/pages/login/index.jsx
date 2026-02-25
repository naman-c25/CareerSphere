import UserLayout from '@/layout/UserLayout'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser, registerUser } from '@/config/redux/action/authAction'
import { reset } from '@/config/redux/reducer/authReducer'
import styles from "./style.module.css"

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
        <div className={styles.card}>

          <div className={styles.formPanel}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${isLogin ? styles.activeTab : ''}`}
                onClick={() => handleTabSwitch(true)}
                type="button"
              >
                Login
              </button>
              <button
                className={`${styles.tab} ${!isLogin ? styles.activeTab : ''}`}
                onClick={() => handleTabSwitch(false)}
                type="button"
              >
                Sign Up
              </button>
            </div>

            <h2 className={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              {!isLogin && (
                <div className={styles.row}>
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
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    className={styles.input}
                    required
                  />
                </div>
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                required
              />

              {authState.isError && (
                <p className={styles.error}>{authState.message}</p>
              )}
              {authState.isSuccess && !authState.loggedIn && (
                <p className={styles.success}>{authState.message}</p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={authState.isLoading}
              >
                {authState.isLoading
                  ? isLogin ? 'Logging in...' : 'Creating account...'
                  : isLogin ? 'Login' : 'Sign Up'}
              </button>
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
          </div>

          <div className={styles.bluePanel}>
            <h2 className={styles.panelTitle}>Career Sphere</h2>
            <p className={styles.panelSub}>Connect. Grow. Succeed.</p>
          </div>

        </div>
      </div>
    </UserLayout>
  )
}
