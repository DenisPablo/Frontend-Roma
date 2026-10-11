import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    createdAt: '2026-10-15T18:00:00Z',
    updatedAt: '2026-10-15T18:00:00Z',
  };

  it('renders workout muscle group, RPE, and feelings', () => {
    render(<WorkoutCard session={mockSession} onDelete={vi.fn()} />);

    expect(screen.getByText('Pecho y Tríceps')).toBeInTheDocument();
    expect(screen.getByText('RPE 8/10')).toBeInTheDocument();
    expect(screen.getByText(/⚡ Excelente/)).toBeInTheDocument();
    expect(screen.getByText('4 / 5')).toBeInTheDocument();
    expect(screen.getByText('"Excelente congestión"')).toBeInTheDocument();
  });
});
