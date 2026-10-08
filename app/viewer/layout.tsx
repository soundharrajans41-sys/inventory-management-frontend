"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  BarChart3, 
  LogOut
} from "lucide-react";
import "../admin/admin.css";
import { clearAuth, getUser, syncUserProfile } from "../lib/api";
import { useRouter } from "next/navigation";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Viewer Role");
  const [userRole, setUserRole] = useState("VIEWER");
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

      if (isMounted) {
        setUserName(user?.name || "Viewer");
        setUserRole((user?.role || "VIEWER").toUpperCase());
        setAuthorized(true);
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const navItems = [
    { name: "Inventory", href: "/viewer/inventory", icon: Package },
    { name: "Reports", href: "/viewer/reports", icon: BarChart3 },
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
              <span className="badge success" style={{ fontSize: '0.75rem', padding: '2px 8px', letterSpacing: '0.5px' }}>
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
