import { createTelegramWebhookHandlers } from "../../_lib/telegram-webhook";

export const dynamic = "force-dynamic";

const handlers = createTelegramWebhookHandlers({
  token: process.env.INTERNAL_TELEGRAM_BOT_TOKEN,
  meta: {
    kind: "internal",
    statusPath: "/owner and /driver"
  },
  webApps: {
    owner: process.env.INTERNAL_OWNER_WEBAPP_URL,
    driver: process.env.INTERNAL_DRIVER_WEBAPP_URL
  },
  welcomeText:
    "Добрый день! Это внутренний бот Aqua60.\nНиже доступны отдельные кабинеты владельца и водителя-курьера. Они не предназначены для клиентского доступа."
});

export const GET = handlers.GET;
export const POST = handlers.POST;
