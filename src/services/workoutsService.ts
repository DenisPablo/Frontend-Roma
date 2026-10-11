import { apiClient } from './api';
import { WorkoutSession, CreateWorkoutSessionPayload } from '../types';

export const workoutsService = {
  async getSessions(from?: string, to?: string): Promise<WorkoutSession[]> {
    return apiClient.get<WorkoutSession[]>('/workouts', { from, to });
  },

  async getById(id: number): Promise<WorkoutSession> {
    return apiClient.get<WorkoutSession>(`/workouts/${id}`);
  },

  async create(payload: CreateWorkoutSessionPayload): Promise<WorkoutSession> {
    return apiClient.post<WorkoutSession>('/workouts', payload);
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/workouts/${id}`);
  },
};
