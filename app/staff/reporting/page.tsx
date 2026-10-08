"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { authFetch } from "../../lib/api";

interface FinancialMetrics {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  totalRevenueFormatted: string;
  totalCostFormatted: string;
  netProfitFormatted: string;
  totalOrders: number;
  totalItemsSold: number;
}

interface StockMovement {
  id: number;
  productName: string;
  quantity: number;
  movementType: string;
  referenceOrder: string;
  timestamp: string;
}

export default function ReportingPage() {
  const [financials, setFinancials] = useState<FinancialMetrics>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalRevenueFormatted: "₹0.00",
    totalCostFormatted: "₹0.00",
    netProfitFormatted: "₹0.00",
    totalOrders: 0,
    totalItemsSold: 0,
  });
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alertsCount, setAlertsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [finRes, movRes, alertRes] = await Promise.all([
          authFetch("/reports/financial"),
          authFetch("/stock-movements/recent"),
          authFetch("/alerts/active")
        ]);

        if (finRes.ok) {
          const finData = await finRes.json();
          setFinancials(finData);
        }
        if (movRes.ok) {
          const movData = await movRes.json();
          setMovements(movData);
        }
        if (alertRes.ok) {
          const alertData = await alertRes.json();
          setAlertsCount(alertData.length);
        }
      } catch (err) {
        console.error("Failed to load reporting data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatRupee = (numOrStr?: number | string) => {
    if (numOrStr === undefined || numOrStr === null) return "₹0.00";
    if (typeof numOrStr === "number") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(numOrStr);
    }
    const cleanStr = String(numOrStr).trim();
    const parsed = parseFloat(cleanStr.replace(/[^0-9.-]/g, ""));
    if (!isNaN(parsed)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(parsed);
    }
    return cleanStr.replace(/^[?$]+/, "₹");
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">Reporting & Movement</h2>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        
        <div className="card">
          <div className="card-title">
            Total Sales Revenue
            <TrendingUp size={20} style={{ color: '#2ecc71' }} />
          </div>
          <p className="metric-value">{loading ? "..." : formatRupee(financials.totalRevenue !== undefined ? financials.totalRevenue : financials.totalRevenueFormatted)}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Across {financials.totalOrders} total order(s)
          </p>
        </div>

        <div className="card">
          <div className="card-title">
            Items Sold
            <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <p className="metric-value">{loading ? "..." : financials.totalItemsSold}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Total units fulfilled
          </p>
        </div>

        <div className="card">
          <div className="card-title">
            Active Alerts
            <TrendingDown size={20} style={{ color: '#e74c3c' }} />
          </div>
          <p className="metric-value">{loading ? "..." : alertsCount}</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Requires attention
          </p>
        </div>

      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-title">
          Recent Inventory Movement History
        </div>
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {movements.map((m) => {
            const isPositive = m.movementType === 'PURCHASE' || m.movementType === 'RETURN_IN';
            return (
              <div 
                key={m.id} 
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <p style={{ fontWeight: 500 }}>{m.productName}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Ref: {m.referenceOrder || "N/A"} • Type: {m.movementType}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: isPositive ? "#2ecc71" : "#e74c3c", fontWeight: 600 }}>
                    {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {m.movementType}
                  </p>
                </div>
              </div>
            );
          })}

          {movements.length === 0 && (
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "1.5rem" }}>
              {loading ? "Loading movements..." : "No recent stock movements recorded."}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
