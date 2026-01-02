/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Lista usuários ativos
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuários
 *
 *   post:
 *     summary: Cria um usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullname]
 *             properties:
 *               fullname:
 *                 type: string
 *               isAdmin:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Usuário criado
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateUserBody = {
  fullname: string;
  isAdmin?: boolean;
  isActive?: boolean;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id, fullname, isAdmin, isActive, created_at")
    .eq("isActive", true)
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  let body: CreateUserBody;

  try {
    body = await req.json();
  } catch {
    return badRequest("JSON inválido");
  }

  const fullname = (body.fullname ?? "").trim();
  if (!fullname) return badRequest("fullname é obrigatório");

  const payload = {
    fullname,
    isAdmin: body.isAdmin ?? false,
    isActive: body.isActive ?? true,
    // se você já colocou DEFAULT now() no banco, pode omitir created_at
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("User")
    .insert(payload)
    .select("id, fullname, isAdmin, isActive, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}