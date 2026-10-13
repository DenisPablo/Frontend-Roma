import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { WorkoutSession, CreateWorkoutSessionPayload, UpdateWorkoutSessionPayload } from '../../types';

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  workoutToEdit?: WorkoutSession | null;
  onSubmitCreate: (payload: CreateWorkoutSessionPayload) => Promise<void>;
  onSubmitUpdate?: (id: number, payload: UpdateWorkoutSessionPayload) => Promise<void>;
}

const MUSCLE_PRESETS = [
  'Pecho y Tríceps',
  'Espalda y Bíceps',
  'Piernas y Glúteos',
  'Hombros y Brazos',
  'Full Body',
  'Torso',
  'Cardio & Core',
];

export const WorkoutModal: React.FC<WorkoutModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  workoutToEdit,
  onSubmitCreate,
  onSubmitUpdate,
}) => {
  const [date, setDate] = useState(currentDate);
  const [targetMuscleGroup, setTargetMuscleGroup] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [rpe, setRpe] = useState<number>(7);
  const [feeling, setFeeling] = useState<number>(4);
  const [recoveryScore, setRecoveryScore] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workoutToEdit) {
      setDate(workoutToEdit.date);
      setTargetMuscleGroup(workoutToEdit.targetMuscleGroup);
      setDurationMinutes(workoutToEdit.durationMinutes ?? 60);
      setRpe(workoutToEdit.rpe);
      setFeeling(workoutToEdit.feeling);
      setRecoveryScore(workoutToEdit.recoveryScore);
      setNotes(workoutToEdit.notes || '');
    } else {
      setDate(currentDate);
      setTargetMuscleGroup('');
      setDurationMinutes(60);
      setRpe(7);
      setFeeling(4);
      setRecoveryScore(4);
      setNotes('');
    }
    setError(null);
  }, [isOpen, workoutToEdit, currentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMuscleGroup.trim()) {
      setError('Debes especificar el grupo muscular o tipo de sesión.');
      return;
    }
    if (durationMinutes <= 0) {
      setError('La duración debe ser mayor a 0 minutos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        date,
        targetMuscleGroup: targetMuscleGroup.trim(),
        durationMinutes,
        rpe,
        feeling,
        recoveryScore,
        notes: notes.trim() ? notes.trim() : null,
      };

      if (workoutToEdit && onSubmitUpdate) {
        await onSubmitUpdate(workoutToEdit.id, payload);
      } else {
        await onSubmitCreate(payload);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la sesión de gimnasio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={workoutToEdit ? 'Editar Sesión de Gym' : 'Registrar Sesión de Gym'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Target muscle group with quick tags */}
        <div className="space-y-1.5">
          <Input
            label="Grupo muscular / Enfoque"
            placeholder="Ej: Piernas, Pecho y Tríceps..."
            value={targetMuscleGroup}
            onChange={(e) => setTargetMuscleGroup(e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {MUSCLE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setTargetMuscleGroup(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all touch-press ${
                  targetMuscleGroup === preset
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Duration input with presets */}
        <div className="space-y-1.5">
          <Input
            label="Duración (minutos)"
            type="number"
            min={1}
            max={600}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
            required
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[45, 60, 75, 90, 120].map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setDurationMinutes(mins)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all touch-press ${
                  durationMinutes === mins
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                ⏱ {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* RPE Selector (1 to 10) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Esfuerzo Percibido (RPE)
            </label>
            <span className="text-xs font-bold font-mono text-amber-400">
              {rpe}/10 {rpe >= 9 ? '🔥 Máximo' : rpe >= 7 ? '💪 Pesado' : '👍 Moderado'}
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setRpe(val)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all touch-press ${
                  rpe === val
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Feeling (1 to 5) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Sensación subjetiva
            </label>
            <span className="text-xs font-semibold text-slate-300">
              {feeling === 5
                ? '⚡ Enorme energía'
                : feeling === 4
                ? '😊 Buena sesión'
                : feeling === 3
                ? '😐 Normal'
                : feeling === 2
                ? '😓 Muy cansado'
                : '😫 Agotado'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { val: 1, label: '😫 1' },
              { val: 2, label: '😓 2' },
              { val: 3, label: '😐 3' },
              { val: 4, label: '😊 4' },
              { val: 5, label: '⚡ 5' },
            ].map((f) => (
              <button
                type="button"
                key={f.val}
                onClick={() => setFeeling(f.val)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all touch-press ${
                  feeling === f.val
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recovery Score (1 to 5) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Puntaje de Recuperación previo
            </label>
            <span className="text-xs font-semibold text-slate-300">{recoveryScore} / 5</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((rec) => (
              <button
                type="button"
                key={rec}
                onClick={() => setRecoveryScore(rec)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all touch-press ${
                  recoveryScore === rec
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                🔋 {rec}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Notas de la sesión (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Buena congestión, aumenté peso en banca..."
            rows={2}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" isLoading={isLoading}>
            {workoutToEdit ? 'Guardar Cambios' : 'Guardar Sesión'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
