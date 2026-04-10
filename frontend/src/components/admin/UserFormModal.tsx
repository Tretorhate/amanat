"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { User } from "@/types/user";
import api from "@/lib/api/axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  initialUser?: User | null;
  isLoading?: boolean;
}

export interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "citizen" | "deputy";
  is_staff?: boolean;
  password?: string;
  constituency_id?: string;
}

type UserRole = "citizen" | "deputy" | "admin";

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialUser,
  isLoading = false,
}: UserFormModalProps) {
  const t = useTranslations("users.form");
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_type: "citizen",
    is_staff: false,
    constituency_id: "",
  });

  const [role, setRole] = useState<UserRole>("citizen");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [constituencies, setConstituencies] = useState<Array<{id: string, name: string}>>([]);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);

  const roleToFormData = (selectedRole: UserRole): UserFormData => ({
    ...formData,
    user_type: selectedRole === "admin" ? "citizen" : selectedRole,
    is_staff: selectedRole === "admin",
  });

  const loadConstituencies = useCallback(async () => {
    if (constituencies.length > 0) return;

    try {
      setLoadingConstituencies(true);
      const response = await api.get("/citizens/constituencies/");
      setConstituencies(response.data.results || response.data);
    } catch (error) {
      console.error("Error loading constituencies:", error);
    } finally {
      setLoadingConstituencies(false);
    }
  }, [constituencies.length]);

  useEffect(() => {
    if (initialUser) {
      const userRole: UserRole =
        initialUser.role === "admin" || initialUser.is_staff
          ? "admin"
          : (initialUser.user_type as "citizen" | "deputy");
      setRole(userRole);
      setFormData({
        username: initialUser.username,
        email: initialUser.email,
        first_name: initialUser.first_name || "",
        last_name: initialUser.last_name || "",
        phone: initialUser.phone || "",
        user_type: userRole === "admin" ? "citizen" : userRole,
        is_staff: userRole === "admin",
        constituency_id: initialUser.constituency_id || "",
      });
    } else {
      setRole("citizen");
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        user_type: "citizen",
        is_staff: false,
        constituency_id: "",
      });
    }
    setErrors({});

    if (isOpen) {
      loadConstituencies();
    }
  }, [initialUser, isOpen, loadConstituencies]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t("errors.usernameRequired");
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = t("errors.firstNameRequired");
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t("errors.lastNameRequired");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("errors.phoneRequired");
    }

    if (!initialUser && !formData.password?.trim()) {
      newErrors.password = t("errors.passwordRequired");
    }

    if ((role === "citizen" || role === "deputy") && !formData.constituency_id) {
      newErrors.constituency = "Округ обязателен для этой роли";
    }

    if (
      formData.password &&
      formData.password.trim() &&
      formData.password.length < 8
    ) {
      newErrors.password = t("errors.passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      setRole("citizen");
      setFormData({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        user_type: "citizen",
        is_staff: false,
        constituency_id: "",
      });
      onClose();
    } catch {
      // Error handling is done in parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialUser ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ── Profile Section ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">
              Профиль
            </h4>
            <div className="space-y-4">
              {/* First Name + Last Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name">{t("labels.firstName")}</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className={errors.first_name ? "border-red-500" : ""}
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">{t("labels.lastName")}</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className={errors.last_name ? "border-red-500" : ""}
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  {t("labels.phone")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+7XXXXXXXXXX"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <Label htmlFor="role">{t("labels.role")}</Label>
                <Select
                  value={role}
                  onValueChange={(value) => {
                    const selectedRole = value as UserRole;
                    setRole(selectedRole);
                    setFormData(roleToFormData(selectedRole));
                  }}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">{t("roles.citizen")}</SelectItem>
                    <SelectItem value="deputy">{t("roles.deputy")}</SelectItem>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Constituency - Only for citizen and deputy roles */}
              {(role === "citizen" || role === "deputy") && (
                <div>
                  <Label htmlFor="constituency">
                    Округ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.constituency_id || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, constituency_id: value })
                    }
                    disabled={loadingConstituencies}
                  >
                    <SelectTrigger id="constituency" className={errors.constituency ? "border-red-500" : ""}>
                      <SelectValue placeholder={loadingConstituencies ? "Загрузка..." : "Выберите округ"} />
                    </SelectTrigger>
                    <SelectContent>
                      {constituencies.map((constituency) => (
                        <SelectItem key={constituency.id} value={constituency.id}>
                          {constituency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.constituency && (
                    <p className="text-red-500 text-xs mt-1">{errors.constituency}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Account Section ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b pb-2">
              Аккаунт
            </h4>
            <div className="space-y-4">
              {/* Username */}
              <div>
                <Label htmlFor="username">{t("labels.username")}</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  disabled={!!initialUser}
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">{t("labels.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">
                  {initialUser
                    ? t("labels.passwordOptional")
                    : t("labels.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={initialUser ? t("placeholders.passwordNoChange") : t("placeholders.password")}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancelButton")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("savingButton")}
              </>
            ) : (
              t("saveButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
