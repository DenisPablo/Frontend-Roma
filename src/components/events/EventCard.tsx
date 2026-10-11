import React from 'react';
import { TaskItem, Category } from '../../types';
import { Badge } from '../ui/Badge';
import { Calendar, Clock, Bell, Trash2 } from 'lucide-react';
import { formatReminderOffset, formatDateShort } from '../../utils/date';

interface EventCardProps {
  event: TaskItem;
  category?: Category;
  onDelete: (id: number) => Promise<void>;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  category,
  onDelete,
}) => {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar el evento "${event.title}"?`)) {
      await onDelete(event.id);
    }
  };

  return (
    <div className="p-4 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-950 border-amber-900/30 hover:border-amber-600/40 transition-all shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header Row: Category, Date & Time */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {category && (
              <Badge variant="gold">
                {category.name}
              </Badge>
            )}

            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300/80 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
              <Calendar size={12} />
              {formatDateShort(event.day)}
            </span>

            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock size={12} />
              {event.scheduledTime}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold tracking-tight text-white mb-2 break-words">
            {event.title}
          </h3>

          {/* Reminders List */}
          {event.reminders && event.reminders.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 mr-1">
                <Bell size={11} className="text-amber-400" />
                Avisos:
              </span>
              {event.reminders.map((r) => (
                <span
                  key={r.id}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    r.sentAt
                      ? 'bg-slate-800/50 text-slate-400 border-slate-700/50 line-through'
                      : 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50'
                  }`}
                >
                  {formatReminderOffset(r.offsetMinutes)}
                  {r.sentAt && ' ✓'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete action */}
        <button
          onClick={handleDelete}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Eliminar evento"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
