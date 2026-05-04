"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Book, MessageSquare, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <Card padding="md">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-500" />
              Admin Console Help
            </span>
          </CardTitle>
          <Badge variant="info">v2.0.0</Badge>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { icon: Book, title: "Documentation", desc: "Complete API and feature documentation", href: "#" },
            { icon: MessageSquare, title: "Support Chat", desc: "Talk to our enterprise support team", href: "#" },
            { icon: Zap, title: "Quick Start", desc: "Get up and running in 5 minutes", href: "#" },
            { icon: ExternalLink, title: "Changelog", desc: "See what's new in each release", href: "#" },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <item.icon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>

      <Card padding="md">
        <CardHeader><CardTitle>Keyboard Shortcuts</CardTitle></CardHeader>
        <div className="space-y-2">
          {[
            { keys: ["Cmd", "K"], action: "Open command palette" },
            { keys: ["A"], action: "Approve (moderation queue)" },
            { keys: ["R"], action: "Reject (moderation queue)" },
            { keys: ["W"], action: "Warn user (moderation)" },
            { keys: ["B"], action: "Ban user (moderation)" },
            { keys: ["←", "→"], action: "Previous / Next item in queue" },
          ].map((shortcut) => (
            <div key={shortcut.action} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-slate-800 last:border-0">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">{shortcut.action}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((k) => (
                  <kbd key={k} className="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-600 rounded font-mono">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
