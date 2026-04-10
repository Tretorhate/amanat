'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appealsApi } from '@/lib/api/appeals';
import { CreateAppealDto, UpdateStatusDto } from '@/types/appeal';
import { toast } from 'sonner';

export const useAppeals = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['appeals', filters],
    queryFn: () => appealsApi.getAll(filters),
  });
};

export const useAppeal = (id: string) => {
  return useQuery({
    queryKey: ['appeal', id],
    queryFn: () => appealsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAppeal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppealDto) => appealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      toast.success('Обращение создано успешно');
    },
    onError: (error) => {
      console.error('Create appeal error:', error);
      toast.error('Ошибка при создании обращения');
    },
  });
};

export const useUpdateAppealStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusDto }) =>
      appealsApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      toast.success('Статус обновлен');
    },
  });
};

export const useAddMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      appealsApi.addMessage(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', variables.id] });
      toast.success('Сообщение отправлено');
    },
    onError: (error) => {
      console.error('Add message error:', error);
      toast.error('Ошибка отправки сообщения');
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      appealsApi.sendMessage(id, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', variables.id] });
      toast.success('Сообщение отправлено');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Ошибка отправки сообщения');
    },
  });
};

export const useAppealMessages = (id: string) => {
  return useQuery({
    queryKey: ['appeal-messages', id],
    queryFn: () => appealsApi.getMessages(id),
    enabled: !!id,
  });
};
