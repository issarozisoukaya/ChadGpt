import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;

  let content = "";
  let isImportant = false;
  try {
    const body = (await request.json()) as { content?: string; is_important?: boolean };
    content = String(body.content ?? "").trim();
    isImportant = Boolean(body.is_important);
  } catch {
    content = "";
  }

  if (!content) {
    return NextResponse.json({ message: "content requis" }, { status: 400 });
  }

  const adminId = auth.admin.id as string | undefined;

  try {
    const supabase = getSupabaseAdmin();
    const row = {
      user_id: id,
      note: content,
      is_important: isImportant,
      ...(adminId ? { created_by: adminId } : {}),
    };
    const { data, error } = await supabase.from("user_notes").insert(row).select("*").maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[notes POST]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
