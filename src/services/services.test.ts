import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { categoriesService } from './categoriesService';
import { tasksService } from './tasksService';
import { workoutsService } from './workoutsService';

describe('API Services', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('categoriesService.getAll fetches categories', async () => {
    const mockCategories = [{ id: 1, name: 'Trabajo', createdAt: '2026-10-10' }];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockCategories,
    } as Response);

    const result = await categoriesService.getAll();
    expect(result).toEqual(mockCategories);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/categories'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('tasksService.create sends correct payload', async () => {
    const payload = {
      title: 'Hacer cardio',
      day: '2026-10-15',
      scheduledTime: '08:00',
      categoryId: 1,
      kind: 'task' as const,
    };
    const mockCreated = { id: 10, ...payload, status: 'pending' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockCreated,
    } as Response);

    const result = await tasksService.create(payload);
    expect(result).toEqual(mockCreated);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('tasksService.start triggers start endpoint', async () => {
    const mockStarted = { id: 10, status: 'in_progress', startedAt: '2026-10-15T08:00:00Z' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockStarted,
    } as Response);

    const result = await tasksService.start(10);
    expect(result.status).toBe('in_progress');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/10/start'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('workoutsService.create sends gym payload', async () => {
    const payload = {
      date: '2026-10-15',
      targetMuscleGroup: 'Pecho',
      rpe: 8,
      feeling: 4,
      recoveryScore: 4,
      notes: 'Buena sesión',
    };
    const mockSession = { id: 5, ...payload };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockSession,
    } as Response);

    const result = await workoutsService.create(payload);
    expect(result.targetMuscleGroup).toBe('Pecho');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/workouts'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });
});
