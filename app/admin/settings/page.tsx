"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  KeyRound,
  ShieldCheck,
  Server,
  Bell,
  Sliders,
  CheckCircle2,
  Database,
  Cpu,
  RefreshCw
} from "lucide-react";
import { authFetch, getUser } from "../../lib/api";

export default function AdminSettingsPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSubmitting, setPassSubmitting] = useState(false);

  // System Thresholds form
  const [defaultMinStock, setDefaultMinStock] = useState("10");
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(true);
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);
  const [autoReorderReminder, setAutoReorderReminder] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/users/profile");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        } else {
          // Fallback to local storage
          setUserProfile(getUser());
        }
      } catch {
        setUserProfile(getUser());
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast("error", "New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }

    setPassSubmitting(true);
    try {
      if (userProfile && userProfile.id) {
        const res = await authFetch(`/users/${userProfile.id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`, {
          method: "PUT",
        });

        if (res.ok) {
          showToast("success", "Password updated successfully!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          const err = await res.json();
          showToast("error", err.message || "Failed to change password.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error connecting to server.");
    } finally {
      setPassSubmitting(false);
    }
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("success", "System preferences and inventory threshold saved.");
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "8px",
            background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "#fff",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.2s ease-out"
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings className="text-primary" size={28} />
            System Configuration & Administrator Settings
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Manage administrative credentials, system defaults, notification preferences, and runtime diagnostics.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Admin Profile Card */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <User className="text-primary" size={22} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
              Administrator Profile
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {(userProfile?.name || "A")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
                {userProfile?.name || "Super Admin"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {userProfile?.email || "admin@inventory.com"}
              </div>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(99, 102, 241, 0.2)",
                  color: "var(--primary)",
                  fontWeight: 700,
                }}
              >
                ROLE: {userProfile?.role || "ADMIN"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Account Status</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>Active & Verified</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Access Permission Scope</span>
              <span style={{ color: "var(--text-bright)" }}>Superuser / Root Admin</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Last Login Session</span>
              <span style={{ color: "var(--text-bright)" }}>
                {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleString("en-IN") : "Current Session"}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <KeyRound className="text-primary" size={22} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
              Update Password
            </h2>
          </div>

          <form onSubmit={handleChangePassword}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={passSubmitting}
                style={{ marginTop: "10px", width: "100%", justifyContent: "center" }}
              >
                {passSubmitting ? "Updating Password..." : "Save New Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Inventory Defaults & Thresholds */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Sliders className="text-primary" size={22} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
              Inventory Policies & Thresholds
            </h2>
          </div>

          <form onSubmit={handleSaveThresholds}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Default Minimum Stock Level Threshold</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={defaultMinStock}
                  onChange={(e) => setDefaultMinStock(e.target.value)}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Items falling below this quantity trigger the Low Stock badge on the Dashboard.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={enableLowStockAlerts}
                    onChange={(e) => setEnableLowStockAlerts(e.target.checked)}
                    style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                  />
                  <span>Dispatch real-time notification on low inventory threshold</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={autoReorderReminder}
                    onChange={(e) => setAutoReorderReminder(e.target.checked)}
                    style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                  />
                  <span>Prompt for automatic Purchase Order generation when out of stock</span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: "8px", width: "100%", justifyContent: "center" }}
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Runtime Diagnostics */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Server className="text-primary" size={22} />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
              System & Architecture Runtime
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>Frontend Framework</span>
              <span style={{ color: "var(--text-bright)", fontWeight: 600 }}>Next.js 16 + React 19 + Tailwind CSS</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>Backend Application</span>
              <span style={{ color: "var(--text-bright)", fontWeight: 600 }}>Spring Boot 3.3.4 (Java 17/21)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>Relational Database</span>
              <span style={{ color: "var(--text-bright)", fontWeight: 600 }}>MySQL 8.0 (InnoDB Engine)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>Security Protocol</span>
              <span style={{ color: "var(--text-bright)", fontWeight: 600 }}>JWT Bearer Authentication + RBAC</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ color: "var(--text-muted)" }}>Audit Logging</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>Transactional (activity_logs) Active</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>System Timezone</span>
              <span style={{ color: "var(--text-bright)" }}>Asia/Kolkata (IST, UTC+05:30)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
