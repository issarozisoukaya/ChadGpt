"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  Bell,
  Globe,
  Palette,
  Shield,
  Zap,
  Mail,
  Webhook,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security Policy", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Webhook },
  { id: "branding", label: "Branding", icon: Palette },
];

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        value ? "bg-blue-600" : "bg-neutral-300 dark:bg-slate-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-slate-800 last:border-0">
      <div className="flex-1 mr-8">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        {description && (
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  // General settings state
  const [platformName, setPlatformName] = useState("ChadGPT");
  const [apiUrl, setApiUrl] = useState("https://api.chadgpt.ai");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [rateLimit, setRateLimit] = useState("1000");

  // Notification settings
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [pagerduty, setPagerduty] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/...");

  // Security settings
  const [twoFaRequired, setTwoFaRequired] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("24");
  const [ipAllowlist, setIpAllowlist] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [cspEnabled, setCspEnabled] = useState(true);

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card padding="sm">
          <nav className="space-y-0.5">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  activeSection === section.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800"
                )}
              >
                <section.icon className="h-4 w-4 flex-shrink-0" />
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* System info */}
        <Card padding="sm" className="mt-4">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            System Info
          </p>
          <div className="space-y-2 text-xs">
            {[
              { label: "Version", value: "v2.0.0" },
              { label: "Environment", value: "Production" },
              { label: "Node", value: "v22.14.0" },
              { label: "Next.js", value: "16.2.4" },
              { label: "Uptime", value: "14d 6h 23m" },
            ].map((info) => (
              <div key={info.label} className="flex items-center justify-between">
                <span className="text-neutral-500">{info.label}</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300">{info.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="lg:col-span-3 space-y-4">
        {activeSection === "general" && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <Badge variant="info">Platform Configuration</Badge>
            </CardHeader>
            <div className="space-y-0">
              <SettingRow label="Platform Name" description="Displayed in the admin console and emails">
                <Input
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-48"
                />
              </SettingRow>
              <SettingRow label="API Base URL" description="Your ChadGPT FastAPI backend URL">
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-64"
                />
              </SettingRow>
              <SettingRow label="Rate Limit (req/hour)" description="Per authenticated user API rate limit">
                <Input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="w-24"
                />
              </SettingRow>
              <SettingRow
                label="Maintenance Mode"
                description="Disable user access for scheduled maintenance"
              >
                <ToggleSwitch value={maintenanceMode} onChange={setMaintenanceMode} />
              </SettingRow>
              <SettingRow
                label="Debug Mode"
                description="Enable verbose logging and API docs endpoint"
              >
                <ToggleSwitch value={debugMode} onChange={setDebugMode} />
              </SettingRow>
            </div>

            {maintenanceMode && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Maintenance mode is enabled. All users will see a maintenance page.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </Card>
        )}

        {activeSection === "notifications" && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <Badge variant="info">Alert Channels</Badge>
            </CardHeader>

            <div className="space-y-0">
              <SettingRow label="Email Alerts" description="Receive critical alerts via email">
                <ToggleSwitch value={emailAlerts} onChange={setEmailAlerts} />
              </SettingRow>
              <SettingRow label="Slack Notifications" description="Send alerts to Slack channel">
                <ToggleSwitch value={slackAlerts} onChange={setSlackAlerts} />
              </SettingRow>
              {slackAlerts && (
                <SettingRow label="Slack Webhook URL" description="Your Slack incoming webhook URL">
                  <Input
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="w-72"
                    placeholder="https://hooks.slack.com/..."
                  />
                </SettingRow>
              )}
              <SettingRow label="PagerDuty Integration" description="Page on-call for critical incidents">
                <ToggleSwitch value={pagerduty} onChange={setPagerduty} />
              </SettingRow>
              <SettingRow label="SMS Alerts" description="Text message for SEV1 incidents">
                <ToggleSwitch value={smsAlerts} onChange={setSmsAlerts} />
              </SettingRow>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700">
              <p className="text-sm font-medium mb-3">Alert Thresholds</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Error Rate Alert", value: "5%" },
                  { label: "Latency Alert (P95)", value: "2000ms" },
                  { label: "Churn Rate Alert", value: ">4%" },
                  { label: "Failed Payments Alert", value: ">10/day" },
                ].map((threshold) => (
                  <div key={threshold.label} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">{threshold.label}</span>
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{threshold.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Changes
              </Button>
            </div>
          </Card>
        )}

        {activeSection === "security" && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Security Policy</CardTitle>
              <Badge variant="success">Enterprise Grade</Badge>
            </CardHeader>

            <div className="space-y-0">
              <SettingRow label="Require 2FA for Admins" description="All admin accounts must enable two-factor authentication">
                <ToggleSwitch value={twoFaRequired} onChange={setTwoFaRequired} />
              </SettingRow>
              <SettingRow label="Session Timeout (hours)" description="Automatically log out inactive admin sessions">
                <Input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-20"
                />
              </SettingRow>
              <SettingRow label="IP Allowlist for Admin" description="Only allow admin access from approved IP addresses">
                <ToggleSwitch value={ipAllowlist} onChange={setIpAllowlist} />
              </SettingRow>
              <SettingRow label="Immutable Audit Logs" description="Cryptographically signed audit trail for all admin actions">
                <ToggleSwitch value={auditLog} onChange={setAuditLog} />
              </SettingRow>
              <SettingRow label="Content Security Policy" description="Strict CSP headers to prevent XSS attacks">
                <ToggleSwitch value={cspEnabled} onChange={setCspEnabled} />
              </SettingRow>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: "SOC 2 Type II", status: "Certified", variant: "success" as const },
                { label: "GDPR Compliant", status: "Compliant", variant: "success" as const },
                { label: "ISO 27001", status: "In Progress", variant: "warning" as const },
                { label: "PCI DSS", status: "N/A", variant: "default" as const },
              ].map((cert) => (
                <div key={cert.label} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-slate-800/50 border border-neutral-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{cert.label}</span>
                  <Badge variant={cert.variant}>{cert.status}</Badge>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save Security Policy
              </Button>
            </div>
          </Card>
        )}

        {activeSection === "integrations" && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <Badge variant="info">External Services</Badge>
            </CardHeader>

            <div className="grid grid-cols-1 gap-3">
              {[
                { name: "OpenAI", desc: "GPT-4o, DALL-E 3, Embeddings", status: "connected", icon: "🤖" },
                { name: "Anthropic", desc: "Claude 3.5 Sonnet", status: "connected", icon: "🧠" },
                { name: "Google AI", desc: "Gemini 1.5 Flash & Pro", status: "connected", icon: "✨" },
                { name: "ElevenLabs", desc: "Text-to-Speech v3", status: "degraded", icon: "🎙️" },
                { name: "Supabase", desc: "PostgreSQL + Auth", status: "connected", icon: "🗃️" },
                { name: "Cloudflare R2", desc: "Object Storage", status: "connected", icon: "☁️" },
                { name: "Upstash Redis", desc: "Cache & Rate Limiting", status: "connected", icon: "⚡" },
                { name: "Firebase FCM", desc: "Push Notifications", status: "connected", icon: "🔔" },
                { name: "Sentry", desc: "Error Tracking", status: "disconnected", icon: "🐛" },
                { name: "Stripe", desc: "Payment Processing", status: "connected", icon: "💳" },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {integration.name}
                      </p>
                      <p className="text-xs text-neutral-500">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        integration.status === "connected"
                          ? "success"
                          : integration.status === "degraded"
                          ? "warning"
                          : "default"
                      }
                    >
                      {integration.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toast.info(`Configuring ${integration.name}`)}
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeSection === "branding" && (
          <Card padding="md">
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
            </CardHeader>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { color: "#3b82f6", label: "Blue" },
                    { color: "#8b5cf6", label: "Purple" },
                    { color: "#10b981", label: "Emerald" },
                    { color: "#f59e0b", label: "Amber" },
                    { color: "#ef4444", label: "Red" },
                    { color: "#0ea5e9", label: "Sky" },
                  ].map((c) => (
                    <button
                      key={c.color}
                      className="group flex flex-col items-center gap-1"
                      onClick={() => toast.info(`Theme changed to ${c.label}`)}
                    >
                      <div
                        className="w-8 h-8 rounded-xl ring-2 ring-offset-2 ring-transparent group-hover:ring-blue-500 transition-all"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs text-neutral-500">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Default Theme
                </label>
                <div className="flex gap-2">
                  {["light", "dark", "system"].map((theme) => (
                    <button
                      key={theme}
                      className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 text-sm font-medium capitalize hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => toast.info(`Theme set to ${theme}`)}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                  Save Branding
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
