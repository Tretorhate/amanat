# Amanat Platform - Frontend Structure (React)

## Frontend Overview

**Path:** `/frontend`
**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS

---

## Project Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.png
│   └── manifest.json
├── src/
│   ├── api/                    # API client and endpoints
│   │   ├── axios.ts
│   │   ├── appeals.ts
│   │   ├── auth.ts
│   │   ├── deputies.ts
│   │   ├── analytics.ts
│   │   └── websocket.ts
│   ├── assets/                 # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── components/             # Reusable components
│   │   ├── common/            # Common UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Pagination.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── appeals/           # Appeal-related components
│   │   │   ├── AppealCard.tsx
│   │   │   ├── AppealList.tsx
│   │   │   ├── AppealDetail.tsx
│   │   │   ├── AppealForm.tsx
│   │   │   ├── AppealFilters.tsx
│   │   │   ├── AppealStatus.tsx
│   │   │   └── CategoryBadge.tsx
│   │   ├── messages/          # Messaging components
│   │   │   ├── ChatBox.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageCounter.tsx
│   │   ├── analytics/         # Analytics components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── ResponseTimeChart.tsx
│   │   │   ├── SatisfactionChart.tsx
│   │   │   └── TrendChart.tsx
│   │   └── deputies/          # Deputy components
│   │       ├── DeputyCard.tsx
│   │       ├── DeputyList.tsx
│   │       ├── DeputyPerformance.tsx
│   │       └── DeputyProfile.tsx
│   ├── pages/                  # Page components
│   │   ├── public/            # Public pages
│   │   │   ├── Home.tsx
│   │   │   ├── PublicDashboard.tsx
│   │   │   └── About.tsx
│   │   ├── auth/              # Authentication pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── deputy/            # Deputy dashboard pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Appeals.tsx
│   │   │   ├── AppealDetail.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Performance.tsx
│   │   └── admin/             # Admin pages
│   │       ├── Dashboard.tsx
│   │       ├── Deputies.tsx
│   │       ├── DeputyDetail.tsx
│   │       ├── AllAppeals.tsx
│   │       ├── Analytics.tsx
│   │       └── Settings.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAppeals.ts
│   │   ├── useWebSocket.ts
│   │   ├── useNotifications.ts
│   │   ├── useDebounce.ts
│   │   └── usePagination.ts
│   ├── store/                  # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── appealStore.ts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # TypeScript types
│   │   ├── appeal.ts
│   │   ├── user.ts
│   │   ├── deputy.ts
│   │   ├── message.ts
│   │   └── analytics.ts
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── dateUtils.ts
│   ├── routes/                 # Route configuration
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PublicRoute.tsx
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── tailwind.css
│   ├── App.tsx                 # Main App component
│   ├── main.tsx               # Entry point
│   └── vite-env.d.ts
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Detailed File Descriptions

### 1. API Layer (`/src/api`)

**axios.ts** - Axios instance configuration
```typescript
import axios from 'axios';
import { authStore } from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = authStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**appeals.ts** - Appeal API endpoints
```typescript
import api from './axios';
import { Appeal, CreateAppealDto, UpdateStatusDto } from '@/types/appeal';

export const appealsApi = {
  getAll: (params?: {
    status?: string;
    category?: string;
    page?: number;
  }) => api.get<{ results: Appeal[]; count: number }>('/appeals/', { params }),

  getById: (id: string) => api.get<Appeal>(`/appeals/${id}/`),

  create: (data: CreateAppealDto) => api.post<Appeal>('/appeals/', data),

  updateStatus: (id: string, data: UpdateStatusDto) => 
    api.patch<Appeal>(`/appeals/${id}/update_status/`, data),

  addMessage: (id: string, content: string) =>
    api.post(`/appeals/${id}/add_message/`, { content }),

  getMyAppeals: () => api.get<Appeal[]>('/appeals/my_appeals/'),

  rate: (id: string, rating: number) =>
    api.patch(`/appeals/${id}/`, { satisfaction_rating: rating }),
};
```

**websocket.ts** - WebSocket connection
```typescript
import { io, Socket } from 'socket.io-client';
import { authStore } from '@/store/authStore';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    const token = authStore.getState().token;
    
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'ws://localhost:8000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('new_message', (data) => {
      // Handle new message notification
      console.log('New message:', data);
    });

    this.socket.on('appeal_status_updated', (data) => {
      // Handle status update
      console.log('Status updated:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToAppeal(appealId: string) {
    this.socket?.emit('subscribe_appeal', { appeal_id: appealId });
  }

  unsubscribeFromAppeal(appealId: string) {
    this.socket?.emit('unsubscribe_appeal', { appeal_id: appealId });
  }
}

export const wsService = new WebSocketService();
```

---

### 2. Types (`/src/types`)

**appeal.ts**
```typescript
export enum AppealStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum AppealCategory {
  INFRASTRUCTURE = 'infrastructure',
  SAFETY = 'safety',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  ENVIRONMENT = 'environment',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  UTILITIES = 'utilities',
  SOCIAL_SERVICES = 'social_services',
  OTHER = 'other',
}

export interface Appeal {
  id: string;
  title: string;
  description: string;
  category: AppealCategory;
  status: AppealStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message_count: number;
  citizen: {
    id: string;
    full_name: string;
    phone: string;
  };
  deputy: {
    id: string;
    full_name: string;
    district: string;
  };
  created_at: string;
  responded_at: string | null;
  closed_at: string | null;
  satisfaction_rating: number | null;
  messages?: Message[];
}

export interface Message {
  id: string;
  appeal_id: string;
  sender_type: 'citizen' | 'deputy';
  sender_id: string;
  content: string;
  created_at: string;
}

export interface CreateAppealDto {
  description: string;
  title?: string;
}

export interface UpdateStatusDto {
  status: AppealStatus;
}
```

**user.ts**
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'deputy' | 'admin' | 'citizen';
}

export interface Deputy extends User {
  district: string;
  phone: string;
  telegram_chat_id: number | null;
  is_active: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface LoginDto {
  username: string;
  password: string;
}
```

---

### 3. Store (Zustand) (`/src/store`)

**authStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token, user) => 
        set({ token, user, isAuthenticated: true }),
      
      logout: () => 
        set({ token: null, user: null, isAuthenticated: false }),
      
      updateUser: (user) => 
        set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

**appealStore.ts**
```typescript
import { create } from 'zustand';
import { Appeal } from '@/types/appeal';

interface AppealState {
  appeals: Appeal[];
  selectedAppeal: Appeal | null;
  filters: {
    status?: string;
    category?: string;
    search?: string;
  };
  setAppeals: (appeals: Appeal[]) => void;
  setSelectedAppeal: (appeal: Appeal | null) => void;
  updateAppeal: (id: string, updates: Partial<Appeal>) => void;
  setFilters: (filters: Partial<AppealState['filters']>) => void;
  clearFilters: () => void;
}

export const appealStore = create<AppealState>((set) => ({
  appeals: [],
  selectedAppeal: null,
  filters: {},
  
  setAppeals: (appeals) => set({ appeals }),
  
  setSelectedAppeal: (appeal) => set({ selectedAppeal: appeal }),
  
  updateAppeal: (id, updates) =>
    set((state) => ({
      appeals: state.appeals.map((appeal) =>
        appeal.id === id ? { ...appeal, ...updates } : appeal
      ),
    })),
  
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  
  clearFilters: () => set({ filters: {} }),
}));
```

---

### 4. Custom Hooks (`/src/hooks`)

**useAppeals.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appealsApi } from '@/api/appeals';
import { CreateAppealDto, UpdateStatusDto } from '@/types/appeal';
import { toast } from 'sonner';

export const useAppeals = (filters?: any) => {
  return useQuery({
    queryKey: ['appeals', filters],
    queryFn: () => appealsApi.getAll(filters),
  });
};

export const useAppeal = (id: string) => {
  return useQuery({
    queryKey: ['appeal', id],
    queryFn: () => appealsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAppeal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAppealDto) => appealsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      toast.success('Обращение создано успешно');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка при создании обращения');
    },
  });
};

export const useUpdateAppealStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusDto }) =>
      appealsApi.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['appeals'] });
      toast.success('Статус обновлен');
    },
  });
};

export const useAddMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      appealsApi.addMessage(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appeal', variables.id] });
      toast.success('Сообщение отправлено');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ошибка отправки сообщения');
    },
  });
};
```

**useWebSocket.ts**
```typescript
import { useEffect } from 'react';
import { wsService } from '@/api/websocket';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  const subscribeToAppeal = (appealId: string) => {
    wsService.subscribeToAppeal(appealId);
    
    // Invalidate queries on real-time updates
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['appeal', appealId] });
    };

    return () => {
      wsService.unsubscribeFromAppeal(appealId);
    };
  };

  return { subscribeToAppeal };
};
```

---

### 5. Components

**components/appeals/AppealCard.tsx**
```typescript
import React from 'react';
import { Appeal, AppealStatus } from '@/types/appeal';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MessageCircle, Clock } from 'lucide-react';

interface AppealCardProps {
  appeal: Appeal;
  onClick?: () => void;
}

const statusColors = {
  [AppealStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [AppealStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [AppealStatus.RESOLVED]: 'bg-green-100 text-green-800',
  [AppealStatus.CLOSED]: 'bg-gray-100 text-gray-800',
  [AppealStatus.REJECTED]: 'bg-red-100 text-red-800',
};

const statusLabels = {
  [AppealStatus.PENDING]: 'Ожидает',
  [AppealStatus.IN_PROGRESS]: 'В работе',
  [AppealStatus.RESOLVED]: 'Решено',
  [AppealStatus.CLOSED]: 'Закрыто',
  [AppealStatus.REJECTED]: 'Отклонено',
};

export const AppealCard: React.FC<AppealCardProps> = ({ appeal, onClick }) => {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
          {appeal.title || appeal.description.substring(0, 50)}
        </h3>
        <Badge className={statusColors[appeal.status]}>
          {statusLabels[appeal.status]}
        </Badge>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {appeal.description}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {appeal.message_count}/10
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(new Date(appeal.created_at), {
              locale: ru,
              addSuffix: true,
            })}
          </span>
        </div>
        <Badge variant="outline">{appeal.category}</Badge>
      </div>
    </Card>
  );
};
```

**components/messages/ChatBox.tsx**
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Appeal, Message } from '@/types/appeal';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { useAddMessage } from '@/hooks/useAppeals';
import { useWebSocket } from '@/hooks/useWebSocket';
import { authStore } from '@/store/authStore';

interface ChatBoxProps {
  appeal: Appeal;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ appeal }) => {
  const user = authStore((state) => state.user);
  const { mutate: sendMessage, isPending } = useAddMessage();
  const { subscribeToAppeal } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAppeal(appeal.id);
    return unsubscribe;
  }, [appeal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [appeal.messages]);

  const handleSend = (content: string) => {
    sendMessage({ id: appeal.id, content });
  };

  const canSendMore = appeal.message_count < 10;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">
          {appeal.title || 'Обращение #' + appeal.id.substring(0, 8)}
        </h3>
        <p className="text-sm text-gray-500">
          Сообщений: {appeal.message_count}/10
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {appeal.messages?.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === user?.id}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={!canSendMore || isPending}
        placeholder={
          canSendMore
            ? 'Введите сообщение...'
            : 'Достигнут лимит сообщений'
        }
      />
    </div>
  );
};
```

---

### 6. Pages

**pages/deputy/Dashboard.tsx**
```typescript
import React from 'react';
import { useAppeals } from '@/hooks/useAppeals';
import { AppealCard } from '@/components/appeals/AppealCard';
import { StatsCard } from '@/components/analytics/StatsCard';
import { AppealStatus } from '@/types/appeal';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const DeputyDashboard = () => {
  const navigate = useNavigate();
  const { data: appealsData, isLoading } = useAppeals();

  const appeals = appealsData?.data.results || [];
  
  const stats = {
    total: appeals.length,
    pending: appeals.filter((a) => a.status === AppealStatus.PENDING).length,
    inProgress: appeals.filter((a) => a.status === AppealStatus.IN_PROGRESS).length,
    resolved: appeals.filter((a) => a.status === AppealStatus.RESOLVED).length,
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Личный кабинет депутата</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Всего обращений"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Ожидают"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="В работе"
          value={stats.inProgress}
          icon={AlertCircle}
          color="purple"
        />
        <StatsCard
          title="Решено"
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Recent Appeals */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Недавние обращения</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appeals.slice(0, 6).map((appeal) => (
            <AppealCard
              key={appeal.id}
              appeal={appeal}
              onClick={() => navigate(`/deputy/appeals/${appeal.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**pages/public/PublicDashboard.tsx**
```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { CategoryChart } from '@/components/analytics/CategoryChart';
import { ResponseTimeChart } from '@/components/analytics/ResponseTimeChart';
import { SatisfactionChart } from '@/components/analytics/SatisfactionChart';
import { StatsCard } from '@/components/analytics/StatsCard';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export const PublicDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: analyticsApi.getPublicStats,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">
            Платформа "Аманат"
          </h1>
          <p className="text-xl opacity-90">
            Прозрачное взаимодействие граждан и депутатов
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Всего обращений"
            value={stats?.total_appeals || 0}
            icon={BarChart3}
            color="blue"
          />
          <StatsCard
            title="Решено"
            value={stats?.resolved_appeals || 0}
            icon={TrendingUp}
            color="green"
          />
          <StatsCard
            title="Активных депутатов"
            value={stats?.active_deputies || 0}
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Ср. время ответа"
            value={`${stats?.avg_response_time || 0}ч`}
            icon={Clock}
            color="orange"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <CategoryChart data={stats?.category_breakdown} />
          <ResponseTimeChart data={stats?.response_time_trend} />
        </div>

        <div className="mb-12">
          <SatisfactionChart data={stats?.satisfaction_data} />
        </div>
      </div>
    </div>
  );
};
```

---

### 7. Configuration Files

**package.json**
```json
{
  "name": "amanat-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.17.0",
    "axios": "^1.6.5",
    "zustand": "^4.4.7",
    "socket.io-client": "^4.6.1",
    "lucide-react": "^0.303.0",
    "date-fns": "^3.0.6",
    "recharts": "^2.10.3",
    "sonner": "^1.3.1",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "