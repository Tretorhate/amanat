'use client';

import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebAppState {
  isTelegram: boolean;
  initData: string | null;
  telegramUser: TelegramUser | null;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}

export function useTelegramWebApp(): TelegramWebAppState {
  const [state, setState] = useState<TelegramWebAppState>({
    isTelegram: false,
    initData: null,
    telegramUser: null,
  });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp && webApp.initData) {
      webApp.ready();
      webApp.expand();
      setState({
        isTelegram: true,
        initData: webApp.initData,
        telegramUser: webApp.initDataUnsafe?.user || null,
      });
    }
  }, []);

  return state;
}
