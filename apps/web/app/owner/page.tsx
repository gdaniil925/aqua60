"use client";

import { useState } from "react";
import {
  AccessGate,
  DataTable,
  RoleTabs,
  SectionCard,
  SimpleList,
  StatCard,
  StatusPill
} from "../ui";

const tabs = [
  { key: "today", label: "Сегодня" },
  { key: "clients", label: "Клиенты" },
  { key: "finance", label: "Финансы" }
];

export default function OwnerPage() {
  const [tab, setTab] = useState("today");

  return (
    <AccessGate
      role="owner"
      subtitle="Владельцу не нужен перегруженный лендинг. Ему нужен экран, который быстро показывает риск по доставкам, деньги, клиентов с проблемами и остаток на складе."
      title="Кабинет владельца"
    >
      {() => (
        <>
          <RoleTabs current={tab} items={tabs} onChange={setTab} />

          {tab === "today" ? (
            <div className="grid-main">
              <div className="grid-two">
                <StatCard label="Выручка сегодня" value="1 486 BYN" />
                <StatCard
                  label="Активные доставки"
                  note="3 экспресса сейчас"
                  tone="attention"
                  value="24"
                />
                <StatCard
                  label="Под риском SLA"
                  note="Экспресс на Алферова 12"
                  tone="danger"
                  value="1 заказ"
                />
                <StatCard
                  label="Склад"
                  note="Порог уведомления 50"
                  value="162 бутыли"
                />

                <SectionCard title="На что смотреть первым">
                  <SimpleList
                    items={[
                      {
                        title: "Экспресс на Алферова 12",
                        meta: "До дедлайна осталось 18 минут, курьер Андрей в пути.",
                        side: <StatusPill tone="danger">Риск SLA</StatusPill>,
                        tone: "danger"
                      },
                      {
                        title: "Ошибки оплаты",
                        meta: "У 3 клиентов не прошли транзакции, им нужно позвонить или написать.",
                        side: <StatusPill tone="warning">3 сбоя</StatusPill>
                      }
                    ]}
                  />
                </SectionCard>
              </div>

              <SectionCard title="Операционный мониторинг">
                <DataTable
                  columns={["Адрес", "Тип", "Курьер", "Статус"]}
                  rows={[
                    ["Алферова 12", "Экспресс", "Андрей", "18 мин до дедлайна"],
                    ["Алферова 10", "План", "Дмитрий", "8 заказов в доме"],
                    ["Белградская 5", "План", "Марина", "3 заказа в доме"]
                  ]}
                />
              </SectionCard>
            </div>
          ) : null}

          {tab === "clients" ? (
            <div className="grid-two">
              <SectionCard title="Карточка клиента">
                <SimpleList
                  items={[
                    {
                      title: "Елена С. • +375 29 000-00-00",
                      meta: "Минск-Мир, Николы Теслы 18, кв. 42. Лимит: 14 бутылей. График: Пн/Чт, 19:00 - 21:00.",
                      side: <StatusPill tone="success">Активна</StatusPill>,
                      tone: "highlight"
                    },
                    {
                      title: "Ручное управление",
                      meta: "Нужны действия: добавить лимит, вычесть лимит, заблокировать клиента."
                    }
                  ]}
                />
                <div className="action-row" style={{ marginTop: 14 }}>
                  <button className="secondary-button" type="button">
                    + Лимит
                  </button>
                  <button className="secondary-button" type="button">
                    - Лимит
                  </button>
                  <button className="secondary-button" type="button">
                    Заблокировать
                  </button>
                </div>
              </SectionCard>
              <SectionCard title="Журнал клиента">
                <DataTable
                  columns={["Дата", "Событие", "Деталь"]}
                  rows={[
                    ["12 мая", "Доставка", "3 бутыли"],
                    ["09 мая", "Изменение графика", "Списано 1 BYN"],
                    ["07 мая", "Экспресс", "2 бутыли, 11.96 BYN"]
                  ]}
                />
              </SectionCard>
            </div>
          ) : null}

          {tab === "finance" ? (
            <div className="grid-two">
              <SectionCard title="bePaid и списания">
                <DataTable
                  columns={["Поток", "Объем", "Комментарий"]}
                  rows={[
                    ["Автосписания 1 июня", "48 клиентов", "Запланировано"],
                    ["Ошибки оплаты", "3 клиента", "Нужно связаться"],
                    ["Штрафы за месяц", "7 BYN", "Автосписано"],
                    ["Изменения графика", "19 операций", "По 1 BYN"]
                  ]}
                />
              </SectionCard>
              <SectionCard title="Склад и уведомления">
                <SimpleList
                  items={[
                    {
                      title: "Полных бутылей на складе: 162",
                      meta: "После нажатия курьером «Доставлено» остатки должны списываться автоматически."
                    },
                    {
                      title: "Уведомление при остатке ниже 50",
                      meta: "Владелец получает сообщение в Telegram до того, как склад станет критическим."
                    }
                  ]}
                />
              </SectionCard>
            </div>
          ) : null}
        </>
      )}
    </AccessGate>
  );
}
