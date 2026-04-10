'use client';

import { useEffect, useState, useRef } from 'react';
import { authStore } from '@/lib/store/authStore';
import { useTelegramWebApp } from './useTelegramWebApp';
import api from '@/lib/api/axios';

interface TelegramAuthState {
  isAuthenticating: boolean;
  error: string | null;
  isTelegram: boolean;
}

export function useTelegramAuth(): TelegramAuthState {
  const { isTelegram, initData, telegramUser } = useTelegramWebApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isTelegram || !initData || attemptedRef.current) return;

    // Check if existing session belongs to the same Telegram user
    const currentUser = authStore.getState().user;
    const currentTelegramId = telegramUser?.id?.toString();

    if (currentUser && currentTelegramId) {
      // If the stored user's telegram_user_id matches, keep the session
      const storedTgId = currentUser.telegram_user_id?.toString();
      if (storedTgId === currentTelegramId) {
        attemptedRef.current = true;
        return; // Session is valid for this Telegram user
      }
      // Different user or no telegram_user_id — clear stale session
      authStore.getState().logout();
    }

    attemptedRef.current = true;
    setIsAuthenticating(true);

    api.post('/accounts/telegram-auth/', { init_data: initData })
      .then((res) => {
        const { access, user } = res.data;
        authStore.getState().login(access, user);
        setIsAuthenticating(false);
      })
      .catch((err) => {
        const message = err.response?.data?.error || 'Telegram authentication failed';
        setError(message);
        setIsAuthenticating(false);
        // Clear any stale auth on failure
        authStore.getState().logout();
      });
  }, [isTelegram, initData, telegramUser]);

  return { isAuthenticating, error, isTelegram };
}
