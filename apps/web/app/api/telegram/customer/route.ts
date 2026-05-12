import { createTelegramWebhookHandlers } from "../../_lib/telegram-webhook";

export const dynamic = "force-dynamic";

const handlers = createTelegramWebhookHandlers({
  token: process.env.CUSTOMER_TELEGRAM_BOT_TOKEN,
  meta: {
    kind: "customer",
    statusPath: "/survey"
  },
  webApps: {
    customer: process.env.CUSTOMER_TELEGRAM_WEBAPP_URL
  },
  welcomeText:
    "Добрый день! Это клиентская версия mini app Aqua60 в Telegram.\nНажмите кнопку ниже, чтобы открыть приложение и проверить профиль, подписку, адрес и экспресс-доставку."
});

export const GET = handlers.GET;
export const POST = handlers.POST;
