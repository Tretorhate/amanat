"use client";

import { useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslations("auth.register");
  const tValidation = useTranslations("validation");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    user_type: "citizen" as "citizen" | "deputy",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = tValidation("required");
    } else if (formData.username.length < 3) {
      newErrors.username = tValidation("minLength", { min: "3" });
    }

    if (!formData.email.trim()) {
      newErrors.email = tValidation("required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = tValidation("email");
    }

    if (!formData.password) {
      newErrors.password = tValidation("required");
    } else if (formData.password.length < 8) {
      newErrors.password = tValidation("minLength", { min: "8" });
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = tValidation("passwordMismatch");
    }

    if (!formData.phone.trim()) {
      newErrors.phone = tValidation("required");
    } else if (!/^[\d+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = tValidation("phone");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(tValidation("validationError"));
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/register/`,
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          phone: formData.phone,
          user_type: formData.user_type,
        },
      );

      toast.success(t("successMessage"));
      router.push("/login");
    } catch (error) {
      console.error("Registration error:", error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const serverErrors = error.response.data as Record<
          string,
          string | string[]
        >;
        const newErrors: Record<string, string> = {};

        Object.keys(serverErrors).forEach((key) => {
          const errorMessage = Array.isArray(serverErrors[key])
            ? serverErrors[key][0]
            : serverErrors[key];
          newErrors[key] = errorMessage;
        });

        setErrors(newErrors);
        toast.error(tValidation("validationError"));
      } else {
        toast.error(tValidation("validationError"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const colors = [
      "",
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-green-500",
    ];

    return { strength, color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md p-8">
        {/* Back to Login */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Назад на главную
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600">Создайте новый аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="username"
              className={errors.username ? "border-red-500" : ""}
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+7 (XXX) XXX-XX-XX"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* User Type - Citizen Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип пользователя <span className="text-red-500">*</span>
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium">
              Гражданин
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                className={errors.password ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
            {/* Password Strength */}
            {formData.password && !errors.password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("confirmPassword")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t("submitting")}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" />
                {t("submitButton")}
              </>
            )}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">{t("haveAccount")} </span>
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {t("loginLink")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
