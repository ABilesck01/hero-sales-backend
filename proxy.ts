import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3001",
  "https://SEU-FRONT.vercel.app",
  "https://seudominio.com",
]);

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.has(origin);

  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (isAllowed) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.headers.set("Vary", "Origin");
    }
    return res;
  }

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
