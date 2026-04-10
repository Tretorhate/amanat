export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: 'deputy' | 'admin' | 'citizen';
  is_staff?: boolean;
  is_active?: boolean;
  user_type?: string;
  deputy_profile_id?: string;
  constituency_id?: string;
  constituency_name?: string;
  telegram_user_id?: string | number | null;
  telegram_chat_id?: string | number | null;
}

export interface Deputy extends User {
  district: string;
  phone: string;
  telegram_chat_id: number | null;
  is_active: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginDto {
  username: string;
  password: string;
}
