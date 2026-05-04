"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { adminApi, tokenStore } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Zap, Lock, Mail, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("admin@chadgpt.ai");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Real API call to backend
      const data = await adminApi.auth.login(email, password);
      const { access_token, admin } = data as {
        access_token: string;
        admin: {
          id: string;
          email: string;
          full_name: string;
          role: "super_admin" | "admin" | "moderator" | "analyst" | "support";
          permissions: string[];
        };
      };

      tokenStore.set(access_token);

      login(
        {
          id: admin.id,
          name: admin.full_name ?? admin.email,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions ?? [],
        },
        access_token
      );

      toast.success(`Bienvenue, ${admin.full_name ?? admin.email} !`);
      router.push("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Email ou mot de passe incorrect";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      translate="no"
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl mb-4">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 suppressHydrationWarning className="text-2xl font-bold text-white">
            ChadGPT Admin
          </h1>
          <p suppressHydrationWarning className="text-sm text-slate-400 mt-1">
            Enterprise Control Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <p suppressHydrationWarning className="text-xs text-slate-400">
              Secured with JWT · Admin access only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              id="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="admin@chadgpt.ai"
              leftIcon={<Mail className="h-4 w-4" />}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              error={error ?? undefined}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold"
            >
              <span suppressHydrationWarning>Sign in to Console</span>
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-1">
            <p suppressHydrationWarning className="text-xs text-slate-600">
              Demo credentials:
            </p>
            <code className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded" suppressHydrationWarning>
              admin@chadgpt.ai / admin123
            </code>
            <p className="text-xs text-slate-600 mt-2">
              Backend:{" "}
              <span suppressHydrationWarning className="text-slate-500">
                {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}
              </span>
            </p>
          </div>
        </div>

        <p suppressHydrationWarning className="text-center text-xs text-slate-600 mt-6">
          ChadGPT Admin v2.0 · Real-time data from Supabase
        </p>
      </div>
    </div>
  );
}
