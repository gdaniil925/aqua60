"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AccessIdentity } from "../ui";
import {
  AccessGate,
  DataTable,
  RoleTabs,
  SectionCard,
  SimpleList,
  StatCard,
  StatusPill
} from "../ui";

type OwnerTab =
  | "operations"
  | "finance"
  | "crm"
  | "discipline"
  | "warehouse"
  | "support"
  | "logistics";

type OwnerData = {
  stats: {
    revenueToday: string;
    activeOrders: number;
    criticalExpress: number;
    warehouseStock: number;
  };
  operationsOrders: {
    address: string;
    type: string;
    bottles: number;
    timer: string;
    risk: "critical" | "warning" | "normal";
  }[];
  groupedBuildings: {
    building: string;
    orders: number;
    bottles: number;
  }[];
  clients: {
    id: string;
    name: string;
    phone: string;
    address: string;
    schedule: string;
    limit: number;
    blocked: boolean;
    nextChargeAt: string;
    recurringAmount: number;
    history: { date: string; event: string; detail: string }[];
  }[];
  supportThreads: {
    id: string;
    customer: string;
    phone: string;
    status: string;
    messages: { sender: "client" | "service"; text: string; time: string }[];
  }[];
  payments: {
    id: string;
    customerName: string;
    phone: string;
    amount: number;
    status: "paid" | "failed" | "pending";
    reason: string;
    timestamp: string;
    recurringAt?: string;
  }[];
  pricing: {
    water: number;
    firstBottleService: number;
    nextBottleService: number;
    scheduleChange: number;
  };
  warehouse: {
    stock: number;
    empty: number;
    lowStockThreshold: number;
  };
  plannerTime: string;
};

const tabs = [
  { key: "operations", label: "Операции" },
  { key: "finance", label: "Финансы" },
  { key: "crm", label: "CRM" },
  { key: "discipline", label: "Дисциплина" },
  { key: "warehouse", label: "Склад" },
  { key: "support", label: "Чат" },
  { key: "logistics", label: "Логистика" }
];

const heatmapRows = [
  { label: "Пн", values: [4, 7, 9, 6] },
  { label: "Вт", values: [3, 5, 7, 4] },
  { label: "Ср", values: [5, 8, 6, 3] },
  { label: "Чт", values: [6, 9, 10, 5] },
  { label: "Пт", values: [4, 7, 8, 6] },
  { label: "Сб", values: [2, 4, 5, 3] },
  { label: "Вс", values: [1, 2, 3, 2] }
];

function heatTone(value: number) {
  if (value >= 9) return "critical";
  if (value >= 6) return "hot";
  if (value >= 3) return "warm";
  return "calm";
}

function formatMoney(value: number) {
  return `${value.toFixed(2)} BYN`;
}

function timestampLabel(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function OwnerDashboard({ identity }: { identity: AccessIdentity }) {
  const [tab, setTab] = useState<OwnerTab>("operations");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [replyDraft, setReplyDraft] = useState("");
  const [data, setData] = useState<OwnerData | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadOwnerData = async () => {
    const response = await fetch("/api/owner", { cache: "no-store" });
    const payload = (await response.json()) as { ok: boolean; data: OwnerData };
    if (payload.ok) {
      setData(payload.data);
      setSelectedClientId((current) => current || payload.data.clients[0]?.id || "");
      setSelectedThreadId((current) => current || payload.data.supportThreads[0]?.id || "");
    }
  };

  useEffect(() => {
    void loadOwnerData();
  }, []);

  const selectedClient =
    data?.clients.find((client) => client.id === selectedClientId) ?? data?.clients[0] ?? null;
  const selectedThread =
    data?.supportThreads.find((thread) => thread.id === selectedThreadId) ??
    data?.supportThreads[0] ??
    null;

  const recurrentRows = useMemo(
    () =>
      (data?.payments ?? [])
        .filter((payment) => payment.recurringAt)
        .map((payment) => [
          payment.customerName,
          payment.phone,
          timestampLabel(payment.recurringAt!),
          formatMoney(payment.amount),
          payment.status === "failed" ? "Повторная попытка" : "Активно"
        ]),
    [data]
  );

  const failedPaymentsRows = useMemo(
    () =>
      (data?.payments ?? [])
        .filter((payment) => payment.status === "failed")
        .map((payment) => [
          payment.customerName,
          payment.phone,
          payment.reason,
          formatMoney(payment.amount),
          "Связаться с клиентом"
        ]),
    [data]
  );

  const invoicesRows = useMemo(
    () =>
      (data?.payments ?? [])
        .filter((payment) =>
          invoiceSearch.trim()
            ? [payment.id, payment.customerName, payment.phone, payment.reason]
                .join(" ")
                .toLowerCase()
                .includes(invoiceSearch.trim().toLowerCase())
            : true
        )
        .map((payment) => [
          payment.id,
          payment.customerName,
          payment.phone,
          formatMoney(payment.amount),
          payment.status === "paid"
            ? "Оплачен"
            : payment.status === "failed"
              ? "Ошибка"
              : "Ожидает",
          timestampLabel(payment.timestamp)
        ]),
    [data, invoiceSearch]
  );

  const postOwnerAction = async (body: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { ok: boolean; data: OwnerData };
      if (payload.ok) {
        setData(payload.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) {
    return <p className="muted-text">Загружаем кабинет владельца...</p>;
  }

  return (
    <>
      <RoleTabs current={tab} items={tabs} onChange={(value) => setTab(value as OwnerTab)} />

      {tab === "operations" ? (
        <div className="grid-two owner-page-grid">
          <div className="owner-column">
            <div className="grid-two">
              <StatCard label="Выручка сегодня" note="Сверка по timestamp" value={data.stats.revenueToday} />
              <StatCard
                label="Подтверждено на сегодня"
                note="Все активные доставки"
                value={`${data.stats.activeOrders} заказов`}
              />
              <StatCard
                label="Экспресс под риском"
                note={`${identity.label} видит SLA в реальном времени`}
                tone="danger"
                value={`${data.stats.criticalExpress}`}
              />
              <StatCard
                label="Склад"
                note={`Порог уведомления ${data.warehouse.lowStockThreshold}`}
                tone={data.warehouse.stock <= data.warehouse.lowStockThreshold ? "danger" : "attention"}
                value={`${data.warehouse.stock} бутылей`}
              />
            </div>

            <SectionCard title="Живой мониторинг заказов">
              <div className="owner-ops-list">
                {data.operationsOrders.map((order) => (
                  <div
                    key={`${order.address}-${order.timer}`}
                    className={`owner-order-row${order.risk === "critical" ? " critical" : order.risk === "warning" ? " warning" : ""}`}
                  >
                    <div>
                      <strong>{order.address}</strong>
                      <p className="item-meta">
                        {order.type} • {order.bottles} бутыли
                      </p>
                    </div>
                    <div className="owner-order-side">
                      <StatusPill
                        tone={
                          order.risk === "critical"
                            ? "danger"
                            : order.risk === "warning"
                              ? "warning"
                              : "success"
                        }
                      >
                        {order.timer}
                      </StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="owner-column">
            <SectionCard title="Группировка по домам">
              <DataTable
                columns={["Дом", "Заказов", "Бутылей"]}
                rows={data.groupedBuildings.map((item) => [
                  item.building,
                  `${item.orders}`,
                  `${item.bottles}`
                ])}
              />
            </SectionCard>

            <SectionCard title="Операционные подсказки">
              <SimpleList
                items={[
                  {
                    title: "Красные строки — это экспрессы ближе 10 минут к дедлайну",
                    meta: "Если курьер еще не завершил доставку, owner сразу видит риск срыва SLA.",
                    side: <StatusPill tone="danger">Критично</StatusPill>,
                    tone: "danger"
                  },
                  {
                    title: "Группировка по домам обновляется от общих заказов",
                    meta: "Это уже общий backend-слой, а не отдельная локальная таблица на экране.",
                    side: <StatusPill tone="warning">Живые данные</StatusPill>
                  }
                ]}
              />
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === "finance" ? (
        <div className="owner-column">
          <SectionCard title="Рекуррентные платежи">
            <div className="grid-three">
              <StatCard label="Всего оплат" value={data.stats.revenueToday} />
              <StatCard label="Автосписания" value={`${recurrentRows.length}`} />
              <StatCard label="Ошибки" tone="danger" value={`${failedPaymentsRows.length}`} />
            </div>
          </SectionCard>

          <div className="grid-two owner-page-grid">
            <SectionCard title="Автосписания 1-го числа">
              <DataTable
                columns={["Клиент", "Телефон", "Время", "Сумма", "Статус"]}
                rows={recurrentRows}
              />
            </SectionCard>

            <SectionCard title="Ошибки оплаты">
              <DataTable
                columns={["Клиент", "Телефон", "Причина", "Сумма", "Действие"]}
                rows={failedPaymentsRows}
              />
            </SectionCard>
          </div>

          <SectionCard title="История счетов">
            <div className="owner-filter-row">
              <input
                className="field-input"
                onChange={(event) => setInvoiceSearch(event.target.value)}
                placeholder="Поиск по номеру телефона, имени или номеру счета"
                value={invoiceSearch}
              />
            </div>
            <DataTable
              columns={["Счет", "Клиент", "Телефон", "Сумма", "Статус", "Timestamp"]}
              rows={invoicesRows}
            />
          </SectionCard>
        </div>
      ) : null}

      {tab === "crm" ? (
        <div className="grid-two owner-page-grid">
          <SectionCard title="База пользователей">
            <div className="owner-client-list">
              {data.clients.map((client) => (
                <button
                  key={client.id}
                  className={`owner-client-card${selectedClient?.id === client.id ? " active" : ""}`}
                  onClick={() => setSelectedClientId(client.id)}
                  type="button"
                >
                  <div className="section-row">
                    <strong>{client.name}</strong>
                    <StatusPill tone={client.blocked ? "danger" : "success"}>
                      {client.blocked ? "Заблокирован" : "Активен"}
                    </StatusPill>
                  </div>
                  <p className="item-meta">{client.phone}</p>
                  <p className="item-meta">{client.address}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          {selectedClient ? (
            <div className="owner-column">
              <SectionCard title="Карточка клиента">
                <div className="owner-card-grid">
                  <div className="owner-card-detail">
                    <span>ФИО</span>
                    <strong>{selectedClient.name}</strong>
                  </div>
                  <div className="owner-card-detail">
                    <span>Телефон</span>
                    <strong>{selectedClient.phone}</strong>
                  </div>
                  <div className="owner-card-detail wide">
                    <span>Адрес</span>
                    <strong>{selectedClient.address}</strong>
                  </div>
                  <div className="owner-card-detail">
                    <span>Остаток лимита</span>
                    <strong>{selectedClient.limit} бутылей</strong>
                  </div>
                  <div className="owner-card-detail">
                    <span>График</span>
                    <strong>{selectedClient.schedule}</strong>
                  </div>
                </div>

                <div className="action-row" style={{ marginTop: 14 }}>
                  <button
                    className="secondary-button"
                    disabled={isSaving}
                    onClick={() =>
                      void postOwnerAction({
                        action: "client",
                        clientId: selectedClient.id,
                        clientAction: "add_limit"
                      })
                    }
                    type="button"
                  >
                    Добавить лимит
                  </button>
                  <button
                    className="secondary-button"
                    disabled={isSaving}
                    onClick={() =>
                      void postOwnerAction({
                        action: "client",
                        clientId: selectedClient.id,
                        clientAction: "remove_limit"
                      })
                    }
                    type="button"
                  >
                    Вычесть лимит
                  </button>
                  <button
                    className="primary-button"
                    disabled={isSaving}
                    onClick={() =>
                      void postOwnerAction({
                        action: "client",
                        clientId: selectedClient.id,
                        clientAction: "toggle_block"
                      })
                    }
                    type="button"
                  >
                    {selectedClient.blocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="История клиента">
                <DataTable
                  columns={["Дата", "Событие", "Деталь"]}
                  rows={selectedClient.history.map((item) => [item.date, item.event, item.detail])}
                />
              </SectionCard>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "discipline" ? (
        <div className="grid-two owner-page-grid">
          <SectionCard title="Настройка цен">
            <div className="owner-settings-grid">
              <label className="field-label">
                Цена воды
                <input
                  className="field-input"
                  onBlur={(event) =>
                    void postOwnerAction({
                      action: "settings",
                      pricing: { water: Number(event.target.value) || data.pricing.water }
                    })
                  }
                  defaultValue={String(data.pricing.water)}
                />
              </label>
              <label className="field-label">
                Сервис за 1-ю бутыль
                <input
                  className="field-input"
                  onBlur={(event) =>
                    void postOwnerAction({
                      action: "settings",
                      pricing: {
                        firstBottleService:
                          Number(event.target.value) || data.pricing.firstBottleService
                      }
                    })
                  }
                  defaultValue={String(data.pricing.firstBottleService)}
                />
              </label>
              <label className="field-label">
                Сервис за 2-ю+ бутыль
                <input
                  className="field-input"
                  onBlur={(event) =>
                    void postOwnerAction({
                      action: "settings",
                      pricing: {
                        nextBottleService:
                          Number(event.target.value) || data.pricing.nextBottleService
                      }
                    })
                  }
                  defaultValue={String(data.pricing.nextBottleService)}
                />
              </label>
              <label className="field-label">
                Смена графика
                <input
                  className="field-input"
                  onBlur={(event) =>
                    void postOwnerAction({
                      action: "settings",
                      pricing: {
                        scheduleChange:
                          Number(event.target.value) || data.pricing.scheduleChange
                      }
                    })
                  }
                  defaultValue={String(data.pricing.scheduleChange)}
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Логика дисциплины">
            <SimpleList
              items={[
                {
                  title: "Штрафы и изменения графика берутся из общего потока оплат",
                  meta: "То есть owner и клиент смотрят на одну и ту же причину списания, а не на разные локальные заглушки."
                },
                {
                  title: "Следующий шаг — завязать это на реальный provider",
                  meta: "Сейчас это живой demo-backend, но еще не реальный bePaid."
                }
              ]}
            />
          </SectionCard>
        </div>
      ) : null}

      {tab === "warehouse" ? (
        <div className="grid-two owner-page-grid">
          <div className="owner-column">
            <div className="grid-two">
              <StatCard label="Полных на складе" value={`${data.warehouse.stock}`} />
              <StatCard label="Пустых на хабе" value={`${data.warehouse.empty}`} />
            </div>

            <SectionCard title="Порог уведомления">
              <label className="field-label">
                Минимальный остаток
                <input
                  className="field-input"
                  defaultValue={String(data.warehouse.lowStockThreshold)}
                  onBlur={(event) =>
                    void postOwnerAction({
                      action: "settings",
                      lowStockThreshold: Number(event.target.value) || data.warehouse.lowStockThreshold
                    })
                  }
                />
              </label>
              <p className="muted-text">
                Когда stock падает ниже порога, owner должен получить Telegram-уведомление.
              </p>
            </SectionCard>
          </div>

          <SectionCard title="Что уже живое">
            <SimpleList
              items={[
                {
                  title: "Доставлено у курьера уменьшает склад owner",
                  meta: "Теперь owner и driver смотрят на один и тот же остаток."
                },
                {
                  title: "Сдача пустой тары у курьера увеличивает пустую тару на хабе",
                  meta: "Это уже общий workflow через API."
                }
              ]}
            />
          </SectionCard>
        </div>
      ) : null}

      {tab === "support" ? (
        <div className="grid-two owner-page-grid">
          <SectionCard title="Диалоги">
            <div className="owner-client-list">
              {data.supportThreads.map((thread) => (
                <button
                  key={thread.id}
                  className={`owner-client-card${selectedThread?.id === thread.id ? " active" : ""}`}
                  onClick={() => setSelectedThreadId(thread.id)}
                  type="button"
                >
                  <div className="section-row">
                    <strong>{thread.customer}</strong>
                    <StatusPill tone={thread.status === "Ждет ответа" ? "warning" : "success"}>
                      {thread.status}
                    </StatusPill>
                  </div>
                  <p className="item-meta">{thread.phone}</p>
                  <p className="item-meta">
                    {thread.messages[thread.messages.length - 1]?.text ?? "Нет сообщений"}
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>

          {selectedThread ? (
            <SectionCard title="Ответ от имени сервиса">
              <div className="support-chat">
                <div className="support-chat-head">
                  <strong>{selectedThread.customer}</strong>
                  <span>{selectedThread.phone}</span>
                </div>
                <div className="support-messages">
                  {selectedThread.messages.map((message, index) => (
                    <div
                      key={`${message.time}-${index}`}
                      className={`support-message ${message.sender === "service" ? "service" : "client"}`}
                    >
                      <strong>
                        {message.sender === "service" ? "Aqua60" : selectedThread.customer}
                      </strong>
                      <p>{message.text}</p>
                      <span>{message.time}</span>
                    </div>
                  ))}
                </div>
                <div className="support-reply-box">
                  <textarea
                    className="field-input support-reply-input"
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="Ответить клиенту напрямую в Telegram..."
                    value={replyDraft}
                  />
                  <div className="action-row">
                    <button
                      className="primary-button"
                      disabled={isSaving}
                      onClick={() => {
                        if (!replyDraft.trim()) return;
                        void postOwnerAction({
                          action: "reply",
                          threadId: selectedThread.id,
                          text: replyDraft
                        });
                        setReplyDraft("");
                      }}
                      type="button"
                    >
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {tab === "logistics" ? (
        <div className="owner-column">
          <SectionCard title="Планировщик рассылок">
            <label className="field-label">
              Время автоопроса «Завтра везем?»
              <input
                className="field-input"
                type="time"
                defaultValue={data.plannerTime}
                onBlur={(event) =>
                  void postOwnerAction({
                    action: "settings",
                    plannerTime: event.target.value || data.plannerTime
                  })
                }
              />
            </label>
          </SectionCard>

          <SectionCard title="Тепловая карта нагрузки">
            <div className="heatmap-grid">
              <div className="heatmap-head">День</div>
              <div className="heatmap-head">09:00</div>
              <div className="heatmap-head">13:00</div>
              <div className="heatmap-head">18:00</div>
              <div className="heatmap-head">21:00</div>
              {heatmapRows.flatMap((row) => [
                <div key={`${row.label}-label`} className="heatmap-label">
                  {row.label}
                </div>,
                ...row.values.map((value, index) => (
                  <div key={`${row.label}-${index}`} className={`heatmap-cell ${heatTone(value)}`}>
                    {value}
                  </div>
                ))
              ])}
            </div>
          </SectionCard>
        </div>
      ) : null}
    </>
  );
}

function OwnerPageContent() {
  const searchParams = useSearchParams();
  const internalAccess = searchParams.get("bot") === "internal";

  if (!internalAccess) {
    return (
      <AccessGate
        role="owner"
        subtitle="Кабинет владельца открывается только из внутреннего Telegram-бота Aqua60."
        title="Кабинет владельца"
      >
        {() => (
          <SectionCard title="Доступ ограничен">
            <p className="muted-text">
              Этот раздел не должен открываться из клиентского бота. Открой внутреннего бота
              Aqua60 и перейди в кабинет владельца оттуда.
            </p>
          </SectionCard>
        )}
      </AccessGate>
    );
  }

  return (
    <AccessGate
      role="owner"
      subtitle="Защищенный кабинет владельца: живой мониторинг, деньги, клиенты, склад, поддержка и логистика в одном интерфейсе."
      title="Кабинет владельца"
    >
      {(identity) => <OwnerDashboard identity={identity} />}
    </AccessGate>
  );
}

export default function OwnerPage() {
  return (
    <Suspense fallback={<p className="muted-text">Загружаем кабинет владельца...</p>}>
      <OwnerPageContent />
    </Suspense>
  );
}
