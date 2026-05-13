import type { AccessIdentity } from "../../ui";
import type { DriverOrder } from "../../driver/route-planner";

type RoleKey = "customer" | "driver" | "owner" | "admin";

interface DemoClient {
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
}

interface DemoSupportThread {
  id: string;
  customer: string;
  phone: string;
  status: string;
  messages: { sender: "client" | "service"; text: string; time: string }[];
}

interface DemoPayment {
  id: string;
  customerName: string;
  phone: string;
  amount: number;
  status: "paid" | "failed" | "pending";
  reason: string;
  timestamp: string;
  recurringAt?: string;
}

interface DemoDriver {
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
}

interface DemoPricing {
  water: number;
  firstBottleService: number;
  nextBottleService: number;
  scheduleChange: number;
}

interface DemoState {
  identities: Record<RoleKey, AccessIdentity[]>;
  clients: DemoClient[];
  supportThreads: DemoSupportThread[];
  payments: DemoPayment[];
  orders: DriverOrder[];
  driverStats: Record<string, DemoDriver>;
  warehouseStock: number;
  warehouseEmpty: number;
  lowStockThreshold: number;
  plannerTime: string;
  pricing: DemoPricing;
}

interface CustomerState {
  client: DemoClient | null;
  latestExpressOrder: DriverOrder | null;
}

const initialState: DemoState = {
  identities: {
    customer: [
      {
        code: "CL-2048",
        label: "Клиент Елена С.",
        note: "Подписка активна, 14 бутылей осталось."
      }
    ],
    driver: [
      {
        code: "DR-1001",
        label: "Курьер Андрей",
        note: "Смена активна, машина №3."
      },
      {
        code: "DR-1002",
        label: "Курьер Дмитрий",
        note: "Резервная смена."
      }
    ],
    owner: [
      {
        code: "OW-9090",
        label: "Владелец / главный доступ",
        note: "Полный доступ к операционному кабинету."
      }
    ],
    admin: []
  },
  clients: [
    {
      id: "cl-1",
      name: "Елена С.",
      phone: "+375 29 000-00-00",
      address: "Минск-Мир, ул. Николы Теслы 18, кв. 42",
      schedule: "Пн / Чт • 19:00 - 20:00",
      limit: 14,
      blocked: false,
      nextChargeAt: "2026-06-01T09:00:00.000Z",
      recurringAmount: 95,
      history: [
        { date: "12 мая", event: "Доставка", detail: "3 бутыли, курьер Андрей" },
        { date: "09 мая", event: "Изменение графика", detail: "Списано 1 BYN" },
        { date: "07 мая", event: "Экспресс", detail: "2 бутыли, 11.96 BYN" }
      ]
    },
    {
      id: "cl-2",
      name: "Максим П.",
      phone: "+375 29 123-45-67",
      address: "Минск-Мир, ул. Белградская 8, кв. 84",
      schedule: "Вт / Пт • 18:00 - 19:00",
      limit: 9,
      blocked: false,
      nextChargeAt: "2026-06-01T09:03:00.000Z",
      recurringAmount: 49,
      history: [
        { date: "12 мая", event: "Плановая доставка", detail: "2 бутыли" },
        { date: "05 мая", event: "Ручное добавление лимита", detail: "+2 бутыли" }
      ]
    },
    {
      id: "cl-3",
      name: "Артем К.",
      phone: "+375 29 200-00-00",
      address: "Минск-Мир, ул. Алферова 10, кв. 11",
      schedule: "Ср / Сб • 10:00 - 11:00",
      limit: 4,
      blocked: true,
      nextChargeAt: "2026-06-01T09:07:00.000Z",
      recurringAmount: 95,
      history: [
        { date: "10 мая", event: "Блокировка", detail: "3 срыва доставки подряд" },
        { date: "08 мая", event: "Ошибка оплаты", detail: "Автосписание отклонено" }
      ]
    }
  ],
  supportThreads: [
    {
      id: "th-1",
      customer: "Елена С.",
      phone: "+375 29 000-00-00",
      status: "Ждет ответа",
      messages: [
        { sender: "client", text: "Можно сегодня оставить воду у двери?", time: "18:11" },
        { sender: "service", text: "Да, передадим курьеру комментарий.", time: "18:15" }
      ]
    },
    {
      id: "th-2",
      customer: "Максим П.",
      phone: "+375 29 123-45-67",
      status: "Новый диалог",
      messages: [{ sender: "client", text: "Почему не прошло автосписание?", time: "19:02" }]
    }
  ],
  payments: [
    {
      id: "INV-5021",
      customerName: "Елена С.",
      phone: "+375 29 000-00-00",
      amount: 95,
      status: "paid",
      reason: "Подписка Aqua60 • Май",
      timestamp: "2026-05-12T09:10:00.000Z",
      recurringAt: "2026-06-01T09:00:00.000Z"
    },
    {
      id: "INV-5022",
      customerName: "Максим П.",
      phone: "+375 29 123-45-67",
      amount: 49,
      status: "failed",
      reason: "Недостаточно средств",
      timestamp: "2026-05-12T09:15:00.000Z",
      recurringAt: "2026-06-01T09:03:00.000Z"
    },
    {
      id: "INV-5023",
      customerName: "Дарья В.",
      phone: "+375 29 501-99-11",
      amount: 179,
      status: "paid",
      reason: "Подписка Aqua60 • Май",
      timestamp: "2026-05-12T09:18:00.000Z",
      recurringAt: "2026-06-01T09:07:00.000Z"
    },
    {
      id: "INV-5024",
      customerName: "Ирина Л.",
      phone: "+375 29 456-77-90",
      amount: 11.96,
      status: "pending",
      reason: "Экспресс вне лимита",
      timestamp: "2026-05-12T19:03:00.000Z"
    }
  ],
  orders: [
    {
      id: "EXP-104",
      address: "ул. Алферова 12, подъезд 3, этаж 8, кв. 84",
      district: "Минск-Мир",
      type: "express",
      status: "in_progress",
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
      address: "ул. Николы Теслы 18, подъезд 1, этаж 5, кв. 42",
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
      address: "ул. Алферова 10, подъезд 2, этаж 11, кв. 11",
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
      timeWindowLabel: "19:00 - 20:00",
      minutesToDeadline: null,
      requestedAt: "09:00"
    },
    {
      id: "SCH-245",
      address: "ул. Белградская 5, подъезд 1, этаж 3, кв. 15",
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
      timeWindowLabel: "20:00 - 21:00",
      minutesToDeadline: null,
      requestedAt: "10:20"
    }
  ],
  driverStats: {
    "DR-1001": {
      code: "DR-1001",
      label: "Курьер Андрей",
      note: "Смена активна, машина №3.",
      onShift: true,
      machineFull: 28,
      machineEmpty: 11,
      deliveredToday: 34,
      returnedToday: 17,
      expressOnTime: 4,
      expressLate: 1,
      lastGeoSync: "19:05",
      offlineQueue: [
        "12.05 17:03 • Геопозиция отправлена повторно после восстановления сети"
      ]
    },
    "DR-1002": {
      code: "DR-1002",
      label: "Курьер Дмитрий",
      note: "Резервная смена.",
      onShift: false,
      machineFull: 18,
      machineEmpty: 4,
      deliveredToday: 11,
      returnedToday: 4,
      expressOnTime: 1,
      expressLate: 0,
      lastGeoSync: "18:55",
      offlineQueue: []
    }
  },
  warehouseStock: 162,
  warehouseEmpty: 37,
  lowStockThreshold: 50,
  plannerTime: "18:00",
  pricing: {
    water: 2.99,
    firstBottleService: 2.99,
    nextBottleService: 1.99,
    scheduleChange: 1
  }
};

function getStore() {
  const globalStore = globalThis as typeof globalThis & {
    __AQUA60_DEMO_STATE__?: DemoState;
  };

  if (!globalStore.__AQUA60_DEMO_STATE__) {
    globalStore.__AQUA60_DEMO_STATE__ = structuredClone(initialState);
  }

  return globalStore.__AQUA60_DEMO_STATE__;
}

function formatCurrency(value: number) {
  return `${value.toFixed(2)} BYN`;
}

function parseBuilding(address: string) {
  return address.split(",")[0]?.trim() ?? address;
}

function timestampLabel(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function nowDateLabel() {
  return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function nowTimeLabel() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function resolveCustomerClient(state: DemoState, code: string) {
  const customerIdentity = state.identities.customer.find((item) => item.code === code);
  if (!customerIdentity) {
    return state.clients[0] ?? null;
  }

  const matchedByName = state.clients.find((client) =>
    customerIdentity.label.includes(client.name)
  );

  return matchedByName ?? state.clients[0] ?? null;
}

function computeCustomerDistrict(address: string) {
  if (address.toLowerCase().includes("минск-мир")) {
    return "Минск-Мир";
  }

  return "Минск";
}

function createMapPointFromGeo(lat: number, lng: number) {
  return {
    x: Math.round((lng - 27.48) * 1000),
    y: Math.round((53.9 - lat) * 1000)
  };
}

export function verifyAccess(role: RoleKey, code: string) {
  const state = getStore();
  return state.identities[role].find(
    (item) => item.code.toLowerCase() === code.trim().toLowerCase()
  );
}

export function getCustomerState(code: string): CustomerState {
  const state = getStore();
  const client = resolveCustomerClient(state, code);
  const latestExpressOrder = client
    ? [...state.orders]
        .filter(
          (order) =>
            order.customerName === client.name &&
            order.type === "express" &&
            order.status !== "delivered"
        )
        .sort((left, right) => right.id.localeCompare(left.id))[0] ?? null
    : null;

  return {
    client,
    latestExpressOrder
  };
}

export function saveCustomerSubscription(
  code: string,
  payload: {
    phone: string;
    address: string;
    schedule: string;
    monthlyBottles: number;
    recurringAmount: number;
  }
) {
  const state = getStore();
  const client = resolveCustomerClient(state, code);
  if (!client) {
    return getCustomerState(code);
  }

  client.phone = payload.phone;
  client.address = payload.address;
  client.schedule = payload.schedule;
  client.limit = payload.monthlyBottles;
  client.recurringAmount = payload.recurringAmount;
  client.nextChargeAt = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
    9,
    0,
    0
  ).toISOString();
  client.history.unshift({
    date: nowDateLabel(),
    event: "Подписка обновлена",
    detail: `${payload.monthlyBottles} бутылей • ${formatCurrency(payload.recurringAmount)}`
  });

  state.payments.unshift({
    id: `INV-${Math.floor(Date.now() / 1000)}`,
    customerName: client.name,
    phone: client.phone,
    amount: payload.recurringAmount,
    status: "paid",
    reason: "Подписка Aqua60 • Демо-подтверждение",
    timestamp: new Date().toISOString(),
    recurringAt: client.nextChargeAt
  });

  return getCustomerState(code);
}

export function createCustomerExpressOrder(
  code: string,
  payload: {
    bottles: number;
    address: string;
    district: string;
    phone: string;
    intercomCode: string;
    comment: string;
    lat: number;
    lng: number;
  }
) {
  const state = getStore();
  const client = resolveCustomerClient(state, code);
  if (!client) {
    return getCustomerState(code);
  }

  client.phone = payload.phone;
  client.address = payload.address;
  client.history.unshift({
    date: nowDateLabel(),
    event: "Экспресс-заказ создан",
    detail: `${payload.bottles} бутыли • ${payload.address}`
  });

  const nextId = `EXP-${100 + state.orders.filter((order) => order.type === "express").length + 1}`;
  state.orders.unshift({
    id: nextId,
    address: payload.address,
    district: payload.district || computeCustomerDistrict(payload.address),
    type: "express",
    status: "pending",
    bottles: payload.bottles,
    customerName: client.name,
    customerPhone: payload.phone,
    comment: payload.comment || "Заказ из клиентского приложения.",
    intercomCode: payload.intercomCode || "—",
    coords: createMapPointFromGeo(payload.lat, payload.lng),
    geo: { lat: payload.lat, lng: payload.lng },
    timeWindowLabel: "Сейчас",
    minutesToDeadline: 60,
    requestedAt: nowTimeLabel()
  });

  state.payments.unshift({
    id: `INV-${Math.floor(Date.now() / 1000) + 1}`,
    customerName: client.name,
    phone: payload.phone,
    amount: payload.bottles * (state.pricing.water + state.pricing.firstBottleService),
    status: "pending",
    reason: "Экспресс вне лимита",
    timestamp: new Date().toISOString()
  });

  return getCustomerState(code);
}

export function cancelCustomerExpressOrder(code: string, orderId: string) {
  const state = getStore();
  const client = resolveCustomerClient(state, code);
  const orderIndex = state.orders.findIndex(
    (order) => order.id === orderId && order.type === "express"
  );

  if (client && orderIndex >= 0) {
    const [removed] = state.orders.splice(orderIndex, 1);
    client.history.unshift({
      date: nowDateLabel(),
      event: "Экспресс отменен",
      detail: removed ? removed.address : "Отменен из клиента"
    });
  }

  return getCustomerState(code);
}

export function getOwnerState() {
  const state = getStore();

  const paidToday = state.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const activeOrders = state.orders.filter((order) => order.status !== "delivered");
  const expressCritical = state.orders.filter(
    (order) =>
      order.type === "express" &&
      order.status === "in_progress" &&
      (order.minutesToDeadline ?? 0) <= 10
  );

  const groupedBuildings = Array.from(
    state.orders.reduce((map, order) => {
      const key = parseBuilding(order.address);
      const current = map.get(key) ?? { orders: 0, bottles: 0 };
      current.orders += 1;
      current.bottles += order.bottles;
      map.set(key, current);
      return map;
    }, new Map<string, { orders: number; bottles: number }>())
  ).map(([building, stats]) => ({
    building,
    orders: stats.orders,
    bottles: stats.bottles
  }));

  return {
    stats: {
      revenueToday: formatCurrency(paidToday),
      activeOrders: activeOrders.length,
      criticalExpress: expressCritical.length,
      warehouseStock: state.warehouseStock
    },
    operationsOrders: state.orders.map((order) => ({
      address: order.address,
      type: order.type === "express" ? "Экспресс" : "План",
      bottles: order.bottles,
      timer:
        order.type === "express" && order.status === "in_progress"
          ? `${order.minutesToDeadline ?? 0} мин`
          : order.timeWindowLabel,
      risk:
        order.type === "express" && (order.minutesToDeadline ?? 0) <= 10
          ? "critical"
          : order.type === "express"
            ? "warning"
            : "normal"
    })),
    groupedBuildings,
    clients: state.clients,
    supportThreads: state.supportThreads,
    payments: state.payments,
    pricing: state.pricing,
    warehouse: {
      stock: state.warehouseStock,
      empty: state.warehouseEmpty,
      lowStockThreshold: state.lowStockThreshold
    },
    plannerTime: state.plannerTime
  };
}

export function updateOwnerClient(clientId: string, action: "add_limit" | "remove_limit" | "toggle_block") {
  const state = getStore();
  const client = state.clients.find((item) => item.id === clientId);
  if (!client) {
    return getOwnerState();
  }

  if (action === "add_limit") {
    client.limit += 1;
  } else if (action === "remove_limit") {
    client.limit = Math.max(0, client.limit - 1);
  } else {
    client.blocked = !client.blocked;
  }

  return getOwnerState();
}

export function updateOwnerSettings(payload: {
  plannerTime?: string;
  lowStockThreshold?: number;
  pricing?: Partial<DemoPricing>;
}) {
  const state = getStore();
  if (payload.plannerTime) {
    state.plannerTime = payload.plannerTime;
  }
  if (typeof payload.lowStockThreshold === "number") {
    state.lowStockThreshold = payload.lowStockThreshold;
  }
  if (payload.pricing) {
    state.pricing = { ...state.pricing, ...payload.pricing };
  }
  return getOwnerState();
}

export function sendOwnerReply(threadId: string, text: string) {
  const state = getStore();
  const thread = state.supportThreads.find((item) => item.id === threadId);
  if (thread && text.trim()) {
    thread.status = "Ответ отправлен";
    thread.messages.push({
      sender: "service",
      text: text.trim(),
      time: "Сейчас"
    });
  }
  return getOwnerState();
}

export function getDriverState(code: string) {
  const state = getStore();
  const driver = state.driverStats[code] ?? state.driverStats["DR-1001"];
  return {
    driver,
    orders: state.orders
  };
}

export function updateDriverState(
  code: string,
  action:
    | { type: "toggle_shift" }
    | { type: "accept_order"; orderId: string }
    | { type: "deliver_order"; orderId: string; emptyReturned: number }
    | { type: "replenish"; amount: number }
    | { type: "surrender_empty" }
) {
  const state = getStore();
  const driver = state.driverStats[code] ?? state.driverStats["DR-1001"];

  if (action.type === "toggle_shift") {
    driver.onShift = !driver.onShift;
  }

  if (action.type === "accept_order") {
    const order = state.orders.find((item) => item.id === action.orderId);
    if (order) {
      order.status = "in_progress";
      order.minutesToDeadline = 60;
      driver.offlineQueue.unshift(
        `${new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })} • Заказ ${order.id} принят, таймер клиента запущен`
      );
    }
  }

  if (action.type === "deliver_order") {
    const order = state.orders.find((item) => item.id === action.orderId);
    if (order) {
      const wasLate = order.type === "express" && (order.minutesToDeadline ?? 0) <= 0;
      order.status = "delivered";
      order.minutesToDeadline = null;
      driver.machineFull = Math.max(0, driver.machineFull - order.bottles);
      driver.machineEmpty += action.emptyReturned;
      driver.returnedToday += action.emptyReturned;
      driver.deliveredToday += order.bottles;
      state.warehouseStock = Math.max(0, state.warehouseStock - order.bottles);
      state.warehouseEmpty += action.emptyReturned;

      const client = state.clients.find((item) => item.name === order.customerName);
      if (client) {
        client.limit = Math.max(0, client.limit - order.bottles);
        client.history.unshift({
          date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long" }),
          event: "Доставка",
          detail: `${order.bottles} бутыли, возврат пустой тары ${action.emptyReturned}`
        });
      }

      if (order.type === "express") {
        if (wasLate) {
          driver.expressLate += 1;
        } else {
          driver.expressOnTime += 1;
        }
      }

      driver.offlineQueue.unshift(
        `${new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })} • ${order.id} доставлен, пустая тара: ${action.emptyReturned}`
      );
    }
  }

  if (action.type === "replenish") {
    if (action.amount > 0) {
      driver.machineFull += action.amount;
      state.warehouseStock = Math.max(0, state.warehouseStock - action.amount);
      driver.offlineQueue.unshift(
        `${new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })} • Хаб пополнил машину на ${action.amount} полных бутылей`
      );
    }
  }

  if (action.type === "surrender_empty") {
    if (driver.machineEmpty > 0) {
      state.warehouseEmpty += driver.machineEmpty;
      driver.offlineQueue.unshift(
        `${new Date().toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })} • На склад сдано ${driver.machineEmpty} пустых бутылей`
      );
      driver.machineEmpty = 0;
    }
  }

  driver.lastGeoSync = new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return getDriverState(code);
}
