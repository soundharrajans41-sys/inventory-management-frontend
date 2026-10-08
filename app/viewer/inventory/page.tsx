"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { authFetch } from "../../lib/api";

interface InventoryItem {
  id: string | number;
  name: string;
  stock: number;
  quantity?: number;
  status: string;
  category?: string;
  price?: number;
  sellingPrice?: number;
  minimumStockLevel?: number;
}

export default function ViewerInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/inventory");
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to load inventory for viewer:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filteredItems = items.filter((item, index) => {
    const sNo = (index + 1).toString();
    const query = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(query) ||
      (item.category || "").toLowerCase().includes(query) ||
      sNo.includes(query) ||
      String(item.id).toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string, stock?: number, minStock?: number) => {
    let resolved = (status || "").toUpperCase().replace(/_/g, " ");
    if (stock !== undefined && stock !== null) {
      const min = minStock !== undefined && minStock !== null ? minStock : 10;
      if (stock === 0) {
        resolved = "OUT OF STOCK";
      } else if (stock <= min) {
        resolved = "LOW STOCK";
      } else {
        resolved = "IN STOCK";
      }
    } else {
      if (resolved === "AVAILABLE") resolved = "IN STOCK";
    }

    if (resolved === "IN STOCK") return <span className="badge success">IN STOCK</span>;
    if (resolved === "LOW STOCK") return <span className="badge warning">LOW STOCK</span>;
    return <span className="badge danger">OUT OF STOCK</span>;
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Inventory Overview (Read-Only)</h2>
      </div>

      <div className="admin-input-wrapper">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search by name, category, or S.No..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Available Stock</th>
              <th>Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, index) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: "var(--primary)" }}>{index + 1}</td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{item.category || "General"}</td>
                <td>{getStatusBadge(item.status, item.stock, item.minimumStockLevel)}</td>
                <td
                  style={{
                    fontWeight: item.stock === 0 ? "bold" : "600",
                    color: item.stock === 0 ? "var(--danger)" : "inherit",
                  }}
                >
                  {item.stock}
                </td>
                <td style={{ fontWeight: 600, color: "var(--secondary)" }}>
                  ₹{(Number(item.price ?? item.sellingPrice ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  {loading ? "Loading inventory..." : "No items found matching your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

