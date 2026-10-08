"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PackagePlus, ShoppingCart, BarChart3, Clock } from "lucide-react";
import { authFetch } from "../../lib/api";

interface StaffData {
  recentEntriesCount: number;
  ordersProcessedCount: number;
  reportsViewedCount: number;
  pendingTasksCount: number;
}

export default function StaffDashboardPage() {
  const [data, setData] = useState<StaffData>({
    recentEntriesCount: 0,
    ordersProcessedCount: 0,
    reportsViewedCount: 0,
    pendingTasksCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffDashboard = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/dashboard/staff");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load staff dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDashboard();
  }, []);

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Staff Dashboard</h2>
      </div>

      <div className="dashboard-grid">
        
        <div className="card">
          <div className="card-title">
            Recent Entries (7d)
            <PackagePlus size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <p className="metric-value">{loading ? "..." : `${data.recentEntriesCount} Movements`}</p>
        </div>

        <div className="card">
          <div className="card-title">
            Orders Processed
            <ShoppingCart size={20} style={{ color: 'var(--secondary)' }} />
          </div>
          <p className="metric-value">{loading ? "..." : data.ordersProcessedCount}</p>
        </div>

        <div className="card">
          <div className="card-title">
            Reports Generated
            <BarChart3 size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <p className="metric-value">{loading ? "..." : data.reportsViewedCount}</p>
        </div>

        <div className="card">
          <div className="card-title">
            Pending Orders
            <Clock size={20} style={{ color: 'var(--warning-color, #f39c12)' }} />
          </div>
          <p className="metric-value">{loading ? "..." : data.pendingTasksCount}</p>
        </div>

      </div>

      <div className="page-header" style={{ marginTop: '2rem' }}>
        <h3 className="page-title" style={{ fontSize: '1.25rem' }}>Quick Actions</h3>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link href="/staff/stock-entry" style={{ textDecoration: 'none' }}>
          <button className="button" style={{ width: 'auto', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', fontWeight: 600 }}>
            + Receive Stock
          </button>
        </Link>
        <Link href="/staff/sales-orders" style={{ textDecoration: 'none' }}>
          <button className="button" style={{ width: 'auto', padding: '0.75rem 1.5rem', background: 'var(--secondary)', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', fontWeight: 600 }}>
            Process Orders
          </button>
        </Link>
      </div>
    </>
  );
}
