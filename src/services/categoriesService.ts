import { apiClient } from './api';
import { Category } from '../types';

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories');
  },

  async getById(id: number): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  async create(name: string): Promise<Category> {
    return apiClient.post<Category>('/categories', { name });
  },

  async update(id: number, name: string): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${id}`, { name });
  },

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/categories/${id}`);
  },
};
