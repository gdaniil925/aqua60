import { NextResponse } from "next/server";
import { getDriverState, updateDriverState } from "../_lib/demo-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "DR-1001";

  return NextResponse.json({ ok: true, data: getDriverState(code) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as
    | { code: string; action: "toggle_shift" }
    | { code: string; action: "accept_order"; orderId: string }
    | { code: string; action: "deliver_order"; orderId: string; emptyReturned: number }
    | { code: string; action: "replenish"; amount: number }
    | { code: string; action: "surrender_empty" };

  if (!body.code) {
    return NextResponse.json(
      { ok: false, message: "Driver code is required" },
      { status: 400 }
    );
  }

  const action =
    body.action === "toggle_shift"
      ? { type: "toggle_shift" as const }
      : body.action === "accept_order"
        ? { type: "accept_order" as const, orderId: body.orderId }
        : body.action === "deliver_order"
          ? {
              type: "deliver_order" as const,
              orderId: body.orderId,
              emptyReturned: body.emptyReturned
            }
          : body.action === "replenish"
            ? { type: "replenish" as const, amount: body.amount }
            : { type: "surrender_empty" as const };

  const data = updateDriverState(body.code, action);
  return NextResponse.json({ ok: true, data });
}
