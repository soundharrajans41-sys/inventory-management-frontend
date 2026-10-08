"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  DownloadCloud,
  RefreshCw,
  X,
  AlertTriangle,
  Calendar,
  User,
  Mail,
  IndianRupee,
  Package,
  Layers
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface SalesOrderItem {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  sellingPrice: number;
  totalPrice?: number;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  orderDate?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | string;
  totalAmount: number;
  items: SalesOrderItem[];
  createdAt?: string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  price?: number;
  sellingPrice?: number;
  stock?: number;
  quantity?: number;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form states for creating SO
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [lineItems, setLineItems] = useState<
    { productId: number | string; quantity: number; sellingPrice: number }[]
  >([{ productId: "", quantity: 1, sellingPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes] = await Promise.all([
        authFetch("/sales"),
        authFetch("/inventory"),
      ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve sales orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setCustomerName("");
    setCustomerEmail("");
    const firstProd = products[0];
    setLineItems([
      {
        productId: firstProd ? firstProd.id : "",
        quantity: 1,
        sellingPrice: firstProd ? firstProd.sellingPrice || firstProd.price || 0 : 0,
      },
    ]);
    setIsCreateOpen(true);
  };

  const handleProductSelect = (index: number, prodId: string | number) => {
    const prod = products.find((p) => String(p.id) === String(prodId));
    const updated = [...lineItems];
    updated[index].productId = prodId;
    if (prod) {
      updated[index].sellingPrice = prod.sellingPrice || prod.price || 0;
    }
    setLineItems(updated);
  };

  const handleItemChange = (index: number, field: "quantity" | "sellingPrice", value: number) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const addLineItem = () => {
    const firstProd = products[0];
    setLineItems([
      ...lineItems,
      {
        productId: firstProd ? firstProd.id : "",
        quantity: 1,
        sellingPrice: firstProd ? firstProd.sellingPrice || firstProd.price || 0 : 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateFormTotal = () => {
    return lineItems.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.sellingPrice || 0), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      showToast("error", "Customer name is required.");
      return;
    }

    const validItems = lineItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast("error", "Please add at least one valid product item.");
      return;
    }

    // Check available stock
    for (const item of validItems) {
      const prod = products.find((p) => String(p.id) === String(item.productId));
      const avail = prod?.stock !== undefined ? prod.stock : prod?.quantity || 0;
      if (item.quantity > avail) {
        showToast("error", `Insufficient stock for '${prod?.name || "Product"}'. Available: ${avail}, Requested: ${item.quantity}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          sellingPrice: Number(i.sellingPrice),
        })),
      };

      const res = await authFetch("/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", "Sales Order created successfully.");
        setIsCreateOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to create Sales Order.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error creating sales order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to FULFILL this order? This will deduct the required items from current inventory stock.")) {
      return;
    }

    try {
      const res = await authFetch(`/sales/${orderId}/process`, { method: "POST" });
      if (res.ok) {
        showToast("success", "Order fulfilled successfully! Inventory reduced.");
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setIsViewOpen(false);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to fulfill sales order.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error processing sales order.");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this Sales Order?")) return;

    try {
      const res = await authFetch(`/sales/${orderId}/status?status=CANCELLED`, { method: "PUT" });
      if (res.ok) {
        showToast("success", "Sales order cancelled.");
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setIsViewOpen(false);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to cancel order.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error cancelling order.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/sales");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sales_orders_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Sales orders CSV exported.");
      } else {
        showToast("error", "Failed to export CSV.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting CSV.");
    }
  };

  const formatRupee = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        search === "" ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
        (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(search.toLowerCase())) ||
        o.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || o.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    switch (upper) {
      case "COMPLETED":
        return <span className="badge badge-success">Fulfilled / Completed</span>;
      case "PENDING":
        return <span className="badge badge-warning">Pending Fulfillment</span>;
      case "CANCELLED":
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
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
            <TrendingUp className="text-primary" size={28} />
            Sales Orders & Outflow
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Track client requests, generate sales dispatches, and atomically decrease inventory with stock validation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Create Sales Order
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total Sales Placed</div>
          <div className="stat-value">{orders.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            All-time sales orders
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Pending Fulfillment</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {orders.filter((o) => o.status.toUpperCase() === "PENDING").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Awaiting dispatch
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Fulfilled & Completed</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {orders.filter((o) => o.status.toUpperCase() === "COMPLETED").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Stock delivered
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Gross Revenue</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {formatRupee(
              orders
                .filter((o) => o.status.toUpperCase() === "COMPLETED")
                .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            From fulfilled sales
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
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
            placeholder="Search by order ID, customer name, email, or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button onClick={fetchData} className="btn" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Information</th>
                <th>Order Date</th>
                <th>Item Count</th>
                <th>Total Value</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading sales orders...</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No sales orders found matching your criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((so) => {
                  const isPending = so.status.toUpperCase() === "PENDING";

                  return (
                    <tr key={so.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-bright)" }}>
                          {so.orderNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-bright)" }}>{so.customerName}</div>
                        {so.customerEmail && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {so.customerEmail}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} />
                          {so.orderDate ? new Date(so.orderDate).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {so.items ? so.items.length : 0} items
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--text-bright)" }}>
                          {formatRupee(so.totalAmount)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>{getStatusBadge(so.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setSelectedOrder(so);
                              setIsViewOpen(true);
                            }}
                            className="btn"
                            style={{ padding: "6px 8px" }}
                            title="View Order Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleProcessOrder(so.id)}
                                className="btn btn-success"
                                style={{ padding: "6px 8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                                title="Process & Fulfill Order (Decreases Stock)"
                              >
                                <CheckCircle size={14} /> Fulfill
                              </button>
                              <button
                                onClick={() => handleCancelOrder(so.id)}
                                className="btn btn-danger"
                                style={{ padding: "6px 8px" }}
                                title="Cancel Order"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
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

      {/* Create Sales Order Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "720px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Create Sales Order
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Record customer order. Fulfilling the order will decrement inventory automatically.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / TechCorp"
                    className="input-field"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Customer Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="input-field"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Order Items</label>
                  <button type="button" onClick={addLineItem} className="btn" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {lineItems.map((item, idx) => {
                    const matchedProd = products.find((p) => String(p.id) === String(item.productId));
                    const avail = matchedProd?.stock !== undefined ? matchedProd.stock : matchedProd?.quantity || 0;

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1.2fr auto",
                          gap: "10px",
                          alignItems: "center",
                          background: "rgba(255, 255, 255, 0.02)",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <div>
                          <select
                            className="input-field"
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            style={{ width: "100%", fontSize: "0.85rem" }}
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stock !== undefined ? p.stock : p.quantity})
                              </option>
                            ))}
                          </select>
                          {matchedProd && (
                            <div style={{ fontSize: "0.7rem", color: avail < item.quantity ? "var(--danger)" : "var(--text-muted)", marginTop: "2px" }}>
                              Available Stock: {avail} units
                            </div>
                          )}
                        </div>

                        <div>
                          <input
                            type="number"
                            min="1"
                            max={avail > 0 ? avail : undefined}
                            placeholder="Qty"
                            className="input-field"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10) || 1)}
                            style={{ width: "100%", fontSize: "0.85rem" }}
                          />
                        </div>

                        <div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Unit Price"
                            className="input-field"
                            value={item.sellingPrice}
                            onChange={(e) => handleItemChange(idx, "sellingPrice", parseFloat(e.target.value) || 0)}
                            style={{ width: "100%", fontSize: "0.85rem" }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={lineItems.length === 1}
                          className="btn btn-danger"
                          style={{ padding: "6px 8px", opacity: lineItems.length === 1 ? 0.4 : 1 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "16px",
                    padding: "12px",
                    background: "rgba(16, 185, 129, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Sales Order Value:</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--success)" }}>
                    {formatRupee(calculateFormTotal())}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating SO..." : "Create Sales Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View SO Details Modal */}
      {isViewOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "680px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  SALES ORDER MANIFEST
                </span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  {selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setIsViewOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Customer Client</div>
                  <div style={{ fontWeight: 600, color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedOrder.customerName}
                  </div>
                  {selectedOrder.customerEmail && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {selectedOrder.customerEmail}
                    </div>
                  )}
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fulfillment Status</div>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(selectedOrder.status)}</div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Date Created</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString("en-IN") : "—"}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Order Value</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)", marginTop: "4px" }}>
                    {formatRupee(selectedOrder.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>Ordered Line Items</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
                  <table className="admin-table" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th style={{ textAlign: "right" }}>Selling Price</th>
                        <th style={{ textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items && selectedOrder.items.map((i, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{i.productName}</div>
                            {i.sku && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{i.sku}</div>}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 600 }}>{i.quantity}</td>
                          <td style={{ textAlign: "right" }}>{formatRupee(i.sellingPrice)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {formatRupee(i.quantity * i.sellingPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              {selectedOrder.status.toUpperCase() === "PENDING" && (
                <>
                  <button onClick={() => handleProcessOrder(selectedOrder.id)} className="btn btn-success">
                    <CheckCircle size={16} /> Fulfill Order (Reduce Stock)
                  </button>
                  <button onClick={() => handleCancelOrder(selectedOrder.id)} className="btn btn-danger">
                    <XCircle size={16} /> Cancel Order
                  </button>
                </>
              )}
              <button onClick={() => setIsViewOpen(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
