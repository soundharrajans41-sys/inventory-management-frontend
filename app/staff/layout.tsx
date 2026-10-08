"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  PackagePlus, 
  ShoppingCart, 
  BarChart3, 
  LogOut
} from "lucide-react";
import "../admin/admin.css";
import { clearAuth, getUser, syncUserProfile } from "../lib/api";
import { useRouter } from "next/navigation";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Staff Member");
  const [userRole, setUserRole] = useState("STAFF");
  const [authorized, setAuthorized] = useState(false);

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
        // Fall back
      }

      const role = (user?.role || "").toUpperCase();
      if (role === "VIEWER") {
        router.replace("/viewer/inventory");
        return;
      }

      if (isMounted) {
        setUserName(user?.name || "Staff Member");
        setUserRole(role);
        setAuthorized(true);
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const navItems = [
    { name: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
    { name: "Stock Entry", href: "/staff/stock-entry", icon: PackagePlus },
    { name: "Sales & Orders", href: "/staff/sales-orders", icon: ShoppingCart },
    { name: "Reporting", href: "/staff/reporting", icon: BarChart3 },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header" style={{ fontSize: "1.15rem", fontWeight: 800 }}>
          Inventory Management
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-nav" style={{ flex: 'none', paddingBottom: '32px' }}>
          <button 
            className="nav-item"
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', fontSize: '0.95rem' }}
            onClick={() => {
              clearAuth();
              window.location.href = "/login";
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-profile">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{userName}</span>
              <span className="badge warning" style={{ fontSize: '0.75rem', padding: '2px 8px', letterSpacing: '0.5px' }}>
                {userRole}
              </span>
            </div>
            <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="admin-content">
          {authorized ? children : (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Verifying permissions...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
