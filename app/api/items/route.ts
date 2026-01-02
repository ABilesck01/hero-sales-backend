/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Lista itens ativos
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: Lista de itens
 *
 *   post:
 *     summary: Cria um novo item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemName]
 *             properties:
 *               itemName:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Item criado
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateItemBody = {
  itemName: string;
  price?: number;
  isActive?: boolean;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("Item")
    .select("id, itemName, price, isActive, created_at")
    .eq("isActive", true)
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  let body: CreateItemBody;
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON inválido");
  }

  const itemName = (body.itemName ?? "").trim();
  if (!itemName) return badRequest("itemName é obrigatório");

  const price =
    body.price === undefined || body.price === null ? null : Number(body.price);

  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return badRequest("price deve ser um número >= 0");
  }

  const payload = {
    itemName,
    price,
    isActive: body.isActive ?? true,
    created_at: new Date().toISOString(), // se tiver DEFAULT now(), pode remover
  };

  const { data, error } = await supabaseAdmin
    .from("Item")
    .insert(payload)
    .select("id, itemName, price, isActive, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
