import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatDateHeading } from '../../utils/date';
import { TabType } from '../../types';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  onShiftDate: (days: number) => void;
  onGoToToday: () => void;
  isOnline: boolean;
  activeTab: TabType;
  onOpenCreateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onShiftDate,
  onGoToToday,
  isOnline,
  activeTab,
  onOpenCreateModal,
}) => {
  const getAddButtonTitle = () => {
    switch (activeTab) {
      case 'tasks':
        return 'Nueva Tarea';
      case 'events':
        return 'Nuevo Evento';
      case 'gym':
        return 'Registrar Gym';
      case 'categories':
        return 'Nueva Categoría';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 safe-top px-4 py-3">
      {/* Top Bar: Brand, Status & Add Action */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold tracking-wider">
            🏛️
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">ROMA</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-medium">Backend conectado</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-400 font-medium">Sin conexión</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-md shadow-amber-500/20 touch-press"
          aria-label={getAddButtonTitle()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{getAddButtonTitle()}</span>
        </button>
      </div>

      {/* Date Navigation Bar (shown on tasks, events and gym tabs) */}
      {activeTab !== 'categories' && (
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-2xl p-1.5">
          <button
            onClick={() => onShiftDate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors touch-press"
            aria-label="Día anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={onGoToToday}
            className="flex-1 text-center py-1 px-2 rounded-lg hover:bg-slate-800/50 transition-colors group"
          >
            <span className="text-xs font-semibold text-white block capitalize group-hover:text-amber-400 transition-colors">
              {formatDateHeading(currentDate)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{currentDate}</span>
          </button>

          <button
            onClick={() => onShiftDate(1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors touch-press"
            aria-label="Día siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </header>
  );
};
