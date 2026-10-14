import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TabType, TaskItem, Category, WorkoutSession, CreateTaskPayload, UpdateTaskPayload, CreateWorkoutSessionPayload, UpdateWorkoutSessionPayload } from './types';
import { tasksService } from './services/tasksService';
import { categoriesService } from './services/categoriesService';
import { workoutsService } from './services/workoutsService';
import { getTodayString, shiftDateString } from './utils/date';

import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { TaskCard } from './components/tasks/TaskCard';
import { TaskModal } from './components/tasks/TaskModal';
import { EventCard } from './components/events/EventCard';
import { EventModal } from './components/events/EventModal';
import { WorkoutCard } from './components/gym/WorkoutCard';
import { WorkoutModal } from './components/gym/WorkoutModal';
import { CategoryManager } from './components/categories/CategoryManager';
import { DashboardView } from './components/dashboard/DashboardView';
import { PomodoroView } from './components/pomodoro/PomodoroView';
import { Badge } from './components/ui/Badge';
import { Dumbbell, Calendar, CheckSquare, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());

  // Data states
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [allEvents, setAllEvents] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);

  // UI / Status states
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [eventToEdit, setEventToEdit] = useState<TaskItem | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<WorkoutSession | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isStandalone = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // Categories Map for O(1) lookups
  const categoryMap = useMemo(() => {
    const map = new Map<number, Category>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Consecutive failure tracking for resilient offline damping
  const consecutiveFailuresRef = useRef<number>(0);

  const handleNetworkSuccess = useCallback(() => {
    consecutiveFailuresRef.current = 0;
    setIsOnline(true);
  }, []);

  const handleNetworkFailure = useCallback(() => {
    consecutiveFailuresRef.current += 1;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
    } else if (consecutiveFailuresRef.current >= 3) {
      setIsOnline(false);
    }
  }, []);

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
      handleNetworkSuccess();
    } catch {
      handleNetworkFailure();
    }
  }, [handleNetworkSuccess, handleNetworkFailure]);

  // Load Tasks for current date
  const loadDayTasks = useCallback(async (date: string) => {
    try {
      const data = await tasksService.getTasks({ date });
      // Only keep kind === 'task'
      setTasks(data.filter((t) => t.kind === 'task'));
      handleNetworkSuccess();
    } catch {
      handleNetworkFailure();
    }
  }, [handleNetworkSuccess, handleNetworkFailure]);

  // Load Events (all future and past events)
  const loadEvents = useCallback(async () => {
    try {
      const data = await tasksService.getTasks();
      setAllEvents(data.filter((t) => t.kind === 'event'));
      handleNetworkSuccess();
    } catch {
      handleNetworkFailure();
    }
  }, [handleNetworkSuccess, handleNetworkFailure]);

  // Load Workouts
  const loadWorkouts = useCallback(async () => {
    try {
      const data = await workoutsService.getSessions();
      setWorkouts(data);
      handleNetworkSuccess();
    } catch {
      handleNetworkFailure();
    }
  }, [handleNetworkSuccess, handleNetworkFailure]);

  // Initial and reactive load
  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadCategories(),
      loadDayTasks(currentDate),
      loadEvents(),
      loadWorkouts(),
    ]);
    setIsLoading(false);
  }, [currentDate, loadCategories, loadDayTasks, loadEvents, loadWorkouts]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // Window online/offline listener to auto-reload when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      consecutiveFailuresRef.current = 0;
      setIsOnline(true);
      reloadAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reloadAll]);

  // Date Shift Handler
  const handleShiftDate = (days: number) => {
    const nextDate = shiftDateString(currentDate, days);
    setCurrentDate(nextDate);
  };

  const handleGoToToday = () => {
    setCurrentDate(getTodayString());
  };

  // Task Actions
  const handleStartTask = async (id: number) => {
    try {
      await tasksService.start(id);
      showToast('Tarea iniciada. Cronómetro en marcha.');
      await loadDayTasks(currentDate);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al iniciar la tarea');
    }
  };

  const handleCompleteTask = async (id: number) => {
    try {
      const res = await tasksService.complete(id);
      showToast(`Tarea completada en ${res.formattedDuration}! 🎉`);
      await loadDayTasks(currentDate);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al completar la tarea');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksService.delete(id);
      showToast('Tarea eliminada.');
      await loadDayTasks(currentDate);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la tarea');
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    await tasksService.create(payload);
    showToast('Tarea creada exitosamente.');
    await loadDayTasks(currentDate);
  };

  const handleUpdateTask = async (id: number, payload: UpdateTaskPayload) => {
    await tasksService.update(id, payload);
    showToast('Tarea actualizada.');
    await loadDayTasks(currentDate);
  };

  // Event Actions
  const handleCreateEvent = async (payload: CreateTaskPayload) => {
    await tasksService.create(payload);
    showToast('Evento creado con recordatorios configurados.');
    await loadEvents();
    if (payload.day === currentDate) {
      await loadDayTasks(currentDate);
    }
  };

  const handleUpdateEvent = async (id: number, payload: UpdateTaskPayload) => {
    await tasksService.update(id, payload);
    showToast('Evento actualizado correctamente.');
    await loadEvents();
    if (payload.day === currentDate || eventToEdit?.day === currentDate) {
      await loadDayTasks(currentDate);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await tasksService.delete(id);
      showToast('Evento eliminado.');
      await loadEvents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el evento');
    }
  };

  // Gym Actions
  const handleCreateWorkout = async (payload: CreateWorkoutSessionPayload) => {
    await workoutsService.create(payload);
    showToast('Sesión de entrenamiento registrada.');
    await loadWorkouts();
  };

  const handleUpdateWorkout = async (id: number, payload: UpdateWorkoutSessionPayload) => {
    await workoutsService.update(id, payload);
    showToast('Sesión de entrenamiento actualizada.');
    await loadWorkouts();
  };

  const handleDeleteWorkout = async (id: number) => {
    try {
      await workoutsService.delete(id);
      showToast('Sesión de entrenamiento eliminada.');
      await loadWorkouts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la sesión');
    }
  };

  // Category Actions
  const handleCreateCategory = async (name: string) => {
    await categoriesService.create(name);
    showToast('Categoría creada.');
    await loadCategories();
  };

  const handleUpdateCategory = async (id: number, name: string) => {
    await categoriesService.update(id, name);
    showToast('Categoría actualizada.');
    await loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    await categoriesService.delete(id);
    showToast('Categoría eliminada.');
    await loadCategories();
  };

  // Modal triggers
  const handleOpenCreateModal = () => {
    switch (activeTab) {
      case 'tasks':
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
        break;
      case 'events':
        setEventToEdit(null);
        setIsEventModalOpen(true);
        break;
      case 'gym':
        setWorkoutToEdit(null);
        setIsWorkoutModalOpen(true);
        break;
      case 'categories':
      case 'dashboard':
      case 'pomodoro':
        // handled inline or no modal
        break;
    }
  };

  const handleOpenEditTask = (t: TaskItem) => {
    setTaskToEdit(t);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditWorkout = (session: WorkoutSession) => {
    setWorkoutToEdit(session);
    setIsWorkoutModalOpen(true);
  };

  // Filter workouts for current date if desired or show recent
  const workoutsForDay = useMemo(
    () => workouts.filter((w) => w.date === currentDate),
    [workouts, currentDate]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-xl font-medium text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✓</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onShiftDate={handleShiftDate}
        onGoToToday={handleGoToToday}
        isOnline={isOnline}
        activeTab={activeTab}
        onOpenCreateModal={handleOpenCreateModal}
        canInstall={!!deferredPrompt && !isStandalone}
        onInstall={handleInstallPWA}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* Tab Content: TASKS */}
        {activeTab === 'tasks' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tareas del Día
                </h2>
                <Badge variant="default">{tasks.length}</Badge>
              </div>

              <button
                onClick={reloadAll}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Actualizar"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {tasks.length > 0 ? (
              <div className="grid gap-2.5">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={categoryMap.get(task.categoryId)}
                    onStart={handleStartTask}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleOpenEditTask}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                  📋
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Sin tareas para este día</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toca el botón "+ Nueva Tarea" para programar una actividad.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Content: EVENTS */}
        {activeTab === 'events' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Eventos & Citas
                </h2>
                <Badge variant="gold">{allEvents.length}</Badge>
              </div>

              <button
                onClick={reloadAll}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Actualizar"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {allEvents.length > 0 ? (
              <div className="grid gap-2.5">
                {allEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    category={categoryMap.get(event.categoryId)}
                    onDelete={handleDeleteEvent}
                    onEdit={(evt) => {
                      setEventToEdit(evt);
                      setIsEventModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/30 border border-dashed border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  📅
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">No hay eventos especiales</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registra exámenes o citas con recordatorios múltiples push por Ntfy.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Content: GYM */}
        {activeTab === 'gym' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Dumbbell size={16} className="text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Entrenamiento Físico
                </h2>
                <Badge variant="default">{workouts.length} total</Badge>
              </div>

              <button
                onClick={reloadAll}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Actualizar"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Quick summary if session today */}
            {workoutsForDay.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider px-1">
                  Sesión de Hoy ({currentDate})
                </span>
                {workoutsForDay.map((session) => (
                  <WorkoutCard
                    key={session.id}
                    session={session}
                    onEdit={handleOpenEditWorkout}
                    onDelete={handleDeleteWorkout}
                  />
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">No registraste sesión hoy</span>
                <button
                  onClick={() => {
                    setWorkoutToEdit(null);
                    setIsWorkoutModalOpen(true);
                  }}
                  className="text-xs text-amber-400 font-semibold hover:underline"
                >
                  + Registrar hoy
                </button>
              </div>
            )}

            {/* History */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Historial de Sesiones
              </span>
              <div className="grid gap-2.5">
                {workouts.map((session) => (
                  <WorkoutCard
                    key={session.id}
                    session={session}
                    onEdit={handleOpenEditWorkout}
                    onDelete={handleDeleteWorkout}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tab Content: CATEGORIES */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* Tab Content: POMODORO */}
        {activeTab === 'pomodoro' && (
          <PomodoroView
            categories={categories}
            currentDate={currentDate}
            dayTasks={tasks}
            onSessionLogged={async () => {
              await loadDayTasks(currentDate);
            }}
            showToast={showToast}
          />
        )}

        {/* Tab Content: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        categories={categories}
        currentDate={currentDate}
        taskToEdit={taskToEdit}
        onSubmitCreate={handleCreateTask}
        onSubmitUpdate={handleUpdateTask}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        categories={categories}
        currentDate={currentDate}
        eventToEdit={eventToEdit}
        onSubmitCreate={handleCreateEvent}
        onSubmitUpdate={handleUpdateEvent}
      />

      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => {
          setIsWorkoutModalOpen(false);
          setWorkoutToEdit(null);
        }}
        currentDate={currentDate}
        workoutToEdit={workoutToEdit}
        onSubmitCreate={handleCreateWorkout}
        onSubmitUpdate={handleUpdateWorkout}
      />

      {/* Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        tasksCount={tasks.length}
        eventsCount={allEvents.length}
      />
    </div>
  );
};
export default App;
