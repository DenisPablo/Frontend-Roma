import React, { useState, useEffect } from 'react';
import { TaskItem, Category } from '../../types';
import { Badge } from '../ui/Badge';
import { Play, Check, Clock, Trash2, Edit2, AlertCircle } from 'lucide-react';
import {
  calculateElapsedSeconds,
  formatStopwatchTime,
} from '../../utils/date';

interface TaskCardProps {
  task: TaskItem;
  category?: Category;
  onStart: (id: number) => Promise<void>;
  onComplete: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onStart,
  onComplete,
  onDelete,
  onEdit,
}) => {
  const [elapsed, setElapsed] = useState<number>(() =>
    task.startedAt ? calculateElapsedSeconds(task.startedAt) : 0
  );
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Live stopwatch when in_progress
  useEffect(() => {
    if (task.status !== 'in_progress' || !task.startedAt) return;

    // Immediately calculate
    setElapsed(calculateElapsedSeconds(task.startedAt));

    const interval = setInterval(() => {
      setElapsed(calculateElapsedSeconds(task.startedAt!));
    }, 1000);

    return () => clearInterval(interval);
  }, [task.status, task.startedAt]);

  const handleStart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionLoading(true);
    try {
      await onStart(task.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActionLoading(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) {
      setIsActionLoading(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isNotDone = task.status === 'not_done';

  return (
    <div
      className={`relative p-4 rounded-2xl border transition-all ${
        isInProgress
          ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/40'
          : isCompleted
          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
          : isNotDone
          ? 'bg-rose-950/20 border-rose-900/40'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header Row: Category & Scheduled Time */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {category && (
              <Badge variant="info">
                {category.name}
              </Badge>
            )}

            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock size={12} />
              {task.scheduledTime}
            </span>

            {/* Status Badges */}
            {task.status === 'pending' && task.formattedDuration && (
              <Badge variant="default" className="text-slate-300 border-slate-700 bg-slate-800/80">
                <Clock size={12} className="text-amber-400" />
                <span>{task.formattedDuration}</span>
              </Badge>
            )}

            {isInProgress && (
              <Badge variant="warning" className="animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                En curso: {formatStopwatchTime(elapsed)}
              </Badge>
            )}

            {isCompleted && (
              <Badge variant="success">
                <Check size={12} />
                Completada ({task.formattedDuration || '0m'})
              </Badge>
            )}

            {isNotDone && (
              <Badge variant="danger">
                <AlertCircle size={12} />
                No realizada
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3
            className={`text-sm font-semibold tracking-tight text-white break-words ${
              isCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h3>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.status === 'pending' && (
            <button
              onClick={handleStart}
              disabled={isActionLoading}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-medium text-xs shadow-md shadow-indigo-600/30 touch-press disabled:opacity-50"
              aria-label="Iniciar tarea"
            >
              <Play size={13} fill="currentColor" />
              <span>Iniciar</span>
            </button>
          )}

          {isInProgress && (
            <button
              onClick={handleComplete}
              disabled={isActionLoading}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-medium text-xs shadow-md shadow-emerald-600/30 touch-press disabled:opacity-50"
              aria-label="Completar tarea"
            >
              <Check size={14} strokeWidth={3} />
              <span>Completar</span>
            </button>
          )}

          {/* Edit Button (allowed for pending, completed, not_done) */}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Editar tarea"
            >
              <Edit2 size={14} />
            </button>
          )}

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isActionLoading}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Eliminar tarea"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
