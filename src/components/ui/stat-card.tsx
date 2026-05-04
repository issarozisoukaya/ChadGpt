"use client";

import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number;
  change?: number;
  format?: "number" | "currency" | "percent";
  prefix?: string;
  suffix?: string;
  icon?: ReactNode;
  iconColor?: string;
  description?: string;
  sparkline?: number[];
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  format = "number",
  prefix,
  suffix,
  icon,
  iconColor = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  description,
  className,
}: StatCardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value)
      : format === "percent"
      ? `${value.toFixed(1)}%`
      : formatNumber(value);

  const isPositive = (change ?? 0) >= 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white dark:bg-slate-900 border-neutral-200 dark:border-slate-800 p-5",
        "hover:shadow-md transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className={cn("rounded-lg p-2 flex-shrink-0", iconColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-50">
            {prefix}{formattedValue}{suffix}
          </p>

          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 mt-1.5 text-xs font-medium",
                isNeutral
                  ? "text-neutral-500"
                  : isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{formatPercent(change)} vs last month</span>
            </div>
          )}

          {description && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
