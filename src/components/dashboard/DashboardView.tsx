import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Dumbbell,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { dashboardService } from '../../services/dashboardService';
import {
  getCurrentMonthString,
  shiftMonthString,
  formatMonthHeading,
} from '../../utils/date';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import { CategoryTimePieChart } from './CategoryTimePieChart';

export const DashboardView: React.FC = () => {
  const currentMonth = getCurrentMonthString();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (month: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats({ month });
      setStats(data);
    } catch (err) {
      setError('No se pudieron cargar las estadísticas del mes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(selectedMonth);
  }, [selectedMonth, fetchStats]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => shiftMonthString(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => shiftMonthString(prev, 1));
  };

  const handleResetToCurrent = () => {
    setSelectedMonth(currentMonth);
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto px-4 pt-2">
      {/* Month Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-lg">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all touch-press"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-100 text-sm sm:text-base">
            {formatMonthHeading(selectedMonth)}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={handleResetToCurrent}
              className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium hover:bg-amber-500/20 transition-all"
            >
              Hoy
            </button>
          )}
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all touch-press"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw size={24} className="animate-spin text-amber-400" />
          <span className="text-xs font-medium">Calculando estadísticas...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchStats(selectedMonth)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-medium"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Stats Content */}
      {!isLoading && stats && (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Gym Attendance */}
            <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider">Gym</span>
                <Dumbbell size={14} className="text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-slate-100">
                {stats.workouts.distinctDaysCount}
                <span className="text-xs font-normal text-slate-400 ml-1">días</span>
              </p>
              <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                {stats.workouts.totalSessions} sesiones
              </p>
            </div>

            {/* Tasks Completed */}
            <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider">Tareas</span>
                <CheckCircle2 size={14} className="text-indigo-400" />
              </div>
              <p className="text-lg font-bold text-slate-100">
                {stats.tasks.completedTasks}
                <span className="text-xs font-normal text-slate-400 ml-1">/{stats.tasks.totalTasks}</span>
              </p>
              <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">
                {stats.tasks.completionRate}% éxito
              </p>
            </div>

            {/* Total Duration */}
            <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider">Enfoque</span>
                <Clock size={14} className="text-amber-400" />
              </div>
              <p className="text-lg font-bold text-slate-100">
                {stats.tasks.formattedTotalDuration || '0m'}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5 font-medium">
                tiempo total
              </p>
            </div>
          </div>

          {/* GitHub-style Attendance Heatmap */}
          <AttendanceHeatmap
            month={selectedMonth}
            sessionDates={stats.workouts.sessionDates}
            dailyActivity={stats.dailyActivity}
            totalSessions={stats.workouts.totalSessions}
            distinctDaysCount={stats.workouts.distinctDaysCount}
            averageRpe={stats.workouts.averageRpe}
            recentSessions={stats.workouts.recentSessions}
          />

          {/* Category Time Pie / Donut Chart */}
          <CategoryTimePieChart categories={stats.categories} />

          {/* Category Progress Breakdown List */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-100 text-base">Rendimiento por Categoría</h3>
              <span className="text-xs text-slate-400 font-medium">
                {stats.categories.length} categorías
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {stats.categories.map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.categoryName}</span>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span>{cat.formattedTotalDuration || '0m'}</span>
                      <span className="font-bold text-slate-200">{cat.completedTasks}/{cat.totalTasks}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.completionRate)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{cat.completionRate}% completadas</span>
                    {cat.pendingTasks > 0 && (
                      <span className="text-amber-400 font-medium">{cat.pendingTasks} pendientes</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
