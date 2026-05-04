"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950">
      <Sidebar />
      <Header />
      <motion.main
        animate={{
          marginLeft: sidebarCollapsed ? 64 : 260,
        }}
        transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        className="pt-16 min-h-screen"
      >
        <div className="p-6">{children}</div>
      </motion.main>
    </div>
  );
}
