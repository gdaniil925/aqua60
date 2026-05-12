"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, StatusPill } from "../ui";

const plans = [
  { id: "10", bottles: 10, note: "Для одного человека" },
  { id: "20", bottles: 20, note: "Самый популярный" },
  { id: "40", bottles: 40, note: "Для семьи или офиса" }
];

const timeSlots = Array.from({ length: 24 }, (_, index) => {
  const start = String(index).padStart(2, "0");
  const end = String((index + 1) % 24).padStart(2, "0");
  return `${start}:00 - ${end}:00`;
});
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const waterPrice = 2.99;
const firstServicePrice = 2.99;
const nextServicePrice = 1.99;
const scheduleChangeFee = 1;
const expressCancelPenalty = 2;
const mapZoom = 13;
const tileSize = 256;

const streetCatalog = [
  {
    label: "ул. Белградская",
    district: "Октябрьский район",
    coords: { lat: 53.8749, lon: 27.5665 },
    houses: ["8", "10", "12", "16"]
  },
  {
    label: "ул. Николы Теслы",
    district: "Октябрьский район",
    coords: { lat: 53.8722, lon: 27.5583 },
    houses: ["18", "20", "24", "28"]
  },
  {
    label: "ул. Братская",
    district: "Октябрьский район",
    coords: { lat: 53.8706, lon: 27.5718 },
    houses: ["6", "10", "14", "17"]
  },
  {
    label: "ул. Аэродромная",
    district: "Октябрьский район",
    coords: { lat: 53.8812, lon: 27.5589 },
    houses: ["20", "24", "28", "32"]
  },
  {
    label: "ул. Жореса Алферова",
    district: "Октябрьский район",
    coords: { lat: 53.8691, lon: 27.5834 },
    houses: ["3", "7", "12", "16"]
  }
];

const initialStreet = streetCatalog[0];

function formatMoney(value: number) {
  return `${value.toFixed(2)} BYN`;
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getNearestStreetByCoordinates(lat: number, lon: number) {
  return streetCatalog.reduce((closest, street) => {
    const currentDistance = Math.hypot(
      lat - street.coords.lat,
      lon - street.coords.lon
    );
    const bestDistance = Math.hypot(
      lat - closest.coords.lat,
      lon - closest.coords.lon
    );

    return currentDistance < bestDistance ? street : closest;
  }, streetCatalog[0]);
}

function lonToWorldX(lon: number) {
  const worldSize = tileSize * 2 ** mapZoom;
  return ((lon + 180) / 360) * worldSize;
}

function latToWorldY(lat: number) {
  const worldSize = tileSize * 2 ** mapZoom;
  const boundedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((boundedLat * Math.PI) / 180);

  return (
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) *
    worldSize
  );
}

function worldXToLon(worldX: number) {
  const worldSize = tileSize * 2 ** mapZoom;
  return (worldX / worldSize) * 360 - 180;
}

function worldYToLat(worldY: number) {
  const worldSize = tileSize * 2 ** mapZoom;
  const mercatorY = 0.5 - worldY / worldSize;
  const latRadians =
    Math.PI / 2 - 2 * Math.atan(Math.exp(-mercatorY * 2 * Math.PI));

  return (latRadians * 180) / Math.PI;
}

function viewportPointToCoordinates(
  pixelX: number,
  pixelY: number,
  viewportWidth: number,
  viewportHeight: number,
  center: { lat: number; lon: number }
) {
  const centerWorldX = lonToWorldX(center.lon);
  const centerWorldY = latToWorldY(center.lat);
  const nextWorldX = centerWorldX + (pixelX - viewportWidth / 2);
  const nextWorldY = centerWorldY + (pixelY - viewportHeight / 2);

  return {
    lat: Number(worldYToLat(nextWorldY).toFixed(6)),
    lon: Number(worldXToLon(nextWorldX).toFixed(6))
  };
}

function getTripCost(bottles: number) {
  if (bottles <= 0) {
    return 0;
  }

  return waterPrice + firstServicePrice +
    Math.max(0, bottles - 1) * (waterPrice + nextServicePrice);
}

function distributeBottles(monthlyBottles: number, tripCount: number) {
  const safeTrips = Math.max(1, Math.min(monthlyBottles, tripCount));
  const base = Math.floor(monthlyBottles / safeTrips);
  const remainder = monthlyBottles % safeTrips;

  return Array.from({ length: safeTrips }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  );
}

export default function SurveyPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "delivery">(
    "profile"
  );
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState(initialStreet.label);
  const [house, setHouse] = useState(initialStreet.houses[0]);
  const [entrance, setEntrance] = useState("2");
  const [floor, setFloor] = useState("7");
  const [apartment, setApartment] = useState("84");
  const [intercom, setIntercom] = useState("425B");
  const [selectedCoords, setSelectedCoords] = useState(initialStreet.coords);
  const [pickPointMode, setPickPointMode] = useState(false);
  const [tapToPickArmed, setTapToPickArmed] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState("20");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Пн", "Чт"]);
  const [selectedSlot, setSelectedSlot] = useState("19:00 - 20:00");

  const [paymentLinked, setPaymentLinked] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);
  const [scheduleChangeOpen, setScheduleChangeOpen] = useState(false);
  const [scheduleEditingEnabled, setScheduleEditingEnabled] = useState(false);
  const [scheduleChangeCharged, setScheduleChangeCharged] = useState(false);

  const [deliveryConfirmation, setDeliveryConfirmation] = useState<
    "pending" | "confirmed" | "postponed"
  >("pending");

  const [expressBottles, setExpressBottles] = useState(2);
  const [expressState, setExpressState] = useState<
    "idle" | "requested" | "confirmed" | "delivered" | "cancelled"
  >("idle");
  const [countdown, setCountdown] = useState(60 * 60);
  const [cancelWindow, setCancelWindow] = useState(5 * 60);
  const [penaltyApplied, setPenaltyApplied] = useState(false);

  const currentStreet = useMemo(
    () =>
      streetCatalog.find((item) => item.label === street) ?? initialStreet,
    [street]
  );

  const plan = useMemo(
    () => plans.find((item) => item.id === selectedPlan) ?? plans[1],
    [selectedPlan]
  );

  const availableHouses = currentStreet.houses;
  const district = currentStreet.district;
  const monthTripCount = Math.max(1, selectedDays.length * 4);
  const tripDistribution = useMemo(
    () => distributeBottles(plan.bottles, monthTripCount),
    [monthTripCount, plan.bottles]
  );
  const monthlyPrice = useMemo(
    () =>
      tripDistribution.reduce(
        (sum, bottlesInTrip) => sum + getTripCost(bottlesInTrip),
        0
      ),
    [tripDistribution]
  );
  const nextDeliveryBottles = tripDistribution[0] ?? 0;
  const expressPrice = useMemo(
    () => getTripCost(expressBottles),
    [expressBottles]
  );
  const mapSrc = useMemo(() => {
    const params = new URLSearchParams({
      ll: `${selectedCoords.lon},${selectedCoords.lat}`,
      z: String(mapZoom),
      pt: `${selectedCoords.lon},${selectedCoords.lat},pm2blm`
    });

    return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
  }, [selectedCoords.lat, selectedCoords.lon]);

  const selectedAddress = useMemo(() => {
    return `${street}, д. ${house}, подъезд ${entrance}, этаж ${floor}, кв./офис ${apartment}`;
  }, [apartment, entrance, floor, house, street]);

  const profileReady = Boolean(
    phone.trim() &&
      street.trim() &&
      house.trim() &&
      entrance.trim() &&
      floor.trim() &&
      apartment.trim()
  );

  const canSubmitSubscription = profileReady && selectedDays.length > 0;
  const canEditSchedule = !subscriptionSaved || scheduleEditingEnabled;

  const historyItems = useMemo(
    () => [
      {
        id: "sub-current",
        title: "Подписка Aqua60 • Май",
        amount: formatMoney(monthlyPrice),
        status: paymentLinked ? "Оплачено" : "Ожидает привязки карты"
      },
      {
        id: "service-change",
        title: "Изменение графика доставки",
        amount: formatMoney(scheduleChangeFee),
        status: scheduleChangeCharged ? "Списано" : "Не применялось"
      },
      {
        id: "penalty",
        title: "Штраф за отмену экспресс-заказа",
        amount: formatMoney(expressCancelPenalty),
        status: penaltyApplied ? "Списано" : "Нет"
      }
    ],
    [monthlyPrice, paymentLinked, penaltyApplied, scheduleChangeCharged]
  );

  useEffect(() => {
    if (expressState !== "confirmed") {
      return;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
      setCancelWindow((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expressState]);

  useEffect(() => {
    if (house && availableHouses.includes(house)) {
      return;
    }

    setHouse(availableHouses[0]);
  }, [availableHouses, house]);

  const handleShareContact = () => {
    setPhone("+375 (29) 555-24-60");
  };

  const handleStreetSelect = (value: string) => {
    const matchedStreet =
      streetCatalog.find((item) => item.label === value) ?? initialStreet;

    setStreet(matchedStreet.label);
    setHouse(matchedStreet.houses[0]);
    setSelectedCoords(matchedStreet.coords);
    setPickPointMode(false);
    setTapToPickArmed(false);
  };

  const handleToggleDay = (day: string) => {
    if (!canEditSchedule) {
      return;
    }

    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].slice(-3)
    );
  };

  const handleMapPick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (!tapToPickArmed) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextCoords = viewportPointToCoordinates(
      Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)),
      Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)),
      bounds.width,
      bounds.height,
      selectedCoords
    );
    const nearestStreet = getNearestStreetByCoordinates(
      nextCoords.lat,
      nextCoords.lon
    );

    setSelectedCoords(nextCoords);
    setStreet(nearestStreet.label);
    setHouse(nearestStreet.houses[0]);
    setPickPointMode(false);
    setTapToPickArmed(false);
  };

  const handleSubscriptionSave = () => {
    if (!canSubmitSubscription) {
      return;
    }

    setPaymentLinked(true);
    setSubscriptionSaved(true);
    setScheduleEditingEnabled(false);
    setActiveTab("delivery");
  };

  const handleExpressRequest = () => {
    setExpressState("requested");
    setPenaltyApplied(false);
    setCountdown(60 * 60);
    setCancelWindow(5 * 60);
  };

  const handleCourierConfirm = () => {
    setExpressState("confirmed");
    setCountdown(60 * 60);
    setCancelWindow(5 * 60);
  };

  const handleCourierFinish = () => {
    setExpressState("delivered");
    setCountdown(0);
    setCancelWindow(0);
  };

  const handleExpressCancel = () => {
    setExpressState("cancelled");
    setPenaltyApplied(cancelWindow > 0);
    setCountdown(0);
    setCancelWindow(0);
  };

  const handleScheduleChangeConfirm = () => {
    setScheduleChangeCharged(true);
    setScheduleEditingEnabled(true);
    setScheduleChangeOpen(false);
  };

  return (
    <AppShell>
      <section className="demo-wrap">
        <div className="demo-phone">
          <div className="demo-statusbar">
            <span>Aqua60</span>
          </div>

          <div className="demo-screen">
            <div className="demo-hero">
              <div className="demo-hero-topline">
                <div className="demo-badges">
                  <StatusPill>Минск</StatusPill>
                  <StatusPill>5л вода</StatusPill>
                </div>
                <div className="brand-lockup brand-lockup-hero" aria-label="Логотип Аква 60">
                  <div className="brand-symbol" aria-hidden="true">
                    <span className="brand-drop" />
                    <span className="brand-leaf" />
                  </div>
                  <div className="brand-wordmark">
                    <strong>Аква</strong>
                    <span>60</span>
                  </div>
                </div>
              </div>
              <h1 className="demo-title">Подписка на воду в один экран</h1>
              <p className="demo-copy">
                Клиент регистрируется, выбирает адрес, настраивает график,
                привязывает карту и управляет подпиской прямо в Telegram.
              </p>
            </div>

            <div className="demo-card sticky-summary">
              <div className="demo-card-head">
                <div>
                  <p className="demo-kicker">Личный кабинет</p>
                  <h3 className="demo-card-title">
                    {subscriptionSaved
                      ? `Осталось ${plan.bottles - nextDeliveryBottles} бутылей`
                      : "Соберите свой план"}
                  </h3>
                </div>
                <StatusPill>{subscriptionSaved ? "Подписка активна" : "Новая настройка"}</StatusPill>
              </div>
              <div className="demo-tabstrip">
                <button
                  className={`demo-tab${activeTab === "profile" ? " active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                  type="button"
                >
                  Профиль
                </button>
                <button
                  className={`demo-tab${activeTab === "subscription" ? " active" : ""}`}
                  onClick={() => setActiveTab("subscription")}
                  type="button"
                >
                  Подписка
                </button>
                <button
                  className={`demo-tab${activeTab === "delivery" ? " active" : ""}`}
                  onClick={() => setActiveTab("delivery")}
                  type="button"
                >
                  Доставка
                </button>
              </div>
            </div>

            {activeTab === "profile" ? (
              <>
                <div className="demo-card">
                  <div className="demo-section-head">
                    <div>
                      <p className="demo-kicker">Шаг 2</p>
                      <h3 className="demo-section-title">Профиль клиента</h3>
                    </div>
                    <StatusPill>{profileReady ? "Готов" : "Заполните анкету"}</StatusPill>
                  </div>

                  <div className="profile-grid">
                    <div className="contact-share-card">
                      <label className="field-label">
                        Телефон
                        <input
                          className="field-input"
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+375 (__) ___-__-__"
                          value={phone}
                        />
                      </label>
                      <div className="contact-action-stack">
                        <button
                          className="demo-secondary-cta contact-share-button"
                          onClick={handleShareContact}
                          type="button"
                        >
                          Подтянуть номер из Telegram
                        </button>
                      </div>
                    </div>

                    <div className="bottle-card">
                      <p className="demo-kicker">Выбор тары</p>
                      <strong>Бутыль 5л</strong>
                      <span className="demo-muted">
                        На первом этапе доступна только одна фиксированная тара.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="demo-section">
                  <div className="demo-section-head">
                    <div>
                      <h3 className="demo-section-title">Адрес доставки</h3>
                      <span className="demo-muted">
                        Улица и дом выбираются из сценария Минск-Мир, остальные поля
                        клиент вводит вручную.
                      </span>
                    </div>
                    <StatusPill>{district}</StatusPill>
                  </div>

                  <div className="address-map-card">
                    <div className="real-address-map-shell">
                      <iframe
                        className="real-address-map-frame"
                        key={`${selectedCoords.lat}-${selectedCoords.lon}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={mapSrc}
                        title="Карта Минска"
                      />
                      <span className="map-floating-chip">Минск</span>
                      {pickPointMode ? (
                        <div className="map-pick-panel">
                          <button
                            className={`map-pick-toggle${tapToPickArmed ? " active" : ""}`}
                            onClick={() => setTapToPickArmed((current) => !current)}
                            type="button"
                          >
                            {tapToPickArmed ? "Коснитесь карты" : "Выбрать касанием"}
                          </button>
                          <button
                            className="map-pick-cancel"
                            onClick={() => {
                              setPickPointMode(false);
                              setTapToPickArmed(false);
                            }}
                            type="button"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          className="map-pick-toggle"
                          onClick={() => setPickPointMode(true)}
                          type="button"
                        >
                          Поставить точку
                        </button>
                      )}
                      {pickPointMode && !tapToPickArmed ? (
                        <div className="map-pick-status">
                          Сначала приблизьте карту, затем нажмите "Выбрать касанием"
                        </div>
                      ) : null}
                      {tapToPickArmed ? (
                        <div
                          className="map-pick-overlay"
                          onClick={handleMapPick}
                          role="button"
                          tabIndex={0}
                        >
                          <span className="map-pick-hint">Коснитесь карты</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="address-form-card">
                      <div className="address-fields-row">
                        <label className="field-label">
                          Улица
                          <select
                            className="field-input"
                            onChange={(event) => handleStreetSelect(event.target.value)}
                            value={street}
                          >
                            {streetCatalog.map((item) => (
                              <option key={item.label} value={item.label}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="field-label">
                          Дом
                          <select
                            className="field-input"
                            onChange={(event) => setHouse(event.target.value)}
                            value={house}
                          >
                            {availableHouses.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div className="address-fields-grid">
                        <label className="field-label">
                          Подъезд
                          <input
                            className="field-input"
                            onChange={(event) => setEntrance(event.target.value)}
                            value={entrance}
                          />
                        </label>
                        <label className="field-label">
                          Этаж
                          <input
                            className="field-input"
                            onChange={(event) => setFloor(event.target.value)}
                            value={floor}
                          />
                        </label>
                        <label className="field-label">
                          Квартира / офис
                          <input
                            className="field-input"
                            onChange={(event) => setApartment(event.target.value)}
                            value={apartment}
                          />
                        </label>
                        <label className="field-label">
                          Код домофона
                          <input
                            className="field-input"
                            onChange={(event) => setIntercom(event.target.value)}
                            value={intercom}
                          />
                        </label>
                      </div>

                      <div className="address-selection">
                        <strong>{selectedAddress}</strong>
                        <span>
                          {district} • код домофона {intercom || "не указан"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "subscription" ? (
              <>
                <div className="demo-section">
                  <div className="demo-section-head">
                    <div>
                      <h3 className="demo-section-title">Конструктор подписки</h3>
                      <span className="demo-muted">
                        Выберите месячный объем, дни доставки и временной слот.
                      </span>
                    </div>
                    <StatusPill>{plan.bottles} бутылей</StatusPill>
                  </div>

                  <div className="plan-grid">
                    {plans.map((item) => (
                      <button
                        key={item.id}
                        className={`plan-card${selectedPlan === item.id ? " active" : ""}`}
                        onClick={() => setSelectedPlan(item.id)}
                        type="button"
                      >
                        <strong>{item.bottles} бутылей</strong>
                        <span>{item.note}</span>
                      </button>
                    ))}
                  </div>

                  <div className="day-grid">
                    {weekdays.map((day) => (
                      <button
                        key={day}
                        className={`day-pill${selectedDays.includes(day) ? " active" : ""}`}
                        disabled={!canEditSchedule}
                        onClick={() => handleToggleDay(day)}
                        type="button"
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="slot-list">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        className={`slot-card${selectedSlot === slot ? " active" : ""}`}
                        disabled={!canEditSchedule}
                        onClick={() => setSelectedSlot(slot)}
                        type="button"
                      >
                        <span>{slot}</span>
                        {selectedSlot === slot ? <strong>Выбрано</strong> : null}
                      </button>
                    ))}
                  </div>

                  <div className="calculator-card">
                    <div className="demo-section-head">
                      <div>
                        <p className="demo-kicker">Калькулятор стоимости</p>
                        <h3 className="demo-section-title">Авторасчет на месяц</h3>
                      </div>
                      <StatusPill>{formatMoney(monthlyPrice)}</StatusPill>
                    </div>

                    <div className="formula-note">
                      Выезд 1: (2.99 вода + 2.99 сервис) + остальные бутыли в этом
                      заказе × (2.99 вода + 1.99 сервис)
                    </div>

                    <div className="calculator-lines">
                      {tripDistribution.map((bottlesInTrip, index) => (
                        <div key={`${bottlesInTrip}-${index}`} className="calculator-line">
                          <span>
                            Выезд {index + 1} • {bottlesInTrip} бут.
                          </span>
                          <strong>{formatMoney(getTripCost(bottlesInTrip))}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="demo-summary">
                  <div>
                    <p className="demo-kicker">Ваш план</p>
                    <h3 className="demo-summary-title">
                      {plan.bottles} бутылей • {selectedDays.join(" / ")} •{" "}
                      {selectedSlot}
                    </h3>
                    <p className="demo-summary-address">{selectedAddress}</p>
                  </div>
                  <div className="demo-price">
                    <span>к оплате</span>
                    <strong>{formatMoney(monthlyPrice)}</strong>
                  </div>
                </div>

                <div className="demo-cta-stack">
                  <button
                    className="demo-main-cta"
                    disabled={!canSubmitSubscription}
                    onClick={handleSubscriptionSave}
                    type="button"
                  >
                    {subscriptionSaved
                      ? "Карта привязана, подписка активна"
                      : "Оформить подписку и привязать карту"}
                  </button>
                </div>
              </>
            ) : null}

            {activeTab === "delivery" ? (
              <>
                {!subscriptionSaved ? (
                  <div className="demo-card empty-state-card">
                    <div className="brand-lockup brand-lockup-empty" aria-label="Логотип Аква 60">
                      <div className="brand-symbol" aria-hidden="true">
                        <span className="brand-drop" />
                        <span className="brand-leaf" />
                      </div>
                    </div>
                    <h3 className="demo-card-title">Сначала соберите подписку</h3>
                    <p className="demo-muted">
                      Здесь будет личный кабинет клиента: остаток бутылей,
                      ближайшая доставка, push-подтверждение, экспресс и история.
                    </p>
                    <button
                      className="demo-main-cta compact-button"
                      onClick={() => setActiveTab("subscription")}
                      type="button"
                    >
                      Перейти к настройке подписки
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cabinet-grid">
                      <div className="demo-card primary">
                        <div className="card-logo-row">
                          <div>
                            <p className="demo-kicker">Личный кабинет</p>
                            <h3 className="demo-card-title">
                              Осталось {plan.bottles - nextDeliveryBottles} бутылей до конца месяца
                            </h3>
                          </div>
                          <div className="brand-lockup brand-lockup-compact" aria-label="Логотип Аква 60">
                            <div className="brand-symbol" aria-hidden="true">
                              <span className="brand-drop" />
                              <span className="brand-leaf" />
                            </div>
                          </div>
                        </div>
                        <p className="demo-muted">
                          Ближайшая доставка: завтра, {selectedSlot}. Курьер привезет{" "}
                          {nextDeliveryBottles} бутыли.
                        </p>
                      </div>

                      <div className="demo-card">
                        <p className="demo-kicker">Оплата</p>
                        <h3 className="demo-card-title">Карта bePaid привязана</h3>
                        <p className="demo-muted">
                          Следующее автосписание: 1 июня • {formatMoney(monthlyPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="demo-card">
                      <div className="demo-card-head">
                        <div>
                          <p className="demo-kicker">Управление графиком</p>
                          <h3 className="demo-card-title">Изменение дней и времени</h3>
                        </div>
                        <StatusPill>
                          {scheduleEditingEnabled ? "Редактирование открыто" : "1 BYN"}
                        </StatusPill>
                      </div>
                      <p className="demo-muted">
                        После оформления подписки график можно менять только после
                        подтверждения списания 1 BYN.
                      </p>
                      <div className="action-row">
                        <button
                          className="demo-secondary-cta compact-button"
                          onClick={() => setScheduleChangeOpen(true)}
                          type="button"
                        >
                          Изменить дни / время доставки
                        </button>
                      </div>
                    </div>

                    <div className="demo-card">
                      <div className="demo-card-head">
                        <div>
                          <p className="demo-kicker">Push-уведомление</p>
                          <h3 className="demo-card-title">
                            Завтра по графику везем {nextDeliveryBottles} бут.
                          </h3>
                        </div>
                        <StatusPill>
                          {deliveryConfirmation === "pending"
                            ? "Ждем ответ"
                            : deliveryConfirmation === "confirmed"
                              ? "Подтверждено"
                              : "Перенесено"}
                        </StatusPill>
                      </div>
                      <p className="demo-muted">
                        Это демо-версия ежедневного подтверждения в боте. Если
                        нажать «Да», заказ уходит курьеру. Если «Нет», лимит
                        сохраняется, а доставка переносится.
                      </p>
                      <div className="action-row">
                        <button
                          className="demo-main-cta compact-button"
                          onClick={() => setDeliveryConfirmation("confirmed")}
                          type="button"
                        >
                          Да, подтверждаю
                        </button>
                        <button
                          className="demo-secondary-cta compact-button"
                          onClick={() => setDeliveryConfirmation("postponed")}
                          type="button"
                        >
                          Нет, перенести
                        </button>
                      </div>
                    </div>

                    <div className="demo-card">
                      <div className="demo-card-head">
                        <div>
                          <p className="demo-kicker">Дозаказать 24/7</p>
                          <h3 className="demo-card-title">Экспресс вне лимита</h3>
                        </div>
                        <StatusPill>{formatMoney(expressPrice)}</StatusPill>
                      </div>

                      <div className="express-quantity-row">
                        {[1, 2, 3].map((count) => (
                          <button
                            key={count}
                            className={`day-pill${expressBottles === count ? " active" : ""}`}
                            onClick={() => setExpressBottles(count)}
                            type="button"
                          >
                            {count} бут.
                          </button>
                        ))}
                      </div>

                      {expressState === "idle" ? (
                        <>
                          <p className="demo-muted">
                            Клиент оформляет экспресс отдельно от подписки. Таймер
                            начнется только после подтверждения заказа курьером.
                          </p>
                          <button
                            className="demo-main-cta compact-button"
                            onClick={handleExpressRequest}
                            type="button"
                          >
                            Дозаказать 24/7
                          </button>
                        </>
                      ) : null}

                      {expressState === "requested" ? (
                        <div className="express-live">
                          <div className="express-timer neutral">
                            <span>Экспресс оформлен</span>
                            <strong>Ждем курьера</strong>
                          </div>
                          <p className="demo-muted">
                            Таймер еще не идет. Он стартует только после кнопки
                            подтверждения у курьера.
                          </p>
                          <div className="action-row">
                            <button
                              className="demo-main-cta compact-button"
                              onClick={handleCourierConfirm}
                              type="button"
                            >
                              Курьер подтвердил заказ
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {expressState === "confirmed" ? (
                        <div className="express-live">
                          <div className="express-timer">
                            <span>До приезда курьера</span>
                            <strong>{formatTimer(countdown)}</strong>
                          </div>
                          <p className="demo-muted">
                            Отмена без штрафа доступна еще {formatTimer(cancelWindow)}.
                            После 5 минут применяется штраф {formatMoney(expressCancelPenalty)}.
                          </p>
                          <div className="action-row">
                            <button
                              className="demo-secondary-cta compact-button"
                              onClick={handleExpressCancel}
                              type="button"
                            >
                              Отменить экспресс
                            </button>
                            <button
                              className="demo-main-cta compact-button"
                              onClick={handleCourierFinish}
                              type="button"
                            >
                              Завершить доставку (курьер)
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {expressState === "delivered" ? (
                        <div className="express-live">
                          <div className="express-timer success">
                            <span>Статус доставки</span>
                            <strong>Вода доставлена</strong>
                          </div>
                          <p className="demo-muted">
                            Таймер остановлен. Клиент получил сообщение: «Вода
                            доставлена! Спасибо, что вы с Аква60».
                          </p>
                        </div>
                      ) : null}

                      {expressState === "cancelled" ? (
                        <div className="express-live">
                          <div className="express-timer warning">
                            <span>Экспресс отменен</span>
                            <strong>
                              {penaltyApplied
                                ? `Штраф ${formatMoney(expressCancelPenalty)}`
                                : "Без штрафа"}
                            </strong>
                          </div>
                          <p className="demo-muted">
                            Если отказ произошел в течение 5 минут после
                            подтверждения курьером, списывается штраф 2 рубля.
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="demo-card">
                      <div className="demo-card-head">
                        <div>
                          <p className="demo-kicker">История оплаченных счетов</p>
                          <h3 className="demo-card-title">Списания и услуги</h3>
                        </div>
                        <StatusPill>История</StatusPill>
                      </div>
                      <div className="history-list">
                        {historyItems.map((item) => (
                          <div key={item.id} className="history-row">
                            <div>
                              <strong>{item.title}</strong>
                              <span>{item.status}</span>
                            </div>
                            <strong>{item.amount}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {scheduleChangeOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Изменение графика стоит 1 BYN</h3>
            <p>
              Списать с карты 1 BYN и открыть редактирование дней и времени
              доставки?
            </p>
            <div className="modal-actions">
              <button
                className="demo-secondary-cta compact-button"
                onClick={() => setScheduleChangeOpen(false)}
                type="button"
              >
                Отмена
              </button>
              <button
                className="demo-main-cta compact-button"
                onClick={handleScheduleChangeConfirm}
                type="button"
              >
                Списать 1 BYN и продолжить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
