/* eslint-disable react/no-unescaped-entities */
import { FileText, MessageCircle, BarChart3, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import api from '@/lib/api/axios';
import { StatCard, CategoryChart, InsightsSection } from '@/components/home';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

interface StatisticsData {
  total_appeals: number;
  resolved_appeals: number;
  pending_appeals: number;
  average_resolution_time: number;
  resolution_rate: number;
}

interface TrendsData {
  daily_counts: Array<{ date: string; count: number }>;
  status_distribution: Array<{ status: string; count: number }>;
  category_distribution: Array<{ category: string; count: number }>;
}

async function getStatistics(): Promise<StatisticsData> {
  try {
    const response = await api.get<StatisticsData>('/analytics/appeal-statistics/');
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return {
      total_appeals: 0,
      resolved_appeals: 0,
      pending_appeals: 0,
      average_resolution_time: 0,
      resolution_rate: 0,
    };
  }
}

async function getTrends(): Promise<TrendsData> {
  try {
    const response = await api.get<TrendsData>('/analytics/appeal-trends/');
    return response.data;
  } catch (error) {
    console.error('Error fetching trends:', error);
    return {
      daily_counts: [],
      status_distribution: [],
      category_distribution: [],
    };
  }
}

function getStatusLabel(status: string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const labelKey = `appeals.status.${status}`;
  return t(labelKey);
}

function getCategoryLabel(category: string, t: Awaited<ReturnType<typeof getTranslations>>): string {
  const labelKey = `appeals.category.${category}`;
  return t(labelKey);
}

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const t = await getTranslations({ locale });
  const [statistics, trends] = await Promise.all([
    getStatistics(),
    getTrends(),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Top Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-4 px-4">
        <div className="container mx-auto flex justify-end">
          <LanguageSwitcher />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-600/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-105 transition-transform">
                <span className="text-white font-bold text-5xl">А</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('home.hero.title')} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('home.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition text-lg flex items-center gap-2"
              >
                {t('home.hero.loginButton')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition text-lg"
              >
                {t('home.hero.registerButton')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition">
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('home.features.submitAppeals.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.submitAppeals.description')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-green-200 transition">
            <MessageCircle className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('home.features.directDialog.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.directDialog.description')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-200 transition">
            <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('home.features.trackStatus.title')}
            </h3>
            <p className="text-gray-600">
              {t('home.features.trackStatus.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Live Analytics Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            {t('home.analytics.title')}
          </h2>
          <p className="text-gray-600 text-center mb-12 text-lg">
            {t('home.analytics.subtitle')}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <StatCard
              icon={<BarChart3 className="w-8 h-8" />}
              label={t('home.analytics.totalAppeals')}
              value={statistics.total_appeals}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle className="w-8 h-8" />}
              label={t('home.analytics.resolved')}
              value={statistics.resolved_appeals}
              color="green"
            />
            <StatCard
              icon={<Clock className="w-8 h-8" />}
              label={t('home.analytics.averageResolutionTime')}
              value={`${statistics.average_resolution_time.toFixed(1)} ${t('home.analytics.hours')}`}
              color="purple"
              isNumeric={false}
            />
            <StatCard
              icon={<Users className="w-8 h-8" />}
              label={t('home.analytics.resolutionRate')}
              value={`${statistics.resolution_rate.toFixed(1)}%`}
              color="orange"
              isNumeric={false}
            />
          </div>

          {/* Charts and Status Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Distribution */}
            <CategoryChart categories={trends.category_distribution.map(cat => ({
              name: getCategoryLabel(cat.category || 'other', t),
              value: cat.count
            }))} />

            {/* Status Distribution */}
            <CategoryChart categories={trends.status_distribution.map(status => ({
              name: getStatusLabel(status.status, t),
              value: status.count
            }))} />
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <InsightsSection
        dailyAppeals={trends.daily_counts}
        categories={trends.category_distribution.map(cat => ({
          name: getCategoryLabel(cat.category || 'other', t),
          value: cat.count
        }))}
      />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transition text-lg"
          >
            {t('home.cta.button')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold mb-4">{t('home.footer.title')}</h3>
                <p className="text-gray-400">{t('home.footer.description')}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t('home.footer.navigation')}</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/login" className="hover:text-white transition">{t('nav.login')}</Link></li>
                  <li><Link href="/register" className="hover:text-white transition">{t('nav.register')}</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition">{t('nav.dashboard')}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t('home.footer.information')}</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition">{t('home.footer.about')}</a></li>
                  <li><a href="#" className="hover:text-white transition">{t('home.footer.support')}</a></li>
                  <li><a href="#" className="hover:text-white transition">{t('home.footer.terms')}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t('home.footer.contacts')}</h4>
                <p className="text-gray-400">support@amanat.kz</p>
                <p className="text-gray-400">+7 (XXX) XXX-XX-XX</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
              <p>{t('home.footer.copyright')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
