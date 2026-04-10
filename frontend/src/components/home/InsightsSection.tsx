'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';

interface DailyAppeal {
  date: string;
  count: number;
}

interface Category {
  name: string;
  value: number;
}

interface InsightsSectionProps {
  dailyAppeals: DailyAppeal[];
  categories: Category[];
}

export function InsightsSection({ dailyAppeals, categories }: InsightsSectionProps) {
  const t = useTranslations();
  // Calculate insights
  const totalAppeals = dailyAppeals.reduce((sum, day) => sum + day.count, 0);
  const avgAppealsPerDay = totalAppeals > 0 ? Math.round(totalAppeals / (dailyAppeals.length || 1)) : 0;

  // Find peak day
  const peakDay = dailyAppeals.length > 0
    ? dailyAppeals.reduce((max, day) => day.count > max.count ? day : max)
    : null;

  // Top category
  const topCategory = categories.length > 0
    ? categories.reduce((max, cat) => cat.value > max.value ? cat : max)
    : null;

  // Calculate trend
  const firstHalf = dailyAppeals.slice(0, Math.floor(dailyAppeals.length / 2));
  const secondHalf = dailyAppeals.slice(Math.floor(dailyAppeals.length / 2));
  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length : 0;
  const trend = secondHalfAvg > firstHalfAvg;

  const insights = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: t('home.insights.platformActivity'),
      description: t('home.insights.averageAppealsPerDay', { count: avgAppealsPerDay }),
      color: 'from-blue-400 to-blue-600',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('home.insights.peakActivity'),
      description: peakDay
        ? t('home.insights.peakActivityDescription', {
            count: peakDay.count,
            date: new Date(peakDay.date).toLocaleDateString('ru-RU'),
          })
        : t('home.insights.noData'),
      color: 'from-yellow-400 to-yellow-600',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: t('home.insights.topCategory'),
      description: topCategory
        ? t('home.insights.topCategoryDescription', {
            category: topCategory.name,
            count: topCategory.value,
          })
        : t('home.insights.noData'),
      color: 'from-green-400 to-green-600',
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: t('home.insights.activityTrend'),
      description: trend
        ? t('home.insights.trendGrowing')
        : t('home.insights.trendStable'),
      color: trend ? 'from-orange-400 to-orange-600' : 'from-purple-400 to-purple-600',
    },
  ];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
          {t('home.insights.title')}
        </h2>
        <p className="text-gray-600 text-center mb-12 text-lg">
          {t('home.insights.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-gray-200 transition"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center text-white mb-4`}>
                {insight.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                {insight.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
