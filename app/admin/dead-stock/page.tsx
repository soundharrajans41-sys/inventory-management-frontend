"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Search,
  DownloadCloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  IndianRupee,
  Package,
  Layers,
  Filter,
  Info,
  Tag,
  X,
  Sliders,
  Sparkles,
  ChevronRight,
  ArrowUpDown
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface DeadStockItem {
  id: number;
  name: string;
  sku: string;
  category?: string;
  supplier?: string;
  currentStock: number;
  purchasePrice: number;
  sellingPrice: number;
  estimatedStockValue: number;
  lastSaleDate?: string;
  daysWithoutSale: number;
  productAgeDays: number;
  status: "DEAD_STOCK" | "SLOW_MOVING" | "ACTIVE" | "NEW_UNSOLD";
  statusLabel: string;
  recommendedAction: string;
}

interface DeadStockReport {
  totalProductsAnalyzed: number;
  deadStockCount: number;
  slowMovingCount: number;
  activeCount: number;
  newUnsoldCount: number;
  totalDeadStockValue: number;
  totalSlowMovingValue: number;
  totalCapitalTiedUp: number;
  slowThresholdDays: number;
  deadThresholdDays: number;
  items: DeadStockItem[];
}

export default function DeadStockPage() {
  const [report, setReport] = useState<DeadStockReport | null>(null);
  const [loading, setLoading] = useState(true);

  // Configurable thresholds
  const [slowDays, setSlowDays] = useState<number>(30);
  const [deadDays, setDeadDays] = useState<number>(60);

  // Filtering & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<keyof DeadStockItem>("daysWithoutSale");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Clearance Calculator Modal
  const [selectedCalcItem, setSelectedCalcItem] = useState<DeadStockItem | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(30);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDeadStockReport = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/reports/dead-stock?slowDays=${slowDays}&deadDays=${deadDays}`);
      if (res.ok) {
        const data: DeadStockReport = await res.json();
        setReport(data);
      } else {
        showToast("Failed to calculate dead stock report.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to inventory backend service.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeadStockReport();
  }, []);

  const handleExportCsv = async () => {
    try {
      const res = await authFetch(`/reports/export/dead-stock?slowDays=${slowDays}&deadDays=${deadDays}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dead_stock_analysis_${slowDays}d_${deadDays}d_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Dead Stock CSV analysis exported successfully!");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to download CSV export.", "error");
    }
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    if (!report || !report.items) return [];

    return report.items.filter((item) => {
      const matchesSearch =
        (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.supplier || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || (item.category || "").toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "daysWithoutSale") {
        aVal = a.daysWithoutSale ?? a.productAgeDays;
        bVal = b.daysWithoutSale ?? b.productAgeDays;
      }

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [report, search, statusFilter, categoryFilter, sortField, sortAsc]);

  const categories = useMemo(() => {
    if (!report || !report.items) return [];
    const set = new Set<string>();
    report.items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [report]);

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never Sold";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSort = (field: keyof DeadStockItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: string, daysUnsold: number) => {
    switch (status) {
      case "DEAD_STOCK":
        return (
          <span className="badge danger" style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
            💤 DEAD STOCK ({daysUnsold}d)
          </span>
        );
      case "SLOW_MOVING":
        return (
          <span className="badge warning" style={{ background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
            ⚠️ SLOW MOVING ({daysUnsold}d)
          </span>
        );
      case "NEW_UNSOLD":
        return (
          <span className="badge info" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)" }}>
            ✨ NEW ITEM ({daysUnsold}d old)
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="badge success">
            🟢 ACTIVE STOCK
          </span>
        );
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 className="page-title">Dead Stock Detector</h1>
            <span style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              padding: "3px 10px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.5px"
            }}>ANALYTICS ENGINE</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Identify unsold inventory, stagnant stock, and capital tied up in slow-moving products
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn" onClick={fetchDeadStockReport} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Analysis
          </button>
          <button className="btn btn-primary" onClick={handleExportCsv}>
            <DownloadCloud size={16} /> Export Dead Stock CSV
          </button>
        </div>
      </div>

      {/* Threshold Configurator Banner */}
      <div className="card" style={{ padding: "20px 24px", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sliders size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Configurable Detection Thresholds</div>
              <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                Adjust day thresholds to dynamically analyze slow-moving and dead inventory items
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {/* Slow Moving Threshold Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Slow Moving (Days):
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={slowDays}
                onChange={(e) => setSlowDays(parseInt(e.target.value, 10) || 30)}
                style={{
                  width: "75px",
                  padding: "6px 10px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  fontSize: "0.9rem"
                }}
              />
            </div>

            {/* Dead Stock Threshold Input */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                Dead Stock (Days):
              </label>
              <input
                type="number"
                min="1"
                max="730"
                value={deadDays}
                onChange={(e) => setDeadDays(parseInt(e.target.value, 10) || 60)}
                style={{
                  width: "75px",
                  padding: "6px 10px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                  color: "var(--text-main)",
                  fontWeight: 700,
                  fontSize: "0.9rem"
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={fetchDeadStockReport}
              style={{ padding: "8px 18px", fontSize: "0.88rem" }}
            >
              Apply Thresholds
            </button>
          </div>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: "28px" }}>
        {/* Card 1: Capital Tied Up */}
        <div className="card">
          <div className="card-title">
            <span>Capital Tied Up</span>
            <IndianRupee size={20} color="#f87171" />
          </div>
          <div className="metric-value" style={{ color: "#f87171", background: "none", WebkitTextFillColor: "initial" }}>
            {formatCurrency(report?.totalCapitalTiedUp)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Dead: {formatCurrency(report?.totalDeadStockValue)} | Slow: {formatCurrency(report?.totalSlowMovingValue)}
            <br/>New (Unsold): {formatCurrency(
              (report?.totalCapitalTiedUp || 0) - ((report?.totalDeadStockValue || 0) + (report?.totalSlowMovingValue || 0))
            )}
          </div>
        </div>

        {/* Card 2: Dead Stock Items */}
        <div className="card">
          <div className="card-title">
            <span>Dead Stock Products</span>
            <Clock size={20} color="#ef4444" />
          </div>
          <div className="metric-value" style={{ color: "#ef4444", background: "none", WebkitTextFillColor: "initial" }}>
            {report?.deadStockCount || 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
            No sales recorded in &ge; {report?.deadThresholdDays || deadDays} days
          </div>
        </div>

        {/* Card 3: Slow Moving Items */}
        <div className="card">
          <div className="card-title">
            <span>Slow Moving Products</span>
            <AlertTriangle size={20} color="#fbbf24" />
          </div>
          <div className="metric-value" style={{ color: "#fbbf24", background: "none", WebkitTextFillColor: "initial" }}>
            {report?.slowMovingCount || 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Unsold for {report?.slowThresholdDays || slowDays} &ndash; {(report?.deadThresholdDays || deadDays) - 1} days
          </div>
        </div>

        {/* Card 4: Healthy Active Stock */}
        <div className="card">
          <div className="card-title">
            <span>Healthy Active Items</span>
            <CheckCircle size={20} color="#34d399" />
          </div>
          <div className="metric-value" style={{ color: "#34d399", background: "none", WebkitTextFillColor: "initial" }}>
            {report?.activeCount || 0}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
            Active sales within {report?.slowThresholdDays || slowDays} days ({report?.newUnsoldCount || 0} new unsold)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: "24px" }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          {/* Search Input */}
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search dead stock by product, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 42px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--glass-border)",
                borderRadius: "10px",
                color: "var(--text-main)",
                outline: "none"
              }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ width: "170px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--glass-border)",
                borderRadius: "10px",
                color: "var(--text-main)",
                outline: "none"
              }}
            >
              <option value="ALL">All Classifications</option>
              <option value="DEAD_STOCK">💤 Dead Stock Only</option>
              <option value="SLOW_MOVING">⚠️ Slow Moving Only</option>
              <option value="NEW_UNSOLD">✨ New Items (Unsold)</option>
              <option value="ACTIVE">🟢 Active Stock</option>
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ width: "160px" }}>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--glass-border)",
                borderRadius: "10px",
                color: "var(--text-main)",
                outline: "none"
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            className="btn"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
              setCategoryFilter("ALL");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Dead Stock Items Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>ID</th>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th onClick={() => handleSort("currentStock")} style={{ cursor: "pointer" }}>Qty</th>
                <th onClick={() => handleSort("purchasePrice")} style={{ cursor: "pointer" }}>Unit Cost</th>
                <th onClick={() => handleSort("estimatedStockValue")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    Capital Value <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort("lastSaleDate")} style={{ cursor: "pointer" }}>Last Sale</th>
                <th onClick={() => handleSort("daysWithoutSale")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    Days Unsold <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Clearance Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Analyzing inventory movement log and sales order history...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No products match the selected classification filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{item.id}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{item.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.supplier}</div>
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--primary)" }}>{item.sku}</td>
                    <td>
                      <span style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: "6px" }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{item.currentStock}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{formatCurrency(item.purchasePrice)}</td>
                    <td style={{ fontWeight: 800, color: item.status === "DEAD_STOCK" ? "#f87171" : item.status === "SLOW_MOVING" ? "#fbbf24" : "var(--text-main)" }}>
                      {formatCurrency(item.estimatedStockValue)}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: item.lastSaleDate ? "var(--text-main)" : "#c084fc" }}>
                      {formatDate(item.lastSaleDate)}
                    </td>
                    <td style={{ fontWeight: 700, color: item.daysWithoutSale !== null && item.daysWithoutSale >= deadDays ? "#f87171" : item.daysWithoutSale !== null && item.daysWithoutSale >= slowDays ? "#fbbf24" : "var(--text-muted)" }}>
                      {item.daysWithoutSale !== null && item.daysWithoutSale !== undefined ? `${item.daysWithoutSale}d` : "-"}
                    </td>
                    <td>{getStatusBadge(item.status, item.daysWithoutSale ?? item.productAgeDays)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                        <button
                          className="btn"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            background: item.status === "DEAD_STOCK" ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
                            color: item.status === "DEAD_STOCK" ? "#f87171" : "var(--primary)",
                            border: item.status === "DEAD_STOCK" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(99, 102, 241, 0.3)"
                          }}
                          onClick={() => setSelectedCalcItem(item)}
                          title="Calculate clearance sale discount"
                        >
                          <Tag size={14} /> Calculate Discount
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clearance Discount Calculator Modal */}
      {selectedCalcItem && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg" style={{ maxWidth: "600px" }}>
            <button className="modal-close" onClick={() => setSelectedCalcItem(null)}>
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Tag size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Clearance Sale Calculator</h2>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {selectedCalcItem.name} ({selectedCalcItem.sku})
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--glass-border)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current Stock</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{selectedCalcItem.currentStock} units</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Original Price</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{formatCurrency(selectedCalcItem.sellingPrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tied Capital Value</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>{formatCurrency(selectedCalcItem.estimatedStockValue)}</div>
                </div>
              </div>
            </div>

            {/* Discount Selection */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "10px", fontWeight: 600 }}>
                Select Clearance Discount Rate:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {[15, 25, 40, 50].map((rate) => (
                  <button
                    key={rate}
                    className={`btn ${discountPercent === rate ? "btn-primary" : ""}`}
                    onClick={() => setDiscountPercent(rate)}
                    style={{ justifyContent: "center", fontWeight: 700 }}
                  >
                    {rate}% OFF
                  </button>
                ))}
              </div>
            </div>

            {/* Projected Financial Recovery Box */}
            <div style={{
              background: "rgba(52, 211, 153, 0.08)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              borderRadius: "14px",
              padding: "18px",
              marginBottom: "24px"
            }}>
              <div style={{ fontSize: "0.85rem", color: "#34d399", fontWeight: 700, marginBottom: "8px" }}>
                PROJECTED CAPITAL RECOVERY
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>New Clearance Selling Price:</span>
                <strong style={{ fontSize: "1.1rem", color: "#34d399" }}>
                  {formatCurrency(selectedCalcItem.sellingPrice * (1 - discountPercent / 100))}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Total Cash Flow Recovery:</span>
                <strong style={{ fontSize: "1.1rem", color: "#fff" }}>
                  {formatCurrency((selectedCalcItem.sellingPrice * (1 - discountPercent / 100)) * selectedCalcItem.currentStock)}
                </strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="btn" onClick={() => setSelectedCalcItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

