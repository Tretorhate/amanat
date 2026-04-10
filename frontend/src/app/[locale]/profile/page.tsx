"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usersApi } from "@/lib/api/users";
import { User } from "@/types/user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User as UserIcon,
  Mail,
  Phone,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingPage } from "@/components/common/LoadingPage";
import axios from "axios";
import React from "react";

interface ProfileFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldKey: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await usersApi.getProfile();
      setUser(response.data);
      setFormData({
        full_name: response.data.full_name || "",
        email: response.data.email || "",
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        phone: response.data.phone || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (field === "full_name" && !formData.full_name?.trim()) {
      newErrors.full_name = t("fullNameRequired");
    }

    if (field === "email") {
      if (!formData.email?.trim()) {
        newErrors.email = t("emailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t("emailInvalid");
      }
    }

    if (field === "phone") {
      if (!formData.phone?.trim()) {
        newErrors.phone = t("phoneRequired");
      } else if (!/^[\d+\-\s()]+$/.test(formData.phone)) {
        newErrors.phone = t("phoneInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password?.trim()) {
      newErrors.current_password = t("currentPasswordRequired");
    }

    if (!passwordData.new_password) {
      newErrors.new_password = t("newPasswordRequired");
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = t("newPasswordMin");
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = t("passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleSaveField = async (field: string) => {
    if (!validateField(field)) return;

    setSaving(true);
    try {
      const updateData = { [field]: formData[field as keyof typeof formData] };
      const response = await usersApi.updateProfile(updateData);
      setUser(response.data);
      setEditingField(null);
      toast.success(t("updateSuccess"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setSaving(true);
    try {
      // Backend endpoint for password change
      await usersApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setIsChangingPassword(false);
      toast.success(t("passwordChangeSuccess"));
    } catch (error) {
      console.error("Error changing password:", error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as Record<
          string,
          string | string[]
        >;
        if (errorData.current_password) {
          setErrors({
            current_password: Array.isArray(errorData.current_password)
              ? errorData.current_password[0]
              : errorData.current_password,
          });
        } else {
          toast.error(t("passwordChangeError"));
        }
      } else {
        toast.error(t("passwordChangeError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (field: string) => {
    setEditingField(null);
    if (user) {
      setFormData({
        ...formData,
        [field]: user[field as keyof User] || "",
      });
    }
    setErrors({});
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">{t("profileNotFound")}</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("pageTitle")}</h1>
              <p className="text-gray-600 mt-1">{t("pageDescription")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Fields */}
            <div className="space-y-4">
              <ProfileField
                icon={UserIcon}
                label={t("fullName")}
                value={user.full_name || ""}
                fieldKey="full_name"
              />
              <ProfileField
                icon={Mail}
                label={t("email")}
                value={user.email || ""}
                fieldKey="email"
              />
              <ProfileField
                icon={Phone}
                label={t("phone")}
                value={user.phone || ""}
                fieldKey="phone"
              />
            </div>

            {/* Account Information Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                {t("additionalInfo")}
              </h2>

              <form className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("firstName")}
                  </label>
                  <Input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    disabled
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("lastName")}
                  </label>
                  <Input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    disabled
                  />
                </div>
              </form>
            </Card>

            {/* Change Password Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                {t("changePasswordTitle")}
              </h2>

              {!isChangingPassword ? (
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                >
                  {t("changePassword")}
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("currentPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            current_password: e.target.value,
                          })
                        }
                        className={
                          errors.current_password ? "border-red-500" : ""
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.current_password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.current_password}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("newPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        className={errors.new_password ? "border-red-500" : ""}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.new_password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("confirmPassword")}
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirm_password: e.target.value,
                          })
                        }
                        className={
                          errors.confirm_password ? "border-red-500" : ""
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.confirm_password}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving} className="flex-1">
                      {saving ? t("saving") : t("changePassword")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          current_password: "",
                          new_password: "",
                          confirm_password: "",
                        });
                        setErrors({});
                      }}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>

          {/* Sidebar - User Info */}
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t("information")}
              </h2>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-gray-600">{t("username")}</span>
                  <br />
                  <span className="font-medium text-gray-900">
                    {user.username}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">{t("role")}</span>
                  <br />
                  <span className="font-medium text-gray-900">
                    {user.role === "admin" || user.is_staff
                      ? t("administrator")
                      : user.role === "deputy" || user.user_type === "deputy"
                        ? t("deputy")
                        : t("citizen")}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">{t("status")}</span>
                  <br />
                  <span className="font-medium text-gray-900">
                    {user.is_active ? t("active") : t("inactive")}
                  </span>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  function ProfileField({
    icon: Icon,
    label,
    value,
    fieldKey,
  }: ProfileFieldProps) {
    const isEditing = editingField === fieldKey;

    return (
      <Card className="p-6 hover:shadow-md transition">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <label className="text-sm font-medium text-gray-700">{label}</label>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingField(fieldKey)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="w-4 h-4 text-gray-600 hover:text-blue-600" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Input
              type={
                fieldKey === "phone"
                  ? "tel"
                  : fieldKey === "email"
                    ? "email"
                    : "text"
              }
              value={formData[fieldKey as keyof typeof formData]}
              onChange={(e) => handleChange(fieldKey, e.target.value)}
              placeholder={`${t("enterPlaceholder").replace("{label}", label.toLowerCase())}`}
              className={errors[fieldKey] ? "border-red-500" : ""}
            />
            {errors[fieldKey] && (
              <p className="text-red-500 text-sm">{errors[fieldKey]}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveField(fieldKey)}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t("saved")}
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCancel(fieldKey)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 text-base">{value || t("notSpecified")}</p>
        )}
      </Card>
    );
  }
}
