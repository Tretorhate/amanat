'use client';

import { useEffect, useState } from 'react';
import { authStore } from '@/lib/store/authStore';

/**
 * Hook to ensure auth store has hydrated from localStorage before rendering
 */
export function useAuthStore() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const unsubscribe = authStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (authStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  const user = authStore((state) => state.user);
  const token = authStore((state) => state.token);
  const isAuthenticated = authStore((state) => state.isAuthenticated);
  const updateUser = authStore((state) => state.updateUser);

  return {
    user,
    token,
    isAuthenticated,
    isHydrated,
    updateUser,
  };
}
