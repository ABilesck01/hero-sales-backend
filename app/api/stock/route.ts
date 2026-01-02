/**
 * @swagger
 * /api/stock:
 *   post:
 *     summary: Entrada ou ajuste de estoque
 *     tags: [Stock]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [item, qty]
 *             properties:
 *               item:
 *                 type: integer
 *               qty:
 *                 type: integer
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimento registrado
 */


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/app/api/_utils/requireAuth";

type StockBody = {
  item: number;
  qty: number;
  note?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  // 1) exige login
  const { user: authUser } = await requireAuth(req);

  // 2) pega profile do logado
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("Profile")
    .select("id, is_admin, is_active")
    .eq("auth_user_id", authUser.id)
    .single();

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: "Profile não encontrado" }, { status: 404 });
  if (!profile.is_active) return NextResponse.json({ error: "Usuário inativo" }, { status: 403 });

  // 3) body + validações
  let body: StockBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON inválido");
  }

  const item = Number(body.item);
  const qty = Number(body.qty);

  if (!Number.isInteger(item) || item <= 0) return badRequest("item inválido");
  if (!Number.isInteger(qty) || qty === 0) return badRequest("qty deve ser inteiro e não pode ser zero");

  // 4) regra: negativo só admin
  if (qty < 0 && !profile.is_admin) {
    return NextResponse.json(
      { error: "Ajuste negativo permitido somente para admin" },
      { status: 403 }
    );
  }

  // 5) verifica item ativo
  const { data: itemExists, error: itemErr } = await supabaseAdmin
    .from("Item")
    .select("id")
    .eq("id", item)
    .eq("isActive", true)
    .maybeSingle();

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
  if (!itemExists) return badRequest("Item não existe ou está inativo");

  // 6) type coerente
  const type = qty > 0 ? "IN" : "ADJUST";

  // 7) grava movimento com auditoria
  const { data, error } = await supabaseAdmin
    .from("StockMovement")
    .insert({
      item,
      user: profile.id,
      sellingOrder: null,
      type,
      qty,
      note: body.note ?? null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
