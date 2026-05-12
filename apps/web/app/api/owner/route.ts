import { NextResponse } from "next/server";
import {
  getOwnerState,
  sendOwnerReply,
  updateOwnerClient,
  updateOwnerSettings
} from "../_lib/demo-store";

export async function GET() {
  return NextResponse.json({ ok: true, data: getOwnerState() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as
    | {
        action: "client";
        clientId: string;
        clientAction: "add_limit" | "remove_limit" | "toggle_block";
      }
    | {
        action: "reply";
        threadId: string;
        text: string;
      }
    | {
        action: "settings";
        plannerTime?: string;
        lowStockThreshold?: number;
        pricing?: {
          water?: number;
          firstBottleService?: number;
          nextBottleService?: number;
          scheduleChange?: number;
        };
      };

  let data = getOwnerState();

  if (body.action === "client") {
    data = updateOwnerClient(body.clientId, body.clientAction);
  }

  if (body.action === "reply") {
    data = sendOwnerReply(body.threadId, body.text);
  }

  if (body.action === "settings") {
    data = updateOwnerSettings({
      plannerTime: body.plannerTime,
      lowStockThreshold: body.lowStockThreshold,
      pricing: body.pricing
    });
  }

  return NextResponse.json({ ok: true, data });
}
