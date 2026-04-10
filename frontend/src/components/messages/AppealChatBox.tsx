'use client';

import { useEffect, useRef } from 'react';
import { AppealMessage } from '@/types/appeal';
import { MessageSquare, User, Bot, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AppealChatBoxProps {
  messages: AppealMessage[];
  currentUserType: 'citizen' | 'deputy';
  citizenName?: string;
  deputyName?: string;
}

export function AppealChatBox({ messages, currentUserType, citizenName, deputyName }: AppealChatBoxProps) {
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
        <p className="font-medium">Сообщений пока нет</p>
        <p className="text-sm mt-1">Начните диалог, отправив первое сообщение</p>
      </div>
    );
  }

  const getSenderInfo = (message: AppealMessage) => {
    switch (message.sender_type) {
      case 'citizen':
        return {
          name: citizenName || 'Гражданин',
          icon: User,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600'
        };
      case 'deputy':
        return {
          name: deputyName || 'Депутат',
          icon: Shield,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600'
        };
      case 'system':
        return {
          name: 'Система',
          icon: Bot,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-600'
        };
      default:
        return {
          name: 'Неизвестно',
          icon: User,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600'
        };
    }
  };

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 bg-gray-50 rounded-lg">
      {messages.map((message) => {
        const senderInfo = getSenderInfo(message);
        const isCurrentUser = message.sender_type === currentUserType;
        const IconComponent = senderInfo.icon;

        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                isCurrentUser 
                  ? 'bg-blue-600 text-white' 
                  : (message.is_read === false ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-white border border-gray-200')
              }`}
            >
              {/* Sender info */}
              <div className="flex items-center gap-2 mb-2">
                {!isCurrentUser && (
                  <div className={`w-6 h-6 rounded-full ${senderInfo.bgColor} flex items-center justify-center`}>
                    <IconComponent className={`w-3 h-3 ${senderInfo.iconColor}`} />
                  </div>
                )}
                <span className={`text-xs font-medium ${
                  isCurrentUser ? 'text-blue-100' : senderInfo.textColor
                }`}>
                  {senderInfo.name}
                </span>
                <span className={`text-xs ${
                  isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {format(new Date(message.created_at), 'HH:mm, dd MMM', {
                    locale: ru,
                  })}
                </span>
                {/* Unread indicator */}
                {!isCurrentUser && message.is_read === false && (
                  <span className="ml-1 text-xs text-red-500">●</span>
                )}
              </div>
              
              {/* Message content */}
              <p className={`text-sm whitespace-pre-wrap break-words ${
                isCurrentUser ? 'text-white' : 'text-gray-900'
              }`}>
                {message.message}
              </p>
              
              {/* System message indicator */}
              {message.sender_type === 'system' && (
                <div className="mt-2 text-xs text-purple-600 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>Системное сообщение</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}