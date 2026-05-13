"use client";

import { useMemo } from "react";
import type { DriverOrder, GeoPoint } from "./route-planner";

function buildMapUrl(courierPoint: GeoPoint, stops: DriverOrder[]) {
  const focusPoint = stops[0]?.geo ?? courierPoint;
  const params = new URLSearchParams({
    ll: `${focusPoint.lng},${focusPoint.lat}`,
    z: "12",
    pt: `${focusPoint.lng},${focusPoint.lat},pm2blm`
  });

  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}

export function DgisMinskMap({
  courierPoint,
  stops
}: {
  courierPoint: GeoPoint;
  stops: DriverOrder[];
}) {
  const mapUrl = useMemo(() => buildMapUrl(courierPoint, stops), [courierPoint, stops]);

  return (
    <div className="real-map-shell">
      <div className="real-map-frame-shell">
        <iframe
          className="real-map-frame"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={mapUrl}
          title="Карта маршрута курьера"
        />
      </div>
      <div className="driver-map-summary">
        <div className="driver-map-summary-row">
          <strong>Курьер</strong>
          <span>
            {courierPoint.lat.toFixed(4)}, {courierPoint.lng.toFixed(4)}
          </span>
        </div>
        {stops.slice(0, 4).map((order, index) => (
          <div className="driver-map-summary-row" key={order.id}>
            <strong>
              {index + 1}. {order.type === "express" ? "Экспресс" : "План"}
            </strong>
            <span>{order.address}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
