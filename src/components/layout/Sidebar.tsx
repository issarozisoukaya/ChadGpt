"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Brain,
  DollarSign,
  Shield,
  ShieldAlert,
  Settings,
  MessageSquareWarning,
  Activity,
  ChevronLeft,
  Zap,
  HelpCircle,
  LogOut,
  TrendingUp,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    label: "Command Center",
    href: "/",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: "User Intelligence",
    href: "/users",
    icon: Users,
    badge: "847K",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    label: "AI Models",
    href: "/models",
    icon: Brain,
    badge: null,
  },
  {
    label: "Revenue",
    href: "/billing",
    icon: DollarSign,
    badge: null,
  },
  {
    label: "Moderation",
    href: "/moderation",
    icon: MessageSquareWarning,
    badge: "24",
    badgeVariant: "warning" as const,
  },
  {
    label: "Security",
    href: "/security",
    icon: ShieldAlert,
    badge: null,
  },
  {
    label: "System Health",
    href: "/system",
    icon: Activity,
    badge: null,
  },
];

const bottomItems = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const pathname = usePathname();

  return (
    <motion.aside
      translate="no"
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col",
        "bg-slate-950 border-r border-slate-800",
        "overflow-hidden"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                {/* suppressHydrationWarning prevents mismatch from browser translation extensions */}
                <p suppressHydrationWarning className="text-sm font-bold text-white truncate">ChadGPT</p>
                <p suppressHydrationWarning className="text-xs text-slate-400 truncate">Admin Console</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5" translate="no">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    suppressHydrationWarning
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge && !sidebarCollapsed && (
                <span
                  suppressHydrationWarning
                  className={cn(
                    "ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium",
                    item.badgeVariant === "warning"
                      ? "bg-amber-900/40 text-amber-400"
                      : "bg-slate-800 text-slate-400"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 py-3 px-2 space-y-0.5">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors group"
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  suppressHydrationWarning
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ))}

        {/* Admin user */}
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              A
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p suppressHydrationWarning className="text-xs font-medium text-slate-200 truncate">
                    Super Admin
                  </p>
                  <p suppressHydrationWarning className="text-xs text-slate-500 truncate">admin@chadgpt.ai</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute top-[72px] -right-3 w-6 h-6 rounded-full",
          "bg-slate-800 border border-slate-700 text-slate-400",
          "flex items-center justify-center hover:bg-slate-700 hover:text-slate-200",
          "transition-all duration-150 shadow-md"
        )}
        aria-label="Toggle sidebar"
      >
        <ChevronLeft
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-250",
            sidebarCollapsed && "rotate-180"
          )}
        />
      </button>
    </motion.aside>
  );
}
