"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import styles from "./Login.module.css"; 
import { API_BASE, setAuth, clearAuth } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response fallback
      }

      if (res.ok && data.token) {
        setAuth(data.token, { 
          id: data.id,
          email: data.email, 
          name: data.name, 
          role: data.role 
        });
        const userRole = (data.role || "").toUpperCase();
        const userEmail = (data.email || "").toLowerCase().trim();

        if (userRole === "ADMIN" && (userEmail === "karthi@gmail.com" || userEmail === "admin@inventory.com")) {
          setSuccessMessage("Admin authenticated! Redirecting to Admin Dashboard...");
          setTimeout(() => {
            router.push("/admin/dashboard");
          }, 300);
        } else if (userRole === "STAFF" || userRole === "ADMIN") {
          setSuccessMessage("Staff authenticated! Redirecting to Staff Portal...");
          setTimeout(() => {
            router.push("/staff/dashboard");
          }, 300);
        } else if (userRole === "VIEWER") {
          setSuccessMessage("Viewer authenticated! Redirecting to Inventory Overview...");
          setTimeout(() => {
            router.push("/viewer/inventory");
          }, 300);
        } else {
          clearAuth();
          setErrorMessage("Access Denied: Unrecognized role. Please contact system administrator.");
        }
      } else {
        setErrorMessage(data.message || (res.status === 401 ? "Invalid email or password. Please verify your credentials." : `Login failed with status ${res.status}`));
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setErrorMessage("Unable to connect to the server (port 8080). Please ensure the backend service is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.brandIconWrapper}>
            <Package size={28} />
          </div>
          <h1 className={styles.heading}>Welcome Back</h1>
          <p className={styles.subheading}>Sign in to access your inventory and orders</p>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className={styles.alertError}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className={styles.alertSuccess}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-email">
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.togglePasswordBtn}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className={styles.footerText}>
          Don&apos;t have an account yet?
          <Link href="/signup" className={styles.link}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}