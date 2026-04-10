'use client';

import { Header } from '@/components/layout/Header';
import { RouteGuard } from '@/components/common/RouteGuard';
import { useTelegramWebApp } from '@/lib/hooks/useTelegramWebApp';

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isTelegram } = useTelegramWebApp();

  if (!isTelegram) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Доступ только через Telegram
          </h1>
          <p className="text-gray-600 mb-6">
            Кабинет гражданина доступен только через Telegram бот.
            Откройте бот в Telegram для доступа к вашим обращениям.
          </p>
          <a
            href="https://t.me/amanat_deputat_bot"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Открыть в Telegram
          </a>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['citizen']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">{children}</main>
      </div>
    </RouteGuard>
  );
}
