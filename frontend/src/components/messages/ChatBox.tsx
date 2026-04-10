'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/types/appeal';
import { MessageBubble } from './MessageBubble';
import { MessageSquare } from 'lucide-react';

interface ChatBoxProps {
  messages: Message[];
  currentUserType: 'citizen' | 'deputy';
  citizenName?: string;
  deputyName?: string;
}

export function ChatBox({ messages, currentUserType, citizenName, deputyName }: ChatBoxProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <MessageSquare className="w-12 h-12 mb-4 text-gray-400" />
        <p>Сообщений пока нет</p>
        <p className="text-sm">Начните диалог, отправив первое сообщение</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
      {messages.map((message) => {
        const senderName =
          message.sender_type === 'citizen' ? citizenName : deputyName;
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isCurrentUser={message.sender_type === currentUserType}
            senderName={senderName}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
