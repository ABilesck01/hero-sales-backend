import { createClient } from "@supabase/supabase-js";

const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // anon basta para validar token via getUser
);

export async function requireAuth(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return { user: data.user, token };
}
