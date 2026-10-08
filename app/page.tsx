"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Shield,
  Eye,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Boxes,
  Users,
  Lock,
  Server,
  Database,
  Sparkles,
  Zap,
  ChevronRight,
  Layers,
  Truck,
  TrendingUp,
  RotateCcw,
  DownloadCloud,
  LayoutDashboard,
  LogIn,
  UserPlus
} from "lucide-react";
import { getUser } from "./lib/api";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  const getRoleDashboard = (role?: string) => {
    const r = (role || "").toUpperCase();
    if (r === "ADMIN") return "/admin/dashboard";
    if (r === "STAFF") return "/staff/dashboard";
    return "/viewer/inventory";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background-base)", color: "var(--text-main)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Navigation */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(9, 9, 11, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "16px 32px"
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 0 20px rgba(129, 140, 248, 0.4)"
            }}>
              <Package size={24} />
            </div>
            <div>
              <span style={{ fontSize: "1.4rem", fontWeight: 800, background: "linear-gradient(90deg, #fff, var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                NexusStock
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--secondary)", display: "block", fontWeight: 700, letterSpacing: "1px" }}>
                INVENTORY MANAGEMENT SYSTEM
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <a href="#features" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              Features
            </a>
            <a href="#roles" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              Roles & Access
            </a>
            <a href="#architecture" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              Tech Architecture
            </a>

            {currentUser ? (
              <Link
                href={getRoleDashboard(currentUser.role)}
                style={{
                  background: "var(--primary)",
                  color: "white",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "var(--shadow-glow)"
                }}
              >
                <LayoutDashboard size={18} />
                Go to {currentUser.role} Portal
              </Link>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Link
                  href="/login"
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-main)",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <LogIn size={16} /> Sign In
                </Link>
                <Link
                  href="/signup"
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    padding: "9px 18px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "var(--shadow-glow)"
                  }}
                >
                  <UserPlus size={16} /> Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "80px 32px 60px", maxWidth: "1280px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "9999px",
          background: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          color: "var(--primary)",
          fontSize: "0.85rem",
          fontWeight: 700,
          marginBottom: "24px"
        }}>
          <Sparkles size={16} /> Enterprise Grade Supply Chain Platform
        </div>

        <h1 style={{
          fontSize: "clamp(2.4rem, 5vw, 4rem)",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-1.5px",
          marginBottom: "20px",
          background: "linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Next-Generation Inventory, Order &amp; Stock Intelligence
        </h1>

        <p style={{
          fontSize: "1.15rem",
          color: "var(--text-muted)",
          maxWidth: "780px",
          margin: "0 auto 36px",
          lineHeight: 1.6
        }}>
          Streamline catalog tracking, sales order processing, purchase procurement, supplier catalogs, and multi-role security with high-performance Spring Boot REST services and real-time dashboard analytics.
        </p>

        {/* Hero Actions */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link
            href="/login"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
              color: "white",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)"
            }}
          >
            Launch System Portal <ArrowRight size={18} />
          </Link>
          <Link
            href="/signup"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-main)",
              padding: "14px 28px",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            Create New Account
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" style={{ padding: "60px 32px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "12px" }}>Complete Core Capabilities</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Designed for scalability with real-time stock status calculations and automated transactions.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
          {/* Card 1 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Boxes size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>Inventory &amp; Stock Tracking</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Full CRUD management for product catalogs, SKU indexing, minimum stock thresholds, purchase/selling price management, and low-stock alerts.
            </p>
          </div>

          {/* Card 2 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52, 211, 153, 0.15)", color: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>Sales &amp; Purchase Orders</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Create and fulfill orders with automatic inventory deduction upon sales completion and stock replenishment when purchase orders are received.
            </p>
          </div>

          {/* Card 3 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(244, 114, 182, 0.15)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Truck size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>Supplier Management</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Maintain detailed vendor contacts, phone records, business emails, physical addresses, and linked catalog items with constraint safety.
            </p>
          </div>

          {/* Card 4 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <RotateCcw size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>Returns &amp; Stock Movements</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Process customer returns with automated stock restoral, record manual adjustments, damage write-offs, and inspect chronological logs.
            </p>
          </div>

          {/* Card 5 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>Financial Reports &amp; CSV Export</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Generate inventory valuation summaries, sales performance reports, category statistics, and download formatted CSV files in one click.
            </p>
          </div>

          {/* Card 6 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--glass-border)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(20px)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(248, 113, 113, 0.15)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
              <Lock size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "10px" }}>JWT Authentication &amp; RBAC</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Stateless JWT security with Spring Security filter chain enforcing permissions for Admin, Staff, and Viewer across both frontend and REST APIs.
            </p>
          </div>
        </div>
      </section>

      {/* Role Comparison Section */}
      <section id="roles" style={{ padding: "60px 32px", maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "12px" }}>Role-Based Access Control (RBAC)</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Tailored interfaces designed for distinct operational security levels.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {/* Admin Role */}
          <div style={{ background: "var(--surface)", border: "2px solid rgba(129, 140, 248, 0.4)", borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Shield size={22} color="#818cf8" />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#818cf8" }}>ADMIN PORTAL</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Full administrative control over system entities, users, and audit logs.</p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#818cf8" /> User Management (Add, Edit, Roles)</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#818cf8" /> Full CRUD on Products &amp; Categories</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#818cf8" /> Purchase &amp; Sales Orders Management</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#818cf8" /> Financial Reports &amp; CSV Downloads</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#818cf8" /> System Activity Log Inspection</li>
            </ul>

            <Link href="/login" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(129, 140, 248, 0.15)", border: "1px solid rgba(129, 140, 248, 0.3)", color: "#818cf8", textDecoration: "none", display: "inline-block", textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>
              Sign in as Admin →
            </Link>
          </div>

          {/* Staff Role */}
          <div style={{ background: "var(--surface)", border: "2px solid rgba(52, 211, 153, 0.4)", borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Package size={22} color="#34d399" />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#34d399" }}>STAFF PORTAL</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Operational workspace for daily inventory transactions and fulfillment.</p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#34d399" /> Stock Movements &amp; Entry Log</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#34d399" /> Create &amp; Dispatch Sales Orders</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#34d399" /> Inventory Catalog Tracking</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#34d399" /> Low Stock Warning Monitor</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#34d399" /> Operational Reporting</li>
            </ul>

            <Link href="/login" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", textDecoration: "none", display: "inline-block", textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>
              Sign in as Staff →
            </Link>
          </div>

          {/* Viewer Role */}
          <div style={{ background: "var(--surface)", border: "2px solid rgba(244, 114, 182, 0.4)", borderRadius: "20px", padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Eye size={22} color="#f472b6" />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f472b6" }}>VIEWER PORTAL</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Read-only overview for auditing stock levels and monitoring status.</p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#f472b6" /> Read-Only Catalog Search</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#f472b6" /> Category &amp; Status Filtering</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#f472b6" /> Inventory Summary Overview</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#f472b6" /> Read-Only Reports Dashboard</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px" }}><CheckCircle size={16} color="#f472b6" /> Protected against mutations</li>
            </ul>

            <Link href="/login" style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "rgba(244, 114, 182, 0.15)", border: "1px solid rgba(244, 114, 182, 0.3)", color: "#f472b6", textDecoration: "none", display: "inline-block", textAlign: "center", fontWeight: 700, fontSize: "0.9rem" }}>
              Sign in as Viewer →
            </Link>
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section id="architecture" style={{ padding: "60px 32px", maxWidth: "1280px", margin: "0 auto", borderTop: "1px solid var(--glass-border)" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px" }}>Built with Enterprise Technology Stack</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Modern, robust, and full-stack software engineering architecture</p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "12px 24px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            <Server size={20} color="#61dafb" />
            <span style={{ fontWeight: 700 }}>Next.js 16 (App Router)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "12px 24px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            <Zap size={20} color="#6db33f" />
            <span style={{ fontWeight: 700 }}>Spring Boot 3.x REST API</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "12px 24px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            <Database size={20} color="#00758f" />
            <span style={{ fontWeight: 700 }}>MySQL 8.0 Database</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "12px 24px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            <Lock size={20} color="#818cf8" />
            <span style={{ fontWeight: 700 }}>Spring Security + JWT</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--glass-border)", padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            &copy; 2026 <strong>NexusStock Inventory System</strong>. All rights reserved.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: 600 }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", display: "inline-block", boxShadow: "0 0 8px #34d399" }}></span>
            Spring Boot Backend Active (Port 8080)
          </div>
        </div>
      </footer>
    </div>
  );
}