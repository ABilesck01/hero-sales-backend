/**
 * @swagger
 * /api/items/{id}:
 *   patch:
 *     summary: Atualiza um item (parcial)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemName:
 *                 type: string
 *                 example: "Coca-Cola 2L"
 *               price:
 *                 type: number
 *                 example: 9.99
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Item atualizado
 *       400:
 *         description: Requisição inválida
 *       404:
 *         description: Item não encontrado
 *
 *   delete:
 *     summary: Remove um item (soft/hard)
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: mode
 *         required: false
 *         schema:
 *           type: string
 *           enum: [soft, hard]
 *           default: soft
 *         description: soft = isActive=false, hard = remove do banco
 *     responses:
 *       200:
 *         description: Item removido
 *       400:
 *         description: Requisição inválida
 *       404:
 *         description: Item não encontrado
 */


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toId(param: string | undefined) {
  if (!param) return null;
  const n = Number(param.trim());
  return Number.isFinite(n) && Math.floor(n) === n && n > 0 ? n : null;
}

type UpdateItemBody = {
  itemName?: string;
  price?: number | null;   // null = limpar preço
  isActive?: boolean;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// PATCH /api/items/:id
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await ctx.params;
  const id = toId(idParam);
  if (!id) return badRequest("id inválido");

  let body: UpdateItemBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON inválido");
  }

  const updates: any = {};

  if (body.itemName !== undefined) {
    const name = String(body.itemName).trim();
    if (!name) return badRequest("itemName não pode ser vazio");
    updates.itemName = name;
  }

  if (body.price !== undefined) {
    if (body.price === null) {
      updates.price = null; // permite limpar
    } else {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return badRequest("price deve ser um número >= 0 ou null");
      }
      updates.price = price;
    }
  }

  if (body.isActive !== undefined) {
    updates.isActive = Boolean(body.isActive);
  }

  if (Object.keys(updates).length === 0) {
    return badRequest("nenhum campo para atualizar");
  }

  // Opcional: garantir que existe
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("Item")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "item não encontrado" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("Item")
    .update(updates)
    .eq("id", id)
    .select("id, itemName, price, isActive, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

// DELETE /api/items/:id?mode=soft|hard (default soft)
export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await ctx.params;
  const id = toId(idParam);
  if (!id) return badRequest("id inválido");

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "soft").toLowerCase();

  if (mode !== "soft" && mode !== "hard") {
    return badRequest("mode deve ser 'soft' ou 'hard'");
  }

  // existe?
  const { data: existing, error: findErr } = await supabaseAdmin
    .from("Item")
    .select("id, isActive")
    .eq("id", id)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "item não encontrado" }, { status: 404 });

  if (mode === "soft") {
    const { data, error } = await supabaseAdmin
      .from("Item")
      .update({ isActive: false })
      .eq("id", id)
      .select("id, itemName, price, isActive, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data, message: "Item desativado (soft delete)." });
  }

  const { error: delErr } = await supabaseAdmin.from("Item").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ message: "Item removido (hard delete).", data: { id } });
}
