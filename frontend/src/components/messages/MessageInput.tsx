'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, AlertCircle } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  maxMessages?: number;
  currentMessageCount?: number;
}

export function MessageInput({
  onSend,
  disabled = false,
  maxMessages = 10,
  currentMessageCount = 0,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const isLimitReached = currentMessageCount >= maxMessages;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled || isLimitReached) return;

    onSend(content.trim());
    setContent('');
  };

  return (
    <div>
      {isLimitReached && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Достигнут лимит сообщений ({maxMessages}). Дальнейшая переписка невозможна.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            isLimitReached
              ? 'Лимит сообщений достигнут'
              : 'Введите ваше сообщение...'
          }
          disabled={disabled || isLimitReached}
          className="flex-1 min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
          maxLength={1000}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          disabled={!content.trim() || disabled || isLimitReached}
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>
          {content.length} / 1000 символов • Ctrl+Enter для отправки
        </span>
        <span>
          Сообщений: {currentMessageCount} / {maxMessages}
        </span>
      </div>
    </div>
  );
}
