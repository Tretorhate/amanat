'use client';

import { Message } from '@/types/appeal';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isCurrentUser, senderName }: MessageBubbleProps) {
  const defaultName = message.sender_type === 'citizen' ? 'Гражданин' : 'Депутат';
  const displayName = senderName || defaultName;

  return (
    <div
      className={cn(
        'flex',
        isCurrentUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-3',
          isCurrentUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium opacity-80">
            {displayName}
          </span>
          <span className="text-xs opacity-60">
            {format(new Date(message.created_at), 'HH:mm, dd MMM', {
              locale: ru,
            })}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
    </div>
  );
}
