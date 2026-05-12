import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Use /api/telegram/customer for the customer bot and /api/telegram/internal for the internal owner/driver bot."
  });
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "This route is deprecated. Point customer webhook to /api/telegram/customer and internal webhook to /api/telegram/internal."
    },
    { status: 410 }
  );
}
