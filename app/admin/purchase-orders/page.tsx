"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  DownloadCloud,
  RefreshCw,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  Truck,
  IndianRupee,
  Layers,
  ChevronRight,
  Package
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId?: number;
  supplierName: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status: "PENDING" | "APPROVED" | "ORDERED" | "RECEIVED" | "CANCELLED" | string;
  notes?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdAt?: string;
}

interface SupplierOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  purchasePrice?: number;
  sellingPrice?: number;
  quantity?: number;
  stock?: number;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Form states for creating PO
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>("");
  const [expectedDate, setExpectedDate] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [lineItems, setLineItems] = useState<
    { productId: number | string; quantity: number; unitPrice: number }[]
  >([{ productId: "", quantity: 1, unitPrice: 0 }]);
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
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        authFetch("/purchases"),
        authFetch("/suppliers"),
        authFetch("/inventory"),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }
      if (suppliersRes.ok) {
        const data = await suppliersRes.json();
        setSuppliers(Array.isArray(data) ? data : []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
    setExpectedDate("");
    setOrderNotes("");
    setLineItems([
      {
        productId: products.length > 0 ? products[0].id : "",
        quantity: 1,
        unitPrice: products.length > 0 ? products[0].purchasePrice || 0 : 0,
      },
    ]);
    setIsCreateOpen(true);
  };

  const handleProductSelect = (index: number, prodId: string | number) => {
    const prod = products.find((p) => String(p.id) === String(prodId));
    const updated = [...lineItems];
    updated[index].productId = prodId;
    if (prod && prod.purchasePrice) {
      updated[index].unitPrice = prod.purchasePrice;
    }
    setLineItems(updated);
  };

  const handleItemChange = (index: number, field: "quantity" | "unitPrice", value: number) => {
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
        unitPrice: firstProd?.purchasePrice || 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateFormTotal = () => {
    return lineItems.reduce((acc, curr) => acc + (curr.quantity || 0) * (curr.unitPrice || 0), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast("error", "Please select a supplier.");
      return;
    }
    const validItems = lineItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast("error", "Please add at least one valid line item.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId: Number(selectedSupplierId),
        notes: orderNotes.trim() || null,
        expectedDeliveryDate: expectedDate ? new Date(expectedDate).toISOString() : null,
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      };

      const res = await authFetch("/purchases", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", "Purchase Order created successfully.");
        setIsCreateOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to create PO.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error creating PO.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to mark this Purchase Order as RECEIVED? This will automatically increase product inventory stock.")) {
      return;
    }

    try {
      const res = await authFetch(`/purchases/${orderId}/receive`, { method: "POST" });
      if (res.ok) {
        showToast("success", "PO received! Inventory stock has been incremented.");
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setIsViewOpen(false);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to receive PO.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error receiving PO.");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this Purchase Order?")) return;

    try {
      const res = await authFetch(`/purchases/${orderId}/cancel`, { method: "POST" });
      if (res.ok) {
        showToast("success", "Purchase Order has been cancelled.");
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setIsViewOpen(false);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to cancel PO.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error cancelling PO.");
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await authFetch(`/purchases/${orderId}/status?status=${newStatus}`, {
        method: "PUT",
      });
      if (res.ok) {
        showToast("success", `Status updated to ${newStatus}.`);
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          const updated = await res.json();
          setSelectedOrder(updated);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error updating status.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/purchases");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `purchase_orders_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Purchase orders CSV exported.");
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
        (o.supplierName && o.supplierName.toLowerCase().includes(search.toLowerCase())) ||
        o.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || o.status.toUpperCase() === statusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    switch (upper) {
      case "RECEIVED":
        return <span className="badge badge-success">Received</span>;
      case "ORDERED":
        return <span className="badge badge-warning" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" }}>Ordered</span>;
      case "APPROVED":
        return <span className="badge badge-info" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>Approved</span>;
      case "PENDING":
        return <span className="badge badge-warning">Pending</span>;
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

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart className="text-primary" size={28} />
            Purchase Orders (Procurement)
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Authorize restock orders with suppliers, track shipment progress, and auto-increase inventory on receipt.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Create Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total POs Raised</div>
          <div className="stat-value">{orders.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Total orders recorded
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Pending / Ordered</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {orders.filter((o) => ["PENDING", "APPROVED", "ORDERED"].includes(o.status.toUpperCase())).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Awaiting delivery
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Completed & Received</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {orders.filter((o) => o.status.toUpperCase() === "RECEIVED").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Stock received & stored
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Procurement Spend</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {formatRupee(orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0))}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Cumulative order volume
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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
            placeholder="Search by PO number, vendor, or product name..."
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
            style={{ minWidth: "150px" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ORDERED">Ordered</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button onClick={fetchData} className="btn" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier / Vendor</th>
                <th>Order Date</th>
                <th>Expected Delivery</th>
                <th>Items Count</th>
                <th>Total Value</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading purchase orders...</div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No purchase orders found matching your search.</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const isReceived = po.status.toUpperCase() === "RECEIVED";
                  const isCancelled = po.status.toUpperCase() === "CANCELLED";

                  return (
                    <tr key={po.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-bright)" }}>
                          {po.orderNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-bright)" }}>{po.supplierName}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} />
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={13} />
                          {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {po.items ? po.items.length : 0} items
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--text-bright)" }}>
                          {formatRupee(po.totalAmount)}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>{getStatusBadge(po.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setSelectedOrder(po);
                              setIsViewOpen(true);
                            }}
                            className="btn"
                            style={{ padding: "6px 8px" }}
                            title="View PO Details"
                          >
                            <Eye size={14} />
                          </button>

                          {!isReceived && !isCancelled && (
                            <>
                              <button
                                onClick={() => handleReceiveOrder(po.id)}
                                className="btn btn-success"
                                style={{ padding: "6px 8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                                title="Receive Order (Auto Increases Stock)"
                              >
                                <CheckCircle2 size={14} /> Receive
                              </button>
                              <button
                                onClick={() => handleCancelOrder(po.id)}
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

      {/* Create Purchase Order Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "720px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Create Purchase Order
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Procure stock items from suppliers. Stock will update upon receiving.
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
                  <label className="form-label">Select Supplier *</label>
                  <select
                    required
                    className="input-field"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="form-label">PO Notes / Special Instructions</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Standard 30-day payment term, deliver to Warehouse Bay 3"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Order Items</label>
                  <button type="button" onClick={addLineItem} className="btn" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {lineItems.map((item, idx) => (
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
                          <option value="">-- Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
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
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
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
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "16px",
                    padding: "12px",
                    background: "rgba(99, 102, 241, 0.05)",
                    borderRadius: "8px",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Estimated Value:</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>
                    {formatRupee(calculateFormTotal())}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating PO..." : "Issue Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Details Modal */}
      {isViewOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "680px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  PURCHASE ORDER SPECIFICATION
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supplier Vendor</div>
                  <div style={{ fontWeight: 600, color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedOrder.supplierName}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Order Status</div>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(selectedOrder.status)}</div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Order Placed</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString("en-IN") : "—"}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Expected Delivery</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedOrder.expectedDeliveryDate
                      ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString("en-IN")
                      : "Unscheduled"}
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}

              {/* Status Update Control */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Update Status:</span>
                <select
                  className="input-field"
                  value={selectedOrder.status.toUpperCase()}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  style={{ fontSize: "0.85rem", padding: "4px 8px" }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ORDERED">ORDERED</option>
                  <option value="RECEIVED">RECEIVED (Closes PO)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {/* Item Details Table */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>Order Line Items</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
                  <table className="admin-table" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th style={{ textAlign: "right" }}>Unit Cost</th>
                        <th style={{ textAlign: "right" }}>Total</th>
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
                          <td style={{ textAlign: "right" }}>{formatRupee(i.unitPrice)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {formatRupee(i.quantity * i.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Purchase Amount:</span>
                <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>
                  {formatRupee(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              {selectedOrder.status.toUpperCase() !== "RECEIVED" && selectedOrder.status.toUpperCase() !== "CANCELLED" && (
                <>
                  <button onClick={() => handleReceiveOrder(selectedOrder.id)} className="btn btn-success">
                    <CheckCircle2 size={16} /> Mark as Received
                  </button>
                  <button onClick={() => handleCancelOrder(selectedOrder.id)} className="btn btn-danger">
                    <XCircle size={16} /> Cancel PO
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
