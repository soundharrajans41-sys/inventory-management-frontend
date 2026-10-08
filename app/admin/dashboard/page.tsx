"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  AlertTriangle,
  AlertOctagon,
  Truck,
  Clock,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Users,
  RotateCcw,
  CheckCircle2,
  FileText
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { authFetch } from "../../lib/api";

interface CategoryStock {
  category: string;
  productCount: number;
  totalStock: number;
}

interface MonthlySale {
  month: string;
  sales: number;
  purchases: number;
  orderCount: number;
}

interface TopProduct {
  name: string;
  quantitySold: number;
  totalRevenue: number;
}

interface StockTrend {
  date: string;
  incoming: number;
  outgoing: number;
}

interface ActivityLog {
  id: number;
  userEmail: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  timestamp: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  minimumStockLevel: number;
  status: string;
}

interface DashboardOverview {
  totalValue: number;
  totalValueFormatted: string;
  productsCount: number;
  usersCount: number;
  alertsCount: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  suppliersCount: number;
  pendingPurchases: number;
  pendingSales: number;
  totalSalesOrdersCount: number;
  totalPurchaseOrdersCount: number;
  totalSalesValue: number;
  totalPurchasesValue: number;
  lowStockProducts: LowStockProduct[];
  categoryStock: CategoryStock[];
  monthlySales: MonthlySale[];
  topSellingProducts: TopProduct[];
  stockMovementTrends: StockTrend[];
  recentActivities: ActivityLog[];
}

const COLORS = ["#818cf8", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#a78bfa"];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await authFetch("/dashboard/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  const formatCurrency = (val?: number | string) => {
    if (val === undefined || val === null) return "₹0.00";
    const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]/g, "")) : val;
    if (isNaN(num)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const getActivityIcon = (action: string) => {
    if (action.includes("PRODUCT")) return <Package size={16} color="#818cf8" />;
    if (action.includes("STOCK")) return <Boxes size={16} color="#34d399" />;
    if (action.includes("PURCHASE")) return <ShoppingCart size={16} color="#fbbf24" />;
    if (action.includes("SALES")) return <TrendingUp size={16} color="#60a5fa" />;
    if (action.includes("RETURN")) return <RotateCcw size={16} color="#f472b6" />;
    if (action.includes("USER")) return <Users size={16} color="#c084fc" />;
    return <FileText size={16} color="#94a3b8" />;
  };

  const formatTimeAgo = (ts?: string) => {
    if (!ts) return "";
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + 
        ", " + date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return ts;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", fontWeight: 800 }}>Admin Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Real-time overview of inventory valuation, warehouse movements, and enterprise sales
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            className="btn" 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <RefreshCw size={16} className={refreshing ? "spin-animate" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Live"}
          </button>
          <Link href="/admin/export" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            Export Reports
          </Link>
        </div>
      </div>

      {/* 8 Core Dashboard Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "18px"
      }}>
        {/* Card 1: Total Products */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Products</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(129, 140, 248, 0.15)", color: "var(--primary)" }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)" }}>
            {loading ? "..." : data?.productsCount ?? 0}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Active SKUs in catalog
          </div>
        </div>

        {/* Card 2: Total Stock Quantity */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Stock Units</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.15)", color: "var(--secondary)" }}>
              <Boxes size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)" }}>
            {loading ? "..." : (data?.totalStock ?? 0).toLocaleString()}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={13} /> Across all warehouses
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Low Stock Items</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#fbbf24" }}>
            {loading ? "..." : data?.lowStockCount ?? 0}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Below reorder threshold
          </div>
        </div>

        {/* Card 4: Out of Stock Items */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Out of Stock</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>
              <AlertOctagon size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#f87171" }}>
            {loading ? "..." : data?.outOfStockCount ?? 0}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#f87171" }}>
            Immediate restock needed
          </div>
        </div>

        {/* Card 5: Total Suppliers */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Suppliers</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(96, 165, 250, 0.15)", color: "#60a5fa" }}>
              <Truck size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-main)" }}>
            {loading ? "..." : data?.suppliersCount ?? 0}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Verified trade partners
          </div>
        </div>

        {/* Card 6: Pending Purchase Orders */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Pending POs</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(244, 114, 182, 0.15)", color: "var(--accent)" }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--accent)" }}>
            {loading ? "..." : data?.pendingPurchases ?? 0}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Awaiting supplier delivery
          </div>
        </div>

        {/* Card 7: Total Sales */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Total Sales Revenue</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.15)", color: "var(--secondary)" }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#34d399" }}>
            {loading ? "..." : formatCurrency(data?.totalSalesValue)}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {data?.totalSalesOrdersCount ?? 0} fulfilled orders
          </div>
        </div>

        {/* Card 8: Total Inventory Value */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Inventory Valuation</span>
            <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(129, 140, 248, 0.15)", color: "var(--primary)" }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--primary)" }}>
            {loading ? "..." : (data?.totalValueFormatted?.replace(/^[$?]/, "₹") || formatCurrency(data?.totalValue))}
          </div>
          <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Current stock asset value
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Monthly Sales & Purchase vs Sales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
        {/* Monthly Sales Revenue */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Monthly Sales Performance</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>Gross revenue over past 6 months</p>
            </div>
            <span className="badge info">Trends</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {loading || !data?.monthlySales ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlySales}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f8fafc" }} 
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, "Sales"]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Purchase vs Sales Comparison */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Purchase vs Sales</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>Procurement cost vs realized sales revenue</p>
            </div>
            <span className="badge success">Comparison</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {loading || !data?.monthlySales ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v > 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f8fafc" }} 
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`]}
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Bar dataKey="sales" name="Sales (₹)" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases (₹)" fill="#f472b6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Stock Movement Trends & Category-wise Stock */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
        {/* Stock Movement Trends (Incoming vs Outgoing 7 Days) */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Stock Movement Trends</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>7-Day incoming vs outgoing inventory units</p>
            </div>
            <span className="badge warning">Warehouse</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {loading || !data?.stockMovementTrends ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.stockMovementTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f8fafc" }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  <Line type="monotone" dataKey="incoming" name="Incoming (Inbound)" stroke="#60a5fa" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="outgoing" name="Outgoing (Dispatched)" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category-wise Stock Distribution */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Category-wise Stock</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>Inventory volume distribution by department</p>
            </div>
            <span className="badge info">Catalog</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {loading || !data?.categoryStock ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={data.categoryStock}
                    dataKey="totalStock"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {data.categoryStock.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f8fafc" }} 
                    formatter={(val: any, name: any) => [`${val} units`, name]}
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Selling Products & Low Stock Alert List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
        {/* Top Selling Products Bar Chart */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Top Selling Products</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>Leading revenue generators by units sold</p>
            </div>
            <span className="badge success">Best Sellers</span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            {loading || !data?.topSellingProducts || data.topSellingProducts.length === 0 ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No product sales recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSellingProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={130} />
                  <Tooltip 
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f8fafc" }} 
                    formatter={(val: any, name: any) => [name === "quantitySold" ? `${val} Units` : `₹${Number(val).toLocaleString()}`, name === "quantitySold" ? "Units Sold" : "Revenue"]}
                  />
                  <Bar dataKey="quantitySold" name="Units Sold" fill="#818cf8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Low Stock Watchlist</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", margin: "4px 0 0" }}>Inventory items requiring immediate reorder</p>
            </div>
            <Link href="/admin/products" style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
              View All Catalog →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "260px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading watchlist...</div>
            ) : !data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                <CheckCircle2 size={32} color="#34d399" style={{ margin: "0 auto 8px" }} />
                All inventory levels are above minimum thresholds!
              </div>
            ) : (
              data.lowStockProducts.map((p) => (
                <div 
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "10px",
                    border: "1px solid var(--glass-border)"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {p.sku}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`badge ${p.quantity === 0 ? "danger" : "warning"}`}>
                      {p.quantity} Left (Min: {p.minimumStockLevel})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Log Feed */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Recent System Activities</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              Live audit trail of operations performed across the inventory ecosystem
            </p>
          </div>
          <Link href="/admin/activity" style={{ color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
            View Full Activity Log →
          </Link>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading activities...</div>
          ) : !data?.recentActivities || data.recentActivities.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No recent activity records found</div>
          ) : (
            data.recentActivities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(0,0,0,0.15)",
                  borderRadius: "12px",
                  border: "1px solid var(--glass-border)",
                  gap: "14px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ 
                    padding: "8px", 
                    borderRadius: "8px", 
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {getActivityIcon(act.action)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                      {act.description}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      By <span style={{ color: "var(--primary)" }}>{act.userName || act.userEmail}</span> • Module: <span style={{ textTransform: "uppercase" }}>{act.module}</span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {formatTimeAgo(act.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}