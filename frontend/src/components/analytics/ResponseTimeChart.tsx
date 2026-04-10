'use client';

import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ResponseTimeChartProps {
  data: Array<{ date: string; average_time: number }>;
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd MMM', { locale: ru }),
    'Среднее время (часы)': item.average_time,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Среднее время ответа
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Среднее время (часы)"
            stroke="#8b5cf6"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
