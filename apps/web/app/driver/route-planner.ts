export type DriverOrderType = "express" | "scheduled";
export type DriverOrderStatus = "pending" | "accepted" | "in_progress" | "delivered";

export interface MapPoint {
  x: number;
  y: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DriverOrder {
  id: string;
  address: string;
  district: string;
  type: DriverOrderType;
  status: DriverOrderStatus;
  bottles: number;
  customerName: string;
  customerPhone: string;
  comment: string;
  intercomCode: string;
  coords: MapPoint;
  geo: GeoPoint;
  timeWindowLabel: string;
  minutesToDeadline: number | null;
  requestedAt: string;
}

export interface PlannedStop {
  order: DriverOrder;
  etaMinutes: number;
  distanceKm: number;
  score: number;
}

const KM_SCALE = 0.18;
const DRIVER_SPEED_KMH = 28;

export function getDistanceKm(from: MapPoint, to: MapPoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const pixels = Math.sqrt(dx * dx + dy * dy);
  return pixels * KM_SCALE;
}

export function getTravelMinutes(distanceKm: number) {
  return Math.max(4, Math.round((distanceKm / DRIVER_SPEED_KMH) * 60));
}

function getOrderScore(order: DriverOrder, courierPoint: MapPoint) {
  const distanceKm = getDistanceKm(courierPoint, order.coords);
  const travelMinutes = getTravelMinutes(distanceKm);

  let score = 0;

  if (order.type === "express") {
    score += 200;
    if (order.status === "accepted" || order.status === "in_progress") {
      score += 45;
    }
    if (order.minutesToDeadline !== null) {
      score += Math.max(0, 90 - order.minutesToDeadline) * 3;
    }
  } else {
    score += 50;
    if (order.timeWindowLabel.includes("19:00")) {
      score += 10;
    }
  }

  score -= distanceKm * 6;
  score -= travelMinutes * 0.7;

  return score;
}

export function buildRoutePlan(orders: DriverOrder[], courierPoint: MapPoint) {
  const active = orders.filter((order) => order.status !== "delivered");
  const sorted = [...active].sort(
    (left, right) => getOrderScore(right, courierPoint) - getOrderScore(left, courierPoint)
  );

  let rollingPoint = courierPoint;
  let rollingEta = 0;

  const stops: PlannedStop[] = sorted.map((order) => {
    const distanceKm = getDistanceKm(rollingPoint, order.coords);
    const travelMinutes = getTravelMinutes(distanceKm);
    rollingEta += travelMinutes;
    rollingPoint = order.coords;

    return {
      order,
      etaMinutes: rollingEta,
      distanceKm: Number(distanceKm.toFixed(1)),
      score: Number(getOrderScore(order, courierPoint).toFixed(1))
    };
  });

  return stops;
}

export function getRecommendedStop(orders: DriverOrder[], courierPoint: MapPoint) {
  const [first] = buildRoutePlan(orders, courierPoint);
  return first ?? null;
}

export function buildNavigatorUrl(order: DriverOrder) {
  return `https://yandex.ru/maps/?rtext=~${order.geo.lat},${order.geo.lng}&rtt=auto`;
}
