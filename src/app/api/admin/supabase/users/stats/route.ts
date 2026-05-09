import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchAdminUsersStats } from "@/lib/supabase/queries/admin-users";

export async function GET(request: Request) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    const supabase = getSupabaseAdmin();
    const kpis = await fetchAdminUsersStats(supabase);
    return NextResponse.json({
      success: true,
      data: {
        kpis,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[admin/supabase/users/stats]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
