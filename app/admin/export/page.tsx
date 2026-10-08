"use client";

import React, { useState } from "react";
import {
  DownloadCloud,
  FileSpreadsheet,
  Package,
  Layers,
  Truck,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  Users,
  Boxes,
  History,
  CheckCircle2
} from "lucide-react";
import { authFetch } from "../../lib/api";

interface ExportCard {
  title: string;
  endpoint: string;
  filename: string;
  description: string;
  icon: any;
  fields: string;
}

export default function ExportHubPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const exportCards: ExportCard[] = [
    {
      title: "Products & Catalog",
      endpoint: "/reports/export/products",
      filename: "products_catalog.csv",
      description: "Full product master data with SKUs, category mappings, prices, and stock counts.",
      icon: Package,
      fields: "ID, Name, SKU, Category, Supplier, Stock, Min Stock, Purchase Price, Selling Price, Status",
    },
    {
      title: "Suppliers & Vendors",
      endpoint: "/reports/export/suppliers",
      filename: "suppliers_directory.csv",
      description: "Comprehensive vendor list including company names, GST numbers, and contact details.",
      icon: Truck,
      fields: "ID, Vendor Name, Company, Contact Person, Email, Phone, GSTIN, Address, Supplied Items",
    },
    {
      title: "Purchase Orders (Procurement)",
      endpoint: "/reports/export/purchases",
      filename: "purchase_orders.csv",
      description: "All historical procurement orders, fulfillment states, and supplier purchase totals.",
      icon: ShoppingCart,
      fields: "ID, PO Number, Supplier, Order Date, Expected Delivery, Status, Total Amount, Notes",
    },
    {
      title: "Sales Orders (Revenue Dispatches)",
      endpoint: "/reports/export/sales",
      filename: "sales_orders.csv",
      description: "Customer sales ledger containing item breakdowns, pricing, and fulfillment status.",
      icon: TrendingUp,
      fields: "ID, Order Number, Customer Name, Email, Order Date, Status, Total Amount",
    },
    {
      title: "Stock Movement Audit Ledger",
      endpoint: "/reports/export/stock",
      filename: "stock_movements_ledger.csv",
      description: "Immutable transactional ledger recording every stock delta, transfer, and manual adjustment.",
      icon: Boxes,
      fields: "Timestamp, Product, Movement Type, Delta Quantity, Previous Stock, New Stock, Reference, User",
    },
    {
      title: "Returns & RMA Tickets",
      endpoint: "/reports/export/returns",
      filename: "returns_rma_records.csv",
      description: "Inward and outward return records with inspection reasons and reconciliation status.",
      icon: RotateCcw,
      fields: "RMA Number, Return Type, Reference Order, Reason, Status, Date Created",
    },
    {
      title: "User Directory & RBAC Roles",
      endpoint: "/reports/export/users",
      filename: "users_rbac_directory.csv",
      description: "System user registry with RBAC privilege roles, account status, and login timestamps.",
      icon: Users,
      fields: "ID, Name, Email, Role, Status, Created Date, Last Login",
    },
    {
      title: "System & Admin Activity Logs",
      endpoint: "/reports/export/activity",
      filename: "activity_audit_logs.csv",
      description: "Security and administrative audit trail recording CRUD mutations and user logins.",
      icon: History,
      fields: "Timestamp, User Email, Action Type, Target Module, Details / Summary",
    },
  ];

  const handleExport = async (card: ExportCard) => {
    setDownloading(card.endpoint);
    try {
      const res = await authFetch(card.endpoint);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${card.filename.replace(".csv", "")}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("success", `Exported ${card.title} successfully.`);
      } else {
        showToast("error", `Failed to export ${card.title}.`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error connecting to export service.");
    } finally {
      setDownloading(null);
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
            <DownloadCloud className="text-primary" size={28} />
            Data Export & Compliance Center
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Download production CSV datasets with standardized column headers for external audits and reporting.
          </p>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "20px",
        }}
      >
        {exportCards.map((card, idx) => {
          const Icon = card.icon;
          const isCurrentDownloading = downloading === card.endpoint;

          return (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.2s, border-color 0.2s",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(99, 102, 241, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    .CSV
                  </span>
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-bright)", marginBottom: "6px" }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
                  {card.description}
                </p>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color)",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "20px",
                  }}
                >
                  <strong style={{ color: "var(--text-bright)", display: "block", marginBottom: "3px" }}>
                    Included Headers:
                  </strong>
                  <span style={{ fontFamily: "monospace" }}>{card.fields}</span>
                </div>
              </div>

              <button
                onClick={() => handleExport(card)}
                disabled={isCurrentDownloading}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "10px" }}
              >
                <DownloadCloud size={16} />
                {isCurrentDownloading ? "Generating CSV..." : "Download Export (.csv)"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
