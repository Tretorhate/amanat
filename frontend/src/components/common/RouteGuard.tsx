'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/lib/hooks/useAuthStore';
import { useTelegramAuth } from '@/lib/hooks/useTelegramAuth';
import { LoadingPage } from './LoadingPage';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'deputy' | 'citizen')[];
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { isAuthenticating, isTelegram, error: telegramError } = useTelegramAuth();

  useEffect(() => {
    if (isHydrated && !user && !isAuthenticating && !isTelegram) {
      router.push('/login');
    }
  }, [isHydrated, user, isAuthenticating, isTelegram, router]);

  if (!isHydrated) {
    return <LoadingPage />;
  }

  if (isAuthenticating) {
    return <LoadingPage />;
  }

  if (!user) {
    if (isTelegram && telegramError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Доступ ограничен
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              {telegramError}
            </p>
            <p className="text-gray-500 text-xs">
              Используйте /start в боте для регистрации
            </p>
          </div>
        </div>
      );
    }
    if (isTelegram) {
      return <LoadingPage />;
    }
    return <LoadingPage />;
  }

  const userRole = getUserRole(user);

  if (!allowedRoles.includes(userRole)) {
    const redirectPath = getRoleBasedRedirect(userRole);
    router.push(redirectPath);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            У вас нет доступа к этой странице
          </p>
          <p className="text-sm text-gray-500">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function getUserRole(user: { role?: string; user_type?: string; is_staff?: boolean }): 'admin' | 'deputy' | 'citizen' {
  if (user.role === 'admin' || user.is_staff) {
    return 'admin';
  }
  if (user.role === 'deputy' || user.user_type === 'deputy') {
    return 'deputy';
  }
  return 'citizen';
}

function getRoleBasedRedirect(role: 'admin' | 'deputy' | 'citizen'): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'deputy':
      return '/deputy/dashboard';
    case 'citizen':
      return '/citizen/dashboard';
    default:
      return '/';
  }
}
