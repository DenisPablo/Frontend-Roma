import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Category, TaskItem, CreateTaskPayload, UpdateTaskPayload } from '../../types';
import { getCurrentTimeString } from '../../utils/date';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentDate: string;
  taskToEdit?: TaskItem | null;
  onSubmitCreate: (payload: CreateTaskPayload) => Promise<void>;
  onSubmitUpdate: (id: number, payload: UpdateTaskPayload) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentDate,
  taskToEdit,
  onSubmitCreate,
  onSubmitUpdate,
}) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(currentDate);
  const [scheduledTime, setScheduledTime] = useState(getCurrentTimeString());
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [isCompletedOnCreate, setIsCompletedOnCreate] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDay(taskToEdit.day);
      setScheduledTime(taskToEdit.scheduledTime);
      setCategoryId(taskToEdit.categoryId);
      setDurationMinutes(
        taskToEdit.durationSeconds != null ? String(Math.round(taskToEdit.durationSeconds / 60)) : ''
      );
      setIsCompletedOnCreate(false);
    } else {
      setTitle('');
      setDay(currentDate);
      setScheduledTime(getCurrentTimeString());
      setDurationMinutes('');
      setIsCompletedOnCreate(false);
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
    setError(null);
  }, [taskToEdit, currentDate, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }
    if (!scheduledTime) {
      setError('La hora estimada es obligatoria.');
      return;
    }

    const parsedMinutes = durationMinutes.trim() ? Number(durationMinutes) : null;
    if (parsedMinutes !== null && (isNaN(parsedMinutes) || parsedMinutes < 0)) {
      setError('La duración debe ser un número mayor o igual a 0.');
      return;
    }
    const durationSeconds = parsedMinutes !== null ? Math.round(parsedMinutes * 60) : null;

    setIsLoading(true);
    setError(null);

    try {
      if (taskToEdit) {
        await onSubmitUpdate(taskToEdit.id, {
          title: title.trim(),
          day,
          scheduledTime,
          categoryId,
          durationSeconds,
        });
      } else {
        await onSubmitCreate({
          title: title.trim(),
          day,
          scheduledTime,
          categoryId,
          kind: 'task',
          durationSeconds,
          isCompleted: isCompletedOnCreate,
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const isScheduleLocked = Boolean(taskToEdit && taskToEdit.status !== 'pending');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        {isScheduleLocked && (
          <div className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl leading-relaxed">
            La fecha y horario están bloqueados porque la tarea ya fue finalizada. Podés actualizar el nombre y la categoría.
          </div>
        )}

        <Input
          label="Título de la tarea"
          placeholder="Ej: Revisar emails, Estudiar patrones..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Fecha"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={isScheduleLocked}
            required
          />

          <Input
            label="Hora programada"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            disabled={isScheduleLocked}
            required
          />
        </div>

        {categoryOptions.length > 0 ? (
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            options={categoryOptions}
          />
        ) : (
          <div className="text-xs text-amber-400">
            No hay categorías registradas. La tarea usará la categoría por defecto.
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <Input
            label={taskToEdit?.status === 'completed' ? 'Duración realizada (minutos)' : 'Duración estimada / prevista (minutos, opcional)'}
            type="number"
            min="0"
            step="1"
            placeholder={taskToEdit?.status === 'completed' ? 'Ej: 45' : 'Ej: 30'}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
          {taskToEdit?.status === 'completed' && (
            <p className="text-[11px] text-slate-400">
              Podés ajustar los minutos reales que te llevó completar esta tarea para corregir tus métricas de tiempo.
            </p>
          )}
        </div>

        {!taskToEdit && (
          <label className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={isCompletedOnCreate}
              onChange={(e) => setIsCompletedOnCreate(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
            />
            <div className="text-xs">
              <span className="font-medium text-slate-200">Marcar como ya completada</span>
              <p className="text-[11px] text-slate-400">Registra la tarea como finalizada con la duración indicada</p>
            </div>
          </label>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {taskToEdit ? 'Guardar Cambios' : 'Crear Tarea'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
