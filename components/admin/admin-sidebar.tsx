"use client";

import { logout } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import { BarChart3, FileText, List, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Wrench, UserX, Bell, Receipt, History, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/applications", label: "Student Applications", icon: FileText },
  { href: "/admin/students", label: "Student List", icon: List },
  { href: "/admin/cancelled-students", label: "Student Cancel List", icon: UserX },
  { href: "/admin/document-notifications", label: "Document Submit Notification", icon: Bell },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/agents", label: "Agent List", icon: Users },
  { href: "/admin/receipts", label: "Receipts", icon: Receipt },
  { href: "/admin/activity-log", label: "Activity Log", icon: History },
];

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={`${open ? "w-64" : "w-16"} h-screen sticky top-0 bg-slate-900 border-r border-slate-700/50 flex flex-col shrink-0 transition-all duration-300 overflow-hidden`}
    >
      <div className={`flex items-center border-b border-slate-700/50 ${open ? "px-6 py-6 justify-between" : "px-3 py-4 justify-center"}`}>
        {open && (
          <div>
            <h1 className="text-xl font-display font-bold text-white">KNC Admin</h1>
            <p className="text-slate-400 text-xs mt-1 truncate">{user.full_name || user.email}</p>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-slate-400 hover:text-white transition-colors shrink-0"
        >
          {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            title={!open ? label : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            } ${!open ? "justify-center" : ""}`}
          >
            <Icon size={18} className="shrink-0" />
            {open && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        <Link
          href="/admin/settings"
          title={!open ? "Settings" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive("/admin/settings")
              ? "bg-brand-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          } ${!open ? "justify-center" : ""}`}
        >
          <Settings size={18} className="shrink-0" />
          {open && <span>Settings</span>}
        </Link>

        <button
          onClick={async () => { setLoggingOut(true); await logout(); }}
          disabled={loggingOut}
          title={!open ? "Logout" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-50 ${!open ? "justify-center" : ""}`}
        >
          <LogOut size={18} className="shrink-0" />
          {open && <span>{loggingOut ? "Logging out…" : "Logout"}</span>}
        </button>
      </div>
    </aside>
  );
}
