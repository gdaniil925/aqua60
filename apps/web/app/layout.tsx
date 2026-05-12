import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Aqua60",
  description: "Telegram platform for water delivery"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
