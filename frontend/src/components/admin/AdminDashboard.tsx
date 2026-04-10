'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { StatsCard } from '@/components/analytics/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, TrendingUp, CheckCircle, Clock, BarChart3, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  stats: {
    totalAppeals: number;
    pendingAppeals: number;
    resolvedAppeals: number;
    totalUsers: number;
    totalCitizens: number;
    totalDeputies: number;
    averageResponseTime?: number;
    satisfactionAverage?: number;
  };
}

export function AdminDashboard({ stats }: AdminDashboardProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.admin');

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-8 h-8" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-purple-100 text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('stats.totalAppealsLabel')}
          value={stats.totalAppeals}
          icon={BarChart3}
          color="blue"
        />
        <StatsCard
          title={t('stats.pendingAppeals')}
          value={stats.pendingAppeals}
          icon={AlertCircle}
          color="yellow"
        />
        <StatsCard
          title={t('stats.resolvedAppeals')}
          value={stats.resolvedAppeals}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title={t('stats.totalUsers')}
          value={stats.totalUsers}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCitizens}</p>
              <p className="text-sm text-gray-600">{t('stats.citizens')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDeputies}</p>
              <p className="text-sm text-gray-600">{t('stats.deputies')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageResponseTime?.toFixed(1) || 'N/A'}ч
              </p>
              <p className="text-sm text-gray-600">{t('stats.averageResponseTime')}</p>
            </div>
          </div>
        </Card>

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => router.push('/admin/appeals')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{t('quickActions.allAppeals.title')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('quickActions.allAppeals.description')}
          </p>
          <Button variant="outline" className="w-full">
            {t('quickActions.allAppeals.button')}
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => router.push('/admin/users')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{t('quickActions.users.title')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('quickActions.users.description')}
          </p>
          <Button variant="outline" className="w-full">
            {t('quickActions.users.button')}
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition cursor-pointer" onClick={() => router.push('/admin/analytics')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">{t('quickActions.analytics.title')}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {t('quickActions.analytics.description')}
          </p>
          <Button variant="outline" className="w-full">
            {t('quickActions.analytics.button')}
          </Button>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('systemStatus.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">{t('systemStatus.apiServer')}</p>
              <p className="text-sm text-green-600">{t('systemStatus.operational')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">{t('systemStatus.database')}</p>
              <p className="text-sm text-green-600">{t('systemStatus.connected')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-gray-900">{t('systemStatus.webSocket')}</p>
              <p className="text-sm text-green-600">{t('systemStatus.active')}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
