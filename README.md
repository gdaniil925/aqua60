# Aqua60 Telegram Platform

Монорепозиторий для сервиса доставки воды `Aqua60` в Telegram.

## Состав проекта

- `apps/web`: клиентский Telegram Web App, кабинет курьера и админка владельца
- `apps/api`: backend API, Telegram bot hooks, бизнес-логика, уведомления
- `packages/shared`: общие типы, роли, статусы и контракты
- `packages/config`: общие конфиги TypeScript
- `packages/database`: схема БД и миграции
- `docs`: архитектура, этапы MVP и продуктовые решения

## Цели MVP

- регистрация клиента и привязка адреса
- конструктор подписки и расчет стоимости
- интеграция с bePaid для привязки карты и оплат
- личный кабинет клиента
- кабинет водителя-курьера
- кабинет владельца
- плановые и экспресс-заказы
- базовый складской учет
- уведомления и таймер экспресс-доставки

## Предлагаемый стек

- `Next.js` для web-интерфейсов
- `Node.js + Fastify` для backend API
- `PostgreSQL` для хранения данных
- `Prisma` для ORM и схемы БД
- `Telegram Bot API` для запуска Web App и уведомлений
- `bePaid API` для рекуррентных платежей и списаний

## Ближайшие этапы

1. Поднять каркас приложений и БД.
2. Реализовать роли и авторизацию через Telegram.
3. Собрать клиентский onboarding и конструктор подписки.
4. Подключить оплату и жизненный цикл заказа.
5. Доделать кабинеты курьера и владельца.

## Telegram Mini App Demo

Проект поддерживает два отдельных Telegram-бота:

1. `customer bot`
   Открывает только клиентский экран:
   - `/survey`
   - webhook: `/api/telegram/customer`

2. `internal bot`
   Открывает только внутренние кабинеты:
   - `/owner?bot=internal`
   - `/driver?bot=internal`
   - webhook: `/api/telegram/internal`

Нужные переменные окружения:

- `CUSTOMER_TELEGRAM_BOT_TOKEN`
- `CUSTOMER_TELEGRAM_WEBAPP_URL`
- `INTERNAL_TELEGRAM_BOT_TOKEN`
- `INTERNAL_OWNER_WEBAPP_URL`
- `INTERNAL_DRIVER_WEBAPP_URL`
