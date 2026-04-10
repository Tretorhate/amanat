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
