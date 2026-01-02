/**
 * @swagger
 * /api/user/{id}:
 *   delete:
 *     summary: Remove usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário removido
 *
 *   patch:
 *     summary: Soft delete do usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário desativado
 */


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toId(param: string | undefined) {
  if (!param) return null;
  const n = Number(param.trim());
  return Number.isFinite(n) && Math.floor(n) === n && n > 0 ? n : null;
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params é Promise
) {
  const { id: idParam } = await ctx.params; // 👈 precisa await
  const id = toId(idParam);

  if (!id) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "soft").toLowerCase();

  if (mode !== "soft" && mode !== "hard") {
    return NextResponse.json(
      { error: "mode deve ser 'soft' ou 'hard'" },
      { status: 400 }
    );
  }

  // Confere se existe
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("User")
    .select("id, isActive")
    .eq("id", id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });

  if (mode === "soft") {
    const { data, error } = await supabaseAdmin
      .from("User")
      .update({ isActive: false })
      .eq("id", id)
      .select("id, fullname, isAdmin, isActive, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, message: "Usuário desativado (soft delete)." });
  }

  const { error: delErr } = await supabaseAdmin
    .from("User")
    .delete()
    .eq("id", id);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ message: "Usuário removido (hard delete).", data: { id } });
}
