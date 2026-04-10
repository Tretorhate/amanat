"use client";

import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface SatisfactionChartProps {
  data: Array<{ rating: number; count: number }>;
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export function SatisfactionChart({ data }: SatisfactionChartProps) {
  const chartData = data.map((item) => ({
    name: `${item.rating} звезд${item.rating === 1 ? "а" : item.rating < 5 ? "ы" : ""}`,
    value: item.count,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Оценки удовлетворенности
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${percent ? (percent * 100).toFixed(0) : "0"}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
