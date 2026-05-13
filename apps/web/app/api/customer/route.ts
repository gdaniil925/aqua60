import { NextResponse } from "next/server";
import {
  cancelCustomerExpressOrder,
  createCustomerExpressOrder,
  getCustomerState,
  saveCustomerSubscription
} from "../_lib/demo-store";

const DEFAULT_CUSTOMER_CODE = "CL-2048";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? DEFAULT_CUSTOMER_CODE;

  return NextResponse.json({ ok: true, data: getCustomerState(code) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as
    | {
        code?: string;
        action: "save_subscription";
        payload: {
          phone: string;
          address: string;
          schedule: string;
          monthlyBottles: number;
          recurringAmount: number;
        };
      }
    | {
        code?: string;
        action: "create_express";
        payload: {
          bottles: number;
          address: string;
          district: string;
          phone: string;
          intercomCode: string;
          comment: string;
          lat: number;
          lng: number;
        };
      }
    | {
        code?: string;
        action: "cancel_express";
        orderId: string;
      };

  const code = body.code ?? DEFAULT_CUSTOMER_CODE;

  const data =
    body.action === "save_subscription"
      ? saveCustomerSubscription(code, body.payload)
      : body.action === "create_express"
        ? createCustomerExpressOrder(code, body.payload)
        : cancelCustomerExpressOrder(code, body.orderId);

  return NextResponse.json({ ok: true, data });
}
