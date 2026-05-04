"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Command,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/": { title: "Command Center", description: "Real-time overview of your AI platform" },
  "/users": { title: "User Intelligence", description: "Manage and analyze your user base" },
  "/analytics": { title: "Analytics", description: "Deep-dive data analysis and insights" },
  "/models": { title: "AI Model Governance", description: "Configure and monitor AI models" },
  "/billing": { title: "Revenue Intelligence", description: "Financial metrics and subscription management" },
  "/moderation": { title: "Moderation Center", description: "Content moderation and safety" },
  "/security": { title: "Security & Threats", description: "Security monitoring and access control" },
  "/system": { title: "System Health", description: "Infrastructure monitoring and observability" },
  "/settings": { title: "Settings", description: "Platform configuration and preferences" },
};

const notifications = [
  { id: 1, type: "warning", message: "ElevenLabs API degraded — error rate 1.8%", time: "15m ago" },
  { id: 2, type: "info", message: "New enterprise signup: Acme Corp ($800/mo)", time: "1h ago" },
  { id: 3, type: "error", message: "24 items pending moderation review", time: "2h ago" },
];

export function Header() {
  const { sidebarCollapsed, selectedTheme, setTheme, setCommandOpen } = useUIStore();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const pageInfo = pageTitles[pathname] ?? { title: "Admin", description: "" };

  return (
    <header
      translate="no"
      className={cn(
        "fixed top-0 right-0 z-40 h-16 flex items-center",
        "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl",
        "border-b border-neutral-200 dark:border-slate-800",
        "transition-all duration-250",
        sidebarCollapsed ? "left-16" : "left-[260px]"
      )}
    >
      <div className="flex items-center justify-between w-full px-6 gap-4">
        {/* Page info */}
        <div className="flex items-center gap-2 min-w-0">
          <div>
            <h1 suppressHydrationWarning className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {pageInfo.title}
            </h1>
            <p suppressHydrationWarning className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {pageInfo.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search / Command */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className={cn(
              "hidden md:flex items-center gap-2 h-8 px-3 rounded-lg",
              "bg-neutral-100 dark:bg-slate-800",
              "border border-neutral-200 dark:border-slate-700",
              "text-xs text-neutral-500 dark:text-neutral-400",
              "hover:bg-neutral-200 dark:hover:bg-slate-700 transition-colors",
              "w-56"
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <span suppressHydrationWarning className="flex-1 text-left">
              Search anything...
            </span>
            <kbd className="flex items-center gap-0.5 text-xs bg-neutral-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Live badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-indicator" />
            <span suppressHydrationWarning className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Live
            </span>
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Refresh data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              setTheme(selectedTheme === "dark" ? "light" : "dark")
            }
          >
            {selectedTheme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setShowNotifications(false)}
                />
                <div
                  className={cn(
                    "absolute right-0 top-10 z-50 w-80 rounded-xl shadow-xl",
                    "bg-white dark:bg-slate-900",
                    "border border-neutral-200 dark:border-slate-800",
                    "overflow-hidden"
                  )}
                >
                  <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-slate-800">
                    <p className="text-sm font-semibold">Notifications</p>
                    <Badge variant="error" size="sm">{notifications.length}</Badge>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                              notif.type === "warning" && "bg-amber-500",
                              notif.type === "error" && "bg-red-500",
                              notif.type === "info" && "bg-blue-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                              {notif.message}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-neutral-200 dark:border-slate-800">
                    <button className="w-full text-xs text-blue-600 dark:text-blue-400 text-center py-1 hover:underline">
                      View all notifications
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
