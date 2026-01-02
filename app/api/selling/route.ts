/**
 * @swagger
 * /api/selling:
 *   post:
 *     summary: Cria uma venda
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seller, items]
 *             properties:
 *               seller:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [item, amount, price]
 *                   properties:
 *                     item:
 *                       type: integer
 *                     amount:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Venda criada
 *       500:
 *         description: Estoque insuficiente
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/app/api/_utils/requireAuth";

type SaleItem = { item: number; amount: number; price: number };
type CreateSaleBody = {
  items: SaleItem[];
  note?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req: Request) {
  
  let authUser: { id: string };
  try {
    const { user } = await requireAuth(req);
    authUser = user;
  } catch (res) {
    return res as Response;
  }

  let body: CreateSaleBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON inválido");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return badRequest("items deve ser um array não vazio");
  }

  for (const it of body.items) {
    const itemId = Number(it.item);
    const amount = Number(it.amount);
    const price = Number(it.price);

    if (!Number.isInteger(itemId) || itemId <= 0) return badRequest("item inválido");
    if (!Number.isInteger(amount) || amount <= 0) return badRequest("amount deve ser > 0");
    if (!Number.isFinite(price) || price < 0) return badRequest("price deve ser >= 0");
  }

  const { data, error } = await supabaseAdmin.rpc("create_sale", {
    p_seller_auth: authUser.id,         // UUID do auth.users
    p_items: body.items,                // jsonb array
    p_note: body.note ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
