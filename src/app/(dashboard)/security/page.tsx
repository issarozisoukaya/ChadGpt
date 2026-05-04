"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  Lock,
  Users,
  Activity,
  Eye,
  Ban,
  CheckCircle2,
  XCircle,
  Key,
  Globe,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

const recentIncidents = [
  {
    id: "sec_001",
    type: "brute_force",
    severity: "high",
    message: "Brute force attack detected from IP 185.220.101.x (Tor exit node)",
    ip: "185.220.101.42",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: "sec_002",
    type: "unusual_login",
    severity: "medium",
    message: "User usr_000042 logged in from 3 countries within 2 hours",
    ip: "203.0.113.45",
    timestamp: new Date(Date.now() - 74 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: "sec_003",
    type: "api_abuse",
    severity: "medium",
    message: "Rate limit violated 47 times by user usr_000123",
    ip: "198.51.100.12",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolved: true,
  },
  {
    id: "sec_004",
    type: "mass_export",
    severity: "high",
    message: "Admin usr_admin2 exported 50k user records without approval",
    ip: "192.168.1.100",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resolved: false,
  },
  {
    id: "sec_005",
    type: "credential_stuffing",
    severity: "critical",
    message: "Credential stuffing attack: 2,847 login attempts in 10 minutes",
    ip: "Multiple IPs",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    resolved: true,
  },
];

const adminRoles = [
  { id: 1, name: "Sarah Chen", email: "sarah@chadgpt.ai", role: "admin", lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), twoFa: true, status: "active" },
  { id: 2, name: "Marcus Johnson", email: "marcus@chadgpt.ai", role: "moderator", lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(), twoFa: true, status: "active" },
  { id: 3, name: "Ana García", email: "ana@chadgpt.ai", role: "analyst", lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), twoFa: false, status: "active" },
  { id: 4, name: "Yuki Tanaka", email: "yuki@chadgpt.ai", role: "support", lastLogin: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), twoFa: true, status: "inactive" },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  admin: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  moderator: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  analyst: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  support: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const severityConfig = {
  critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", badge: "error" as const },
  high: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10", badge: "error" as const },
  medium: { color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/10", badge: "warning" as const },
  low: { color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/10", badge: "info" as const },
};

const auditLog = [
  { id: 1, admin: "Sarah Chen", action: "ban_user", target: "usr_000891", timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 2, admin: "Marcus Johnson", action: "approve_content", target: "mod_00019", timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
  { id: 3, admin: "Super Admin", action: "model_configured", target: "gpt-4o", timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: 4, admin: "Ana García", action: "export_users", target: "CSV 5000 rows", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: 5, admin: "Super Admin", action: "prompt_deployed", target: "v2.3.1", timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
];

export default function SecurityPage() {
  const [blockedIPs] = useState(["185.220.101.42", "45.33.32.156", "198.51.100.99"]);
  const [newIP, setNewIP] = useState("");

  return (
    <div className="space-y-6">
      {/* Security KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Failed Logins (24h)"
          value={847}
          change={-23.4}
          icon={<Lock className="h-4 w-4" />}
          iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          description="48 blocked IPs"
        />
        <StatCard
          title="Active Threats"
          value={recentIncidents.filter((i) => !i.resolved).length}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          description="Require action"
        />
        <StatCard
          title="2FA Adoption"
          value={78.4}
          format="percent"
          change={5.2}
          icon={<Shield className="h-4 w-4" />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          description="Admin: 100%"
        />
        <StatCard
          title="Audit Events (24h)"
          value={2847}
          icon={<Activity className="h-4 w-4" />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          description="Immutable log"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Threat Intelligence */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Active Security Incidents
              </span>
            </CardTitle>
            <Badge variant="error">
              {recentIncidents.filter((i) => !i.resolved).length} open
            </Badge>
          </CardHeader>
          <div className="space-y-2">
            {recentIncidents.map((incident) => {
              const sc = severityConfig[incident.severity as keyof typeof severityConfig];
              return (
                <div
                  key={incident.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    incident.resolved
                      ? "opacity-50 border-neutral-200 dark:border-slate-700"
                      : sc.bg + " border-transparent"
                  )}
                >
                  <AlertTriangle className={cn("h-4 w-4 mt-0.5 flex-shrink-0", sc.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <Badge variant={sc.badge} size="sm">{incident.severity}</Badge>
                      <span className="font-mono text-xs text-neutral-500">{incident.ip}</span>
                    </div>
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      {incident.message}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {formatRelativeTime(incident.timestamp)}
                      {incident.resolved && " · Resolved"}
                    </p>
                  </div>
                  {!incident.resolved && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toast.success("Incident resolved")}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => toast.success("IP blocked")}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* IP Management + Audit */}
        <div className="space-y-4">
          {/* IP Blocklist */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-red-500" />
                  IP Blocklist
                </span>
              </CardTitle>
              <Badge variant="error">{blockedIPs.length} blocked</Badge>
            </CardHeader>
            <div className="flex gap-2 mb-3">
              <Input
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="Enter IP to block (e.g. 1.2.3.4)"
                className="flex-1"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (newIP) {
                    toast.success(`IP ${newIP} blocked`);
                    setNewIP("");
                  }
                }}
              >
                Block
              </Button>
            </div>
            <div className="space-y-1.5">
              {blockedIPs.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50"
                >
                  <div className="flex items-center gap-2">
                    <Ban className="h-3.5 w-3.5 text-red-500" />
                    <span className="font-mono text-sm text-red-700 dark:text-red-400">{ip}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-neutral-500"
                    onClick={() => toast.success(`IP ${ip} unblocked`)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Admin Audit Log */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Admin Audit Log
                </span>
              </CardTitle>
              <Button variant="ghost" size="xs">View all</Button>
            </CardHeader>
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-slate-800 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {entry.admin.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{entry.admin}</span>
                      <span className="text-neutral-500"> · </span>
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{entry.action}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Target: <span className="font-mono">{entry.target}</span> · {formatRelativeTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Admin Team & RBAC */}
      <Card padding="none">
        <div className="p-4 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
          <CardTitle>Admin Team & Access Control</CardTitle>
          <Button variant="primary" size="sm" icon={<Users className="h-3.5 w-3.5" />}>
            Invite Admin
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/50">
                {["Admin", "Role", "2FA", "Last Login", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left p-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {adminRoles.map((admin) => (
                <tr key={admin.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{admin.name}</p>
                        <p className="text-xs text-neutral-500">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={roleColors[admin.role] ?? roleColors.support}>
                      {admin.role}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {admin.twoFa ? (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Disabled</span>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-xs text-neutral-500">
                    {formatRelativeTime(admin.lastLogin)}
                  </td>
                  <td className="p-3">
                    <Badge variant={admin.status === "active" ? "success" : "default"}>
                      {admin.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="xs" onClick={() => toast.info(`Editing ${admin.name}`)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => toast.info("API key rotated")}>
                        <Key className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
