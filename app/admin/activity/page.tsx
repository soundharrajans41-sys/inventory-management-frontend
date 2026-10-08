"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  DownloadCloud,
  RefreshCw,
  User,
  Calendar,
  Layers,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface ActivityLogItem {
  id: number;
  userId?: number;
  userEmail: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/activity-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        showToast("error", "Failed to retrieve audit activity logs.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error connecting to activity logs API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/activity");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Activity logs CSV exported.");
      } else {
        showToast("error", "Failed to export logs.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting logs.");
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        search === "" ||
        (log.userEmail && log.userEmail.toLowerCase().includes(search.toLowerCase())) ||
        (log.description && log.description.toLowerCase().includes(search.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(search.toLowerCase()));

      const matchesModule = moduleFilter === "ALL" || (log.module && log.module.toUpperCase() === moduleFilter.toUpperCase());
      const matchesAction = actionFilter === "ALL" || (log.action && log.action.toUpperCase() === actionFilter.toUpperCase());

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, search, moduleFilter, actionFilter]);

  const getModuleBadge = (mod: string) => {
    const upper = (mod || "").toUpperCase();
    switch (upper) {
      case "AUTH":
        return <span className="badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>AUTH</span>;
      case "INVENTORY":
      case "PRODUCT":
        return <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>INVENTORY</span>;
      case "PURCHASE":
        return <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>PURCHASE</span>;
      case "SALES":
        return <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>SALES</span>;
      case "STOCK":
        return <span className="badge" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}>STOCK</span>;
      case "RETURNS":
        return <span className="badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>RETURNS</span>;
      case "USER":
        return <span className="badge badge-primary">USER</span>;
      default:
        return <span className="badge badge-neutral">{mod}</span>;
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
            <History className="text-primary" size={28} />
            System Audit & Admin Activity Log
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Real-time security trail recording user logins, status modifications, order fulfillment, and inventory adjustments.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export Audit Log CSV
          </button>
          <button onClick={fetchLogs} className="btn btn-primary" title="Refresh">
            <RefreshCw size={16} /> Refresh Feed
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total Logged Events</div>
          <div className="stat-value">{logs.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Immutable audit events
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Inventory & Stock Actions</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {logs.filter((l) => ["INVENTORY", "PRODUCT", "STOCK"].includes((l.module || "").toUpperCase())).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Catalog mutations
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Order Lifecycle Events</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {logs.filter((l) => ["PURCHASE", "SALES", "RETURNS"].includes((l.module || "").toUpperCase())).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Order processing & RMA
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Auth & Access Audits</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {logs.filter((l) => ["AUTH", "USER"].includes((l.module || "").toUpperCase())).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Security events
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
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
            placeholder="Search by user email, action keyword, or detail description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="input-field"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Modules</option>
            <option value="AUTH">AUTH</option>
            <option value="INVENTORY">INVENTORY</option>
            <option value="STOCK">STOCK</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="SALES">SALES</option>
            <option value="RETURNS">RETURNS</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Operator / User</th>
                <th>Action Type</th>
                <th>Module</th>
                <th>Audit Description</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading audit entries...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No activity logs recorded matching criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "—"}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <User size={13} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600, color: "var(--text-bright)" }}>
                          {log.userEmail || "System Daemon"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-bright)", fontWeight: 700 }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{getModuleBadge(log.module)}</td>
                    <td>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "450px" }}>
                        {log.description}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
