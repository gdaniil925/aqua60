import Link from "next/link";
import { AppShell, SectionCard, StatusPill, TopBar } from "./ui";

const roles = [
  {
    href: "/survey",
    title: "Демо клиента",
    text: "Пример живого клиентского приложения: тариф, график, следующая доставка и быстрый заказ воды."
  },
  {
    href: "/app",
    title: "Клиент",
    text: "Видит только главное: ближайшую доставку, остаток лимита, кнопку дозаказа и оплату."
  },
  {
    href: "/driver",
    title: "Курьер",
    text: "Получает короткую рабочую панель: срочные заказы, маршрут, остатки в машине и закрытие смены."
  },
  {
    href: "/owner",
    title: "Владелец",
    text: "Контролирует текущий день, оплату, проблемных клиентов, склад и нагрузку по курьерам."
  }
];

export default function HomePage() {
  return (
    <AppShell>
      <TopBar
        title="Выбор роли"
        subtitle="Клиентский раздел открывается сразу. Для курьера и владельца сохранен отдельный вход по коду, чтобы рабочие разделы не были доступны всем подряд."
      />

      <div className="grid-three">
        {roles.map((role) => (
          <Link key={role.href} className="role-card" href={role.href}>
            <div className="section-row">
              <h2 className="section-title">{role.title}</h2>
              <StatusPill>
                {role.title === "Клиент"
                  ? "Прямой вход"
                  : role.title === "Демо клиента"
                    ? "Демо"
                    : "Вход по коду"}
              </StatusPill>
            </div>
            <p className="muted-text">{role.text}</p>
          </Link>
        ))}
      </div>

      <SectionCard title="Что изменилось">
        <div className="simple-list">
          <div className="simple-item">
            <strong>Меньше декоративности</strong>
            <p className="item-meta">
              Я убрал витринную подачу и сместил интерфейс в сторону рабочего приложения с короткими карточками и вкладками.
            </p>
          </div>
          <div className="simple-item">
            <strong>Фокус по ролям</strong>
            <p className="item-meta">
              У клиента только ключевые действия, у курьера только нужное на смене, у владельца только управление бизнесом.
            </p>
          </div>
          <div className="simple-item">
            <strong>Доступ по кодам</strong>
            <p className="item-meta">
              В прототипе отдельные коды доступа оставлены только для водителей и владельца.
            </p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
