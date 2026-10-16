import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { StorageService } from './services/storage';
import { SupabaseService } from './services/supabase';
import { CloudSyncService, SyncPayload } from './services/cloudSync';
import { generateAthleticRecommendations } from './services/recommendations';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ToastProvider, useToast } from './components/common/Toast';
import { ConfirmModal } from './components/common/ConfirmModal';
import { DeviceSyncModal } from './components/common/DeviceSyncModal';
import { Header } from './components/layout/Header';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

// Modules
import { Dashboard } from './components/dashboard/Dashboard';
import { UniversalActivityModal } from './components/activity/UniversalActivityModal';
import { IACCTeamView } from './components/modules/IACCTeamView';
import { GymSessionView } from './components/modules/GymSessionView';
import { HomePhysicalView } from './components/modules/HomePhysicalView';
import { IndividualBasketballView } from './components/modules/IndividualBasketballView';
import { CalendarView } from './components/modules/CalendarView';
import { StatsView } from './components/modules/StatsView';
import { GoalsView } from './components/modules/GoalsView';
import { HistoryView } from './components/modules/HistoryView';
import { SettingsView } from './components/modules/SettingsView';

import {
  Activity,
  PhysicalMeasurement,
  PersonalGoal,
  UserProfile,
  RoutineTemplate,
  AppSyncInfo,
  ActivityCategory,
} from './types';

function CourtsideApp() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // App core state
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [activities, setActivities] = useState<Activity[]>(() => StorageService.getActivities());
  const [measurements, setMeasurements] = useState<PhysicalMeasurement[]>(() =>
    StorageService.getMeasurements()
  );
  const [goals, setGoals] = useState<PersonalGoal[]>(() => StorageService.getGoals());
  const [templates, setTemplates] = useState<RoutineTemplate[]>(() => StorageService.getTemplates());

  // Navigation
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

  // Modals
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDeviceSyncModalOpen, setIsDeviceSyncModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<ActivityCategory>('iacc_team');

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Sync info state
  const [syncInfo, setSyncInfo] = useState<AppSyncInfo>({
    state: 'saved_locally',
    lastSyncedAt: null,
    pendingCount: 0,
    errorMessage: null,
    isCloudConnected: true,
  });

  // Recommendations calculated from verified data
  const recommendations = generateAthleticRecommendations(activities, measurements, goals);

  // Push latest local data to Cloud (Cross-device Server API & Supabase)
  const handlePushSync = useCallback(async () => {
    if (!isOnline) {
      setSyncInfo((prev) => ({
        ...prev,
        state: 'sync_error',
        errorMessage: 'Sin conexión a Internet',
      }));
      return;
    }

    setSyncInfo((prev) => ({ ...prev, state: 'syncing' }));

    const payload: SyncPayload = {
      profile: StorageService.getProfile(),
      activities: StorageService.getActivities(),
      measurements: StorageService.getMeasurements(),
      goals: StorageService.getGoals(),
      templates: StorageService.getTemplates(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Push to built-in Server Sync endpoint
    const cloudRes = await CloudSyncService.pushToCloud(payload);

    // 2. Also push to Supabase if credentials exist
    if (SupabaseService.isConfigured()) {
      await SupabaseService.syncAllToCloud(
        payload.activities,
        payload.measurements,
        payload.goals,
        payload.profile
      );
    }

    if (cloudRes.success) {
      const timeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      setSyncInfo({
        state: 'synced',
        lastSyncedAt: timeStr,
        pendingCount: 0,
        errorMessage: null,
        isCloudConnected: true,
      });
    } else {
      setSyncInfo((prev) => ({
        ...prev,
        state: 'saved_locally',
        errorMessage: cloudRes.error || null,
      }));
    }
  }, [isOnline]);

  // Pull latest data from Cloud (Cross-device Server API)
  const handlePullSync = useCallback(
    async (customCode?: string, isSilent = false) => {
      if (!isOnline) return;

      if (!isSilent) {
        setSyncInfo((prev) => ({ ...prev, state: 'syncing' }));
      }

      if (customCode) {
        CloudSyncService.setSyncCode(customCode);
      }

      const res = await CloudSyncService.pullFromCloud();

      if (res.success && res.data) {
        const cloudData = res.data;
        if (cloudData.profile) {
          StorageService.saveProfile(cloudData.profile);
          setProfile(cloudData.profile);
        }
        if (Array.isArray(cloudData.activities)) {
          StorageService.saveAllActivities(cloudData.activities);
          setActivities(cloudData.activities);
        }
        if (Array.isArray(cloudData.measurements)) {
          StorageService.saveAllMeasurements(cloudData.measurements);
          setMeasurements(cloudData.measurements);
        }
        if (Array.isArray(cloudData.goals)) {
          StorageService.saveAllGoals(cloudData.goals);
          setGoals(cloudData.goals);
        }
        if (Array.isArray(cloudData.templates)) {
          StorageService.saveAllTemplates(cloudData.templates);
          setTemplates(cloudData.templates);
        }

        const timeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        setSyncInfo({
          state: 'synced',
          lastSyncedAt: timeStr,
          pendingCount: 0,
          errorMessage: null,
          isCloudConnected: true,
        });

        if (!isSilent) {
          showToast('Datos sincronizados correctamente con la nube.', 'success');
        }
      } else if (res.notFound) {
        // If code is fresh on server, push current local data as seed!
        await handlePushSync();
      }
    },
    [isOnline, handlePushSync, showToast]
  );

  // Initial mount: check URL for ?sync=CODE (from QR or share link) and pull cloud data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync');
      if (syncParam) {
        CloudSyncService.setSyncCode(syncParam);
        showToast(`Dispositivo emparejado con código: ${syncParam.toUpperCase()}`, 'success');
        handlePullSync(syncParam);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        handlePullSync(undefined, true);
      }
    }
  }, [handlePullSync, showToast]);

  // Automatic background pull: on window focus, visibility change, and every 12 seconds
  useEffect(() => {
    if (!isOnline) return;

    const pullIfIdle = () => {
      if (!isActivityModalOpen && !isDeviceSyncModalOpen) {
        handlePullSync(undefined, true);
      }
    };

    // Instant sync when user unlocks phone or switches back to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pullIfIdle();
      }
    };

    window.addEventListener('focus', pullIfIdle);
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(pullIfIdle, 12000); // Check every 12 seconds

    return () => {
      window.removeEventListener('focus', pullIfIdle);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [isOnline, isActivityModalOpen, isDeviceSyncModalOpen, handlePullSync]);

  // Activity Actions
  const handleOpenNewActivity = (cat?: ActivityCategory, initialDate?: string) => {
    setEditingActivity(
      initialDate
        ? ({ date: initialDate, status: 'planned', durationMinutes: 60, category: cat || 'iacc_team' } as any)
        : null
    );
    setDefaultCategory(cat || 'iacc_team');
    setIsActivityModalOpen(true);
  };

  const handleSelectActivity = (act: Activity) => {
    setEditingActivity(act);
    setDefaultCategory(act.category);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (activity: Activity) => {
    StorageService.saveActivity(activity);
    setActivities(StorageService.getActivities());
    showToast(
      activity.status === 'completed'
        ? 'Entrenamiento registrado y actualizado.'
        : 'Actividad planificada guardada.',
      'success'
    );
    handlePushSync();
  };

  const handleDeleteActivity = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar actividad deportiva',
      description: '¿Estás seguro de que querés eliminar este registro? Esta acción actualizará los cálculos de minutos y estadísticas.',
      isDanger: true,
      onConfirm: () => {
        StorageService.deleteActivity(id);
        setActivities(StorageService.getActivities());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Actividad eliminada correctamente.', 'info');
        handlePushSync();
      },
    });
  };

  const handleDuplicateActivity = (id: string) => {
    const cloned = StorageService.duplicateActivity(id);
    if (cloned) {
      setActivities(StorageService.getActivities());
      showToast('Sesión duplicada como punto de partida para hoy.', 'success');
      setEditingActivity(cloned);
      setIsActivityModalOpen(true);
      handlePushSync();
    }
  };

  // Measurement Actions
  const handleSaveMeasurement = (m: PhysicalMeasurement) => {
    StorageService.saveMeasurement(m);
    setMeasurements(StorageService.getMeasurements());
    showToast(`Medición de ${m.testName} guardada.`, 'success');
    handlePushSync();
  };

  const handleDeleteMeasurement = (id: string) => {
    StorageService.deleteMeasurement(id);
    setMeasurements(StorageService.getMeasurements());
    showToast('Medición eliminada.', 'info');
    handlePushSync();
  };

  // Goal Actions
  const handleSaveGoal = (g: PersonalGoal) => {
    StorageService.saveGoal(g);
    setGoals(StorageService.getGoals());
    showToast('Objetivo deportivo guardado.', 'success');
    handlePushSync();
  };

  const handleUpdateGoalProgress = (id: string, val: number, comment?: string) => {
    StorageService.updateGoalProgress(id, val, comment);
    setGoals(StorageService.getGoals());
    showToast('Progreso de la meta actualizado.', 'success');
    handlePushSync();
  };

  const handleDeleteGoal = (id: string) => {
    StorageService.deleteGoal(id);
    setGoals(StorageService.getGoals());
    showToast('Objetivo eliminado.', 'info');
    handlePushSync();
  };

  // Profile Action
  const handleSaveProfile = (p: UserProfile) => {
    StorageService.saveProfile(p);
    setProfile(p);
    handlePushSync();
  };

  // Backup & Restore Actions
  const handleExportData = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `courtside_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Copia de seguridad descargada correctamente.', 'success');
  };

  const handleImportData = (jsonStr: string) => {
    const res = StorageService.importAllData(jsonStr);
    if (res.success) {
      setProfile(StorageService.getProfile());
      setActivities(StorageService.getActivities());
      setMeasurements(StorageService.getMeasurements());
      setGoals(StorageService.getGoals());
      setTemplates(StorageService.getTemplates());
      showToast(res.message, 'success');
      handlePushSync();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleResetData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restablecer datos de prueba',
      description: 'Esto restaurará las sesiones iniciales de IACC, gimnasio, tiros y mediciones para Santino.',
      isDanger: false,
      onConfirm: () => {
        StorageService.resetToDefaultSeeds();
        setProfile(StorageService.getProfile());
        setActivities(StorageService.getActivities());
        setMeasurements(StorageService.getMeasurements());
        setGoals(StorageService.getGoals());
        setTemplates(StorageService.getTemplates());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Datos de prueba restaurados.', 'info');
        handlePushSync();
      },
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar todos los datos',
      description: 'Esta acción borrará todas las actividades, estadísticas y metas guardadas en este dispositivo. No se puede deshacer.',
      isDanger: true,
      onConfirm: () => {
        StorageService.clearAllData();
        setActivities([]);
        setMeasurements([]);
        setGoals([]);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Todos los datos fueron eliminados.', 'warning');
        handlePushSync();
      },
    });
  };

  // Section Selector with quick transitions
  const handleSelectSection = (sec: NavSection) => {
    if (sec === 'logger') {
      handleOpenNewActivity();
      return;
    }
    startTransition(() => {
      setActiveSection(sec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D10] text-[#F5F6F8]">
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-600 px-4 py-1.5 text-center text-xs font-bold text-black flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span>Modo Sin Conexión — Podés seguir registrando entrenamientos, todo se guarda localmente en tu dispositivo.</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        profile={profile}
        syncInfo={syncInfo}
        onOpenNewActivity={() => handleOpenNewActivity()}
        onOpenProfileSettings={() => handleSelectSection('settings')}
        onManualSync={handlePushSync}
        onOpenDeviceSync={() => setIsDeviceSyncModalOpen(true)}
      />

      {/* App Body (Sidebar + Content Area) */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          unreadRecommendationsCount={recommendations.length}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {activeSection === 'dashboard' && (
            <Dashboard
              profile={profile}
              activities={activities}
              measurements={measurements}
              goals={goals}
              recommendations={recommendations}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
              onNavigateSection={handleSelectSection}
            />
          )}

          {activeSection === 'iacc' && (
            <IACCTeamView
              activities={activities}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
            />
          )}

          {activeSection === 'gym' && (
            <GymSessionView
              activities={activities}
              templates={templates}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
            />
          )}

          {activeSection === 'home_physical' && (
            <HomePhysicalView
              activities={activities}
              templates={templates}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
            />
          )}

          {activeSection === 'basketball_skill' && (
            <IndividualBasketballView
              activities={activities}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarView
              activities={activities}
              onOpenNewActivity={handleOpenNewActivity}
              onSelectActivity={handleSelectActivity}
            />
          )}

          {activeSection === 'stats' && (
            <StatsView
              activities={activities}
              measurements={measurements}
              onSaveMeasurement={handleSaveMeasurement}
              onDeleteMeasurement={handleDeleteMeasurement}
              onOpenNewActivity={handleOpenNewActivity}
            />
          )}

          {activeSection === 'goals' && (
            <GoalsView
              goals={goals}
              onSaveGoal={handleSaveGoal}
              onUpdateGoalProgress={handleUpdateGoalProgress}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {activeSection === 'history' && (
            <HistoryView
              activities={activities}
              onSelectActivity={handleSelectActivity}
              onDeleteActivity={handleDeleteActivity}
              onExportData={handleExportData}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              profile={profile}
              syncInfo={syncInfo}
              onSaveProfile={handleSaveProfile}
              onManualSync={handlePushSync}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetData={handleResetData}
              onClearAllData={handleClearAllData}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeSection={activeSection} onSelectSection={handleSelectSection} />

      {/* Universal Activity Modal */}
      <UniversalActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        onDuplicate={handleDuplicateActivity}
        initialActivity={editingActivity}
        defaultCategory={defaultCategory}
      />

      {/* Cross-Device Sync Modal (Phone ↔ PC) */}
      <DeviceSyncModal
        isOpen={isDeviceSyncModalOpen}
        onClose={() => setIsDeviceSyncModalOpen(false)}
        onPushSync={handlePushSync}
        onPullSync={handlePullSync}
        isSyncing={syncInfo.state === 'syncing'}
        lastSyncedAt={syncInfo.lastSyncedAt}
        showToast={showToast}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CourtsideApp />
    </ToastProvider>
  );
}
