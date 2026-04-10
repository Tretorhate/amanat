import api from './axios';

export interface AnalyticsStats {
  total_appeals: number;
  pending_appeals: number;
  in_progress_appeals: number;
  resolved_appeals: number;
  average_response_time: number;
  satisfaction_average: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface ResponseTimeData {
  date: string;
  average_time: number;
}

export interface TrendData {
  daily_counts: Array<{ date: string; count: number }>;
  status_distribution: Array<{ status: string; count: number }>;
  category_distribution: CategoryDistribution[];
}

export const analyticsApi = {
  // Uses existing backend endpoint: /api/analytics/appeal-statistics/
  getStats: () => api.get<AnalyticsStats>('/analytics/appeal-statistics/'),

  // Uses existing backend endpoint: /api/analytics/appeal-trends/
  // Returns { daily_counts, status_distribution, category_distribution }
  getCategoryDistribution: () =>
    api.get<TrendData>('/analytics/appeal-trends/'),

  // Uses existing backend endpoint: /api/analytics/appeal-statistics/
  // Returns average_resolution_time field
  getResponseTimes: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/appeal-statistics/', { params }),
};
