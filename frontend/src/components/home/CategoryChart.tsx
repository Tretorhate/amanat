'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface Category {
  name: string;
  value: number;
}

interface CategoryChartProps {
  categories: Category[];
}

const getCategoryColor = (index: number): string => {
  const colors = [
    'bg-gradient-to-r from-blue-400 to-blue-600',
    'bg-gradient-to-r from-green-400 to-green-600',
    'bg-gradient-to-r from-red-400 to-red-600',
    'bg-gradient-to-r from-yellow-400 to-yellow-600',
    'bg-gradient-to-r from-purple-400 to-purple-600',
    'bg-gradient-to-r from-pink-400 to-pink-600',
    'bg-gradient-to-r from-indigo-400 to-indigo-600',
    'bg-gradient-to-r from-cyan-400 to-cyan-600',
  ];
  return colors[index % colors.length];
};

export function CategoryChart({ categories }: CategoryChartProps) {
  const t = useTranslations();
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">{t('home.charts.categoryDistribution')}</h3>
        <p className="text-gray-600">{t('home.charts.noDataToDisplay')}</p>
      </div>
    );
  }

  // Sort categories: put "Other" (translated) last
  const otherLabel = t('home.charts.other');
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.name === otherLabel) return 1;
    if (b.name === otherLabel) return -1;
    return b.value - a.value;
  });

  const total = sortedCategories.reduce((sum, cat) => sum + cat.value, 0);
  const maxValue = Math.max(...sortedCategories.map(cat => cat.value), 1);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{t('home.charts.categoryDistribution')}</h3>
      <div className="space-y-5">
        {sortedCategories.slice(0, 6).map((category, index) => {
          const percentage = (category.value / maxValue) * 100;
          const proportion = (category.value / total * 100).toFixed(1);

          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 truncate">{category.name}</span>
                <span className="text-sm font-bold text-gray-900 ml-2">{category.value} ({proportion}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getCategoryColor(index)} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
