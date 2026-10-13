import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TabType, TaskItem, Category, WorkoutSession, CreateTaskPayload, UpdateTaskPayload, CreateWorkoutSessionPayload } from './types';
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
import { Badge } from './components/ui/Badge';
import { Modal } from './components/ui/Modal';
import { Dumbbell, Calendar, CheckSquare, RefreshCw, Download } from 'lucide-react';

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

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaHelpOpen, setIsPwaHelpOpen] = useState(false);
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

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const data = await categoriesService.getAll();
      setCategories(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Load Tasks for current date
  const loadDayTasks = useCallback(async (date: string) => {
    try {
      const data = await tasksService.getTasks({ date });
      // Only keep kind === 'task'
      setTasks(data.filter((t) => t.kind === 'task'));
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Load Events (all future and past events)
  const loadEvents = useCallback(async () => {
    try {
      const data = await tasksService.getTasks();
      setAllEvents(data.filter((t) => t.kind === 'event'));
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Load Workouts
  const loadWorkouts = useCallback(async () => {
    try {
      const data = await workoutsService.getSessions();
      setWorkouts(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

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
        setIsEventModalOpen(true);
        break;
      case 'gym':
        setIsWorkoutModalOpen(true);
        break;
      case 'categories':
        // handled in category manager inline
        break;
    }
  };

  const handleOpenEditTask = (t: TaskItem) => {
    setTaskToEdit(t);
    setIsTaskModalOpen(true);
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
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* PWA Install Banner */}
        {!isStandalone && (
          <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-indigo-500/15 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <Download className="text-amber-400 shrink-0" size={18} />
              <div className="text-xs truncate">
                <p className="font-semibold text-white truncate">Instalar Roma en Android / PWA</p>
                <p className="text-slate-400 text-[11px] truncate">Acceso directo y pantalla completa</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {deferredPrompt && (
                <button
                  onClick={handleInstallPWA}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl touch-press shadow"
                >
                  Instalar
                </button>
              )}
              <button
                onClick={() => setIsPwaHelpOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-xl border border-slate-700 touch-press"
                aria-label="Guía para instalar en Brave o Android"
              >
                {deferredPrompt ? 'Guía' : 'Instalar'}
              </button>
            </div>
          </div>
        )}

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
                    Registra exámenes o citas con recordatorios múltiples por Telegram.
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
                    onDelete={handleDeleteWorkout}
                  />
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">No registraste sesión hoy</span>
                <button
                  onClick={() => setIsWorkoutModalOpen(true)}
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
        onClose={() => setIsEventModalOpen(false)}
        categories={categories}
        currentDate={currentDate}
        onSubmitCreate={handleCreateEvent}
      />

      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        currentDate={currentDate}
        onSubmitCreate={handleCreateWorkout}
      />

      {/* PWA Install Guidance Modal for Brave & Android */}
      <Modal
        isOpen={isPwaHelpOpen}
        onClose={() => setIsPwaHelpOpen(false)}
        title="Instalación en Brave / Android"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400 text-sm flex items-center gap-2">
              <Download size={16} /> Pasos para instalar en Brave:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-200 pl-1 leading-relaxed">
              <li>Tocá los <strong>tres puntos verticales (⋮)</strong> en la barra de Brave.</li>
              <li>Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
              <li>Aceptá la ventana de confirmación del sistema.</li>
            </ol>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-rose-300">
            <h4 className="font-semibold text-rose-400">
              ⚠️ ¿Por qué suele fallar en Brave Android?
            </h4>
            <p className="leading-relaxed">
              En dispositivos Android (especialmente <strong>Xiaomi / HyperOS / MIUI</strong>, Realme y Samsung), el sistema bloquea por defecto que navegadores de terceros añadan accesos directos al launcher.
            </p>
            <p className="font-medium text-slate-100">
              Solución en los ajustes de tu teléfono:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-200">
              <li>Abrí <strong>Ajustes del teléfono</strong> &gt; <strong>Aplicaciones</strong>.</li>
              <li>Buscá <strong>Brave</strong> &gt; <strong>Otros permisos</strong> (o <em>Permisos avanzados</em>).</li>
              <li>Habilitá <strong>"Accesos directos en pantalla de inicio"</strong>.</li>
            </ol>
          </div>

          {deferredPrompt && (
            <button
              onClick={() => {
                handleInstallPWA();
                setIsPwaHelpOpen(false);
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-center shadow touch-press"
            >
              Probar instalación automática ahora
            </button>
          )}
        </div>
      </Modal>

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
