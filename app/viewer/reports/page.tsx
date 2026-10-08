"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { authFetch } from "../../lib/api";

interface FinancialSummary {
  totalRevenue?: number;
  totalCost?: number;
  netProfit?: number;
  totalRevenueFormatted: string;
  totalCostFormatted: string;
  netProfitFormatted: string;
  totalOrders: number;
  totalItemsSold: number;
}

export default function ViewerReportsPage() {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    totalRevenueFormatted: "₹0.00",
    totalCostFormatted: "₹0.00",
    netProfitFormatted: "₹0.00",
    totalOrders: 0,
    totalItemsSold: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/reports/financial");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to load viewer financial report:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
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
        <h1 className="page-title">Analytics & Reports Overview (Read-Only)</h1>
      </div>
      
      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-title">
          Financial Summary
          <TrendingUp size={20} className="text-secondary" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Revenue</p>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--secondary)', margin: 0 }}>
                {loading ? "..." : formatRupee(summary.totalRevenue !== undefined ? summary.totalRevenue : summary.totalRevenueFormatted)}
              </h3>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Cost</p>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--danger)', margin: 0 }}>
                {loading ? "..." : formatRupee(summary.totalCost !== undefined ? summary.totalCost : summary.totalCostFormatted)}
              </h3>
            </div>
        </div>
        
        <div style={{ width: '100%', height: '1px', background: 'var(--glass-border)', margin: '20px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Net Profit</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              {loading ? "..." : formatRupee(summary.netProfit !== undefined ? summary.netProfit : summary.netProfitFormatted)}
            </span>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <span>Total Orders: <strong style={{ color: 'var(--text-main)' }}>{summary.totalOrders}</strong></span>
          <span>Items Sold: <strong style={{ color: 'var(--text-main)' }}>{summary.totalItemsSold}</strong></span>
        </div>
      </div>
    </>
  );
}
