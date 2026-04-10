'use client';

import { Appeal } from '@/types/appeal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AppealCardProps {
  appeal: Appeal;
  onClick?: () => void;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  resolved: 'Решено',
  closed: 'Закрыто',
  rejected: 'Отклонено',
};

const categoryLabels = {
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

export function AppealCard({ appeal, onClick }: AppealCardProps) {
  return (
    <Card
      className="p-6 hover:bg-gray-50 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            {appeal.title || appeal.description.substring(0, 60) + '...'}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {appeal.description.substring(0, 150)}
            {appeal.description.length > 150 && '...'}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Категория: {categoryLabels[appeal.category]}</span>
            <span>•</span>
            <span>
              {format(new Date(appeal.created_at), 'dd MMMM yyyy', { locale: ru })}
            </span>
            {appeal.citizen?.user?.full_name && (
              <>
                <span>•</span>
                <span>От: {appeal.citizen?.user?.full_name}</span>
              </>
            )}
          </div>
        </div>
        <div className="ml-4">
          <Badge className={statusColors[appeal.status]}>
            {statusLabels[appeal.status]}
          </Badge>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition">
          <MessageSquare className="w-4 h-4" />
          {appeal.message_count || 0} сообщений
        </button>
        {appeal.priority && appeal.priority !== 'normal' && (
          <Badge variant="outline" className="text-xs">
            Приоритет: {appeal.priority}
          </Badge>
        )}
      </div>
    </Card>
  );
}
