import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Category, CreateTaskPayload } from '../../types';
import { getCurrentTimeString } from '../../utils/date';
import { Bell } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentDate: string;
  onSubmitCreate: (payload: CreateTaskPayload) => Promise<void>;
}

interface ReminderOption {
  value: string;
  label: string;
}

const DEFAULT_REMINDER_OPTIONS: ReminderOption[] = [
  { value: '-1d', label: '1 día antes' },
  { value: '-2h', label: '2 horas antes' },
  { value: '-30m', label: '30 min antes' },
  { value: '0', label: 'Al comenzar' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentDate,
  onSubmitCreate,
}) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(currentDate);
  const [scheduledTime, setScheduledTime] = useState(getCurrentTimeString());
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [selectedReminders, setSelectedReminders] = useState<string[]>(['-1d', '-2h', '0']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleReminder = (val: string) => {
    setSelectedReminders((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título del evento es obligatorio.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmitCreate({
        title: title.trim(),
        day,
        scheduledTime,
        categoryId,
        kind: 'event',
        reminders: selectedReminders,
      });
      onClose();
      // Reset
      setTitle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Título del evento / cita"
          placeholder="Ej: Turno médico, Examen final, Cumpleaños..."
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
            required
          />

          <Input
            label="Hora"
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        </div>

        {categoryOptions.length > 0 && (
          <Select
            label="Categoría"
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            options={categoryOptions}
          />
        )}

        {/* Reminders Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
            <Bell size={13} className="text-amber-400" />
            <span>Recordatorios push (Ntfy)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_REMINDER_OPTIONS.map((opt) => {
              const isSelected = selectedReminders.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggleReminder(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all touch-press flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="gold" isLoading={isLoading}>
            Crear Evento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
