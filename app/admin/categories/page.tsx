"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Package
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface CategoryItem {
  id: number;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

interface ProductItem {
  id: number;
  categoryId?: number;
  category?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        authFetch("/categories"),
        authFetch("/products")
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getProductCount = (catId: number, catName: string) => {
    return products.filter(
      (p) => p.categoryId === catId || (p.category && p.category.toLowerCase() === catName.toLowerCase())
    ).length;
  };

  const openAddModal = () => {
    setModalMode("ADD");
    setActiveCategory(null);
    setFormName("");
    setFormDesc("");
    setFormStatus("ACTIVE");
    setFormError(null);
  };

  const openEditModal = (cat: CategoryItem) => {
    setModalMode("EDIT");
    setActiveCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormStatus(cat.status || "ACTIVE");
    setFormError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      status: formStatus,
    };

    setSubmitting(true);
    try {
      if (modalMode === "ADD") {
        const res = await authFetch("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("Category created successfully!");
          setModalMode(null);
          fetchCategories();
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.message || "Failed to create category.");
        }
      } else if (modalMode === "EDIT" && activeCategory) {
        const res = await authFetch(`/categories/${activeCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("Category updated successfully!");
          setModalMode(null);
          fetchCategories();
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.message || "Failed to update category.");
        }
      }
    } catch {
      setFormError("Server error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      const res = await authFetch(`/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Category deleted successfully.");
        setDeleteId(null);
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        setDeleteError(
          err.message || "Cannot delete category: products are currently associated with it. Please reassign or remove the products first."
        );
      }
    } catch {
      setDeleteError("Failed to communicate with server.");
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} color="#10b981" /> : <AlertTriangle size={18} color="#ef4444" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Organize catalog inventory classifications and product groupings
          </p>
        </div>

        <button className="btn btn-primary" onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Search and Summary */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search categories..."
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
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Total Categories: <strong style={{ color: "var(--text-main)" }}>{categories.length}</strong>
          </div>
        </div>
      </div>

      {/* Categories Cards / Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Description</th>
                <th>Associated Products</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading categories...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((c) => {
                  const count = getProductCount(c.id, c.name);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{c.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Layers size={16} color="#818cf8" />
                          {c.name}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "350px" }}>
                        {c.description || "—"}
                      </td>
                      <td>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "6px",
                          background: count > 0 ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.05)",
                          color: count > 0 ? "var(--primary)" : "var(--text-muted)",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 600
                        }}>
                          <Package size={14} />
                          {count} Products
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.status === "ACTIVE" ? "success" : "info"}`}>
                          {c.status || "ACTIVE"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            className="btn-icon"
                            onClick={() => openEditModal(c)}
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: "#f87171" }}
                            onClick={() => { setDeleteId(c.id); setDeleteError(null); }}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Add / Edit Modal */}
      {modalMode !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setModalMode(null)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>
              {modalMode === "ADD" ? "Add Category" : `Edit Category #${activeCategory?.id}`}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
              Categorize inventory items for simplified filtering and reporting.
            </p>

            {formError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                marginBottom: "20px"
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile, Laptop, Home Appliances"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of products within this category..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "12px",
                    color: "var(--text-main)",
                    outline: "none"
                  }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : modalMode === "ADD" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId !== null && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#f87171", marginBottom: "16px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Delete Category</h3>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to delete this category? Categories associated with existing products cannot be deleted to prevent orphaned records.
            </p>

            {deleteError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "12px",
                borderRadius: "10px",
                fontSize: "0.8rem",
                marginBottom: "20px"
              }}>
                {deleteError}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn" onClick={() => { setDeleteId(null); setDeleteError(null); }}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
