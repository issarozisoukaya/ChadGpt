import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchAdminUsersList } from "@/lib/supabase/queries/admin-users";

export async function GET(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(500, Math.max(1, Number(url.searchParams.get("page_size") ?? "50") || 50));

  try {
    const supabase = getSupabaseAdmin();
    const payload = await fetchAdminUsersList(supabase, {
      page,
      pageSize,
      search: url.searchParams.get("search") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      countryCode: url.searchParams.get("country_code") ?? undefined,
      tags: url.searchParams.get("tags") ?? undefined,
      dateFrom: url.searchParams.get("date_from") ?? undefined,
      dateTo: url.searchParams.get("date_to") ?? undefined,
      sort: url.searchParams.get("sort") ?? "created_at",
      order: url.searchParams.get("order") === "asc" ? "asc" : "desc",
    });

    return NextResponse.json({
      success: true,
      data: {
        users: payload.users,
        pagination: payload.pagination,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
