import { apiClient } from './api';
import { DashboardStats } from '../types';

export interface DashboardParams {
  month?: string;
  from?: string;
  to?: string;
}

export const dashboardService = {
  getStats(params?: DashboardParams): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats', params as Record<string, string | number | undefined>);
  },
};
