'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppealStatus } from '@/types/appeal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface AppealResponseFormProps {
  currentStatus: AppealStatus;
  onSubmit: (data: {
    status?: AppealStatus;
    comment?: string;
  }) => void;
  disabled?: boolean;
  isAdmin?: boolean;
}

export function AppealResponseForm({
  currentStatus,
  onSubmit,
  disabled = false,
  isAdmin = false,
}: AppealResponseFormProps) {
  const t = useTranslations('appeals.response');
  const tStatus = useTranslations('appeals.status');

  const [status, setStatus] = useState<AppealStatus>(currentStatus);
  const [comment, setComment] = useState('');

  // Appeal is finalized — only admin can change
  const isFinalized = currentStatus === AppealStatus.RESOLVED || currentStatus === AppealStatus.REJECTED;
  const isFormDisabled = disabled || (isFinalized && !isAdmin);

  // Available status transitions for deputy
  const getAvailableStatuses = (): AppealStatus[] => {
    if (isAdmin) {
      return [AppealStatus.PENDING, AppealStatus.IN_PROGRESS, AppealStatus.RESOLVED, AppealStatus.REJECTED];
    }
    switch (currentStatus) {
      case AppealStatus.PENDING:
        return [AppealStatus.PENDING, AppealStatus.IN_PROGRESS, AppealStatus.REJECTED];
      case AppealStatus.IN_PROGRESS:
        return [AppealStatus.IN_PROGRESS, AppealStatus.RESOLVED, AppealStatus.REJECTED];
      default:
        return [currentStatus];
    }
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: {
      status?: AppealStatus;
      comment?: string;
    } = {};

    if (status !== currentStatus) {
      data.status = status;
    }

    if (comment.trim()) {
      data.comment = comment.trim();
    }

    if (Object.keys(data).length === 0) {
      return;
    }

    onSubmit(data);
    setComment('');
  };

  if (isFinalized && !isAdmin) {
    return (
      <Card className="p-6 bg-gray-50 border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Обращение {currentStatus === AppealStatus.RESOLVED ? 'решено' : 'отклонено'}. Изменение статуса доступно только администратору.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{t('changeStatus')}</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppealStatus)}
            disabled={isFormDisabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {availableStatuses.map((s) => (
              <option key={s} value={s}>{tStatus(s)}</option>
            ))}
          </select>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Комментарий
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Добавьте комментарий к изменению статуса..."
            disabled={isFormDisabled}
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
            maxLength={1000}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length} / 1000
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            isFormDisabled ||
            (status === currentStatus && !comment.trim())
          }
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          Сохранить
        </Button>
      </form>
    </Card>
  );
}
