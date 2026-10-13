import React from 'react';
import { WorkoutSession } from '../../types';
import { Dumbbell, BatteryCharging, Smile, Trash2, Calendar, Clock, Edit2 } from 'lucide-react';
import { formatDateShort } from '../../utils/date';

interface WorkoutCardProps {
  session: WorkoutSession;
  onEdit?: (session: WorkoutSession) => void;
  onDelete: (id: number) => Promise<void>;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ session, onEdit, onDelete }) => {
  const getRpeBadgeStyle = (rpe: number) => {
    if (rpe <= 4) return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    if (rpe <= 7) return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
  };

  const getFeelingEmoji = (feeling: number) => {
    switch (feeling) {
      case 5:
        return '⚡ Excelente (5)';
      case 4:
        return '💪 Muy bien (4)';
      case 3:
        return '😐 Normal (3)';
      case 2:
        return '😓 Pesado (2)';
      case 1:
        return '😫 Agotado (1)';
      default:
        return `${feeling}/5`;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar la sesión de "${session.targetMuscleGroup}"?`)) {
      await onDelete(session.id);
    }
  };

  return (
    <div className="p-4 rounded-2xl border bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Calendar size={12} />
              {formatDateShort(session.date)}
            </span>

            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-800/50">
              <Clock size={12} />
              {session.durationMinutes ?? 60} min
            </span>

            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getRpeBadgeStyle(
                session.rpe
              )}`}
            >
              RPE {session.rpe}/10
            </span>
          </div>

          <h3 className="text-base font-semibold text-white flex items-center gap-1.5">
            <Dumbbell size={16} className="text-amber-400" />
            {session.targetMuscleGroup}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Editar sesión"
              title="Editar sesión"
            >
              <Edit2 size={16} />
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Eliminar sesión"
            title="Eliminar sesión"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 flex items-center gap-2">
          <Clock size={16} className="text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block">Duración</span>
            <span className="text-xs font-medium text-slate-200 truncate block">
              {session.durationMinutes ?? 60} min
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 flex items-center gap-2">
          <Smile size={16} className="text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block">Calidad / Sensación</span>
            <span className="text-xs font-medium text-slate-200 truncate block">
              {getFeelingEmoji(session.feeling)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50 flex items-center gap-2">
          <BatteryCharging size={16} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 block">Recuperación</span>
            <span className="text-xs font-medium text-slate-200">
              {session.recoveryScore} / 5
            </span>
          </div>
        </div>
      </div>

      {session.notes && (
        <p className="mt-2 text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
          "{session.notes}"
        </p>
      )}
    </div>
  );
};
