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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDay(taskToEdit.day);
      setScheduledTime(taskToEdit.scheduledTime);
      setCategoryId(taskToEdit.categoryId);
    } else {
      setTitle('');
      setDay(currentDate);
      setScheduledTime(getCurrentTimeString());
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

    setIsLoading(true);
    setError(null);

    try {
      if (taskToEdit) {
        await onSubmitUpdate(taskToEdit.id, {
          title: title.trim(),
          day,
          scheduledTime,
          categoryId,
        });
      } else {
        await onSubmitCreate({
          title: title.trim(),
          day,
          scheduledTime,
          categoryId,
          kind: 'task',
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
