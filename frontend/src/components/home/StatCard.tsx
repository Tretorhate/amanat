import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  color?: "blue" | "green" | "purple" | "orange";
  isNumeric?: boolean;
}

const colorClasses = {
  blue: "from-blue-400 to-blue-600",
  green: "from-green-400 to-green-600",
  purple: "from-purple-400 to-purple-600",
  orange: "from-orange-400 to-orange-600",
};

// const iconColorClasses = {
//   blue: 'text-blue-600',
//   green: 'text-green-600',
//   purple: 'text-purple-600',
//   orange: 'text-orange-600',
// };

export function StatCard({
  icon,
  label,
  value,
  suffix,
  color = "blue",
  isNumeric = true,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-gray-200 transition">
      <div
        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white mb-4`}
      >
        {icon}
      </div>
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-bold text-gray-900">
          {typeof value === "number" && isNumeric
            ? value.toLocaleString("ru-RU")
            : value}
        </p>
        {suffix && (
          <span className="text-gray-600 font-semibold">{suffix}</span>
        )}
      </div>
    </div>
  );
}
