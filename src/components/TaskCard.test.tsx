import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TaskCard } from './tasks/TaskCard';
import { TaskItem, Category } from '../types';

describe('TaskCard Component', () => {
  const mockTask: TaskItem = {
    id: 1,
    title: 'Completar informe',
    day: '2026-10-15',
    scheduledTime: '10:00',
    categoryId: 1,
    kind: 'task',
    status: 'pending',
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-15T09:00:00Z',
  };

  const mockCategory: Category = {
    id: 1,
    name: 'Trabajo',
    createdAt: '2026-10-10T00:00:00Z',
  };

  it('renders task details and category badge', () => {
    render(
      <TaskCard
        task={mockTask}
        category={mockCategory}
        onStart={vi.fn()}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Completar informe')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('Iniciar')).toBeInTheDocument();
  });

  it('calls onStart when Iniciar is clicked', async () => {
    const handleStart = vi.fn().mockResolvedValue(undefined);
    render(
      <TaskCard
        task={mockTask}
        category={mockCategory}
        onStart={handleStart}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const startButton = screen.getByText('Iniciar');
    await act(async () => {
      fireEvent.click(startButton);
    });
    expect(handleStart).toHaveBeenCalledWith(1);
  });

  it('renders in_progress state with live indicator and Completar button', () => {
    const inProgressTask: TaskItem = {
      ...mockTask,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    };

    render(
      <TaskCard
        task={inProgressTask}
        category={mockCategory}
        onStart={vi.fn()}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Completar')).toBeInTheDocument();
    expect(screen.getByText(/En curso:/)).toBeInTheDocument();
  });

  it('renders edit button for completed tasks and calls onEdit', () => {
    const completedTask: TaskItem = {
      ...mockTask,
      status: 'completed',
      completedAt: new Date().toISOString(),
      durationSeconds: 120,
    };

    const handleEdit = vi.fn();
    render(
      <TaskCard
        task={completedTask}
        category={mockCategory}
        onStart={vi.fn()}
        onComplete={vi.fn()}
        onDelete={vi.fn()}
        onEdit={handleEdit}
      />
    );

    const editButton = screen.getByLabelText('Editar tarea');
    expect(editButton).toBeInTheDocument();
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalledWith(completedTask);
  });
});
