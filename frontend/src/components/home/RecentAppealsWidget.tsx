"use client";

import React from "react";
import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Appeal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  citizen?: {
    id: string;
    full_name: string;
  };
}

interface RecentAppealsWidgetProps {
  appeals: Appeal[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  resolved: "Решено",
  rejected: "Отклонено",
  closed: "Закрыто",
};

// const priorityLabels: Record<string, string> = {
//   urgent: 'Срочно',
//   high: 'Высокий',
//   normal: 'Обычный',
//   low: 'Низкий',
// };

export function RecentAppealsWidget({ appeals }: RecentAppealsWidgetProps) {
  if (!appeals || appeals.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Недавние обращения
        </h3>
        <p className="text-gray-600">Нет обращений для отображения</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Недавние обращения
      </h3>
      <div className="space-y-4">
        {appeals.map((appeal) => (
          <Link
            key={appeal.id}
            href={`/citizen/appeals/${appeal.id}`}
            className="block p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {/* <span className="text-lg">{priorityColors[appeal.priority] || '⚪'}</span> */}
                  <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                    {appeal.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                  {appeal.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(appeal.created_at), {
                    locale: ru,
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appeal.status] || "bg-gray-100 text-gray-800"}`}
                >
                  {statusLabels[appeal.status] || appeal.status}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {appeal.category}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/dashboard"
        className="mt-6 block text-center py-3 text-blue-600 font-semibold hover:text-blue-700 transition border-t border-gray-200 pt-6"
      >
        Все обращения →
      </Link>
    </div>
  );
}
