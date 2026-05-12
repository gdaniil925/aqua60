import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TelegramUpdate {
  message?: {
    chat?: {
      id?: number;
    };
    text?: string;
  };
}

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const webappUrl = process.env.TELEGRAM_WEBAPP_URL;

function getTelegramApiUrl(method: string) {
  if (!telegramToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  return `https://api.telegram.org/bot${telegramToken}/${method}`;
}

async function telegramRequest(
  method: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(getTelegramApiUrl(method), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const data = (await response.json()) as {
    ok: boolean;
    description?: string;
  };

  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API request failed for ${method}`);
  }
}

async function sendWelcomeMessage(chatId: number) {
  if (!webappUrl) {
    throw new Error("TELEGRAM_WEBAPP_URL is not configured");
  }

  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text:
      "Aqua60 готово к показу. Нажмите кнопку ниже, чтобы открыть мини-приложение и посмотреть клиентский demo-flow.",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть Aqua60",
            web_app: {
              url: webappUrl
            }
          }
        ]
      ]
    }
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    enabled: Boolean(telegramToken && webappUrl),
    webappUrl: webappUrl ?? null
  });
}

export async function POST(request: Request) {
  if (!telegramToken || !webappUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Telegram bot is not configured"
      },
      {
        status: 500
      }
    );
  }

  const update = (await request.json()) as TelegramUpdate;
  const text = update.message?.text?.trim().toLowerCase();
  const chatId = update.message?.chat?.id;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (text === "/start" || text === "/app") {
    await sendWelcomeMessage(chatId);
    return NextResponse.json({ ok: true, action: "welcome" });
  }

  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text: "Напишите /start, и я открою мини-приложение Aqua60."
  });

  return NextResponse.json({ ok: true, action: "hint" });
}
