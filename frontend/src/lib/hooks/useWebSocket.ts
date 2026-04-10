'use client';

import { useEffect } from 'react';
import { wsService } from '@/lib/api/websocket';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  const subscribeToAppeal = (appealId: string) => {
    wsService.subscribeToAppeal(appealId);

    // Invalidate queries on real-time updates
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.appeal_id === appealId) {
        queryClient.invalidateQueries({ queryKey: ['appeal', appealId] });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ws-message', handleUpdate);
      return () => {
        wsService.unsubscribeFromAppeal(appealId);
        window.removeEventListener('ws-message', handleUpdate);
      };
    }
  };

  return { subscribeToAppeal };
};
