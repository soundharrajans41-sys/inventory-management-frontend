"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UserX,
  DownloadCloud,
  RefreshCw,
  X,
  AlertTriangle,
  Mail,
  Calendar,
  Clock,
  ShieldAlert
} from "lucide-react";
import { authFetch, getUser } from "../../lib/api";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF" | "VIEWER" | string;
  active?: boolean;
  enabled?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Current session user info
  const currentUser = getUser();
  const currentUserId = currentUser?.id;
  const currentUserEmail = (currentUser?.email || "").toLowerCase();

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("STAFF");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        showToast("error", "Failed to retrieve system users.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error connecting to backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("STAFF");
    setIsAddEditOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setSelectedUser(u);
    setFormName(u.name || "");
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormRole(u.role ? u.role.toUpperCase() : "STAFF");
    setIsAddEditOpen(true);
  };

  const openResetPassModal = (u: UserItem) => {
    setSelectedUser(u);
    setNewPassword("");
    setIsResetPassOpen(true);
  };

  const openDeleteModal = (u: UserItem) => {
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("error", "Name and Email are required.");
      return;
    }

    // Prevent demoting own admin role
    if (
      selectedUser &&
      (String(selectedUser.id) === String(currentUserId) || selectedUser.email.toLowerCase() === currentUserEmail) &&
      formRole.toUpperCase() !== "ADMIN"
    ) {
      showToast("error", "Safety constraint: You cannot demote your own ADMIN account.");
      return;
    }

    setSubmitting(true);
    try {
      if (selectedUser) {
        // Edit
        const payload: any = {
          name: formName.trim(),
          role: formRole.toUpperCase(),
        };
        const res = await authFetch(`/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("success", "User profile updated successfully.");
          setIsAddEditOpen(false);
          fetchUsers();
        } else {
          const err = await res.json();
          showToast("error", err.message || "Failed to update user.");
        }
      } else {
        // Create
        if (!formPassword) {
          showToast("error", "Password is required for new accounts.");
          setSubmitting(false);
          return;
        }

        const payload = {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          role: formRole.toUpperCase(),
        };

        const res = await authFetch("/users", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("success", "New user registered successfully.");
          setIsAddEditOpen(false);
          fetchUsers();
        } else {
          const err = await res.json();
          showToast("error", err.message || "Failed to create user.");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error saving user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: UserItem) => {
    const isCurrentlyActive = u.active !== undefined ? u.active : (u.enabled ?? true);
    // Prevent deactivating oneself
    if (
      String(u.id) === String(currentUserId) ||
      u.email.toLowerCase() === currentUserEmail
    ) {
      showToast("error", "Safety constraint: You cannot deactivate your own account.");
      return;
    }

    const endpoint = isCurrentlyActive ? `/users/${u.id}/deactivate` : `/users/${u.id}/activate`;
    try {
      const res = await authFetch(endpoint, { method: "PUT" });
      if (res.ok) {
        showToast("success", `User ${isCurrentlyActive ? "deactivated" : "activated"} successfully.`);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to toggle status.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error updating user status.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) {
      showToast("error", "Please enter a valid password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/users/${selectedUser.id}/reset-password?newPassword=${encodeURIComponent(newPassword)}`, {
        method: "PUT",
      });

      if (res.ok) {
        showToast("success", `Password reset successfully for ${selectedUser.name}.`);
        setIsResetPassOpen(false);
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to reset password.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error resetting password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (
      String(selectedUser.id) === String(currentUserId) ||
      selectedUser.email.toLowerCase() === currentUserEmail
    ) {
      showToast("error", "Safety constraint: You cannot delete your own Administrator account.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/users/${selectedUser.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "User account permanently removed.");
        setIsDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error deleting user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/users");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_directory_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "User directory exported.");
      } else {
        showToast("error", "Failed to export users CSV.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting users.");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search === "" ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

      const matchesRole = roleFilter === "ALL" || (u.role && u.role.toUpperCase() === roleFilter.toUpperCase());
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const getRoleBadge = (role: string) => {
    const upper = (role || "").toUpperCase();
    switch (upper) {
      case "ADMIN":
        return <span className="badge badge-primary">ADMIN (Full Control)</span>;
      case "STAFF":
        return <span className="badge badge-warning">STAFF (Inventory/Ops)</span>;
      case "VIEWER":
        return <span className="badge badge-neutral">VIEWER (Read-Only)</span>;
      default:
        return <span className="badge badge-neutral">{role}</span>;
    }
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
            <Users className="text-primary" size={28} />
            User Management & RBAC Governance
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Provision system accounts, enforce Role-Based Access Controls (ADMIN, STAFF, VIEWER), and audit logins.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total Registered Accounts</div>
          <div className="stat-value">{users.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Active system users
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Administrators</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {users.filter((u) => u.role?.toUpperCase() === "ADMIN").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Unrestricted privileges
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Operations Staff</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {users.filter((u) => u.role?.toUpperCase() === "STAFF").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Orders & inventory rights
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Read-Only Viewers</div>
          <div className="stat-value" style={{ color: "var(--text-muted)" }}>
            {users.filter((u) => u.role?.toUpperCase() === "VIEWER").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Observer accounts
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search by user name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="input-field"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          <button onClick={fetchUsers} className="btn" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role (RBAC)</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th>Created Date</th>
                <th>Last Login</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading user accounts...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No accounts found matching your query.</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.active !== undefined ? u.active : (u.enabled ?? true);
                  const isSelf = String(u.id) === String(currentUserId) || u.email.toLowerCase() === currentUserEmail;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "rgba(99, 102, 241, 0.15)",
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                            }}
                          >
                            {(u.name || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-bright)", display: "flex", alignItems: "center", gap: "6px" }}>
                              {u.name}
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "2px 6px",
                                    background: "rgba(99, 102, 241, 0.2)",
                                    color: "var(--primary)",
                                    borderRadius: "4px",
                                    fontWeight: 700,
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={11} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge ${isActive ? "badge-success" : "badge-danger"}`}
                          style={{ cursor: isSelf ? "not-allowed" : "pointer" }}
                          onClick={() => !isSelf && handleToggleActive(u)}
                          title={isSelf ? "Self account status cannot be altered" : "Click to toggle active state"}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} />
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={13} />
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-IN") : "Never logged in"}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => openResetPassModal(u)}
                            className="btn"
                            style={{ padding: "6px 8px" }}
                            title="Reset User Password"
                          >
                            <KeyRound size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="btn"
                            style={{ padding: "6px 8px" }}
                            title="Edit Role / Name"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={isSelf}
                            className="btn btn-danger"
                            style={{ padding: "6px 8px", opacity: isSelf ? 0.3 : 1 }}
                            title={isSelf ? "Cannot delete self" : "Delete User"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddEditOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "500px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                {selectedUser ? "Modify Account Settings" : "Create New User Account"}
              </h2>
              <button
                onClick={() => setIsAddEditOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Sharma"
                    className="input-field"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={!!selectedUser}
                    placeholder="user@example.com"
                    className="input-field"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: "100%", opacity: selectedUser ? 0.6 : 1 }}
                  />
                  {selectedUser && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Email address acts as unique identifier and cannot be modified.
                    </div>
                  )}
                </div>

                {!selectedUser && (
                  <div>
                    <label className="form-label">Initial Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      className="input-field"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      style={{ width: "100%" }}
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">Assigned Security Role *</label>
                  <select
                    className="input-field"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="ADMIN">ADMIN - Unrestricted Administration & Settings</option>
                    <option value="STAFF">STAFF - Inventory, Orders & Returns Operations</option>
                    <option value="VIEWER">VIEWER - Read-Only Dashboard & Reports</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button type="button" onClick={() => setIsAddEditOpen(false)} className="btn" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : selectedUser ? "Update User" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPassOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "450px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <KeyRound size={20} className="text-primary" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Reset User Password
                </h2>
              </div>
              <button
                onClick={() => setIsResetPassOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              Set a new password for <strong style={{ color: "var(--text-bright)" }}>{selectedUser.name}</strong> ({selectedUser.email}).
            </p>

            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: "20px" }}>
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter new secure password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsResetPassOpen(false)} className="btn" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Resetting..." : "Apply New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedUser && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "450px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--danger)", marginBottom: "16px" }}>
              <ShieldAlert size={28} />
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Confirm User Deletion</h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete account{" "}
              <strong style={{ color: "var(--text-bright)" }}>{selectedUser.name}</strong> ({selectedUser.email})?
              This will revoke all dashboard credentials immediately.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="btn btn-danger"
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}