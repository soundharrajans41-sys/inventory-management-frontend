
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  UserPlus, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Package, 
  Eye as EyeIcon, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2
} from "lucide-react";
import styles from "../login/Login.module.css"; 
import { API_BASE } from "../lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<string>("Staff");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const roles = [
    {
      id: "Admin",
      label: "Administrator",
      desc: "Full System Access",
      icon: Shield
    },
    {
      id: "Staff",
      label: "Staff Member",
      desc: "Manage Products & Orders",
      icon: Package
    },
    {
      id: "Viewer",
      label: "Viewer Account",
      desc: "Read-Only Overview",
      icon: EyeIcon
    }
  ];

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }


    if (password.length < 3) {
      setErrorMessage("Password must be at least 3 characters long.");
      return;
    }


    setLoading(true);
    try {
      const newUser = {
        name: cleanName,
        email: cleanEmail,
        password,
        role: role.toUpperCase()
      };
      
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response fallback
      }

      if (res.ok) {
        setSuccessMessage("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      } else {
        setErrorMessage(
          data.message || 
          (res.status === 409 
            ? "An account with this email address already exists." 
            : `Registration failed with status code ${res.status}.`)
        );
      }
    } catch (err) {
      console.error("Signup connection error:", err);
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
            <UserPlus size={28} />
          </div>
          <h1 className={styles.heading}>Create Account</h1>
          <p className={styles.subheading}>Join the inventory management system</p>
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

        {/* Signup Form */}
        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="signup-name">
              Full Name
            </label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="signup-name"
                type="text"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="signup-email">
              Email Address
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="signup-email"
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
            <label className={styles.label} htmlFor="signup-password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete="new-password"
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

          {/* Role Info Notice */}
          <div style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.22)",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            fontSize: "0.825rem",
            color: "#cbd5e1",
            lineHeight: "1.4"
          }}>
            <Shield size={18} style={{ color: "#818cf8", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "#fff" }}>Role Selection:</strong>
              <br />
              Choose <strong style={{ color: "#fff" }}>Admin</strong> for full system access, <strong style={{ color: "#fff" }}>Staff</strong> to manage products &amp; orders, or <strong style={{ color: "#fff" }}>Viewer</strong> for read-only access.
            </div>
          </div>

          {/* Role Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Select Role
            </label>
            <div className={styles.roleGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {roles.map((r) => {
                const IconComponent = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`${styles.roleOption} ${isSelected ? styles.roleOptionSelected : ""}`}
                  >
                    <IconComponent 
                      size={20} 
                      color={isSelected ? "#818cf8" : "#94a3b8"} 
                    />
                    <span className={styles.roleOptionTitle}>{r.label}</span>
                    <span className={styles.roleOptionDesc}>{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
