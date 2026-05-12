"use client";

import { useEffect, useRef, useState } from "react";
import type { DriverOrder, GeoPoint } from "./route-planner";

declare global {
  interface Window {
    mapgl?: MapGLNamespace;
  }
}

interface MapGLNamespace {
  Map: new (
    container: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      key: string;
    }
  ) => MapGLMap;
  Marker: new (
    map: MapGLMap,
    options: {
      coordinates: [number, number];
      color?: string;
      label?: string;
    }
  ) => MapGLObject;
  Polyline: new (
    map: MapGLMap,
    options: {
      coordinates: [number, number][];
      color: string;
      width: number;
      zIndex?: number;
      renderingMode?: "2d" | "3d";
    }
  ) => MapGLObject;
}

interface MapGLMap {
  setCenter: (center: [number, number]) => void;
  destroy: () => void;
}

interface MapGLObject {
  destroy: () => void;
}

const DGIS_SCRIPT_ID = "dgis-mapgl-script";
const DGIS_API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY;

function ensureMapGlScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.mapgl) {
      resolve();
      return;
    }

    const existing = document.getElementById(DGIS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("2GIS load error")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = DGIS_SCRIPT_ID;
    script.src = "https://mapgl.2gis.com/api/js/v1";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("2GIS load error"));
    document.body.appendChild(script);
  });
}

function extractWktCoordinateGroups(payload: unknown) {
  const found: string[] = [];

  const walk = (value: unknown) => {
    if (typeof value === "string" && value.includes("LINESTRING")) {
      found.push(value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };

  walk(payload);
  return found;
}

function parseWktLines(lines: string[]) {
  const coordinates: [number, number][] = [];

  lines.forEach((line) => {
    const match = line.match(/LINESTRING\s*\((.+)\)/i);
    if (!match) {
      return;
    }

    match[1].split(",").forEach((pair) => {
      const [lngRaw, latRaw] = pair.trim().split(/\s+/);
      const lng = Number(lngRaw);
      const lat = Number(latRaw);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coordinates.push([lng, lat]);
      }
    });
  });

  return coordinates;
}

async function fetchDgisRoute(points: GeoPoint[], key: string) {
  if (points.length < 2) {
    return [];
  }

  const response = await fetch(`https://routing.api.2gis.com/routing/7.0.0/global?key=${key}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      points: points.map((point, index) => ({
        lon: point.lng,
        lat: point.lat,
        type: "stop",
        start: index === 0
      })),
      transport: "driving",
      route_mode: "fastest",
      traffic_mode: "jam",
      output: "detailed",
      locale: "ru"
    })
  });

  if (!response.ok) {
    throw new Error("2GIS routing request failed");
  }

  const data = await response.json();
  const wktLines = extractWktCoordinateGroups(data);
  return parseWktLines(wktLines);
}

export function DgisMinskMap({
  courierPoint,
  stops
}: {
  courierPoint: GeoPoint;
  stops: DriverOrder[];
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapGLMap | null>(null);
  const objectsRef = useRef<MapGLObject[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const renderMap = async () => {
      if (!DGIS_API_KEY) {
        setError("Добавь NEXT_PUBLIC_2GIS_API_KEY, чтобы включить карту 2GIS и маршруты.");
        return;
      }

      try {
        await ensureMapGlScript();

        if (!active || !mapContainerRef.current || !window.mapgl) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new window.mapgl.Map(mapContainerRef.current, {
            center: [courierPoint.lng, courierPoint.lat],
            zoom: 13,
            key: DGIS_API_KEY
          });
        } else {
          mapRef.current.setCenter([courierPoint.lng, courierPoint.lat]);
        }

        objectsRef.current.forEach((object) => object.destroy());
        objectsRef.current = [];

        const mapgl = window.mapgl;
        const courierMarker = new mapgl.Marker(mapRef.current, {
          coordinates: [courierPoint.lng, courierPoint.lat],
          color: "#152033",
          label: "К"
        });
        objectsRef.current.push(courierMarker);

        stops.forEach((order, index) => {
          const marker = new mapgl.Marker(mapRef.current!, {
            coordinates: [order.geo.lng, order.geo.lat],
            color: order.type === "express" ? "#c54848" : "#1482a5",
            label: String(index + 1)
          });
          objectsRef.current.push(marker);
        });

        const routeCoordinates = await fetchDgisRoute(
          [courierPoint, ...stops.map((stop) => stop.geo)],
          DGIS_API_KEY
        );

        if (!active || !window.mapgl || !mapRef.current || routeCoordinates.length === 0) {
          setError(routeCoordinates.length === 0 ? "2GIS не вернул геометрию маршрута." : "");
          return;
        }

        const routePolyline = new window.mapgl.Polyline(mapRef.current, {
          coordinates: routeCoordinates,
          color: "#1482a5",
          width: 6,
          zIndex: 10,
          renderingMode: "2d"
        });
        objectsRef.current.push(routePolyline);
        setError("");
      } catch (renderError) {
        if (active) {
          setError("Не удалось загрузить карту 2GIS или построить маршрут.");
        }
        console.error(renderError);
      }
    };

    void renderMap();

    return () => {
      active = false;
    };
  }, [courierPoint, stops]);

  useEffect(() => {
    return () => {
      objectsRef.current.forEach((object) => object.destroy());
      objectsRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="real-map-shell">
      <div className="real-map-frame" ref={mapContainerRef} />
      {error ? <p className="error-note">{error}</p> : null}
      <p className="helper-note">
        Реальная карта и маршрут настроены под 2GIS. Для запуска нужен ключ в
        `NEXT_PUBLIC_2GIS_API_KEY`.
      </p>
    </div>
  );
}
