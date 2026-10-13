import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { PieChart as PieIcon } from 'lucide-react';
import { CategoryStats } from '../../types';
import { formatDurationSeconds } from '../../utils/date';

interface CategoryTimePieChartProps {
  categories: CategoryStats[];
}

const CATEGORY_COLORS = [
  '#f59e0b', // Amber (Roma primary)
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

export const CategoryTimePieChart: React.FC<CategoryTimePieChartProps> = ({ categories }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [metricMode, setMetricMode] = useState<'duration' | 'tasks'>('duration');

  const totalDuration = useMemo(
    () => categories.reduce((acc, c) => acc + (c.totalDurationSeconds || 0), 0),
    [categories]
  );

  const totalCompletedTasks = useMemo(
    () => categories.reduce((acc, c) => acc + (c.completedTasks || 0), 0),
    [categories]
  );

  // If there is zero recorded duration, auto-fallback to completed tasks so the chart isn't empty
  const activeMode = totalDuration === 0 && totalCompletedTasks > 0 ? 'tasks' : metricMode;

  const chartData = useMemo(() => {
    const total = activeMode === 'duration' ? totalDuration : totalCompletedTasks;

    return categories
      .map((cat, idx) => {
        const val = activeMode === 'duration' ? cat.totalDurationSeconds || 0 : cat.completedTasks || 0;
        const percentage = total > 0 ? Math.round((val / total) * 1000) / 10 : 0;
        return {
          ...cat,
          value: val,
          percentage,
          color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categories, activeMode, totalDuration, totalCompletedTasks]);

  // SVG Donut calculation
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~427.25

  let accumulatedOffset = 0;
  const segments = chartData.map((item) => {
    const dashLength = (item.percentage / 100) * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += dashLength;

    return {
      ...item,
      dashLength,
      offset,
    };
  });

  const selectedItem = selectedCategoryId
    ? chartData.find((item) => item.categoryId === selectedCategoryId)
    : null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
      {/* Header with Metric Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PieIcon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Distribución por Categorías</h3>
            <p className="text-xs text-slate-400">
              {activeMode === 'duration' ? 'Tiempo invertido por categoría' : 'Tareas completadas'}
            </p>
          </div>
        </div>

        {totalDuration > 0 && totalCompletedTasks > 0 && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMetricMode('duration')}
              className={clsx(
                'px-2.5 py-1 rounded-lg transition-all font-medium',
                activeMode === 'duration'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Tiempo
            </button>
            <button
              onClick={() => setMetricMode('tasks')}
              className={clsx(
                'px-2.5 py-1 rounded-lg transition-all font-medium',
                activeMode === 'tasks'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Tareas
            </button>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          <p>No hay actividad registrada en este período.</p>
        </div>
      ) : (
        <>
          {/* Donut Chart Visual */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke="rgba(30, 41, 59, 0.6)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />

                {/* Segments */}
                {segments.map((seg) => {
                  const isHovered = selectedCategoryId === seg.categoryId;
                  return (
                    <circle
                      key={seg.categoryId}
                      cx="90"
                      cy="90"
                      r={radius}
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={`${seg.dashLength} ${circumference}`}
                      strokeDashoffset={-seg.offset}
                      fill="none"
                      className="transition-all duration-300 cursor-pointer"
                      onClick={() =>
                        setSelectedCategoryId(
                          selectedCategoryId === seg.categoryId ? null : seg.categoryId
                        )
                      }
                    />
                  );
                })}
              </svg>

              {/* Center Info Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {selectedItem ? (
                  <>
                    <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                      {selectedItem.categoryName}
                    </span>
                    <span className="text-xl font-bold text-slate-100 mt-0.5">
                      {selectedItem.percentage}%
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {activeMode === 'duration'
                        ? formatDurationSeconds(selectedItem.value)
                        : `${selectedItem.value} tareas`}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      {activeMode === 'duration' ? 'Tiempo Total' : 'Completadas'}
                    </span>
                    <span className="text-xl font-bold text-slate-100 mt-0.5">
                      {activeMode === 'duration'
                        ? formatDurationSeconds(totalDuration)
                        : totalCompletedTasks}
                    </span>
                    <span className="text-[10px] text-slate-400">en el período</span>
                  </>
                )}
              </div>
            </div>

            {/* Top Categories List */}
            <div className="flex-1 w-full space-y-2">
              <p className="text-xs font-semibold text-slate-400">
                {activeMode === 'duration' ? 'Mayor tiempo invertido:' : 'Más tareas listas:'}
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {chartData.map((item) => {
                  const isSelected = selectedCategoryId === item.categoryId;
                  return (
                    <button
                      key={item.categoryId}
                      onClick={() =>
                        setSelectedCategoryId(isSelected ? null : item.categoryId)
                      }
                      className={clsx(
                        'w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs',
                        isSelected
                          ? 'bg-slate-800/80 ring-1 ring-amber-400/80 shadow-md'
                          : 'bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800/50'
                      )}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-200 truncate">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <span className="text-slate-400">
                          {activeMode === 'duration'
                            ? formatDurationSeconds(item.value)
                            : `${item.value} t`}
                        </span>
                        <span className="font-bold text-slate-100 w-11 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
