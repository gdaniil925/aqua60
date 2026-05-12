"use client";

import { useMemo, useState } from "react";
import {
  AccessGate,
  DataTable,
  RoleTabs,
  SectionCard,
  StatCard,
  StatusPill
} from "../ui";
import { DgisMinskMap } from "./DgisMinskMap";
import {
  buildNavigatorUrl,
  buildRoutePlan,
  type DriverOrder,
  getRecommendedStop,
  type GeoPoint,
  type MapPoint
} from "./route-planner";

const tabs = [
  { key: "dispatch", label: "Диспетчер" },
  { key: "route", label: "Маршрут" },
  { key: "shift", label: "Смена" }
];

const baseOrders: DriverOrder[] = [
  {
    id: "EXP-104",
    address: "ул. Алферова 12, подъезд 3, кв. 84",
    district: "Минск-Мир",
    type: "express",
    status: "accepted",
    bottles: 2,
    customerName: "Елена С.",
    customerPhone: "+375 29 000-00-00",
    comment: "Оставить у двери, не звонить.",
    intercomCode: "2580",
    coords: { x: 78, y: 34 },
    geo: { lat: 53.8717, lng: 27.5625 },
    timeWindowLabel: "Сейчас",
    minutesToDeadline: 18,
    requestedAt: "18:42"
  },
  {
    id: "EXP-105",
    address: "ул. Николы Теслы 18, подъезд 1, кв. 42",
    district: "Минск-Мир",
    type: "express",
    status: "pending",
    bottles: 3,
    customerName: "Максим П.",
    customerPhone: "+375 29 123-45-67",
    comment: "Позвонить за 5 минут.",
    intercomCode: "1902",
    coords: { x: 58, y: 64 },
    geo: { lat: 53.8642, lng: 27.5411 },
    timeWindowLabel: "Сейчас",
    minutesToDeadline: 42,
    requestedAt: "18:55"
  },
  {
    id: "SCH-212",
    address: "ул. Алферова 10, подъезд 2",
    district: "Минск-Мир",
    type: "scheduled",
    status: "accepted",
    bottles: 4,
    customerName: "Артем К.",
    customerPhone: "+375 29 200-00-00",
    comment: "Поднять на 11 этаж.",
    intercomCode: "6411",
    coords: { x: 70, y: 22 },
    geo: { lat: 53.8764, lng: 27.5558 },
    timeWindowLabel: "19:00 - 21:00",
    minutesToDeadline: null,
    requestedAt: "09:00"
  },
  {
    id: "SCH-245",
    address: "ул. Белградская 5, подъезд 1",
    district: "Минск-Мир",
    type: "scheduled",
    status: "accepted",
    bottles: 2,
    customerName: "Дарья В.",
    customerPhone: "+375 29 501-99-11",
    comment: "Оставить у консьержа.",
    intercomCode: "0000",
    coords: { x: 32, y: 18 },
    geo: { lat: 53.8628, lng: 27.5187 },
    timeWindowLabel: "19:00 - 21:00",
    minutesToDeadline: null,
    requestedAt: "10:20"
  }
];

export default function DriverPage() {
  const [tab, setTab] = useState("dispatch");
  const [orders, setOrders] = useState<DriverOrder[]>(baseOrders);
  const [courierPoint, setCourierPoint] = useState<MapPoint>({ x: 48, y: 46 });
  const [courierGeoPoint, setCourierGeoPoint] = useState<GeoPoint>({
    lat: 53.8695,
    lng: 27.5485
  });
  const [fullBottles, setFullBottles] = useState(28);
  const [emptyBottles, setEmptyBottles] = useState(11);
  const [deliveredToday, setDeliveredToday] = useState(34);
  const [returnedToday, setReturnedToday] = useState(17);
  const [selectedOrderId, setSelectedOrderId] = useState("EXP-104");

  const routePlan = useMemo(
    () => buildRoutePlan(orders, courierPoint),
    [orders, courierPoint]
  );

  const recommendedStop = useMemo(
    () => getRecommendedStop(orders, courierPoint),
    [orders, courierPoint]
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ??
    recommendedStop?.order ??
    null;

  const activeOrdersCount = orders.filter((order) => order.status !== "delivered").length;
  const expressCount = orders.filter(
    (order) => order.type === "express" && order.status !== "delivered"
  ).length;
  const acceptedExpressCount = orders.filter(
    (order) =>
      order.type === "express" &&
      (order.status === "accepted" || order.status === "in_progress")
  ).length;

  const moveCourier = (point: MapPoint, geoPoint: GeoPoint) => {
    setCourierPoint(point);
    setCourierGeoPoint(geoPoint);
  };

  const acceptOrder = (orderId: string) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId && order.status === "pending"
          ? { ...order, status: "accepted", minutesToDeadline: order.minutesToDeadline ?? 60 }
          : order
      )
    );
    setSelectedOrderId(orderId);
  };

  const markDelivered = (orderId: string) => {
    const target = orders.find((order) => order.id === orderId);
    if (!target || target.status === "delivered") {
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: "delivered", minutesToDeadline: null } : order
      )
    );
    setCourierPoint(target.coords);
    setCourierGeoPoint(target.geo);
    setFullBottles((current) => Math.max(0, current - target.bottles));
    setEmptyBottles((current) => current + 1);
    setDeliveredToday((current) => current + target.bottles);
    setReturnedToday((current) => current + 1);
  };

  const simulateExpressOrder = () => {
    const id = `EXP-${100 + orders.length + 7}`;
    const newExpress: DriverOrder = {
      id,
      address: "ул. Братская 14, подъезд 4, кв. 51",
      district: "Минск-Мир",
      type: "express",
      status: "pending",
      bottles: 2,
      customerName: "Ирина Л.",
      customerPhone: "+375 29 456-77-90",
      comment: "Набрать домофон и подняться сразу.",
      intercomCode: "1470",
      coords: { x: 90, y: 58 },
      geo: { lat: 53.8592, lng: 27.5754 },
      timeWindowLabel: "Сейчас",
      minutesToDeadline: 56,
      requestedAt: "19:04"
    };

    setOrders((current) => [newExpress, ...current]);
    setSelectedOrderId(id);
    setTab("dispatch");
  };

  const routeRows = routePlan.map((stop, index) => [
    `${index + 1}. ${stop.order.type === "express" ? "Экспресс" : "План"}`,
    stop.order.address,
    `${stop.etaMinutes} мин`,
    `${stop.distanceKm} км`
  ]);

  return (
    <AccessGate
      role="driver"
      subtitle="Курьеру нужен не просто список заказов, а диспетчерский экран с реальной картой Минска, приоритетами, ETA и пересчетом очереди при каждом новом срочном заказе."
      title="Кабинет курьера"
    >
      {(identity) => (
        <>
          <RoleTabs current={tab} items={tabs} onChange={setTab} />

          {tab === "dispatch" ? (
            <div className="driver-dispatch-grid">
              <div className="driver-left-stack">
                <div className="grid-three">
                  <StatCard label="Статус смены" note={identity.label} value="На смене" />
                  <StatCard
                    label="Остаток в машине"
                    note="Полные / пустые"
                    value={`${fullBottles} / ${emptyBottles}`}
                  />
                  <StatCard
                    label="Активные заказы"
                    note={`${expressCount} экспресс / ${acceptedExpressCount} уже приняты`}
                    tone={expressCount > 0 ? "attention" : "neutral"}
                    value={`${activeOrdersCount}`}
                  />
                </div>

                <SectionCard
                  title="Реальная карта Минска и маршрут 2GIS"
                  action={
                    <div className="action-row">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          moveCourier({ x: 48, y: 46 }, { lat: 53.8695, lng: 27.5485 })
                        }
                        type="button"
                      >
                        База
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          moveCourier({ x: 64, y: 38 }, { lat: 53.8744, lng: 27.5598 })
                        }
                        type="button"
                      >
                        Центр района
                      </button>
                      <button className="primary-button" onClick={simulateExpressOrder} type="button">
                        Новый экспресс
                      </button>
                    </div>
                  }
                >
                  <DgisMinskMap
                    courierPoint={courierGeoPoint}
                    stops={routePlan.map((stop) => stop.order)}
                  />
                </SectionCard>

                <SectionCard title="Рекомендуемая очередь">
                  <DataTable
                    columns={["Порядок", "Адрес", "ETA", "Дистанция"]}
                    rows={routeRows}
                  />
                </SectionCard>
              </div>

              <div className="driver-right-stack">
                <SectionCard
                  title="Рекомендованный следующий заказ"
                  action={
                    recommendedStop ? (
                      <StatusPill tone={recommendedStop.order.type === "express" ? "danger" : "warning"}>
                        {recommendedStop.order.type === "express" ? "Экспресс" : "План"}
                      </StatusPill>
                    ) : null
                  }
                >
                  {recommendedStop ? (
                    <div className="driver-focus-card">
                      <h3>{recommendedStop.order.address}</h3>
                      <p className="muted-text">
                        ETA {recommendedStop.etaMinutes} мин, {recommendedStop.distanceKm} км, {recommendedStop.order.bottles} бутыли.
                      </p>
                      <p className="muted-text">
                        {recommendedStop.order.type === "express"
                          ? `До дедлайна осталось ${recommendedStop.order.minutesToDeadline} минут.`
                          : `Окно доставки: ${recommendedStop.order.timeWindowLabel}.`}
                      </p>
                    </div>
                  ) : (
                    <p className="muted-text">Активных заказов нет.</p>
                  )}
                </SectionCard>

                <SectionCard title="Все заказы">
                  <div className="dispatch-orders">
                    {routePlan.map((stop) => (
                      <button
                        key={stop.order.id}
                        className={`order-card-button${selectedOrder?.id === stop.order.id ? " active" : ""}`}
                        onClick={() => setSelectedOrderId(stop.order.id)}
                        type="button"
                      >
                        <div className="section-row">
                          <strong>{stop.order.address}</strong>
                          <StatusPill
                            tone={
                              stop.order.type === "express"
                                ? "danger"
                                : stop.order.status === "pending"
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {stop.order.type === "express" ? "Экспресс" : "План"}
                          </StatusPill>
                        </div>
                        <p className="item-meta">
                          {stop.order.bottles} бутыли • ETA {stop.etaMinutes} мин • {stop.order.customerName}
                        </p>
                      </button>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          ) : null}

          {tab === "route" ? (
            <div className="grid-main">
              <SectionCard
                title="Карточка выбранного заказа"
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
                          {selectedOrder.district}. Клиент: {selectedOrder.customerName}, {selectedOrder.customerPhone}
                        </p>
                        <p className="muted-text">
                          Домофон {selectedOrder.intercomCode}. Комментарий: {selectedOrder.comment}
                        </p>
                      </div>
                      <div className="driver-order-metrics">
                        <StatCard label="Бутыли" value={`${selectedOrder.bottles}`} />
                        <StatCard
                          label="Окно / дедлайн"
                          note={
                            selectedOrder.type === "express"
                              ? "После принятия идет таймер клиента"
                              : "Плановая доставка"
                          }
                          value={
                            selectedOrder.type === "express"
                              ? `${selectedOrder.minutesToDeadline ?? 0} мин`
                              : selectedOrder.timeWindowLabel
                          }
                          tone={selectedOrder.type === "express" ? "danger" : "attention"}
                        />
                      </div>
                    </div>

                    <div className="action-row" style={{ marginTop: 14 }}>
                      {selectedOrder.status === "pending" ? (
                        <button
                          className="primary-button"
                          onClick={() => acceptOrder(selectedOrder.id)}
                          type="button"
                        >
                          Принять заказ
                        </button>
                      ) : null}
                      <a
                        className="secondary-button link-button"
                        href={buildNavigatorUrl(selectedOrder)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Открыть навигатор
                      </a>
                      <button className="secondary-button" type="button">
                        Позвонить клиенту
                      </button>
                      <button
                        className="primary-button"
                        onClick={() => markDelivered(selectedOrder.id)}
                        type="button"
                      >
                        Доставлено
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="muted-text">Выбери заказ из диспетчерской очереди.</p>
                )}
              </SectionCard>

              <SectionCard title="Как система строит график">
                <div className="driver-logic-list">
                  <div className="logic-item">
                    <strong>1. Экспресс выше плана</strong>
                    <p className="item-meta">
                      Любой новый срочный заказ автоматически поднимается выше плановых доставок и пересчитывает очередь.
                    </p>
                  </div>
                  <div className="logic-item">
                    <strong>2. Учитывается расстояние</strong>
                    <p className="item-meta">
                      ETA зависит от текущей точки курьера и положения каждой доставки на карте.
                    </p>
                  </div>
                  <div className="logic-item">
                    <strong>3. Дедлайн влияет на приоритет</strong>
                    <p className="item-meta">
                      Чем меньше минут до SLA, тем выше заказ поднимается в маршрутном списке.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {tab === "shift" ? (
            <div className="grid-two">
              <SectionCard title="Смена сегодня">
                <DataTable
                  columns={["Показатель", "Значение"]}
                  rows={[
                    ["Доставлено бутылей", `${deliveredToday}`],
                    ["Активных заказов", `${activeOrdersCount}`],
                    ["Экспресс в работе", `${expressCount}`],
                    ["Собрано пустой тары", `${returnedToday}`]
                  ]}
                />
              </SectionCard>
              <SectionCard title="Системные возможности модуля">
                <div className="driver-logic-list">
                  <div className="logic-item">
                    <strong>Live-позиция курьера</strong>
                    <p className="item-meta">
                      В реальной версии координаты должны обновляться каждые 5 минут и передаваться владельцу.
                    </p>
                  </div>
                  <div className="logic-item">
                    <strong>Offline-sync</strong>
                    <p className="item-meta">
                      Если связь пропадает, статус доставки сохраняется локально и синхронизируется позже.
                    </p>
                  </div>
                  <div className="logic-item">
                    <strong>Динамический перерасчет</strong>
                    <p className="item-meta">
                      Новый экспресс автоматически меняет рекомендуемый порядок точек и обновляет ETA.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}
        </>
      )}
    </AccessGate>
  );
}
