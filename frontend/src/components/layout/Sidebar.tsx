"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/lib/hooks/useAuthStore";
import { usePathname, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, Users, BarChart3, MapPin, X } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isDeputy = user?.role === "deputy" || user?.user_type === "deputy";
  const isAdmin = user?.role === "admin" || user?.is_staff;

  const deputyLinks = [
    {
      href: "/deputy/dashboard",
      label: t("deputy.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: "/deputy/constituencies",
      label: t("deputy.constituencies"),
      icon: MapPin,
    },
  ];

  const adminLinks = [
    {
      href: "/admin/dashboard",
      label: t("admin.dashboard"),
      icon: LayoutDashboard,
    },
    { href: "/admin/appeals", label: t("admin.appeals"), icon: FileText },
    { href: "/admin/users", label: t("admin.users"), icon: Users },
    { href: "/admin/constituencies", label: t("admin.constituencies"), icon: MapPin },
    { href: "/admin/analytics", label: t("admin.analytics"), icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : isDeputy ? deputyLinks : [];

  if (links.length === 0) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200",
          // Desktop: always visible, sticky below header
          "hidden lg:block lg:w-64 lg:flex-shrink-0 lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)] lg:z-30",
          // Mobile: slide-in overlay
          isOpen && "!block fixed top-[73px] left-0 w-64 h-[calc(100vh-73px)] shadow-xl z-50"
        )}
      >
        {/* Mobile close button */}
        {isOpen && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <span className="font-semibold text-gray-900">Меню</span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <nav className="p-4 space-y-2 overflow-y-auto h-full">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
