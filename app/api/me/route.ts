import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/app/api/_utils/requireAuth";

export async function GET(req: Request) {
  // 1) garante que está logado (lê token/cookie e valida no Supabase)
  let authUser: { id: string; email?: string | null };

  try {
    const { user } = await requireAuth(req);
    authUser = user;
  } catch (res) {
    return res as Response; // 401
  }

  // 2) busca profile do usuário logado
  const { data: profile, error } = await supabaseAdmin
    .from("Profile")
    .select("id, auth_user_id, fullname, is_admin, is_active, created_at")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3) profile deve existir (trigger cria, mas em dev pode falhar)
  if (!profile) {
    return NextResponse.json(
      { error: "Perfil não encontrado para este usuário." },
      { status: 404 }
    );
  }

  // 4) bloqueia usuário desativado
  if (profile.is_active === false) {
    return NextResponse.json(
      { error: "Usuário desativado." },
      { status: 403 }
    );
  }

  // 5) payload final pro front
  const data = {
    authUserId: authUser.id,
    email: authUser.email ?? null,
    profileId: profile.id,
    fullname: profile.fullname ?? null,
    isAdmin: !!profile.is_admin,
  };

  return NextResponse.json({ data }, { status: 200 });
}
