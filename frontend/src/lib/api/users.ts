import api from "./axios";
import { User, LoginDto, AuthResponse } from "@/types/user";

export interface PasswordChangeDto {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  login: (data: LoginDto) => api.post<AuthResponse>("/auth/login/", data),

  getProfile: () => api.get<User>("/auth/profile/"),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>("/auth/profile/", data),

  changePassword: (data: PasswordChangeDto) =>
    api.post<void>("/auth/change-password/", data),

  refreshToken: (refresh: string) =>
    api.post<{ access: string }>("/auth/token/refresh/", { refresh }),
};
