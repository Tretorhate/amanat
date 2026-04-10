import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from "@/lib/providers";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages({ locale });

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </NextIntlClientProvider>
    </div>
  );
}
