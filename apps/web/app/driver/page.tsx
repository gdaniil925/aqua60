"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AccessIdentity } from "../ui";
import {
  AccessGate,
  DataTable,
  RoleTabs,
  SectionCard,
  StatCard,
  StatusPill
} from "../ui";
import { DgisMinskMap } from "./DgisMinskMap";
import { buildNavigatorUrl, buildRoutePlan, type DriverOrder } from "./route-planner";

type DriverTab = "queue" | "order" | "cargo" | "shift";

type DriverData = {
  driver: {
    code: string;
    label: string;
    note: string;
    onShift: boolean;
    machineFull: number;
    machineEmpty: number;
    deliveredToday: number;
    returnedToday: number;
    expressOnTime: number;
    expressLate: number;
    lastGeoSync: string;
    offlineQueue: string[];
  };
  orders: DriverOrder[];
};

interface DeliveryDraft {
  orderId: string;
  emptyReturned: number;
}

const tabs = [
  { key: "queue", label: "Очередь" },
  { key: "order", label: "Заказ" },
  { key: "cargo", label: "Багажник" },
  { key: "shift", label: "Смена" }
];

function formatTimer(minutesLeft: number | null, status: DriverOrder["status"]) {
  if (minutesLeft === null) {
    return status === "pending" ? "Не запущен" : "-";
  }
  const totalSeconds = Math.max(0, minutesLeft * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function DriverDashboard({ identity }: { identity: AccessIdentity }) {
  const [tab, setTab] = useState<DriverTab>("queue");
  const [data, setData] = useState<DriverData | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft | null>(null);
  const [replenishAmount, setReplenishAmount] = useState("12");
  const [isSaving, setIsSaving] = useState(false);

  const loadDriverData = async () => {
    const response = await fetch(`/api/driver?code=${encodeURIComponent(identity.code)}`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as { ok: boolean; data: DriverData };
    if (payload.ok) {
      setData(payload.data);
      setSelectedOrderId((current) => current || payload.data.orders[0]?.id || "");
    }
  };

  useEffect(() => {
    void loadDriverData();
  }, [identity.code]);

  const postDriverAction = async (body: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: identity.code, ...body })
      });
      const payload = (await response.json()) as { ok: boolean; data: DriverData };
      if (payload.ok) {
        setData(payload.data);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const routePlan = useMemo(
    () => buildRoutePlan(data?.orders ?? [], { x: 48, y: 46 }),
    [data]
  );

  const activeOrders = routePlan.filter((stop) => stop.order.status !== "delivered");
  const expressOrders = activeOrders.filter((stop) => stop.order.type === "express");
  const planOrders = activeOrders.filter((stop) => stop.order.type === "scheduled");
  const selectedStop = activeOrders.find((stop) => stop.order.id === selectedOrderId) ?? activeOrders[0];
  const selectedOrder = selectedStop?.order ?? null;

  const groupedPlanRows = useMemo(() => {
    const groups = new Map<string, { count: number; bottles: number }>();
    for (const stop of planOrders) {
      const building = stop.order.address.split(",")[0];
      const current = groups.get(building) ?? { count: 0, bottles: 0 };
      current.count += 1;
      current.bottles += stop.order.bottles;
      groups.set(building, current);
    }
    return Array.from(groups.entries()).map(([building, stats]) => [
      building,
      `${stats.count} заказа`,
      `${stats.bottles} бутылей`
    ]);
  }, [planOrders]);

  if (!data) {
    return <p className="muted-text">Загружаем кабинет курьера...</p>;
  }

  return (
    <div className="driver-theme">
      <RoleTabs current={tab} items={tabs} onChange={(value) => setTab(value as DriverTab)} />

      {tab === "queue" ? (
        <div className="driver-dispatch-grid">
          <div className="driver-left-stack">
            <div className="grid-three">
              <StatCard
                label="Статус смены"
                note={data.driver.label}
                tone={data.driver.onShift ? "attention" : "neutral"}
                value={data.driver.onShift ? "На смене" : "Не на смене"}
              />
              <StatCard
                label="В машине"
                note="Полные / пустые"
                value={`${data.driver.machineFull} / ${data.driver.machineEmpty}`}
              />
              <StatCard
                label="Экспресс в работе"
                note={`${expressOrders.filter((item) => item.order.status === "in_progress").length} уже приняты`}
                tone={expressOrders.length > 0 ? "danger" : "neutral"}
                value={`${expressOrders.length}`}
              />
            </div>

            <SectionCard
              title="Живая карта и очередь"
              action={
                <div className="action-row">
                  <button
                    className={data.driver.onShift ? "primary-button" : "secondary-button"}
                    disabled={isSaving}
                    onClick={() => void postDriverAction({ action: "toggle_shift" })}
                    type="button"
                  >
                    {data.driver.onShift ? "На смене" : "Не на смене"}
                  </button>
                </div>
              }
            >
              <DgisMinskMap
                courierPoint={{ lat: 53.8695, lng: 27.5485 }}
                stops={activeOrders.map((stop) => stop.order)}
              />
            </SectionCard>

            <SectionCard title="Группировка плановых заказов по домам">
              <DataTable
                columns={["Дом", "Заказов", "Бутылей"]}
                rows={groupedPlanRows.length > 0 ? groupedPlanRows : [["Нет плановых", "-", "-"]]}
              />
            </SectionCard>
          </div>

          <div className="driver-right-stack">
            <SectionCard title="ЭКСПРЕСС" action={<StatusPill tone="danger">{expressOrders.length} срочных</StatusPill>}>
              <div className="dispatch-orders">
                {expressOrders.map((stop) => (
                  <button
                    key={stop.order.id}
                    className={`order-card-button express${selectedOrderId === stop.order.id ? " active" : ""}`}
                    onClick={() => {
                      setSelectedOrderId(stop.order.id);
                      setTab("order");
                    }}
                    type="button"
                  >
                    <div className="section-row">
                      <strong>{stop.order.address}</strong>
                      <StatusPill tone="danger">
                        {stop.order.status === "pending"
                          ? "Новый"
                          : formatTimer(stop.order.minutesToDeadline, stop.order.status)}
                      </StatusPill>
                    </div>
                    <p className="item-meta">
                      {stop.order.bottles} бутыли • {stop.order.customerName} • ETA {stop.etaMinutes} мин
                    </p>
                    {stop.order.status === "pending" ? (
                      <div className="action-row" style={{ marginTop: 10 }}>
                        <button
                          className="primary-button compact-button"
                          disabled={isSaving || !data.driver.onShift}
                          onClick={(event) => {
                            event.stopPropagation();
                            void postDriverAction({
                              action: "accept_order",
                              orderId: stop.order.id
                            });
                          }}
                          type="button"
                        >
                          ПРИНЯЛ
                        </button>
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="ПЛАН" action={<StatusPill>{planOrders.length} в очереди</StatusPill>}>
              <div className="dispatch-orders">
                {planOrders.map((stop) => (
                  <button
                    key={stop.order.id}
                    className={`order-card-button${selectedOrderId === stop.order.id ? " active" : ""}`}
                    onClick={() => {
                      setSelectedOrderId(stop.order.id);
                      setTab("order");
                    }}
                    type="button"
                  >
                    <div className="section-row">
                      <strong>{stop.order.address}</strong>
                      <StatusPill tone="warning">{stop.order.timeWindowLabel}</StatusPill>
                    </div>
                    <p className="item-meta">
                      {stop.order.bottles} бутыли • {stop.order.customerName} • ETA {stop.etaMinutes} мин
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {tab === "order" ? (
        <div className="grid-two owner-page-grid">
          <SectionCard
            title="Карточка заказа"
            action={
              selectedOrder ? (
                <StatusPill tone={selectedOrder.type === "express" ? "danger" : "warning"}>
                  {selectedOrder.id}
                </StatusPill>
              ) : null
            }
          >
            {selectedOrder ? (
              <>
                <div className="driver-order-grid">
                  <div className="driver-order-block">
                    <h3>{selectedOrder.address}</h3>
                    <p className="muted-text">
                      {selectedOrder.district} • клиент {selectedOrder.customerName} • {selectedOrder.customerPhone}
                    </p>
                    <p className="muted-text">
                      Домофон {selectedOrder.intercomCode}. Комментарий: {selectedOrder.comment}
                    </p>
                  </div>

                  <div className="driver-order-metrics">
                    <StatCard label="Заказ" value={`${selectedOrder.bottles} бутыли`} />
                    <StatCard
                      label={selectedOrder.type === "express" ? "Таймер клиента" : "Окно доставки"}
                      note={
                        selectedOrder.type === "express"
                          ? "Стартует после «ПРИНЯЛ»"
                          : "Плановая доставка по подписке"
                      }
                      tone={selectedOrder.type === "express" ? "danger" : "attention"}
                      value={formatTimer(selectedOrder.minutesToDeadline, selectedOrder.status)}
                    />
                  </div>
                </div>

                <div className="action-row" style={{ marginTop: 14 }}>
                  {selectedOrder.type === "express" && selectedOrder.status === "pending" ? (
                    <button
                      className="primary-button"
                      disabled={isSaving || !data.driver.onShift}
                      onClick={() =>
                        void postDriverAction({
                          action: "accept_order",
                          orderId: selectedOrder.id
                        })
                      }
                      type="button"
                    >
                      ПРИНЯЛ
                    </button>
                  ) : null}
                  <a
                    className="secondary-button link-button"
                    href={buildNavigatorUrl(selectedOrder)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Навигатор
                  </a>
                  <a className="secondary-button link-button" href={`tel:${selectedOrder.customerPhone}`}>
                    Связь
                  </a>
                  <button
                    className="primary-button"
                    onClick={() => setDeliveryDraft({ orderId: selectedOrder.id, emptyReturned: 0 })}
                    type="button"
                  >
                    ДОСТАВЛЕНО
                  </button>
                </div>
              </>
            ) : (
              <p className="muted-text">Выбери заказ в очереди, чтобы открыть полную карточку.</p>
            )}
          </SectionCard>

          <SectionCard title="Навигация и детали маршрута">
            <div className="driver-logic-list">
              {activeOrders.map((stop, index) => (
                <div key={stop.order.id} className="logic-item">
                  <strong>
                    {index + 1}. {stop.order.address}
                  </strong>
                  <p className="item-meta">
                    ETA {stop.etaMinutes} мин • {stop.distanceKm} км •{" "}
                    {stop.order.type === "express"
                      ? `дедлайн ${formatTimer(stop.order.minutesToDeadline, stop.order.status)}`
                      : stop.order.timeWindowLabel}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : null}

      {tab === "cargo" ? (
        <div className="grid-two owner-page-grid">
          <div className="owner-column">
            <div className="grid-two">
              <StatCard label="Полные в машине" value={`${data.driver.machineFull}`} />
              <StatCard label="Пустые в машине" value={`${data.driver.machineEmpty}`} />
            </div>

            <SectionCard title="Пополнить склад в машине">
              <label className="field-label">
                Количество новых бутылей
                <input
                  className="field-input"
                  onChange={(event) => setReplenishAmount(event.target.value)}
                  value={replenishAmount}
                />
              </label>
              <div className="action-row" style={{ marginTop: 14 }}>
                <button
                  className="primary-button"
                  disabled={isSaving}
                  onClick={() =>
                    void postDriverAction({
                      action: "replenish",
                      amount: Number(replenishAmount) || 0
                    })
                  }
                  type="button"
                >
                  Пополнить склад
                </button>
                <button
                  className="secondary-button"
                  disabled={isSaving}
                  onClick={() => void postDriverAction({ action: "surrender_empty" })}
                  type="button"
                >
                  Сдать тару на склад
                </button>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Offline-sync и журнал багажника">
            <DataTable
              columns={["Время", "Событие"]}
              rows={data.driver.offlineQueue.map((entry) => {
                const parts = entry.split(" • ");
                return [parts[0] ?? "Сейчас", parts.slice(1).join(" • ")];
              })}
            />
          </SectionCard>
        </div>
      ) : null}

      {tab === "shift" ? (
        <div className="grid-two owner-page-grid">
          <SectionCard title="Итоги смены">
            <DataTable
              columns={["Показатель", "Значение"]}
              rows={[
                ["Всего доставлено бутылей", `${data.driver.deliveredToday}`],
                ["Экспресс вовремя", `${data.driver.expressOnTime}`],
                ["Экспресс с опозданием", `${data.driver.expressLate}`],
                ["Собрано пустой тары", `${data.driver.returnedToday}`],
                ["Последняя геосинхронизация", data.driver.lastGeoSync]
              ]}
            />
          </SectionCard>

          <SectionCard title="Технические требования">
            <div className="driver-logic-list">
              <div className="logic-item">
                <strong>White-list доступ</strong>
                <p className="item-meta">
                  Кабинет открывается только по коду водителя, который проверяется через `/api/access`.
                </p>
              </div>
              <div className="logic-item">
                <strong>Offline-sync</strong>
                <p className="item-meta">
                  Все важные действия уходят в общий backend-слой и параллельно пишутся в офлайн-журнал.
                </p>
              </div>
              <div className="logic-item">
                <strong>Геолокация и отчетность</strong>
                <p className="item-meta">
                  В demo-режиме показываем живое поле последней синхронизации и сквозную статистику по смене.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {deliveryDraft ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Подтвердить доставку</h3>
            <p>
              Отметь, сколько пустых бутылей вернул клиент. После подтверждения таймер
              у клиента остановится, а owner увидит обновленные остатки на складе.
            </p>
            <div className="delivery-counter">
              <button
                className="secondary-button"
                onClick={() =>
                  setDeliveryDraft((current) =>
                    current
                      ? { ...current, emptyReturned: Math.max(0, current.emptyReturned - 1) }
                      : current
                  )
                }
                type="button"
              >
                -
              </button>
              <strong>{deliveryDraft.emptyReturned}</strong>
              <button
                className="secondary-button"
                onClick={() =>
                  setDeliveryDraft((current) =>
                    current ? { ...current, emptyReturned: current.emptyReturned + 1 } : current
                  )
                }
                type="button"
              >
                +
              </button>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button compact-button"
                onClick={() => setDeliveryDraft(null)}
                type="button"
              >
                Отмена
              </button>
              <button
                className="primary-button compact-button"
                disabled={isSaving}
                onClick={async () => {
                  await postDriverAction({
                    action: "deliver_order",
                    orderId: deliveryDraft.orderId,
                    emptyReturned: deliveryDraft.emptyReturned
                  });
                  setDeliveryDraft(null);
                }}
                type="button"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DriverPageContent() {
  const searchParams = useSearchParams();
  const internalAccess = searchParams.get("bot") === "internal";

  if (!internalAccess) {
    return (
      <AccessGate
        role="driver"
        subtitle="Кабинет курьера открывается только из внутреннего Telegram-бота Aqua60."
        title="Кабинет курьера"
      >
        {() => (
          <SectionCard title="Доступ ограничен">
            <p className="muted-text">
              Этот раздел закрыт для клиентского бота. Открой внутреннего бота Aqua60 и зайди
              в кабинет курьера через его кнопку.
            </p>
          </SectionCard>
        )}
      </AccessGate>
    );
  }

  return (
    <AccessGate
      role="driver"
      subtitle="Мобильный кабинет водителя-курьера с очередью экспрессов, карточкой заказа, багажником, таймерами и офлайн-синхронизацией."
      title="Кабинет курьера"
    >
      {(identity) => <DriverDashboard identity={identity} />}
    </AccessGate>
  );
}

export default function DriverPage() {
  return (
    <Suspense fallback={<p className="muted-text">Загружаем кабинет курьера...</p>}>
      <DriverPageContent />
    </Suspense>
  );
}
