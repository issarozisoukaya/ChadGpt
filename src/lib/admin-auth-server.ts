const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type VerifiedSuperAdmin =
  | { ok: true; admin: Record<string, unknown> }
  | { ok: false; status: number; message: string };

/** Validates Bearer JWT against the existing admin API and requires role super_admin. */
export async function verifySuperAdmin(request: Request): Promise<VerifiedSuperAdmin> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return { ok: false, status: 401, message: "Jeton d'authentification manquant" };
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, status: res.status, message: "Session admin invalide ou expirée" };
    }

    const raw = (await res.json()) as { data?: Record<string, unknown> } & Record<string, unknown>;
    const admin = (raw?.data ?? raw) as Record<string, unknown>;
    const role = admin?.role as string | undefined;

    if (role !== "super_admin") {
      return { ok: false, status: 403, message: "Accès réservé aux super administrateurs" };
    }

    return { ok: true, admin };
  } catch {
    return { ok: false, status: 503, message: "Impossible de joindre l'API d'authentification admin" };
  }
}
