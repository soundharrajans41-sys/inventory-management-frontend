"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  ShoppingCart,
  TrendingUp,
  Boxes,
  RotateCcw,
  Users,
  BarChart3,
  History,
  DownloadCloud,
  Settings,
  BellRing,
  LogOut,
  Menu,
  X,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info
} from "lucide-react";
import "./admin.css";
import { clearAuth, getUser, syncUserProfile, authFetch } from "../lib/api";

interface AlertPreview {
  id: number;
  type: string;
  title?: string;
  message?: string;
  time?: string;
  isRead?: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = useState("Administrator");
  const [userRole, setUserRole] = useState("ADMIN");
  const [userEmail, setUserEmail] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications state
  const [unreadAlerts, setUnreadAlerts] = useState<AlertPreview[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Time & Date update
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch alerts for top navbar
  const fetchAlerts = async () => {
    try {
      const res = await authFetch("/alerts/active");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUnreadAlerts(data.slice(0, 5));
          setUnreadCount(data.length);
        }
      }
    } catch {
      // silently fallback
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      let user = getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const freshUser = await syncUserProfile();
        if (freshUser && isMounted) {
          user = freshUser;
        }
      } catch {
        // Fall back to current cached user
      }

      const role = (user?.role || "").toUpperCase();

      // Only ADMIN role is authorized for the admin module
      if (role !== "ADMIN") {
        if (role === "STAFF") {
          router.replace("/staff/dashboard");
        } else {
          router.replace("/viewer/inventory");
        }
        return;
      }

      if (isMounted) {
        setUserName(user?.name || "Administrator");
        setUserRole(role);
        setUserEmail(user?.email || "");
        setAuthorized(true);
        fetchAlerts();
      }
    };

    checkAccess();

    // Poll alerts every 30 seconds
    const alertPoll = setInterval(fetchAlerts, 30000);

    return () => {
      isMounted = false;
      clearInterval(alertPoll);
    };
  }, [router]);

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await authFetch(`/alerts/${id}/read`, { method: "PATCH" });
      setUnreadAlerts((prev) => prev.filter((a) => a.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Layers },
    { name: "Suppliers", href: "/admin/suppliers", icon: Truck },
    { name: "Purchase Orders", href: "/admin/purchase-orders", icon: ShoppingCart },
    { name: "Sales Orders", href: "/admin/sales-orders", icon: TrendingUp },
    { name: "Stock Management", href: "/admin/stock", icon: Boxes },
    { name: "Dead Stock", href: "/admin/dead-stock", icon: Clock },
    { name: "Returns", href: "/admin/returns", icon: RotateCcw },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Activity Log", href: "/admin/activity", icon: History },
    { name: "Export CSV", href: "/admin/export", icon: DownloadCloud },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 45
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem", fontWeight: 800 }}>NexusStock</span>
            <span style={{ 
              fontSize: "0.65rem", 
              background: "rgba(129, 140, 248, 0.2)", 
              color: "var(--primary)", 
              padding: "2px 6px", 
              borderRadius: "4px",
              fontWeight: 700,
              letterSpacing: "0.5px"
            }}>ADMIN</span>
          </div>
          <button 
            className="mobile-close-btn"
            style={{ 
              display: sidebarOpen ? "block" : "none", 
              background: "transparent", 
              border: "none", 
              color: "var(--text-muted)", 
              cursor: "pointer" 
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Also treat /admin/inventory as active under Products
            const isActive = 
              pathname === item.href || 
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)) ||
              (item.href === "/admin/products" && pathname.startsWith("/admin/inventory"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "10px 12px 14px", borderTop: "1px solid var(--glass-border)", flexShrink: 0 }}>
          <button
            className="nav-item"
            style={{
              width: "100%",
              background: "rgba(239, 68, 68, 0.08)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.88rem",
              fontWeight: 600,
              justifyContent: "center",
              padding: "9px 14px"
            }}
            onClick={() => {
              clearAuth();
              window.location.href = "/login";
            }}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="admin-main">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              className="mobile-menu-btn"
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                color: "var(--text-main)",
                cursor: "pointer"
              }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* Current Date & Time display */}
            <div className="topbar-datetime" style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={15} style={{ color: "var(--primary)" }} />
                <span>{currentDate}</span>
              </div>
              <span style={{ opacity: 0.4 }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={15} style={{ color: "var(--secondary)" }} />
                <span style={{ fontWeight: 600, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Topbar Profile & Notifications */}
          <div className="topbar-profile" style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* Notification Icon Popover */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "10px",
                  padding: "9px 11px",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  transition: "all 0.2s ease"
                }}
                onClick={() => setNotifDropdownOpen((prev) => !prev)}
                title="Notifications"
              >
                <BellRing size={19} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "#ef4444",
                      color: "white",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 8px rgba(239, 68, 68, 0.6)"
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    right: 0,
                    width: "340px",
                    background: "rgba(20, 24, 39, 0.96)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "16px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    zIndex: 100,
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Notifications</span>
                    <span className="badge info" style={{ fontSize: "0.7rem" }}>{unreadCount} New</span>
                  </div>

                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {unreadAlerts.length === 0 ? (
                      <div style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        <CheckCircle size={28} style={{ color: "var(--secondary)", margin: "0 auto 8px" }} />
                        No unread notifications
                      </div>
                    ) : (
                      unreadAlerts.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                            fontSize: "0.85rem"
                          }}
                        >
                          <div style={{ marginTop: "2px" }}>
                            {a.type === "CRITICAL" ? (
                              <AlertCircle size={16} color="#f87171" />
                            ) : a.type === "WARNING" ? (
                              <AlertTriangle size={16} color="#fbbf24" />
                            ) : (
                              <Info size={16} color="#818cf8" />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                              {a.title || a.type}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                              {a.message}
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsRead(a.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "0.75rem"
                            }}
                            title="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ padding: "10px", borderTop: "1px solid var(--glass-border)", textAlign: "center" }}>
                    <Link
                      href="/admin/alerts"
                      onClick={() => setNotifDropdownOpen(false)}
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--primary)",
                        textDecoration: "none",
                        fontWeight: 600
                      }}
                    >
                      View All Alerts & Notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ textAlign: "right", lineHeight: 1.2 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{userName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{userEmail || "Admin Portal"}</div>
              </div>
              <div className="avatar" title={`${userName} (${userRole})`}>
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="admin-content">
          {authorized ? (
            children
          ) : (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
              <div className="skeleton" style={{ width: "200px", height: "24px", margin: "0 auto 16px" }} />
              Verifying administrative session...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
