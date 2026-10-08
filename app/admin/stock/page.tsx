"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes,
  Search,
  Filter,
  DownloadCloud,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Sliders,
  Calendar,
  User,
  Package,
  Layers,
  CheckCircle2,
  X
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  movementType: "PURCHASE" | "SALE" | "RETURN_IN" | "RETURN_OUT" | "ADJUSTMENT" | string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  stock?: number;
  minimumStockLevel: number;
  status: string;
}

export default function StockManagementPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedProductId, setSelectedProductId] = useState<string>("ALL");

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState<number | string>("");
  const [newQuantity, setNewQuantity] = useState<number | string>("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        authFetch("/stock-movements"),
        authFetch("/inventory"),
      ]);

      if (movRes.ok) {
        const data = await movRes.json();
        setMovements(Array.isArray(data) ? data : []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch stock records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdjustModal = (product?: ProductItem) => {
    if (product) {
      setAdjustProductId(product.id);
      setNewQuantity(product.quantity !== undefined ? product.quantity : (product.stock || 0));
    } else {
      const first = products[0];
      setAdjustProductId(first ? first.id : "");
      setNewQuantity(first ? (first.quantity !== undefined ? first.quantity : (first.stock || 0)) : 0);
    }
    setAdjustNotes("");
    setIsAdjustModalOpen(true);
  };

  const handleProductSelectionForAdjustment = (pId: string | number) => {
    setAdjustProductId(pId);
    const selected = products.find((p) => String(p.id) === String(pId));
    if (selected) {
      setNewQuantity(selected.quantity !== undefined ? selected.quantity : (selected.stock || 0));
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      showToast("error", "Please select a product.");
      return;
    }

    const qty = parseInt(String(newQuantity), 10);
    if (isNaN(qty) || qty < 0) {
      showToast("error", "Stock quantity must be a non-negative number.");
      return;
    }

    const targetProduct = products.find((p) => String(p.id) === String(adjustProductId));
    const oldQty = targetProduct?.quantity !== undefined ? targetProduct.quantity : (targetProduct?.stock || 0);

    if (qty === oldQty) {
      showToast("error", "New stock matches existing stock. No adjustment needed.");
      return;
    }

    if (!confirm(`Are you sure you want to adjust stock for '${targetProduct?.name}' from ${oldQty} to ${qty}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(`/products/${adjustProductId}`, {
        method: "PUT",
        body: JSON.stringify({
          quantity: qty,
          stock: qty,
          notes: adjustNotes || "Manual stock adjustment via Admin panel",
        }),
      });

      if (res.ok) {
        showToast("success", "Stock adjusted successfully. Ledger movement recorded.");
        setIsAdjustModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to adjust stock.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error adjusting stock.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/stock");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stock_movements_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Stock movements ledger exported.");
      } else {
        showToast("error", "Failed to export stock ledger.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting ledger.");
    }
  };

  // Metrics
  const totalStockCount = useMemo(() => {
    return products.reduce((acc, curr) => acc + (curr.quantity !== undefined ? curr.quantity : (curr.stock || 0)), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const q = p.quantity !== undefined ? p.quantity : (p.stock || 0);
      return q > 0 && q <= (p.minimumStockLevel || 10);
    }).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => {
      const q = p.quantity !== undefined ? p.quantity : (p.stock || 0);
      return q === 0;
    }).length;
  }, [products]);

  const incomingTotal = useMemo(() => {
    return movements
      .filter((m) => ["PURCHASE", "RETURN_IN"].includes(m.movementType.toUpperCase()))
      .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [movements]);

  const outgoingTotal = useMemo(() => {
    return movements
      .filter((m) => ["SALE", "RETURN_OUT"].includes(m.movementType.toUpperCase()))
      .reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [movements]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchesSearch =
        search === "" ||
        (m.productName && m.productName.toLowerCase().includes(search.toLowerCase())) ||
        (m.sku && m.sku.toLowerCase().includes(search.toLowerCase())) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(search.toLowerCase())) ||
        (m.performedBy && m.performedBy.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === "ALL" || m.movementType.toUpperCase() === typeFilter.toUpperCase();
      const matchesProduct = selectedProductId === "ALL" || String(m.productId) === selectedProductId;

      return matchesSearch && matchesType && matchesProduct;
    });
  }, [movements, search, typeFilter, selectedProductId]);

  const getMovementBadge = (type: string) => {
    const upper = (type || "").toUpperCase();
    switch (upper) {
      case "PURCHASE":
        return (
          <span className="badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <ArrowDownLeft size={12} style={{ marginRight: "4px" }} /> PURCHASE (IN)
          </span>
        );
      case "SALE":
        return (
          <span className="badge" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
            <ArrowUpRight size={12} style={{ marginRight: "4px" }} /> SALE (OUT)
          </span>
        );
      case "RETURN_IN":
        return (
          <span className="badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>
            <RotateCcw size={12} style={{ marginRight: "4px" }} /> RETURN (IN)
          </span>
        );
      case "RETURN_OUT":
        return (
          <span className="badge badge-warning">
            <RotateCcw size={12} style={{ marginRight: "4px" }} /> RETURN (OUT)
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            <Sliders size={12} style={{ marginRight: "4px" }} /> ADJUSTMENT
          </span>
        );
      default:
        return <span className="badge badge-neutral">{type}</span>;
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
            <Boxes className="text-primary" size={28} />
            Stock Management & Audit Ledger
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Monitor real-time inventory inflows and outflows, reconcile discrepancies, and execute manual adjustments.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export Ledger">
            <DownloadCloud size={16} /> Export Ledger CSV
          </button>
          <button onClick={() => openAdjustModal()} className="btn btn-primary">
            <Sliders size={16} /> Adjust Stock Level
          </button>
        </div>
      </div>

      {/* Stock Overview KPI Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Current Total Stock</div>
          <div className="stat-value">{totalStockCount}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Units across catalog
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Cumulative Incoming</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            +{incomingTotal}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Purchases & Customer Returns
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Cumulative Outgoing</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            -{outgoingTotal}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Sales & Supplier Returns
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Low Stock Alert</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {lowStockCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Below reorder threshold
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Out of Stock</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {outOfStockCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Depleted items
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
            placeholder="Search by product name, SKU, reference PO/SO, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="input-field"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{ minWidth: "180px" }}
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Movement Types</option>
            <option value="PURCHASE">Purchase (Restock)</option>
            <option value="SALE">Sale (Dispatch)</option>
            <option value="RETURN_IN">Return (Inward)</option>
            <option value="RETURN_OUT">Return (Outward)</option>
            <option value="ADJUSTMENT">Manual Adjustment</option>
          </select>

          <button onClick={fetchData} className="btn" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Timestamp</th>
                <th>Product Information</th>
                <th>Movement Type</th>
                <th style={{ textAlign: "center" }}>Delta Quantity</th>
                <th style={{ textAlign: "center" }}>Stock Transition</th>
                <th>Reference ID</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading stock ledger transactions...</div>
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No stock movements recorded for this filter.</div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = ["PURCHASE", "RETURN_IN"].includes(m.movementType.toUpperCase()) || 
                    (m.movementType.toUpperCase() === "ADJUSTMENT" && m.newStock > m.previousStock);

                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          {m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-bright)" }}>{m.productName}</div>
                        {m.sku && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {m.sku}</div>}
                      </td>
                      <td>{getMovementBadge(m.movementType)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: isPositive ? "var(--success)" : "var(--danger)",
                          }}
                        >
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {m.previousStock} → <strong style={{ color: "var(--text-bright)" }}>{m.newStock}</strong>
                        </span>
                      </td>
                      <td>
                        {m.referenceNumber ? (
                          <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--primary)" }}>
                            {m.referenceNumber}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                        )}
                        {m.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.notes}</div>}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <User size={13} />
                          {m.performedBy || "System"}
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

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "520px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Sliders size={22} className="text-primary" />
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Manual Stock Adjustment
                </h2>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label className="form-label">Select Catalog Product *</label>
                  <select
                    required
                    className="input-field"
                    value={adjustProductId}
                    onChange={(e) => handleProductSelectionForAdjustment(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => {
                      const cur = p.quantity !== undefined ? p.quantity : (p.stock || 0);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current Stock: {cur})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="form-label">New Actual Physical Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="input-field"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    style={{ width: "100%", fontSize: "1.1rem", fontWeight: 700 }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Enter the counted physical stock quantity. The system will compute the adjustment delta.
                  </div>
                </div>

                <div>
                  <label className="form-label">Audit Reason / Discrepancy Explanation</label>
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="e.g. Physical inventory count discrepancy, damaged packaging replacement..."
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    style={{ width: "100%", resize: "none" }}
                  />
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                    borderRadius: "6px",
                    color: "#fbbf24",
                    fontSize: "0.8rem",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    This action updates the authoritative product inventory and appends an immutable entry to the stock audit ledger.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Confirm Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
