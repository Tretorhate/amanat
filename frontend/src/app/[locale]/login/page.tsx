"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usersApi } from "@/lib/api/users";
import { authStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await usersApi.login(formData);

      const { access, refresh, user } = response.data;

      // Save to authStore
      authStore.getState().login(access, user);

      // Legacy storage for compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success(t("welcomeMessage", { name: user.full_name || user.username }));

      // Redirect based on user type
      const { user_type, is_staff, role } = user;

      if (is_staff || role === "admin") {
        router.push("/admin/dashboard");
      } else if (user_type === "deputy" || role === "deputy") {
        router.push("/deputy/dashboard");
      } else if (user_type === "citizen" || role === "citizen") {
        // For citizens, check if they have a profile before redirecting
        // We'll let the citizen dashboard handle profile validation
        router.push("/citizen/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("errorInvalidCredentials");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-3xl">А</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("title")}
          </h2>
          <p className="text-gray-600">Платформа &quot;Аманат&quot;</p>
        </div>

        {/* Login Form */}
        <Card className="p-8 border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("username")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder={t("usernamePlaceholder")}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t("submitting")}
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {t("submitButton")}
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-700 transition"
            >
              ← {t("backToHome")}
            </a>
          </div>
        </Card>

      </div>
    </div>
  );
}
