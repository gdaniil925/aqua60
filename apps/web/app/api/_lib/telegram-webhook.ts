import { NextResponse } from "next/server";

export interface TelegramUpdate {
  message?: {
    message_id?: number;
    chat?: {
      id?: number;
    };
    text?: string;
  };
}

interface TelegramWebhookConfig {
  token?: string;
  meta: {
    kind: "customer" | "internal";
    statusPath?: string;
  };
  webApps: {
    customer?: string;
    owner?: string;
    driver?: string;
  };
  welcomeText: string;
}

const messageRegistry = new Map<string, Map<number, number[]>>();

function getRegistry(kind: string) {
  if (!messageRegistry.has(kind)) {
    messageRegistry.set(kind, new Map<number, number[]>());
  }
  return messageRegistry.get(kind)!;
}

function getTelegramApiUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function telegramRequest(
  token: string,
  method: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(getTelegramApiUrl(token, method), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const data = (await response.json()) as {
    ok: boolean;
    result?: unknown;
    description?: string;
  };

  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API request failed for ${method}`);
  }

  return data.result;
}

async function clearPreviousBotMessages(token: string, kind: string, chatId: number) {
  const registry = getRegistry(kind);
  const messageIds = registry.get(chatId) ?? [];

  for (const messageId of messageIds) {
    try {
      await telegramRequest(token, "deleteMessage", {
        chat_id: chatId,
        message_id: messageId
      });
    } catch {
      // ignore
    }
  }

  registry.set(chatId, []);
}

function buildKeyboard(config: TelegramWebhookConfig) {
  if (config.meta.kind === "customer") {
    if (!config.webApps.customer) {
      return null;
    }

    return {
      inline_keyboard: [
        [
          {
            text: "Открыть Aqua60",
            web_app: {
              url: config.webApps.customer
            }
          }
        ]
      ]
    };
  }

  const rows: Array<Array<Record<string, unknown>>> = [];

  if (config.webApps.owner) {
    rows.push([
      {
        text: "Открыть кабинет владельца",
        web_app: {
          url: config.webApps.owner
        }
      }
    ]);
  }

  if (config.webApps.driver) {
    rows.push([
      {
        text: "Открыть кабинет курьера",
        web_app: {
          url: config.webApps.driver
        }
      }
    ]);
  }

  return rows.length > 0 ? { inline_keyboard: rows } : null;
}

async function sendWelcomeMessage(config: TelegramWebhookConfig, chatId: number) {
  if (!config.token) {
    throw new Error("Telegram bot token is not configured");
  }

  const replyMarkup = buildKeyboard(config);
  if (!replyMarkup) {
    throw new Error("Telegram web app URLs are not configured");
  }

  await clearPreviousBotMessages(config.token, config.meta.kind, chatId);

  const result = (await telegramRequest(config.token, "sendMessage", {
    chat_id: chatId,
    text: config.welcomeText,
    reply_markup: replyMarkup
  })) as { message_id?: number } | undefined;

  if (result?.message_id) {
    getRegistry(config.meta.kind).set(chatId, [result.message_id]);
  }
}

export function createTelegramWebhookHandlers(config: TelegramWebhookConfig) {
  async function GET() {
    return NextResponse.json({
      ok: true,
      enabled: Boolean(
        config.token &&
          (config.meta.kind === "customer"
            ? config.webApps.customer
            : config.webApps.owner || config.webApps.driver)
      ),
      kind: config.meta.kind,
      webApps: config.webApps,
      statusPath: config.meta.statusPath ?? null
    });
  }

  async function POST(request: Request) {
    if (!config.token) {
      return NextResponse.json(
        {
          ok: false,
          message: "Telegram bot is not configured"
        },
        { status: 500 }
      );
    }

    const update = (await request.json()) as TelegramUpdate;
    const text = update.message?.text?.trim().toLowerCase();
    const chatId = update.message?.chat?.id;

    if (!chatId || !text) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (text === "/start" || text === "/app") {
      await sendWelcomeMessage(config, chatId);
      return NextResponse.json({ ok: true, action: "welcome", kind: config.meta.kind });
    }

    await telegramRequest(config.token, "sendMessage", {
      chat_id: chatId,
      text:
        config.meta.kind === "customer"
          ? "Напишите /start, и я открою клиентское mini-приложение Aqua60."
          : "Напишите /start, и я открою внутренние кабинеты Aqua60 для владельца и курьера."
    });

    return NextResponse.json({ ok: true, action: "hint", kind: config.meta.kind });
  }

  return { GET, POST };
}
