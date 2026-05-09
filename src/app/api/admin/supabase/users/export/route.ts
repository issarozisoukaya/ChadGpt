import { NextResponse } from "next/server";
import Papa from "papaparse";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchAdminUsersList } from "@/lib/supabase/queries/admin-users";
const MAX_ROWS = 25_000;

function maskEmail(email: string) {
  const [a, d] = email.split("@");
  if (!d) return "***";
  return `${(a ?? "").slice(0, 1)}***@${d}`;
}

export async function GET(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
  const anonymize = url.searchParams.get("anonymize") === "1";

  const baseParams = {
    search: url.searchParams.get("search") ?? undefined,
    plan: url.searchParams.get("plan") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    countryCode: url.searchParams.get("country_code") ?? undefined,
    tags: url.searchParams.get("tags") ?? undefined,
    dateFrom: url.searchParams.get("date_from") ?? undefined,
    dateTo: url.searchParams.get("date_to") ?? undefined,
    sort: url.searchParams.get("sort") ?? "created_at",
    order: url.searchParams.get("order") === "asc" ? ("asc" as const) : ("desc" as const),
  };

  try {
    const supabase = getSupabaseAdmin();
    const pageSize = 500;
    const rows: Record<string, unknown>[] = [];

    for (let page = 1; ; page++) {
      const chunk = await fetchAdminUsersList(supabase, {
        ...baseParams,
        page,
        pageSize,
      });
      rows.push(...chunk.users);
      if (chunk.users.length < pageSize || rows.length >= MAX_ROWS) break;
    }

    const sanitized = rows.map((m) => {
      const row = m as Record<string, unknown>;
      if (!anonymize) return row;
      const email = String(row.email ?? "");
      const phone = String(row.phone ?? "");
      return {
        ...row,
        email: email ? maskEmail(email) : "",
        phone: phone ? "***" : "",
      };
    });

    if (format === "json") {
      return new NextResponse(JSON.stringify(sanitized, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    const csv = Papa.unparse(sanitized);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur export";
    console.error("[admin/supabase/users/export]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
