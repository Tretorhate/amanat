import api from './axios';
import {
  Deputy,
  Constituency,
  Specialization,
  UpdateDeputyDto,
} from '@/types/deputy';
import { PaginatedResponse } from '@/types/common';

export const deputiesApi = {
  // Deputy Profile (current logged-in deputy)
  getProfile: () => api.get<Deputy>('/deputies/'),

  updateProfile: (data: UpdateDeputyDto) => api.patch<Deputy>('/deputies/', data),

  // Constituencies (from citizens app - the canonical model)
  getConstituencies: () => api.get<PaginatedResponse<Constituency>>('/citizens/constituencies/'),

  createConstituency: (data: Omit<Constituency, 'id' | 'created_at'>) =>
    api.post<Constituency>('/citizens/constituencies/', data),

  getConstituency: (id: string) =>
    api.get<Constituency>(`/citizens/constituencies/${id}/`),

  updateConstituency: (id: string, data: Partial<Omit<Constituency, 'id' | 'created_at'>>) =>
    api.put<Constituency>(`/citizens/constituencies/${id}/`, data),

  deleteConstituency: (id: string) =>
    api.delete(`/citizens/constituencies/${id}/`),

  // Specializations
  getSpecializations: () => api.get<PaginatedResponse<Specialization>>('/deputies/specializations/'),

  createSpecialization: (data: Omit<Specialization, 'id' | 'deputy'>) =>
    api.post<Specialization>('/deputies/specializations/', data),

  getSpecialization: (id: string) =>
    api.get<Specialization>(`/deputies/specializations/${id}/`),

  updateSpecialization: (id: string, data: Partial<Omit<Specialization, 'id' | 'created_at'>>) =>
    api.put<Specialization>(`/deputies/specializations/${id}/`, data),

  deleteSpecialization: (id: string) =>
    api.delete(`/deputies/specializations/${id}/`),
};
