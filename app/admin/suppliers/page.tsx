"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  DownloadCloud,
  RefreshCw,
  X,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  FileText,
  PackageCheck
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface SupplierItem {
  id: number;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  suppliedProductsCount?: number;
  status?: string;
  createdAt?: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formGst, setFormGst] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(Array.isArray(data) ? data : []);
      } else {
        showToast("error", "Failed to fetch suppliers list.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setSelectedSupplier(null);
    setFormName("");
    setFormCompany("");
    setFormContactPerson("");
    setFormEmail("");
    setFormPhone("");
    setFormAddress("");
    setFormGst("");
    setIsAddEditOpen(true);
  };

  const openEditModal = (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
    setFormName(supplier.name || "");
    setFormCompany(supplier.companyName || "");
    setFormContactPerson(supplier.contactPerson || "");
    setFormEmail(supplier.email || "");
    setFormPhone(supplier.phone || "");
    setFormAddress(supplier.address || "");
    setFormGst(supplier.gstNumber || "");
    setIsAddEditOpen(true);
  };

  const openViewModal = (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
    setIsViewOpen(true);
  };

  const openDeleteModal = (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
    setIsDeleteOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("error", "Supplier name is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        companyName: formCompany.trim() || null,
        contactPerson: formContactPerson.trim() || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        gstNumber: formGst.trim() || null,
      };

      const endpoint = selectedSupplier ? `/suppliers/${selectedSupplier.id}` : "/suppliers";
      const method = selectedSupplier ? "PUT" : "POST";

      const res = await authFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("success", selectedSupplier ? "Supplier updated successfully." : "Supplier created successfully.");
        setIsAddEditOpen(false);
        fetchSuppliers();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error saving supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`/suppliers/${selectedSupplier.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Supplier deleted successfully.");
        setIsDeleteOpen(false);
        setSelectedSupplier(null);
        fetchSuppliers();
      } else {
        const err = await res.json();
        showToast("error", err.message || "Failed to delete supplier. Ensure no products are linked.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Unexpected error deleting supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/suppliers");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `suppliers_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", "Suppliers CSV exported successfully.");
      } else {
        showToast("error", "Failed to export suppliers CSV.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error exporting CSV.");
    }
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchesSearch =
        search === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.companyName && s.companyName.toLowerCase().includes(search.toLowerCase())) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (s.gstNumber && s.gstNumber.toLowerCase().includes(search.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

      return matchesSearch;
    });
  }, [suppliers, search]);

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
            <Truck className="text-primary" size={28} />
            Supplier Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Maintain vendor directories, company credentials, GST registrations, and supply metrics.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportCsv} className="btn" title="Export as CSV">
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-title">Total Registered Vendors</div>
          <div className="stat-value">{suppliers.length}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Active business suppliers
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">With GST Registration</div>
          <div className="stat-value" style={{ color: "var(--primary)" }}>
            {suppliers.filter((s) => s.gstNumber && s.gstNumber.trim().length > 0).length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Compliant commercial entities
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Supplied Catalog Products</div>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {suppliers.reduce((acc, curr) => acc + (curr.suppliedProductsCount || 0), 0)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Linked product items
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
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
            placeholder="Search by vendor name, company, contact person, GST or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "38px", width: "100%" }}
          />
        </div>

        <button onClick={fetchSuppliers} className="btn" title="Refresh">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier / Vendor</th>
                <th>Company Name</th>
                <th>Contact Details</th>
                <th>GST Number</th>
                <th style={{ textAlign: "center" }}>Products Supplied</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>Loading suppliers catalogue...</div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-muted)" }}>No suppliers found matching your criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        #{supplier.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-bright)" }}>{supplier.name}</div>
                      {supplier.contactPerson && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Attn: {supplier.contactPerson}
                        </div>
                      )}
                    </td>
                    <td>
                      {supplier.companyName ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <Building2 size={14} color="var(--primary)" />
                          {supplier.companyName}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {supplier.email && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Mail size={12} color="var(--text-muted)" /> {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-muted)" }}>
                            <Phone size={12} /> {supplier.phone}
                          </span>
                        )}
                        {!supplier.email && !supplier.phone && <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </div>
                    </td>
                    <td>
                      {supplier.gstNumber ? (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                            background: "rgba(99, 102, 241, 0.1)",
                            color: "#818cf8",
                            padding: "3px 7px",
                            borderRadius: "4px",
                            border: "1px solid rgba(99, 102, 241, 0.25)"
                          }}
                        >
                          {supplier.gstNumber}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Unregistered</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          color: (supplier.suppliedProductsCount || 0) > 0 ? "var(--success)" : "var(--text-muted)"
                        }}
                      >
                        <PackageCheck size={14} />
                        {supplier.suppliedProductsCount || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button
                          onClick={() => openViewModal(supplier)}
                          className="btn"
                          style={{ padding: "6px 8px" }}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="btn"
                          style={{ padding: "6px 8px" }}
                          title="Edit Supplier"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(supplier)}
                          className="btn btn-danger"
                          style={{ padding: "6px 8px" }}
                          title="Delete Supplier"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit Modal */}
      {isAddEditOpen && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "600px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                {selectedSupplier ? "Edit Supplier Details" : "Add New Supplier"}
              </h2>
              <button
                onClick={() => setIsAddEditOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Acme Components"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Company Legal Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Acme Tech Pvt. Ltd."
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Contact Person</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Rajesh Kumar"
                    value={formContactPerson}
                    onChange={(e) => setFormContactPerson(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">GST Identification Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="supplier@domain.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="form-label">Registered Office / Warehouse Address</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="Full street address, city, pin code..."
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
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
                  {submitting ? "Saving..." : selectedSupplier ? "Update Supplier" : "Create Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Supplier Modal */}
      {isViewOpen && selectedSupplier && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "520px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-bright)" }}>
                Supplier Dossier
              </h2>
              <button
                onClick={() => setIsViewOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-bright)" }}>
                  {selectedSupplier.name}
                </div>
                {selectedSupplier.companyName && (
                  <div style={{ color: "var(--primary)", fontSize: "0.9rem", marginTop: "2px" }}>
                    {selectedSupplier.companyName}
                  </div>
                )}
                {selectedSupplier.contactPerson && (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Point of Contact: {selectedSupplier.contactPerson}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>GST Identification</div>
                  <div style={{ fontWeight: 600, fontFamily: "monospace", color: "#818cf8", marginTop: "4px" }}>
                    {selectedSupplier.gstNumber || "Not Provided"}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supplied Items Count</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--success)", marginTop: "4px" }}>
                    {selectedSupplier.suppliedProductsCount || 0} Products
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <span>{selectedSupplier.email || "No email listed"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <span>{selectedSupplier.phone || "No phone listed"}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "4px" }}>
                  <FileText size={16} color="var(--text-muted)" style={{ marginTop: "2px" }} />
                  <span style={{ color: "var(--text-muted)" }}>{selectedSupplier.address || "No physical address specified"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button onClick={() => setIsViewOpen(false)} className="btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedSupplier && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: "450px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--danger)", marginBottom: "16px" }}>
              <AlertTriangle size={28} />
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Confirm Supplier Deletion</h2>
            </div>

            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Are you sure you want to permanently delete supplier{" "}
              <strong style={{ color: "var(--text-bright)" }}>{selectedSupplier.name}</strong>?
            </p>

            {(selectedSupplier.suppliedProductsCount || 0) > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  color: "#f87171",
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                }}
              >
                Warning: This supplier is currently associated with {selectedSupplier.suppliedProductsCount} product(s). 
                The backend will reject deletion if integrity constraints exist.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSupplier}
                className="btn btn-danger"
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
