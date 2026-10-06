import "./globals.css";
import "./wide-screen.css";
import { ReactNode } from "react";
import { YandexMetrika } from "./ya-metric";
import { Metadata } from "next";
import { SHSITES_URL } from "./constants";
import { Preloader } from "./components/preloader";

export const metadata: Metadata = {
  // пустая строка в .env ломала сборку: new URL("") бросает ошибку
  metadataBase: SHSITES_URL ? new URL(SHSITES_URL) : undefined,
  title: "Southuuub",
  description: "South HUB – пространство, где участники получают доступ к коллективному разуму C-level в IT и становятся его частью. Мы создаём безопасную среду для свободного высказывания и обмена опытом. Участники сообщества — IT-лидеры, которые делают бизнес в России и мыслят масштабно. Попадите в круг равных, где доверие и открытость вдохновляют создавать новое вместе.",
  openGraph: {
    type: "website",
    title: "В сообществе C-level в IT South HUB рождаются партнёрства, дружба и смыслы, которых не найти онлайн.",
    description: "South HUB – пространство, где участники получают доступ к коллективному разуму C-level в IT и становятся его частью. Мы создаём безопасную среду для свободного высказывания и обмена опытом. Участники сообщества — IT-лидеры, которые делают бизнес в России и мыслят масштабно. Попадите в круг равных, где доверие и открытость вдохновляют создавать новое вместе.",
    siteName: "Southuuub",
    images: [{ url: "/site.png" }]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`antialiased`}>
        <YandexMetrika />
        <Preloader />
        {children}
      </body>
    </html>
  );
}
