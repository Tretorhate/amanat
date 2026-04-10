import { User } from './user';
import { PaginatedResponse } from './common';

export interface Deputy extends User {
  district: string;
  phone: string;
  telegram_chat_id: number | null;
  is_active: boolean;
  position?: string;
}

export interface Constituency {
  id: string;
  name: string;
  region: string;
  district: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
}

export interface CreateConstituencyData {
  name: string;
  region: string;
  district: string;
  description?: string;
}

export interface Specialization {
  id: string;
  deputy: string;
  specialization: string;
  description: string;
  is_primary: boolean;
}

export interface UpdateDeputyDto {
  full_name?: string;
  phone?: string;
  district?: string;
  position?: string;
}

// Re-export for convenience
export type { PaginatedResponse };
