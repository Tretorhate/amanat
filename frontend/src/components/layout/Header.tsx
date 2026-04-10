"use client";

import { authStore } from "@/lib/store/authStore";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { useTranslations } from "next-intl";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { LogOut, User, UserCircle, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const logout = authStore((state) => state.logout);
  const t = useTranslations("common");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    toast.success(t("logoutSuccess"));
    router.push("/");
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  const getRoleLabel = () => {
    if (!user) return "";
    if (user.role === "deputy" || user.user_type === "deputy") return t("roles.deputy");
    if (user.role === "admin" || user.is_staff) return t("roles.administrator");
    if (user.role === "citizen" || user.user_type === "citizen")
      return t("roles.citizen");
    return t("roles.user");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button for deputy/admin */}
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}

            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg sm:text-xl">А</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                {t("personalCabinet")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{getRoleLabel()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher />
            <NotificationBell />
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 hover:text-gray-900 transition p-2 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-100"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">{user.full_name || user.username}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[200px]">
                    {/* Show name on mobile */}
                    <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.full_name || user.username}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel()}</p>
                    </div>
                    <button
                      onClick={() => handleNavigate("/profile")}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition"
                    >
                      <UserCircle className="w-4 h-4 text-purple-600" />
                      <span>{t("myProfile")}</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
