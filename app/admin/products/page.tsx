"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Filter,
  DownloadCloud,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  category?: string;
  categoryId?: number;
  supplier?: string;
  supplierId?: number;
  description?: string;
  quantity: number;
  stock?: number;
  minimumStockLevel: number;
  purchasePrice?: number;
  sellingPrice?: number;
  price?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface SupplierOption {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  const [sortField, setSortField] = useState<keyof ProductItem>("id");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | "VIEW" | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formMinStock, setFormMinStock] = useState("5");
  const [formPurchasePrice, setFormPurchasePrice] = useState("0.00");
  const [formSellingPrice, setFormSellingPrice] = useState("0.00");
  const [formDescription, setFormDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, supRes] = await Promise.all([
        authFetch("/products"),
        authFetch("/categories"),
        authFetch("/suppliers"),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData);
      }
    } catch (err) {
      console.error("Error loading products data:", err);
      showToast("Error loading catalog data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setModalMode("ADD");
    setActiveProduct(null);
    setFormName("");
    setFormSku("");
    setFormCategory(categories[0]?.name || "");
    setFormSupplier(suppliers[0]?.name || "");
    setFormQuantity("10");
    setFormMinStock("5");
    setFormPurchasePrice("0.00");
    setFormSellingPrice("0.00");
    setFormDescription("");
    setFormError(null);
  };

  const openEditModal = (p: ProductItem) => {
    setModalMode("EDIT");
    setActiveProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category || "");
    setFormSupplier(p.supplier || "");
    setFormQuantity(String(p.quantity ?? p.stock ?? 0));
    setFormMinStock(String(p.minimumStockLevel ?? 5));
    setFormPurchasePrice(String(p.purchasePrice ?? 0));
    setFormSellingPrice(String(p.sellingPrice ?? p.price ?? 0));
    setFormDescription(p.description || "");
    setFormError(null);
  };

  const openViewModal = (p: ProductItem) => {
    setModalMode("VIEW");
    setActiveProduct(p);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Product name is required.");
      return;
    }

    const payload = {
      name: formName.trim(),
      sku: formSku.trim() || undefined,
      category: formCategory.trim() || undefined,
      supplier: formSupplier.trim() || undefined,
      quantity: parseInt(formQuantity, 10) || 0,
      stock: parseInt(formQuantity, 10) || 0,
      minimumStockLevel: parseInt(formMinStock, 10) || 5,
      purchasePrice: parseFloat(formPurchasePrice) || 0,
      sellingPrice: parseFloat(formSellingPrice) || 0,
      price: parseFloat(formSellingPrice) || 0,
      description: formDescription.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (modalMode === "ADD") {
        const res = await authFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("Product created successfully!");
          setModalMode(null);
          fetchData();
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.message || "Failed to create product.");
        }
      } else if (modalMode === "EDIT" && activeProduct) {
        const res = await authFetch(`/products/${activeProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast("Product updated successfully!");
          setModalMode(null);
          fetchData();
        } else {
          const err = await res.json().catch(() => ({}));
          setFormError(err.message || "Failed to update product.");
        }
      }
    } catch (err) {
      console.error(err);
      setFormError("Server or network communication error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    try {
      const res = await authFetch(`/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Product deleted successfully.");
        setDeleteConfirmId(null);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        setDeleteError(err.message || "Cannot delete product: Associated transaction history exists.");
      }
    } catch {
      setDeleteError("Failed to communicate with server.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await authFetch("/reports/export/products");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_catalog_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Products CSV downloaded successfully!");
      }
    } catch (err) {
      console.error("Export error:", err);
      showToast("Error exporting CSV", "error");
    }
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.supplier || "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || (p.category || "").toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === "ALL" ||
        (p.status || "").toLowerCase().replace(/_/g, " ") === selectedStatus.toLowerCase().replace(/_/g, " ");

      const matchesSupplier =
        selectedSupplier === "ALL" || (p.supplier || "").toLowerCase() === selectedSupplier.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [products, search, selectedCategory, selectedStatus, selectedSupplier, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const handleSort = (field: keyof ProductItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status?: string, qty?: number) => {
    const s = (status || "").toUpperCase();
    if (s.includes("OUT") || qty === 0) {
      return <span className="badge danger">OUT OF STOCK</span>;
    }
    if (s.includes("LOW")) {
      return <span className="badge warning">LOW STOCK</span>;
    }
    return <span className="badge success">IN STOCK</span>;
  };

  const formatPrice = (val?: number) => {
    if (val === undefined || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(val);
  };

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

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Inventory Management</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Comprehensive CRUD operations, stock tracking, and supplier pricing catalog
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button className="btn" onClick={handleExportCsv} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DownloadCloud size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openAddModal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Plus size={16} /> Add Product
          </button>
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
              placeholder="Search by product name, SKU, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Category Filter */}
          <div style={{ width: "160px" }}>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
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
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ width: "150px" }}>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
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
              <option value="ALL">All Status</option>
              <option value="IN STOCK">In Stock</option>
              <option value="LOW STOCK">Low Stock</option>
              <option value="OUT OF STOCK">Out of Stock</option>
            </select>
          </div>

          {/* Supplier Filter */}
          <div style={{ width: "170px" }}>
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setCurrentPage(1);
              }}
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
              <option value="ALL">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <button
            className="btn"
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
              setSelectedSupplier("ALL");
              setCurrentPage(1);
            }}
            title="Reset Filters"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    ID <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Product Name <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>SKU</th>
                <th>Category</th>
                <th>Supplier</th>
                <th onClick={() => handleSort("quantity")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Quantity <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort("purchasePrice")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Purchase Price <ArrowUpDown size={13} />
                  </div>
                </th>
                <th onClick={() => handleSort("sellingPrice")} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Selling Price <ArrowUpDown size={13} />
                  </div>
                </th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading product catalog...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const qty = p.quantity ?? p.stock ?? 0;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>#{p.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{p.name}</div>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--primary)" }}>{p.sku}</td>
                      <td>
                        <span style={{ 
                          fontSize: "0.8rem", 
                          background: "rgba(255,255,255,0.06)", 
                          padding: "3px 8px", 
                          borderRadius: "6px" 
                        }}>
                          {p.category || "General"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.supplier || "—"}</td>
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ color: qty === 0 ? "#f87171" : qty <= (p.minimumStockLevel ?? 5) ? "#fbbf24" : "var(--text-main)" }}>
                          {qty}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                          (Min: {p.minimumStockLevel ?? 5})
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {formatPrice(p.purchasePrice)}
                      </td>
                      <td style={{ fontWeight: 700, color: "#34d399" }}>
                        {formatPrice(p.sellingPrice ?? p.price)}
                      </td>
                      <td>{getStatusBadge(p.status, qty)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            className="btn-icon"
                            onClick={() => openViewModal(p)}
                            title="View Product Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: "#f87171" }}
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="Delete Product"
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

        {/* Pagination Bar */}
        <div className="pagination-container">
          <div>
            Showing {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length} items
          </div>
          <div className="pagination-buttons">
            <button
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span style={{ padding: "6px" }}>...</span>}
                  <button
                    className={`btn-page ${currentPage === page ? "active" : ""}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            <button
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(modalMode === "ADD" || modalMode === "EDIT") && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <button className="modal-close" onClick={() => setModalMode(null)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px" }}>
              {modalMode === "ADD" ? "Add New Product" : `Edit Product #${activeProduct?.id}`}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
              Fill in product specifications, initial stock inventory, and vendor details.
            </p>

            {formError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "0.85rem",
                marginBottom: "20px"
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony Bravia 55-inch 4K TV"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-ELEC-SB55 (leave blank to auto-generate)"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Select or enter category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  />
                  <datalist id="category-suggestions">
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Supplier / Vendor</label>
                  <input
                    type="text"
                    list="supplier-suggestions"
                    placeholder="Select or enter supplier"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                  />
                  <datalist id="supplier-suggestions">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label>Description & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Optional product description, manufacturer specs, or notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
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
                  {submitting ? "Saving..." : modalMode === "ADD" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Product Details Modal */}
      {modalMode === "VIEW" && activeProduct && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <button className="modal-close" onClick={() => setModalMode(null)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "4px" }}>
              {activeProduct.name}
            </h2>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "24px" }}>
              <span style={{ fontFamily: "monospace", color: "var(--primary)", fontSize: "0.9rem" }}>
                {activeProduct.sku}
              </span>
              <span>•</span>
              {getStatusBadge(activeProduct.status, activeProduct.quantity)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Category</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px" }}>{activeProduct.category || "—"}</div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Supplier</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px" }}>{activeProduct.supplier || "—"}</div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Current Stock</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px" }}>{activeProduct.quantity} units</div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Min Stock Level</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px" }}>{activeProduct.minimumStockLevel} units</div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Purchase Price</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px" }}>{formatPrice(activeProduct.purchasePrice)}</div>
              </div>
              <div className="card" style={{ padding: "16px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Selling Price</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: "4px", color: "#34d399" }}>
                  {formatPrice(activeProduct.sellingPrice ?? activeProduct.price)}
                </div>
              </div>
            </div>

            {activeProduct.description && (
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "6px" }}>Description</h4>
                <p style={{ background: "rgba(0,0,0,0.2)", padding: "14px", borderRadius: "10px", border: "1px solid var(--glass-border)", margin: 0, fontSize: "0.9rem" }}>
                  {activeProduct.description}
                </p>
              </div>
            )}

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--glass-border)", paddingTop: "16px" }}>
              <span>Created: {activeProduct.createdAt ? new Date(activeProduct.createdAt).toLocaleString() : "—"}</span>
              <span>Updated: {activeProduct.updatedAt ? new Date(activeProduct.updatedAt).toLocaleString() : "—"}</span>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => setModalMode(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => openEditModal(activeProduct)}>Edit Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "440px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#f87171", marginBottom: "16px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Delete Product</h3>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to permanently delete this product? If the product has transaction history (orders, receipts), deletion will be protected to preserve ledger integrity.
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
              <button className="btn" onClick={() => { setDeleteConfirmId(null); setDeleteError(null); }}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
