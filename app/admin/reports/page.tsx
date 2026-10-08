"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  DownloadCloud,
  Calendar,
  TrendingUp,
  RefreshCw,
  Package,
  ShoppingCart,
  Truck,
  RotateCcw,
  IndianRupee,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Filter
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { authFetch } from "../../lib/api";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4"];

export default function ReportsPage() {
  const [financial, setFinancial] = useState<any>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalOrders: 0,
    totalItemsSold: 0,
  });

  const [inventoryReport, setInventoryReport] = useState<any>({
    totalInventoryValue: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoryDistribution: [],
  });

  const [dashboardOverview, setDashboardOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("THIS_MONTH");
  const [activeTab, setActiveTab] = useState<"FINANCIAL" | "INVENTORY" | "PERFORMANCE">("FINANCIAL");

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [finRes, invRes, dashRes] = await Promise.all([
        authFetch("/reports/financial"),
        authFetch("/reports/inventory"),
        authFetch("/dashboard/overview"),
      ]);

      if (finRes.ok) {
        setFinancial(await finRes.json());
      }
      if (invRes.ok) {
        setInventoryReport(await invRes.json());
      }
      if (dashRes.ok) {
        setDashboardOverview(await dashRes.json());
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve analytical reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCsv = async (dataset: string) => {
    try {
      const res = await authFetch(`/reports/export/${dataset}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dataset}_report_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", `Exported ${dataset} report successfully.`);
      } else {
        showToast("error", `Failed to export ${dataset} report.`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting report.");
    }
  };

  const formatRupee = (numOrStr?: number | string) => {
    const num = Number(numOrStr) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
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
            <BarChart3 className="text-primary" size={28} />
            Analytics & Executive Reports
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Deep-dive financial reconciliations, stock turnover, sales performance, and audit summaries.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="input-field"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{ fontSize: "0.85rem", padding: "6px 12px" }}
          >
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
            <option value="THIS_YEAR">This Year (FY)</option>
            <option value="ALL_TIME">All Time</option>
          </select>

          <button onClick={() => handleExportCsv("sales")} className="btn" title="Export Sales CSV">
            <DownloadCloud size={16} /> Export Sales
          </button>
          <button onClick={() => handleExportCsv("inventory")} className="btn btn-primary" title="Export Inventory CSV">
            <DownloadCloud size={16} /> Export Inventory
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveTab("FINANCIAL")}
          className={`btn ${activeTab === "FINANCIAL" ? "btn-primary" : ""}`}
          style={{ fontSize: "0.9rem", padding: "8px 16px" }}
        >
          <TrendingUp size={16} /> Financial & Revenue Report
        </button>
        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={`btn ${activeTab === "INVENTORY" ? "btn-primary" : ""}`}
          style={{ fontSize: "0.9rem", padding: "8px 16px" }}
        >
          <Package size={16} /> Inventory Health & Valuation
        </button>
        <button
          onClick={() => setActiveTab("PERFORMANCE")}
          className={`btn ${activeTab === "PERFORMANCE" ? "btn-primary" : ""}`}
          style={{ fontSize: "0.9rem", padding: "8px 16px" }}
        >
          <BarChart3 size={16} /> Product Velocity & Sales
        </button>
      </div>

      {/* Tab 1: Financial & Revenue */}
      {activeTab === "FINANCIAL" && (
        <>
          <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-title">Total Gross Revenue</div>
              <div className="stat-value" style={{ color: "var(--success)" }}>
                {formatRupee(financial.totalRevenue)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                From fulfilled customer sales
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Cost of Goods / Procurement</div>
              <div className="stat-value" style={{ color: "var(--warning)" }}>
                {formatRupee(financial.totalCost)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Total purchase cost
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Net Operating Profit</div>
              <div className="stat-value" style={{ color: financial.netProfit >= 0 ? "var(--primary)" : "var(--danger)" }}>
                {formatRupee(financial.netProfit)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Gross margin difference
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Total Orders Fulfilled</div>
              <div className="stat-value">{financial.totalOrders}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {financial.totalItemsSold} total items dispatched
              </div>
            </div>
          </div>

          {/* Monthly Comparison Chart */}
          <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-bright)" }}>
              Revenue vs Procurement Cost Trajectory
            </h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardOverview?.monthlySales || []} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(val: any) => [formatRupee(val), ""]}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases Spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Inventory Health */}
      {activeTab === "INVENTORY" && (
        <>
          <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-title">Catalog Inventory Valuation</div>
              <div className="stat-value" style={{ color: "var(--primary)" }}>
                {formatRupee(inventoryReport.totalInventoryValue || dashboardOverview?.totalValue)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Current assets on hand
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Active SKU Catalog</div>
              <div className="stat-value">{inventoryReport.totalProducts || dashboardOverview?.productsCount}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Distinct catalog products
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Low Stock Threshold Items</div>
              <div className="stat-value" style={{ color: "var(--warning)" }}>
                {inventoryReport.lowStockCount || dashboardOverview?.lowStockCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Restock required
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Depleted (Out of Stock)</div>
              <div className="stat-value" style={{ color: "var(--danger)" }}>
                {inventoryReport.outOfStockCount || dashboardOverview?.outOfStockCount}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Zero inventory available
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-card" style={{ padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-bright)" }}>
              Category Stock Distribution
            </h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardOverview?.categoryStock || []} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="stock" name="Units in Stock" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Tab 3: Performance & Velocity */}
      {activeTab === "PERFORMANCE" && (
        <div className="glass-card" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-bright)" }}>
            Top Velocity Catalog Items
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th style={{ textAlign: "center" }}>Units Dispatched</th>
                  <th style={{ textAlign: "right" }}>Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {dashboardOverview?.topSellingProducts && dashboardOverview.topSellingProducts.length > 0 ? (
                  dashboardOverview.topSellingProducts.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--text-bright)" }}>{p.name}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.category || "General"}</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)" }}>
                        {p.unitsSold} units
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "var(--success)" }}>
                        {formatRupee(p.revenue)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                      No product performance sales data yet recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}