/**
 * @swagger
 * /api/stock/{item}:
 *   get:
 *     summary: Retorna o saldo atual de um item
 *     tags: [Stock]
 *     parameters:
 *       - in: path
 *         name: item
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do item
 *     responses:
 *       200:
 *         description: Saldo do item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   type: integer
 *                   example: 1
 *                 balance:
 *                   type: integer
 *                   example: 98
 *       400:
 *         description: Item inválido
 */


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function toId(param: string | undefined) {
  if (!param) return null;
  const n = Number(param.trim());
  return Number.isFinite(n) && Math.floor(n) === n && n > 0 ? n : null;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ item: string }> }
) {
  const { item: itemParam } = await ctx.params;
  const itemId = toId(itemParam);

  if (!itemId)
    return NextResponse.json({ error: "item inválido" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("StockMovement")
    .select("type, qty")
    .eq("item", itemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let balance = 0;

  for (const m of data) {
    if (m.type === "IN") balance += m.qty;
    if (m.type === "OUT") balance -= m.qty;
    if (m.type === "ADJUST") balance += m.qty; // ajuste já vem com sinal
  }

  return NextResponse.json({
    item: itemId,
    balance,
  });
}
