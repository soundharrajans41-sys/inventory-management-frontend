"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, AlertTriangle, Info, Trash2, ShieldAlert } from "lucide-react";
import { authFetch } from "../../lib/api";

interface AlertItem {
  id: number;
  type: string;
  msg: string;
  time: string;
  title?: string;
  message?: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const removeAlert = async (id: number) => {
    try {
      const res = await authFetch(`/alerts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts(alerts.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  const clearAllAlerts = async () => {
    if (!confirm("Are you sure you want to clear all alerts?")) return;
    try {
      const res = await authFetch("/alerts/clear-all", {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts([]);
      }
    } catch (err) {
      console.error("Failed to clear alerts:", err);
    }
  };

  const getAlertIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t === "critical") return <div className="alert-icon critical"><AlertCircle size={24} /></div>;
    if (t === "warning") return <div className="alert-icon warning"><AlertTriangle size={24} /></div>;
    return <div className="alert-icon info"><Info size={24} /></div>;
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Notifications & Alerts</h2>
        <button className="btn" onClick={clearAllAlerts}>
          <ShieldAlert size={18} /> Clear All Alerts
        </button>
      </div>

      <div style={{ maxWidth: "800px" }}>
        {alerts.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: 'var(--text-muted)' }}>
            {loading ? "Loading alerts..." : "No active alerts at this time."}
          </div>
        ) : (
          alerts.map(a => (
            <div key={a.id} className="alert-box">
              {getAlertIcon(a.type)}
              <div className="alert-content">
                <p className="alert-title">{a.msg || a.message || a.title}</p>
                <span className="alert-time">{a.time}</span>
              </div>
              <button className="btn-icon" onClick={() => removeAlert(a.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}