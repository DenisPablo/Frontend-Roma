import React from 'react';
import { CheckSquare, Calendar, Dumbbell, Tags, BarChart3, Timer } from 'lucide-react';
import { TabType } from '../../types';
import { clsx } from 'clsx';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  tasksCount?: number;
  eventsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  tasksCount = 0,
  eventsCount = 0,
}) => {
  const tabs = [
    {
      id: 'tasks' as TabType,
      label: 'Tareas',
      icon: CheckSquare,
      badge: tasksCount > 0 ? tasksCount : undefined,
    },
    {
      id: 'events' as TabType,
      label: 'Eventos',
      icon: Calendar,
      badge: eventsCount > 0 ? eventsCount : undefined,
    },
    {
      id: 'pomodoro' as TabType,
      label: 'Pomodoro',
      icon: Timer,
    },
    {
      id: 'gym' as TabType,
      label: 'Gym',
      icon: Dumbbell,
    },
    {
      id: 'dashboard' as TabType,
      label: 'Métricas',
      icon: BarChart3,
    },
    {
      id: 'categories' as TabType,
      label: 'Categorías',
      icon: Tags,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 safe-bottom">
      <div className="grid grid-cols-6 max-w-lg mx-auto px-1 py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all touch-press relative',
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx(
                    'transition-transform',
                    isActive && 'scale-110'
                  )}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute -bottom-0.5 w-5 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
