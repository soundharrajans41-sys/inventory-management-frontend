"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, Plus, X } from "lucide-react";
import { authFetch } from "../../lib/api";

interface OrderItem {
  id: string | number;
  orderNumber: string;
  customer: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  itemsCount: number;
  total: string;
  totalAmount?: number;
}

interface ProductOption {
  id: number;
  name: string;
  stock: number;
  price: number;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New order form states
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | string>("");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/sales");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load sales orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await authFetch("/inventory");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load products for order modal:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const processOrder = async (id: string | number) => {
    try {
      const res = await authFetch(`/sales/${id}/process`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Order processed successfully! Inventory stock has been updated.");
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to process order.");
      }
    } catch (err) {
      console.error("Error processing order:", err);
      alert("Error processing order.");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !selectedProductId) {
      alert("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        items: [
          {
            productId: Number(selectedProductId),
            quantity: parseInt(orderQuantity, 10) || 1
          }
        ]
      };

      const res = await authFetch("/sales", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Sales order created successfully!");
        setIsModalOpen(false);
        setCustomerName("");
        setCustomerEmail("");
        setOrderQuantity("1");
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create sales order.");
      }
    } catch (err) {
      console.error("Create order error:", err);
      alert("Error creating sales order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Sales & Orders Management</h2>
      </div>

      <div className="card" style={{ marginTop: "2rem", padding: "0" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title" style={{ margin: 0 }}>
            Recent Orders
            <ShoppingCart size={20} style={{ color: 'var(--secondary)' }} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> New Order
          </button>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Order ID</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Customer</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Items</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Total (₹)</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Status</th>
                <th style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>{order.orderNumber || `ORD-${order.id}`}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{order.customer || order.customerName}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>{order.itemsCount || 1}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 600, color: "var(--secondary)" }}>
                    {order.total ? order.total.replace(/^[$?]/, "₹") : `₹${(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    <span style={{ 
                      padding: "0.25rem 0.75rem", 
                      borderRadius: "1rem", 
                      fontSize: "0.75rem", 
                      fontWeight: 600,
                      background: order.status === 'PENDING' || order.status === 'Pending' ? 'rgba(243, 156, 18, 0.2)' : order.status === 'PROCESSING' || order.status === 'Processing' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                      color: order.status === 'PENDING' || order.status === 'Pending' ? '#f39c12' : order.status === 'PROCESSING' || order.status === 'Processing' ? '#3498db' : '#2ecc71'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem" }}>
                    {(order.status === 'Pending' || order.status === 'PENDING') && (
                      <button 
                        onClick={() => processOrder(order.id)}
                        style={{ padding: "0.4rem 0.8rem", background: "rgba(255,255,255,0.1)", color: "white", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.75rem" }}
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    {loading ? "Loading orders..." : "No orders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "1.5rem", color: "var(--text-main)" }}>
              Create Sales Order
            </h3>

            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  placeholder="e.g. john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", background: "rgba(255,255,255,0.05)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: "#1f2937", color: "white" }}>
                      {p.name} (Available: {p.stock}, ₹{Number(p.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
