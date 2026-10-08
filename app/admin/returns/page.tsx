"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
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
  Layers,
  ArrowRight,
  Package,
  Check
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface ReturnOrderItem {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  quantity: number;
  remarks?: string;
}

interface ReturnOrder {
  id: number;
  returnNumber: string;
  returnType: "CUSTOMER_RETURN" | "SUPPLIER_RETURN" | string;
  referenceOrderNumber?: string;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED" | string;
  items: ReturnOrderItem[];
  createdAt?: string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  stock?: number;
  quantity?: number;
}

export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);

  // Form states
  const [returnType, setReturnType] = useState<string>("CUSTOMER_RETURN");
  const [refOrderNumber, setRefOrderNumber] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [lineItems, setLineItems] = useState<
    { productId: number | string; quantity: number; remarks: string }[]
  >([{ productId: "", quantity: 1, remarks: "" }]);
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
      const [retRes, prodRes] = await Promise.all([
        authFetch("/returns"),
        authFetch("/inventory"),
      ]);

      if (retRes.ok) {
        const data = await retRes.json();
        setReturns(Array.isArray(data) ? data : []);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(Array.isArray(prodData) ? prodData : []);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve return orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setReturnType("CUSTOMER_RETURN");
    setRefOrderNumber("");
    setReturnReason("");
    const firstProd = products[0];
    setLineItems([
      {
        productId: firstProd ? firstProd.id : "",
        quantity: 1,
        remarks: "",
      },
    ]);
    setIsCreateOpen(true);
  };

  const handleProductSelect = (index: number, prodId: string | number) => {
    const updated = [...lineItems];
    updated[index].productId = prodId;
    setLineItems(updated);
  };

  const handleItemChange = (index: number, field: "quantity" | "remarks", value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const addLineItem = () => {
    const firstProd = products[0];
    setLineItems([
      ...lineItems,
      {
        productId: firstProd ? firstProd.id : "",
        quantity: 1,
        remarks: "",
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast("error", "Please add at least one valid item to return.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        returnType,
        referenceOrderNumber: refOrderNumber.trim() || null,
        reason: returnReason.trim() || null,
        items: validItems.map((i) => ({
          productId: Number(i.productId),
          quantity: Number(i.quantity),
          remarks: i.remarks.trim() || null,
        })),
      };

      const res = await authFetch("/returns", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", "Return request registered successfully.");
        setIsCreateOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to create return.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error creating return order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await authFetch(`/returns/${id}/approve`, { method: "POST" });
      if (res.ok) {
        showToast("success", "Return request APPROVED.");
        fetchData();
        if (selectedReturn && selectedReturn.id === id) {
          const updated = await res.json();
          setSelectedReturn(updated);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to approve return.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error approving return.");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to REJECT this return request?")) return;
    try {
      const res = await authFetch(`/returns/${id}/reject`, { method: "POST" });
      if (res.ok) {
        showToast("success", "Return request REJECTED.");
        fetchData();
        if (selectedReturn && selectedReturn.id === id) {
          const updated = await res.json();
          setSelectedReturn(updated);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to reject return.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error rejecting return.");
    }
  };

  const handleProcess = async (id: number) => {
    if (!confirm("Process this return? This will automatically update inventory stock and record the movement in ledger.")) {
      return;
    }
    try {
      const res = await authFetch(`/returns/${id}/process`, { method: "POST" });
      if (res.ok) {
        showToast("success", "Return processed successfully! Inventory updated.");
        fetchData();
        if (selectedReturn && selectedReturn.id === id) {
          setIsViewOpen(false);
        }
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to process return.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error processing return.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/returns");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `returns_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Returns CSV exported successfully.");
      } else {
        showToast("error", "Failed to export returns CSV.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting CSV.");
    }
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchesSearch =
        search === "" ||
        (r.returnNumber && r.returnNumber.toLowerCase().includes(search.toLowerCase())) ||
        (r.referenceOrderNumber && r.referenceOrderNumber.toLowerCase().includes(search.toLowerCase())) ||
        (r.reason && r.reason.toLowerCase().includes(search.toLowerCase())) ||
        r.items.some((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || r.status.toUpperCase() === statusFilter.toUpperCase();
      const matchesType = typeFilter === "ALL" || r.returnType.toUpperCase() === typeFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [returns, search, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    const upper = (status || "").toUpperCase();
    switch (upper) {
      case "PROCESSED":
        return <span className="badge badge-success">Processed (Stock Updated)</span>;
      case "APPROVED":
        return <span className="badge badge-info" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>Approved</span>;
      case "PENDING":
        return <span className="badge badge-warning">Pending Review</span>;
      case "REJECTED":
        return <span className="badge badge-danger">Rejected</span>;
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
            <RotateCcw className="text-primary" size={28} />
            Returns & RMA Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Authorize, review, and process customer returns (inward stock) and supplier return claims (outward stock).
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> Register Return
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total RMA Requests</div>
          <div className="stat-value">{returns.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Logged return orders
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Pending Decision</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {returns.filter((r) => r.status.toUpperCase() === "PENDING").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Awaiting inspection / review
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Approved & Pending Restock</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {returns.filter((r) => r.status.toUpperCase() === "APPROVED").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Ready to process
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Processed & Closed</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {returns.filter((r) => r.status.toUpperCase() === "PROCESSED").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Inventory adjusted
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
            placeholder="Search by RMA number, order reference, reason, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            className="input-field"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: "160px" }}
          >
            <option value="ALL">All Return Types</option>
            <option value="CUSTOMER_RETURN">Customer Return (IN)</option>
            <option value="SUPPLIER_RETURN">Supplier Return (OUT)</option>
          </select>

          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: "150px" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSED">Processed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button onClick={fetchData} className="btn" title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>RMA Number</th>
                <th>Type</th>
                <th>Order Ref</th>
                <th>Reason / Description</th>
                <th>Items Count</th>
                <th>Date Logged</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading return orders...</div>
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No returns found matching your filter criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ro) => {
                  const isCustomer = ro.returnType === "CUSTOMER_RETURN";
                  const isPending = ro.status.toUpperCase() === "PENDING";
                  const isApproved = ro.status.toUpperCase() === "APPROVED";

                  return (
                    <tr key={ro.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-bright)" }}>
                          {ro.returnNumber}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: isCustomer ? "rgba(168, 85, 247, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: isCustomer ? "#c084fc" : "#fbbf24",
                            border: `1px solid ${isCustomer ? "rgba(168, 85, 247, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                          }}
                        >
                          {isCustomer ? "Customer (In)" : "Supplier (Out)"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {ro.referenceOrderNumber || "—"}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", maxWidth: "220px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {ro.reason || "No reason given"}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {ro.items ? ro.items.length : 0} item(s)
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} />
                          {ro.createdAt ? new Date(ro.createdAt).toLocaleDateString("en-IN") : "—"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>{getStatusBadge(ro.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => {
                              setSelectedReturn(ro);
                              setIsViewOpen(true);
                            }}
                            className="btn"
                            style={{ padding: "6px 8px" }}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(ro.id)}
                                className="btn"
                                style={{ padding: "6px 8px", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}
                                title="Approve Return"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => handleReject(ro.id)}
                                className="btn btn-danger"
                                style={{ padding: "6px 8px" }}
                                title="Reject Return"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleProcess(ro.id)}
                              className="btn btn-success"
                              style={{ padding: "6px 8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                              title="Process Return (Updates Stock)"
                            >
                              Process
                            </button>
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

      {/* Register Return Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "680px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  Register Return (RMA)
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Record defective, damaged, or returned stock from customers or back to suppliers.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReturn}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label className="form-label">Return Type *</label>
                  <select
                    className="input-field"
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="CUSTOMER_RETURN">Customer Return (Restocks Inventory)</option>
                    <option value="SUPPLIER_RETURN">Supplier Return (Reduces Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Associated Order # (PO / SO)</label>
                  <input
                    type="text"
                    placeholder="e.g. SO-1002 or PO-5001"
                    className="input-field"
                    value={refOrderNumber}
                    onChange={(e) => setRefOrderNumber(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Reason for Return</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Defective display panel, incorrect item dispatched"
                    className="input-field"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Returned Items</label>
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
                        gridTemplateColumns: "2fr 1fr 2fr auto",
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
                          type="text"
                          placeholder="Remarks / Item Condition"
                          className="input-field"
                          value={item.remarks}
                          onChange={(e) => handleItemChange(idx, "remarks", e.target.value)}
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
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Registering..." : "Submit Return Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Return Details Modal */}
      {isViewOpen && selectedReturn && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "620px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  RMA FILE DOSSIER
                </span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  {selectedReturn.returnNumber}
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
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Return Classification</div>
                  <div style={{ fontWeight: 600, color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedReturn.returnType === "CUSTOMER_RETURN" ? "Customer Return (Inward)" : "Supplier Return (Outward)"}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Current Status</div>
                  <div style={{ marginTop: "4px" }}>{getStatusBadge(selectedReturn.status)}</div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Original Reference Order</div>
                  <div style={{ fontFamily: "monospace", color: "var(--primary)", marginTop: "4px" }}>
                    {selectedReturn.referenceOrderNumber || "Not Specified"}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Filing Date</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-bright)", marginTop: "4px" }}>
                    {selectedReturn.createdAt ? new Date(selectedReturn.createdAt).toLocaleString("en-IN") : "—"}
                  </div>
                </div>
              </div>

              {selectedReturn.reason && (
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: "6px", fontSize: "0.85rem" }}>
                  <strong>Return Reason:</strong> {selectedReturn.reason}
                </div>
              )}

              {/* Items List */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "8px" }}>Returned Inventory Items</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
                  <table className="admin-table" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th>Condition Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.items && selectedReturn.items.map((i, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{i.productName}</div>
                            {i.sku && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{i.sku}</div>}
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{i.quantity}</td>
                          <td style={{ color: "var(--text-muted)" }}>{i.remarks || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              {selectedReturn.status.toUpperCase() === "PENDING" && (
                <>
                  <button onClick={() => handleApprove(selectedReturn.id)} className="btn btn-primary">
                    <Check size={16} /> Approve RMA
                  </button>
                  <button onClick={() => handleReject(selectedReturn.id)} className="btn btn-danger">
                    <XCircle size={16} /> Reject RMA
                  </button>
                </>
              )}

              {selectedReturn.status.toUpperCase() === "APPROVED" && (
                <button onClick={() => handleProcess(selectedReturn.id)} className="btn btn-success">
                  Process Return & Reconcile Stock
                </button>
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
