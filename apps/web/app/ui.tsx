"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";

type RoleKey = "customer" | "driver" | "owner";

export interface AccessIdentity {
  code: string;
  label: string;
  note: string;
}

const ACCESS_MAP: Record<RoleKey, AccessIdentity[]> = {
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
  ]
};

function storageKey(role: RoleKey) {
  return `aqua60-access-${role}`;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="page-wrap">{children}</div>
    </div>
  );
}

export function TopBar({
  title,
  subtitle,
  identity,
  onLogout
}: {
  title: string;
  subtitle: string;
  identity?: AccessIdentity;
  onLogout?: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Aqua60</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      <div className="topbar-side">
        {identity ? (
          <div className="identity-chip">
            <strong>{identity.label}</strong>
            <span>{identity.note}</span>
          </div>
        ) : null}
        {onLogout ? (
          <button className="text-button" onClick={onLogout} type="button">
            Сменить код
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function RoleTabs({
  items,
  current,
  onChange
}: {
  items: { key: string; label: string }[];
  current: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="tab-strip" role="tablist" aria-label="Разделы">
      {items.map((item) => (
        <button
          key={item.key}
          className={`tab-button${current === item.key ? " active" : ""}`}
          onClick={() => onChange(item.key)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  tone
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "attention" | "danger";
}) {
  return (
    <article className={`stat-card${tone ? ` ${tone}` : ""}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {note ? <p className="stat-note">{note}</p> : null}
    </article>
  );
}

export function SectionCard({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section-card">
      <div className="section-row">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({
  children,
  tone
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger";
}) {
  return <span className={`status-pill${tone ? ` ${tone}` : ""}`}>{children}</span>;
}

export function SimpleList({
  items
}: {
  items: { title: string; meta?: string; side?: ReactNode; tone?: "danger" | "highlight" }[];
}) {
  return (
    <div className="simple-list">
      {items.map((item) => (
        <div
          key={item.title}
          className={`simple-item${item.tone ? ` ${item.tone}` : ""}`}
        >
          <div className="section-row">
            <strong>{item.title}</strong>
            {item.side}
          </div>
          {item.meta ? <p className="item-meta">{item.meta}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="data-table">
      <div
        className="data-row head"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <div key={column}>{column}</div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="data-row"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {row.map((cell, cellIndex) => (
            <div key={`cell-${rowIndex}-${cellIndex}`}>{cell}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AccessGate({
  role,
  title,
  subtitle,
  children
}: {
  role: RoleKey;
  title: string;
  subtitle: string;
  children: (identity: AccessIdentity) => ReactNode;
}) {
  const [value, setValue] = useState("");
  const [identity, setIdentity] = useState<AccessIdentity | null>(null);
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey(role));
    if (!saved) {
      return;
    }

    void (async () => {
      try {
        setIsChecking(true);
        const response = await fetch("/api/access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role, code: saved })
        });

        if (!response.ok) {
          window.localStorage.removeItem(storageKey(role));
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          identity?: AccessIdentity;
        };

        if (payload.ok && payload.identity) {
          setIdentity(payload.identity);
        }
      } finally {
        setIsChecking(false);
      }
    })();
  }, [role]);

  const demoCodes = useMemo(
    () => ACCESS_MAP[role].map((item) => `${item.label}: ${item.code}`).join(" · "),
    [role]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      try {
        setIsChecking(true);
        const response = await fetch("/api/access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ role, code: value })
        });

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          identity?: AccessIdentity;
        };

        if (!response.ok || !payload.ok || !payload.identity) {
          setError(payload.message ?? "Код не найден. Проверь ID или код доступа.");
          return;
        }

        window.localStorage.setItem(storageKey(role), payload.identity.code);
        setIdentity(payload.identity);
        setValue("");
        setError("");
      } finally {
        setIsChecking(false);
      }
    })();
  };

  const resetAccess = () => {
    window.localStorage.removeItem(storageKey(role));
    setIdentity(null);
    setError("");
  };

  if (!identity) {
    return (
      <AppShell>
        <div className="compact-nav">
          <Link className="nav-link" href="/">
            Назад к выбору роли
          </Link>
        </div>
        <section className="login-card">
          <p className="eyebrow">Доступ по коду</p>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="access-code">
              Код / ID
            </label>
            <input
              id="access-code"
              className="field-input"
              disabled={isChecking}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Например, DR-1001"
              value={value}
            />
            <button className="primary-button" disabled={isChecking} type="submit">
              {isChecking ? "Проверяем доступ..." : "Открыть раздел"}
            </button>
          </form>

          {error ? <p className="error-note">{error}</p> : null}
          <p className="helper-note">Демо-коды: {demoCodes}</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="compact-nav">
        <Link className="nav-link" href="/">
          Все роли
        </Link>
      </div>
      <TopBar
        identity={identity}
        onLogout={resetAccess}
        subtitle={subtitle}
        title={title}
      />
      {children(identity)}
    </AppShell>
  );
}
