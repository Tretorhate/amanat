import api from './axios';
import { Appeal, CreateAppealDto, UpdateStatusDto } from '@/types/appeal';
import { PaginatedResponse } from '@/types/common';

export const appealsApi = {
  getAll: (params?: {
    status?: string;
    category?: string;
    page?: number;
  }) => api.get<PaginatedResponse<Appeal>>('/appeals/', { params }),

  getById: (id: string) => api.get<Appeal>(`/appeals/${id}/`),

  create: (data: CreateAppealDto) => api.post<Appeal>('/appeals/', data),

  updateStatus: (id: string, data: UpdateStatusDto) =>
    api.patch<Appeal>(`/appeals/${id}/update_status/`, data),

  addMessage: (id: string, content: string) =>
    api.post(`/appeals/${id}/add_message/`, { content }),

  rate: (id: string, rating: number) =>
    api.patch(`/appeals/${id}/`, { satisfaction_rating: rating }),

  respond: (id: string, data: { status?: string; message?: string }) =>
    api.post(`/appeals/${id}/respond/`, data),

  // Dialogue messages
  getMessages: (id: string) =>
    api.get(`/appeals/${id}/messages/`),

  sendMessage: (id: string, message: string) =>
    api.post(`/appeals/${id}/send_message/`, { message }),

  markAppealMessagesAsRead: (id: string) =>
    api.post(`/appeals/${id}/mark_messages_read/`),

  delete: (id: string) => api.delete(`/appeals/${id}/`),
};
