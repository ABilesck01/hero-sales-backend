import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/swagger";

export async function GET() {
  if (!swaggerSpec) {
    return NextResponse.json(
      { error: "Swagger desativado" },
      { status: 404 }
    );
  }

  return NextResponse.json(swaggerSpec);
}
