import { NextResponse } from "next/server";
import { verifyAccess } from "../_lib/demo-store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: "customer" | "driver" | "owner" | "admin";
    code?: string;
  };

  if (!body.role || !body.code) {
    return NextResponse.json(
      { ok: false, message: "Role and code are required" },
      { status: 400 }
    );
  }

  const identity = verifyAccess(body.role, body.code);

  if (!identity) {
    return NextResponse.json(
      { ok: false, message: "Код не найден в белом списке." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true, identity });
}
