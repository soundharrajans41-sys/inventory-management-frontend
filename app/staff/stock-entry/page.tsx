"use client";

import React, { useState } from "react";
import { PackagePlus } from "lucide-react";
import { authFetch } from "../../lib/api";

export default function StockEntryPage() {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const payload = {
        itemName: itemName.trim(),
        quantity: parseInt(quantity, 10),
        supplier: supplier.trim(),
        remarks: remarks.trim() || `Stock received from ${supplier.trim()}`
      };

      const res = await authFetch("/inventory/stock-in", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const product = await res.json();
        setMessage(`Successfully added ${quantity} unit(s) of "${product.name}". Total current stock: ${product.stock}`);
        setItemName("");
        setQuantity("");
        setSupplier("");
        setRemarks("");
      } else {
        const err = await res.json();
        setIsError(true);
        setMessage(err.message || "Failed to add stock.");
      }
    } catch (err) {
      console.error("Stock entry error:", err);
      setIsError(true);
      setMessage("Error connecting to backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Stock Entry</h2>
      </div>

      <div className="card" style={{ maxWidth: "600px", marginTop: "2rem" }}>
        <div className="card-title" style={{ marginBottom: "1.5rem" }}>
          Receive New Stock
          <PackagePlus size={20} style={{ color: 'var(--primary)' }} />
        </div>

        {message && (
          <div style={{
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "0.5rem",
            background: isError ? "rgba(231, 76, 60, 0.2)" : "rgba(46, 204, 113, 0.2)",
            color: isError ? "#e74c3c" : "#2ecc71",
            fontWeight: 500,
            fontSize: "0.9rem"
          }}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Item Name</label>
            <input 
              type="text" 
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', outline: 'none' }}
              placeholder="e.g. Wireless Headphones"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantity Received</label>
            <input 
              type="number" 
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', outline: 'none' }}
              placeholder="e.g. 50"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Supplier</label>
            <input 
              type="text" 
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', outline: 'none' }}
              placeholder="e.g. TechCorp Inc."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Remarks (Optional)</label>
            <input 
              type="text" 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', outline: 'none' }}
              placeholder="e.g. Invoice #98234"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--primary)', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? "Recording Stock..." : "Add to Inventory"}
          </button>
        </form>
      </div>
    </>
  );
}
