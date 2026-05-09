import { NextResponse } from "next/server";
import { verifySuperAdmin } from "@/lib/admin-auth-server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;
  let tag = "";
  try {
    const body = (await request.json()) as { tag?: string };
    tag = String(body.tag ?? "").trim();
  } catch {
    tag = "";
  }
  if (!tag) {
    return NextResponse.json({ message: "tag requis" }, { status: 400 });
  }

  const adminId = auth.admin.id as string | undefined;

  try {
    const supabase = getSupabaseAdmin();
    const row = {
      user_id: id,
      tag,
      ...(adminId ? { added_by: adminId } : {}),
    };
    const { error } = await supabase.from("user_tags").upsert(row, { onConflict: "user_id,tag" });
    if (error) throw error;
    return NextResponse.json({ success: true, data: row });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[tags POST]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await verifySuperAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag")?.trim();
  if (!tag) {
    return NextResponse.json({ message: "query tag requis" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("user_tags").delete().eq("user_id", id).eq("tag", tag);
    if (error) throw error;
    return NextResponse.json({ success: true, data: { removed: tag } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur Supabase";
    console.error("[tags DELETE]", e);
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
