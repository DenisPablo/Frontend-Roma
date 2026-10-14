import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings as SettingsIcon,
  Flame,
  Coffee,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { Category, TaskItem, PomodoroMode, PomodoroSettings } from '../../types';
import { tasksService } from '../../services/tasksService';
import { getCurrentTimeString } from '../../utils/date';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

interface PomodoroViewProps {
  categories: Category[];
  currentDate: string;
  dayTasks: TaskItem[];
  onSessionLogged: () => Promise<void>;
  showToast: (msg: string) => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
};

const SETTINGS_STORAGE_KEY = 'roma_pomodoro_settings';
const STATS_STORAGE_KEY = 'roma_pomodoro_stats';

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  categories,
  currentDate,
  dayTasks,
  onSessionLogged,
  showToast,
}) => {
  // Settings state persisted in localStorage
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Daily completed pomodoros count persisted in localStorage
  const [pomodorosToday, setPomodorosToday] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === currentDate && typeof parsed.count === 'number') {
          return parsed.count;
        }
      }
    } catch {
      // fallback
    }
    return 0;
  });

  // Timer states
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const getDurationForMode = useCallback(
    (targetMode: PomodoroMode, cfg: PomodoroSettings): number => {
      switch (targetMode) {
        case 'focus':
          return cfg.focusMinutes * 60;
        case 'short_break':
          return cfg.shortBreakMinutes * 60;
        case 'long_break':
          return cfg.longBreakMinutes * 60;
      }
    },
    []
  );

  const [timeLeft, setTimeLeft] = useState<number>(() =>
    getDurationForMode('focus', settings)
  );

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempFocusMinutes, setTempFocusMinutes] = useState(settings.focusMinutes);
  const [tempShortBreakMinutes, setTempShortBreakMinutes] = useState(settings.shortBreakMinutes);
  const [tempLongBreakMinutes, setTempLongBreakMinutes] = useState(settings.longBreakMinutes);
  const [tempLongBreakInterval, setTempLongBreakInterval] = useState(settings.longBreakInterval);
  const [tempSoundEnabled, setTempSoundEnabled] = useState(settings.soundEnabled);

  // Activity association states
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('new');
  const [isLogging, setIsLogging] = useState<boolean>(false);

  // Web Audio API synthesized alert beep
  const playAlertSound = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(587.33, now, 0.15); // D5
      playTone(880.0, now + 0.15, 0.2); // A5
      playTone(1174.66, now + 0.35, 0.45); // D6
    } catch {
      // Audio playback might be prevented by browser policy before first interaction
    }
  }, []);

  const incrementPomodoroCount = useCallback(() => {
    setPomodorosToday((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(
          STATS_STORAGE_KEY,
          JSON.stringify({ date: currentDate, count: next })
        );
      } catch {
        // ignore
      }
      return next;
    });
  }, [currentDate]);

  // Log focus session to tasks
  const logFocusSession = useCallback(
    async (minutesToLog: number) => {
      if (!selectedCategoryId || selectedCategoryId === 0) {
        showToast('Sesión de foco finalizada (Modo libre).');
        return;
      }

      const category = categories.find((c) => c.id === selectedCategoryId);
      const durationSeconds = minutesToLog * 60;

      try {
        setIsLogging(true);
        if (selectedTaskId && selectedTaskId !== 'new') {
          const taskId = Number(selectedTaskId);
          const task = dayTasks.find((t) => t.id === taskId);
          const currentDuration = task?.durationSeconds || 0;
          await tasksService.update(taskId, {
            durationSeconds: currentDuration + durationSeconds,
          });
          showToast(`+${minutesToLog}m registrados en "${task?.title || 'Tarea'}".`);
        } else if (category) {
          await tasksService.create({
            title: `Sesión de ${category.name}`,
            day: currentDate,
            scheduledTime: getCurrentTimeString(),
            categoryId: category.id,
            kind: 'task',
            isCompleted: true,
            durationSeconds,
          });
          showToast(`Nueva sesión de ${category.name} registrada (+${minutesToLog}m).`);
        }
        await onSessionLogged();
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Error al registrar la sesión');
      } finally {
        setIsLogging(false);
      }
    },
    [selectedCategoryId, selectedTaskId, categories, dayTasks, currentDate, onSessionLogged, showToast]
  );

  // Completion handler when timer naturally hits 0
  const handleTimerComplete = useCallback(async () => {
    if (settings.soundEnabled) {
      playAlertSound();
    }

    if (mode === 'focus') {
      incrementPomodoroCount();
      await logFocusSession(settings.focusMinutes);

      if (cycleCount >= settings.longBreakInterval) {
        setMode('long_break');
        setCycleCount(1);
        setTimeLeft(settings.longBreakMinutes * 60);
        showToast('¡Ciclo de pomodoros completado! Tómate un descanso largo.');
      } else {
        setMode('short_break');
        setCycleCount((prev) => prev + 1);
        setTimeLeft(settings.shortBreakMinutes * 60);
        showToast('¡Sesión de foco terminada! Momento de un descanso corto.');
      }
    } else {
      setMode('focus');
      setTimeLeft(settings.focusMinutes * 60);
      showToast('¡Descanso terminado! Es hora de volver a enfocarse.');
    }
  }, [
    settings,
    mode,
    cycleCount,
    playAlertSound,
    incrementPomodoroCount,
    logFocusSession,
    showToast,
  ]);

  // Main countdown timer interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          setTimeout(() => {
            handleTimerComplete();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleTimerComplete]);

  // Mode Selection Handlers
  const handleSelectMode = (newMode: PomodoroMode) => {
    if (newMode === mode) return;
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationForMode(newMode, settings));
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getDurationForMode(mode, settings));
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      if (cycleCount >= settings.longBreakInterval) {
        setMode('long_break');
        setCycleCount(1);
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setMode('short_break');
        setCycleCount((prev) => prev + 1);
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else {
      setMode('focus');
      setTimeLeft(settings.focusMinutes * 60);
    }
  };

  const handleManualCompleteFocus = async () => {
    setIsRunning(false);
    incrementPomodoroCount();
    await logFocusSession(settings.focusMinutes);
    if (cycleCount >= settings.longBreakInterval) {
      setMode('long_break');
      setCycleCount(1);
      setTimeLeft(settings.longBreakMinutes * 60);
    } else {
      setMode('short_break');
      setCycleCount((prev) => prev + 1);
      setTimeLeft(settings.shortBreakMinutes * 60);
    }
  };

  // Open settings
  const handleOpenSettings = () => {
    setTempFocusMinutes(settings.focusMinutes);
    setTempShortBreakMinutes(settings.shortBreakMinutes);
    setTempLongBreakMinutes(settings.longBreakMinutes);
    setTempLongBreakInterval(settings.longBreakInterval);
    setTempSoundEnabled(settings.soundEnabled);
    setIsSettingsOpen(true);
  };

  // Save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PomodoroSettings = {
      focusMinutes: Math.max(1, Math.min(120, tempFocusMinutes || 25)),
      shortBreakMinutes: Math.max(1, Math.min(60, tempShortBreakMinutes || 5)),
      longBreakMinutes: Math.max(1, Math.min(60, tempLongBreakMinutes || 15)),
      longBreakInterval: Math.max(1, Math.min(12, tempLongBreakInterval || 4)),
      soundEnabled: tempSoundEnabled,
    };

    setSettings(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (!isRunning) {
      setTimeLeft(getDurationForMode(mode, updated));
    }

    setIsSettingsOpen(false);
    showToast('Configuración de Pomodoro guardada.');
  };

  // Category and Task Options
  const categoryOptions = useMemo(() => {
    return [
      { value: 0, label: 'Sin categoría (Libre)' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ];
  }, [categories]);

  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const categoryTasks = useMemo(() => {
    if (!selectedCategoryId) return [];
    return dayTasks.filter(
      (t) => t.categoryId === selectedCategoryId && t.kind === 'task'
    );
  }, [dayTasks, selectedCategoryId]);

  const taskOptions = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        value: 'new',
        label: `+ Nueva sesión de ${selectedCategory.name}`,
      },
      ...categoryTasks.map((t) => ({
        value: String(t.id),
        label: `${t.title} ${t.formattedDuration ? `(${t.formattedDuration})` : ''}`,
      })),
    ];
  }, [selectedCategory, categoryTasks]);

  // Formatted timer display
  const formattedMinutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const formattedSeconds = String(timeLeft % 60).padStart(2, '0');

  // Mode Theme Colors
  const modeTheme = useMemo(() => {
    switch (mode) {
      case 'focus':
        return {
          title: 'Foco',
          icon: Flame,
          primaryText: 'text-amber-400',
          bgActive: 'bg-amber-500/15 border-amber-500/50 text-amber-300',
          buttonPlay: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25',
          progressColor: '#f59e0b',
        };
      case 'short_break':
        return {
          title: 'Descanso Corto',
          icon: Coffee,
          primaryText: 'text-emerald-400',
          bgActive: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300',
          buttonPlay: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25',
          progressColor: '#10b981',
        };
      case 'long_break':
        return {
          title: 'Descanso Largo',
          icon: Sparkles,
          primaryText: 'text-indigo-400',
          bgActive: 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300',
          buttonPlay: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/25',
          progressColor: '#6366f1',
        };
    }
  }, [mode]);

  const totalDuration = getDurationForMode(mode, settings);
  const progressRatio = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;
  const strokeDashoffset = 283 - 283 * progressRatio;

  return (
    <div className="space-y-4">
      {/* Top Header Card: Mode Switcher & Stats */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => handleSelectMode('focus')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-press ${
              mode === 'focus'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame size={14} />
            <span>Foco</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('short_break')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-press ${
              mode === 'short_break'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coffee size={14} />
            <span className="truncate">Descanso Corto</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectMode('long_break')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-press ${
              mode === 'long_break'
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span className="truncate">Descanso Largo</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Ciclo:</span>
            <span className="font-semibold text-white">
              {cycleCount} de {settings.longBreakInterval}
            </span>
            <div className="flex items-center gap-1 ml-1.5">
              {Array.from({ length: settings.longBreakInterval }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx < cycleCount - 1
                      ? 'bg-amber-500'
                      : idx === cycleCount - 1
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="gold" className="text-[10px] px-2 py-0.5">
              Hoy: {pomodorosToday} 🍅
            </Badge>

            <button
              onClick={handleOpenSettings}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Configuración de Pomodoro"
              title="Configurar tiempos"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${modeTheme.progressColor}, transparent 70%)`,
          }}
        />

        {/* Circular Progress Ring */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="5"
            />
            {/* Animated Progress Path */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={modeTheme.progressColor}
              strokeWidth="5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">
              {modeTheme.title}
            </span>
            <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-md">
              <span>{formattedMinutes}</span>
              <span className={isRunning ? 'animate-pulse text-slate-400' : 'text-slate-400'}>
                :
              </span>
              <span>{formattedSeconds}</span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              {isRunning ? 'En marcha...' : 'En pausa'}
            </span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors touch-press"
            title="Reiniciar temporizador"
            aria-label="Reiniciar temporizador"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => setIsRunning((prev) => !prev)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl touch-press font-bold ${
              modeTheme.buttonPlay
            }`}
            title={isRunning ? 'Pausar' : 'Comenzar'}
            aria-label={isRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>

          <button
            onClick={handleSkip}
            className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors touch-press"
            title="Saltar al siguiente modo"
            aria-label="Saltar modo"
          >
            <SkipForward size={18} />
          </button>
        </div>
      </div>

      {/* Activity Association Card */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Asociar Actividad
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Registro de tiempo</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Select
            label="Categoría de enfoque"
            value={selectedCategoryId}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSelectedCategoryId(val);
              setSelectedTaskId('new');
            }}
            options={categoryOptions}
          />

          {selectedCategoryId > 0 && (
            <Select
              label="Tarea o sesión específica"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              options={taskOptions}
            />
          )}
        </div>

        {/* Action to manually log current focus session */}
        {mode === 'focus' && (
          <div className="pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full text-xs font-semibold text-amber-300 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10"
              onClick={handleManualCompleteFocus}
              isLoading={isLogging}
            >
              <CheckCircle2 size={15} className="mr-1.5 text-amber-400" />
              <span>Registrar {settings.focusMinutes} min y pasar a descanso</span>
            </Button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configurar Pomodoro"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Foco (minutos)"
              type="number"
              min={1}
              max={120}
              value={tempFocusMinutes}
              onChange={(e) => setTempFocusMinutes(Number(e.target.value))}
              required
            />

            <Input
              label="Descanso Corto (min)"
              type="number"
              min={1}
              max={60}
              value={tempShortBreakMinutes}
              onChange={(e) => setTempShortBreakMinutes(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Descanso Largo (min)"
              type="number"
              min={1}
              max={60}
              value={tempLongBreakMinutes}
              onChange={(e) => setTempLongBreakMinutes(Number(e.target.value))}
              required
            />

            <Input
              label="Intervalo descanso largo"
              type="number"
              min={1}
              max={12}
              value={tempLongBreakInterval}
              onChange={(e) => setTempLongBreakInterval(Number(e.target.value))}
              required
            />
          </div>

          {/* Sound toggle button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2">
              {tempSoundEnabled ? (
                <Volume2 size={18} className="text-amber-400" />
              ) : (
                <VolumeX size={18} className="text-slate-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">Alerta sonora</p>
                <p className="text-[10px] text-slate-400">Tono suave al completar el bloque</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTempSoundEnabled((prev) => !prev)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                tempSoundEnabled ? 'bg-amber-500' : 'bg-slate-800'
              }`}
              aria-label="Alternar sonido"
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                  tempSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsSettingsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
