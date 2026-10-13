import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutCard } from './gym/WorkoutCard';
import { WorkoutSession } from '../types';

describe('WorkoutCard Component', () => {
  const mockSession: WorkoutSession = {
    id: 1,
    date: '2026-10-15',
    targetMuscleGroup: 'Pecho y Tríceps',
    rpe: 8,
    feeling: 5,
    recoveryScore: 4,
    notes: 'Excelente congestión',
    durationMinutes: 75,
    createdAt: '2026-10-15T18:00:00Z',
    updatedAt: '2026-10-15T18:00:00Z',
  };

  it('renders workout muscle group, RPE, duration, quality and feelings', () => {
    render(<WorkoutCard session={mockSession} onDelete={vi.fn()} />);

    expect(screen.getByText('Pecho y Tríceps')).toBeInTheDocument();
    expect(screen.getByText('RPE 8/10')).toBeInTheDocument();
    expect(screen.getAllByText(/75 min/)).toHaveLength(2); // in badge and in metrics row
    expect(screen.getByText(/⚡ Excelente/)).toBeInTheDocument();
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
    expect(screen.getByText('"Excelente congestión"')).toBeInTheDocument();
  });

  it('triggers onEdit when edit button is clicked', () => {
    const onEditMock = vi.fn();
    render(<WorkoutCard session={mockSession} onEdit={onEditMock} onDelete={vi.fn()} />);

    const editBtn = screen.getByLabelText('Editar sesión');
    fireEvent.click(editBtn);

    expect(onEditMock).toHaveBeenCalledTimes(1);
    expect(onEditMock).toHaveBeenCalledWith(mockSession);
  });
});
