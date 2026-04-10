"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe } from "lucide-react";
import { type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  const currentLocale = locale;

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Globe className="w-4 h-4 text-gray-500 ml-1" />
      <button
        onClick={() => changeLocale("ru")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentLocale === "ru"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        RU
      </button>
      <button
        onClick={() => changeLocale("kz")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          currentLocale === "kz"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        KZ
      </button>
    </div>
  );
}
