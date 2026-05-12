"use client";

import { useState } from "react";
import {
  AppShell,
  DataTable,
  RoleTabs,
  SectionCard,
  SimpleList,
  StatCard,
  StatusPill,
  TopBar
} from "../ui";

const tabs = [
  { key: "main", label: "Главное" },
  { key: "schedule", label: "График" },
  { key: "payments", label: "Оплата" }
];

export default function CustomerPage() {
  const [tab, setTab] = useState("main");

  return (
    <AppShell>
      <TopBar
        subtitle="Клиент должен за 5 секунд понять три вещи: когда следующая доставка, сколько бутылей осталось и что делать, если вода нужна сейчас."
        title="Личный кабинет клиента"
      />

      <RoleTabs current={tab} items={tabs} onChange={setTab} />

      {tab === "main" ? (
        <div className="grid-main">
          <div className="grid-two">
            <StatCard
              label="Ближайшая доставка"
              note="Четверг, 19:00 - 21:00"
              value="15 мая"
            />
            <StatCard
              label="Осталось по подписке"
              note="Из 20 бутылей в этом месяце"
              value="14 бутылей"
            />
            <SectionCard title="Что важно сейчас">
              <SimpleList
                items={[
                  {
                    title: "Подтвердить завтрашнюю доставку",
                    meta: "Нужно подтвердить 3 бутыли до 18:00, иначе заказ уйдет на перенос.",
                    side: <StatusPill tone="warning">Ждет ответа</StatusPill>
                  },
                  {
                    title: "Дозаказать воду прямо сейчас",
                    meta: "Экспресс-заказ оплачивается отдельно и не расходует подписочный лимит.",
                    side: <StatusPill>24/7</StatusPill>
                  }
                ]}
              />
              <div className="action-row" style={{ marginTop: 14 }}>
                <button className="primary-button" type="button">
                  Подтвердить доставку
                </button>
                <button className="secondary-button" type="button">
                  Дозаказать сейчас
                </button>
              </div>
            </SectionCard>
            <SectionCard title="Лимит на месяц">
              <p className="muted-text">Использовано 6 из 20 бутылей.</p>
              <div className="progress-track">
                <span style={{ width: "30%" }} />
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Экспресс-заказ">
            <SimpleList
              items={[
                {
                  title: "2 бутыли • 11.96 BYN",
                  meta: "Полная цена показывается до подтверждения: вода + сервисный выезд.",
                  side: <StatusPill tone="success">Доступно сейчас</StatusPill>,
                  tone: "highlight"
                },
                {
                  title: "Если курьер уже принял заказ",
                  meta: "У клиента запускается таймер 60 минут и появляется живой статус доставки."
                },
                {
                  title: "Поздний отказ",
                  meta: "После подтверждения экспресса отказ в течение 5 минут приводит к штрафу 2 BYN.",
                  side: <StatusPill tone="danger">Штраф</StatusPill>,
                  tone: "danger"
                }
              ]}
            />
          </SectionCard>
        </div>
      ) : null}

      {tab === "schedule" ? (
        <div className="grid-two">
          <SectionCard title="Мой график">
            <DataTable
              columns={["День", "Объем", "Время", "Статус"]}
              rows={[
                ["Понедельник", "2 бутыли", "19:00 - 21:00", "Подтверждено"],
                ["Четверг", "3 бутыли", "19:00 - 21:00", "Ожидает ответа"]
              ]}
            />
          </SectionCard>
          <SectionCard title="Изменить график">
            <SimpleList
              items={[
                {
                  title: "Стоимость изменения",
                  meta: "Перед редактированием приложение должно спросить: списать 1 BYN и продолжить?",
                  side: <StatusPill>1 BYN</StatusPill>
                },
                {
                  title: "Адрес доставки",
                  meta: "Минск-Мир, ул. Николы Теслы 18, подъезд 1, этаж 9, кв. 42."
                }
              ]}
            />
            <div className="action-row" style={{ marginTop: 14 }}>
              <button className="secondary-button" type="button">
                Изменить дни
              </button>
              <button className="secondary-button" type="button">
                Изменить время
              </button>
            </div>
          </SectionCard>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="grid-two">
          <SectionCard title="Способ оплаты">
            <SimpleList
              items={[
                {
                  title: "Карта •• 4582",
                  meta: "Рекуррентные списания активны. Следующая дата списания: 1 июня, 09:00.",
                  side: <StatusPill tone="success">Активна</StatusPill>
                }
              ]}
            />
          </SectionCard>
          <SectionCard title="История">
            <DataTable
              columns={["Дата", "Операция", "Сумма"]}
              rows={[
                ["12 мая", "Подписка на месяц", "95.60 BYN"],
                ["09 мая", "Изменение графика", "1.00 BYN"],
                ["07 мая", "Экспресс-заказ", "11.96 BYN"]
              ]}
            />
          </SectionCard>
        </div>
      ) : null}
    </AppShell>
  );
}
