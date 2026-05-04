"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useLayoutEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";

/** Applies `light` / `dark` on <html> from Zustand — no inline script (avoids next-themes / React 19 warning). */
function ThemeClassSync() {
  const selectedTheme = useUIStore((s) => s.selectedTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const resolved =
      selectedTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : selectedTheme;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [selectedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <>
      <ThemeClassSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { borderRadius: "10px", fontSize: "13px" },
          }}
        />
      </QueryClientProvider>
    </>
  );
}
