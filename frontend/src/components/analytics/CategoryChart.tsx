'use client';

import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CategoryChartProps {
  data: Array<{ category: string; count: number }>;
}

const categoryLabels: Record<string, string> = {
  infrastructure: 'Инфраструктура',
  safety: 'Безопасность',
  healthcare: 'Здравоохранение',
  education: 'Образование',
  environment: 'Экология',
  transport: 'Транспорт',
  housing: 'Жильё',
  utilities: 'ЖКХ',
  social_services: 'Соцуслуги',
  other: 'Другое',
};

export function CategoryChart({ data }: CategoryChartProps) {
  const chartData = data.map((item) => ({
    name: categoryLabels[item.category] || item.category,
    Количество: item.count,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Распределение по категориям
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Количество" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
