import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PomodoroView } from './PomodoroView';
import { Category, TaskItem } from '../../types';
import { tasksService } from '../../services/tasksService';

vi.mock('../../services/tasksService', () => ({
  tasksService: {
    update: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
  },
}));

describe('PomodoroView Component', () => {
  const mockCategories: Category[] = [
    { id: 1, name: 'Estudio', createdAt: '2026-10-10T00:00:00Z' },
    { id: 2, name: 'Trabajo', createdAt: '2026-10-10T00:00:00Z' },
  ];

  const mockTasks: TaskItem[] = [
    {
      id: 10,
      title: 'Repasar TypeScript',
      day: '2026-10-15',
      scheduledTime: '10:00',
      categoryId: 1,
      kind: 'task',
      status: 'pending',
      durationSeconds: 1500,
      formattedDuration: '25m',
      createdAt: '2026-10-15T09:00:00Z',
      updatedAt: '2026-10-15T09:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders mode tabs, digital timer, and cycle info', () => {
    render(
      <PomodoroView
        categories={mockCategories}
        currentDate="2026-10-15"
        dayTasks={mockTasks}
        onSessionLogged={vi.fn()}
        showToast={vi.fn()}
      />
    );

    expect(screen.getAllByText('Foco')[0]).toBeInTheDocument();
    expect(screen.getByText('Descanso Corto')).toBeInTheDocument();
    expect(screen.getByText('Descanso Largo')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText(/1 de 4/)).toBeInTheDocument();
  });

  it('switches mode and updates timer display', () => {
    render(
      <PomodoroView
        categories={mockCategories}
        currentDate="2026-10-15"
        dayTasks={mockTasks}
        onSessionLogged={vi.fn()}
        showToast={vi.fn()}
      />
    );

    // Switch to short break
    fireEvent.click(screen.getByText('Descanso Corto'));
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();

    // Switch to long break
    fireEvent.click(screen.getByText('Descanso Largo'));
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
  });

  it('allows logging focus session to an existing task', async () => {
    const handleSessionLogged = vi.fn().mockResolvedValue(undefined);
    const handleToast = vi.fn();

    render(
      <PomodoroView
        categories={mockCategories}
        currentDate="2026-10-15"
        dayTasks={mockTasks}
        onSessionLogged={handleSessionLogged}
        showToast={handleToast}
      />
    );

    // Select category 'Estudio'
    const categorySelect = screen.getByLabelText('Categoría de enfoque');
    fireEvent.change(categorySelect, { target: { value: '1' } });

    // Select task '10'
    const taskSelect = screen.getByLabelText('Tarea o sesión específica');
    fireEvent.change(taskSelect, { target: { value: '10' } });

    // Click register button
    const registerButton = screen.getByText(/Registrar 25 min y pasar a descanso/);
    await act(async () => {
      fireEvent.click(registerButton);
    });

    expect(tasksService.update).toHaveBeenCalledWith(10, {
      durationSeconds: 1500 + 25 * 60,
    });
    expect(handleSessionLogged).toHaveBeenCalled();
  });

  it('allows logging focus session as new category session', async () => {
    const handleSessionLogged = vi.fn().mockResolvedValue(undefined);
    const handleToast = vi.fn();

    render(
      <PomodoroView
        categories={mockCategories}
        currentDate="2026-10-15"
        dayTasks={mockTasks}
        onSessionLogged={handleSessionLogged}
        showToast={handleToast}
      />
    );

    // Select category 'Trabajo'
    const categorySelect = screen.getByLabelText('Categoría de enfoque');
    fireEvent.change(categorySelect, { target: { value: '2' } });

    // Click register button
    const registerButton = screen.getByText(/Registrar 25 min y pasar a descanso/);
    await act(async () => {
      fireEvent.click(registerButton);
    });

    expect(tasksService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sesión de Trabajo',
        day: '2026-10-15',
        categoryId: 2,
        kind: 'task',
        isCompleted: true,
        durationSeconds: 25 * 60,
      })
    );
    expect(handleSessionLogged).toHaveBeenCalled();
  });
});
