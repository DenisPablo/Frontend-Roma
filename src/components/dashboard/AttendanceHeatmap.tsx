import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Dumbbell, Flame, CheckCircle2, Award } from 'lucide-react';
import { DailyActivityStats, WorkoutSessionSummary } from '../../types';

interface AttendanceHeatmapProps {
  month: string; // YYYY-MM
  sessionDates: string[];
  dailyActivity: DailyActivityStats[];
  totalSessions: number;
  distinctDaysCount: number;
  averageRpe: number;
  recentSessions?: WorkoutSessionSummary[];
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  month,
  sessionDates,
  dailyActivity,
  totalSessions,
  distinctDaysCount,
  averageRpe,
  recentSessions,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay(); // 0 is Sun, 1 is Mon
  // Shift to start Monday: Monday = 0, Sunday = 6
  const startDayOffset = (firstDayOfWeek + 6) % 7;

  const activityMap = new Map<string, DailyActivityStats>();
  dailyActivity.forEach((d) => activityMap.set(d.date, d));

  const sessionDatesSet = new Set(sessionDates);

  const weekDayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const selectedActivity = selectedDate ? activityMap.get(selectedDate) : null;
  const isSelectedWorkout = selectedDate ? sessionDatesSet.has(selectedDate) : false;

  const consistencyRate = daysInMonth > 0 ? Math.round((distinctDaysCount / daysInMonth) * 100) : 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Dumbbell size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Asistencias al Gimnasio</h3>
            <p className="text-xs text-slate-400">Plantilla de consistencia mensual</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Flame size={14} className="fill-emerald-400" />
          <span>{distinctDaysCount} días</span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/50 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Asistencia</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{consistencyRate}%</p>
          <p className="text-[10px] text-slate-500">{distinctDaysCount}/{daysInMonth} días</p>
        </div>
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/50 text-center">
          <p className="text-[11px] text-slate-400 font-medium">Sesiones</p>
          <p className="text-lg font-bold text-slate-100 mt-0.5">{totalSessions}</p>
          <p className="text-[10px] text-slate-500">en el mes</p>
        </div>
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/50 text-center">
          <p className="text-[11px] text-slate-400 font-medium">RPE Medio</p>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{averageRpe > 0 ? averageRpe : '-'}</p>
          <p className="text-[10px] text-slate-500">intensidad / 10</p>
        </div>
      </div>

      {/* GitHub-style Heatmap Grid */}
      <div className="space-y-2 pt-2">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <span key={idx} className="text-[11px] font-semibold text-slate-400">
              {lbl}
            </span>
          ))}
        </div>

        {/* Heatmap cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysArray.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="aspect-square rounded-xl opacity-0" />;
            }

            const dayString = String(dayNum).padStart(2, '0');
            const dateStr = `${month}-${dayString}`;
            const hasWorkout = sessionDatesSet.has(dateStr);
            const act = activityMap.get(dateStr);
            const workoutCount = act ? act.workoutCount : (hasWorkout ? 1 : 0);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={clsx(
                  'aspect-square rounded-xl flex flex-col items-center justify-center transition-all touch-press relative group',
                  hasWorkout
                    ? workoutCount > 1
                      ? 'bg-emerald-400 text-slate-950 font-black shadow-[0_0_14px_rgba(52,211,153,0.4)]'
                      : 'bg-emerald-500/80 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800/60',
                  isSelected && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105'
                )}
                aria-label={`Día ${dayNum}: ${hasWorkout ? `${workoutCount} sesión(es) de gym` : 'Sin gym'}`}
              >
                <span className="text-xs leading-none">{dayNum}</span>
                {hasWorkout && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* GitHub-style Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
        <div className="flex items-center space-x-1.5">
          <Award size={13} className="text-emerald-400" />
          <span>Toca un día para ver detalle</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span>Menos</span>
          <span className="w-3 h-3 rounded-md bg-slate-950 border border-slate-800/60" />
          <span className="w-3 h-3 rounded-md bg-emerald-500/80" />
          <span className="w-3 h-3 rounded-md bg-emerald-400" />
          <span>Más</span>
        </div>
      </div>

      {/* Selected Day Popover Card */}
      {selectedDate && (() => {
        const daySessions = recentSessions?.filter((s) => s.date === selectedDate) ?? [];

        return (
          <div className="p-4 bg-slate-950/95 rounded-2xl border border-slate-800 text-xs animate-in fade-in duration-150 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-200">
                Detalle del {selectedDate}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800"
              >
                Cerrar
              </button>
            </div>

            {/* Sessions details if workout was recorded on this day */}
            {daySessions.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Entrenamientos ({daySessions.length})
                </span>
                {daySessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                        <Dumbbell size={15} className="text-amber-400" />
                        {s.targetMuscleGroup}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        RPE {s.rpe}/10
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                      <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Duración</span>
                        <span className="text-xs font-semibold text-slate-200">
                          ⏱ {s.durationMinutes} min
                        </span>
                      </div>

                      <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Calidad</span>
                        <span className="text-xs font-semibold text-indigo-300">
                          ⚡ {s.feeling}/5
                        </span>
                      </div>

                      <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block">Recuperación</span>
                        <span className="text-xs font-semibold text-emerald-300">
                          🔋 {s.recoveryScore}/5
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isSelectedWorkout ? (
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <Dumbbell size={14} />
                <span>Entrenamiento realizado</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Dumbbell size={14} />
                <span>Sin sesión de gimnasio</span>
              </div>
            )}

            {/* Tasks summary */}
            {selectedActivity && (selectedActivity.tasksCompleted > 0 || selectedActivity.tasksPending > 0) && (
              <div className="flex items-center space-x-2 text-indigo-400 font-medium pt-1 border-t border-slate-800/60">
                <CheckCircle2 size={14} />
                <span>
                  {selectedActivity.tasksCompleted} tareas listas de {selectedActivity.tasksTotal}
                </span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
