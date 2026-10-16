import React, { useState } from 'react';
import {
  Settings,
  User,
  ShieldCheck,
  Cloud,
  Database,
  Copy,
  Check,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Smartphone,
  Monitor,
  Terminal,
  ExternalLink,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserProfile, AppSyncInfo } from '../../types';
import { SupabaseService } from '../../services/supabase';
import { CloudSyncService } from '../../services/cloudSync';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  profile: UserProfile;
  syncInfo: AppSyncInfo;
  onSaveProfile: (p: UserProfile) => void;
  onManualSync: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => void;
  onResetData: () => void;
  onClearAllData: () => void;
  showToast: (msg: string, type?: any) => void;
}

export const SettingsView: React.FC<Props> = ({
  profile,
  syncInfo,
  onSaveProfile,
  onManualSync,
  onExportData,
  onImportData,
  onResetData,
  onClearAllData,
  showToast,
}) => {
  // Profile form state
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname || '');
  const [club, setClub] = useState(profile.club);
  const [category, setCategory] = useState(profile.category);
  const [age, setAge] = useState(profile.age);
  const [heightCm, setHeightCm] = useState(profile.heightCm);
  const [weightKg, setWeightKg] = useState(profile.weightKg);
  const [wingspanCm, setWingspanCm] = useState(profile.wingspanCm);
  const [dominantHand, setDominantHand] = useState(profile.dominantHand);
  const [jerseyNumber, setJerseyNumber] = useState(profile.jerseyNumber);
  const [weeklyTargetMinutes, setWeeklyTargetMinutes] = useState(profile.weeklyTargetMinutes);
  const [weeklyTargetSessions, setWeeklyTargetSessions] = useState(profile.weeklyTargetSessions);

  // Supabase credentials form state
  const currentSettings = SupabaseService.getSettings();
  const [sbUrl, setSbUrl] = useState(currentSettings.url);
  const [sbKey, setSbKey] = useState(currentSettings.anonKey);
  const [sbEmail, setSbEmail] = useState('');
  const [sbPassword, setSbPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim() || 'Santino',
      nickname: nickname.trim(),
      club: club.trim(),
      category: category.trim(),
      age: Number(age) || 16,
      heightCm: Number(heightCm) || 187,
      weightKg: Number(weightKg) || 77,
      wingspanCm: Number(wingspanCm) || 191,
      dominantHand: dominantHand as any,
      jerseyNumber: Number(jerseyNumber) || 7,
      weeklyTargetMinutes: Number(weeklyTargetMinutes) || 480,
      weeklyTargetSessions: Number(weeklyTargetSessions) || 6,
    });
    showToast('Perfil de jugador actualizado correctamente.', 'success');
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    SupabaseService.saveSettings(sbUrl, sbKey);
    showToast('Configuración de Supabase guardada.', 'success');
  };

  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbEmail || !sbPassword) return;
    setIsAuthLoading(true);
    try {
      const { error } = await SupabaseService.signInWithEmail(sbEmail, sbPassword);
      if (error) throw error;
      showToast('Sesión iniciada correctamente en Supabase.', 'success');
      onManualSync();
    } catch (err: any) {
      showToast(err.message || 'Error al iniciar sesión.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSupabaseSignUp = async () => {
    if (!sbEmail || !sbPassword) {
      showToast('Ingresá email y contraseña para registrar tu cuenta.', 'warning');
      return;
    }
    setIsAuthLoading(true);
    try {
      const { error } = await SupabaseService.signUpWithEmail(sbEmail, sbPassword);
      if (error) throw error;
      showToast('Cuenta creada en Supabase. Si tenés confirmación de email activa, revisá tu casilla.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al crear cuenta.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSupabaseSignOut = async () => {
    await SupabaseService.signOut();
    showToast('Sesión de Supabase cerrada.', 'info');
  };

  const copySqlToClipboard = () => {
    const sql = SupabaseService.getDatabaseSetupSQL();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast('Código SQL copiado al portapapeles.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* 1. Header */}
      <div className="flex items-center gap-3 p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-wide">
            CONFIGURACIÓN Y SINCRONIZACIÓN
          </h1>
          <p className="text-xs text-[#9299A5]">
            Personalizá tus datos atléticos, conectá tu nube de Supabase y configurá la PWA.
          </p>
        </div>
      </div>

      {/* 2. Player Profile Settings */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-5">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-[#FF6B2C]" />
          <h2 className="font-display font-bold text-lg text-white tracking-wide">
            PERFIL DEL JUGADOR
          </h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#9299A5] mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Apodo deportivo</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ej. Santi"
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Camiseta #</label>
              <input
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num font-bold text-[#FF6B2C]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9299A5] mb-1">Club de Básquetbol</label>
              <input
                type="text"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">División / Categoría</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          {/* Anthropometric & Athletic Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-[#1E2530]">
            <div>
              <label className="block text-[#9299A5] mb-1">Edad</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Altura (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Peso (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Envergadura (cm)</label>
              <input
                type="number"
                value={wingspanCm}
                onChange={(e) => setWingspanCm(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Mano hábil</label>
              <select
                value={dominantHand}
                onChange={(e) => setDominantHand(e.target.value as any)}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
              >
                <option value="Derecha">Derecha</option>
                <option value="Izquierda">Izquierda</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1E2530]">
            <div>
              <label className="block text-[#9299A5] mb-1">Meta semanal de minutos</label>
              <input
                type="number"
                value={weeklyTargetMinutes}
                onChange={(e) => setWeeklyTargetMinutes(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num font-bold text-[#FF6B2C]"
              />
            </div>
            <div>
              <label className="block text-[#9299A5] mb-1">Meta semanal de sesiones</label>
              <input
                type="number"
                value={weeklyTargetSessions}
                onChange={(e) => setWeeklyTargetSessions(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition active:scale-95"
            >
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>

      {/* 2.5 Cross-Device Cloud Sync (Phone ↔ PC) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#FF6B2C]/10 via-[#15191F] to-[#0B0D10] border border-[#FF6B2C]/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#FF6B2C]" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              SINCRONIZACIÓN CELULAR ↔ COMPUTADORA (EN VIVO)
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono-num font-bold bg-[#B7F56A]/15 text-[#B7F56A] border border-[#B7F56A]/30">
            Nube Activa • Sincronización Automática
          </span>
        </div>

        <p className="text-xs text-[#9299A5] leading-relaxed">
          Tus datos se sincronizan automáticamente entre tu celular y tu computadora cada vez que guardás un entrenamiento, o cada 30 segundos mientras estás conectado. No necesitás crear bases de datos externas si no querés: COURTSIDE incluye sincronización de nube integrada mediante tu <strong>Código de Jugador</strong>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#222A36] space-y-2">
            <span className="text-[#9299A5] block text-[11px]">Tu Código de Sincronización</span>
            <div className="flex items-center justify-between">
              <span className="font-mono-num font-black text-xl text-[#FF6B2C] tracking-wider">
                {CloudSyncService.getSyncCode()}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CloudSyncService.getSyncCode());
                  showToast('Código copiado.', 'success');
                }}
                className="px-2.5 py-1 rounded-lg text-xs bg-[#1F2633] text-white hover:bg-[#2B3545] border border-[#354052]"
              >
                Copiar
              </button>
            </div>
            <p className="text-[10px] text-[#6D7787]">
              En tu celular, tocá el botón «Celular ↔ PC» en la barra superior o abrí el link de emparejamiento.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#222A36] flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[#9299A5] block text-[11px]">Link Directo para Celular</span>
              <p className="text-[11px] text-[#6D7787] truncate mt-1">
                {CloudSyncService.getShareablePairingUrl()}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(CloudSyncService.getShareablePairingUrl());
                  showToast('Link de celular copiado para enviar por WhatsApp o mensaje.', 'success');
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#354052] transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link para Celular</span>
              </button>
              <button
                onClick={onManualSync}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Supabase Cloud Sync & Authentication (Optional external backend) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#9299A5]" />
            <h2 className="font-display font-bold text-lg text-white tracking-wide">
              INTEGRACIÓN EXTERNA CON SUPABASE (OPCIONAL)
            </h2>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono-num font-bold ${
              syncInfo.state === 'synced'
                ? 'bg-[#B7F56A]/15 text-[#B7F56A] border border-[#B7F56A]/30'
                : syncInfo.state === 'syncing'
                ? 'bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30'
                : 'bg-[#1F2633] text-[#9299A5]'
            }`}
          >
            {syncInfo.state === 'synced'
              ? 'Sincronizado'
              : syncInfo.state === 'syncing'
              ? 'Sincronizando...'
              : syncInfo.state === 'sync_error'
              ? 'Error de red'
              : 'Modo Local (Sin Nube)'}
          </span>
        </div>

        <p className="text-xs text-[#9299A5] leading-relaxed">
          COURTSIDE funciona 100% de manera autónoma y sin conexión guardando todo en tu dispositivo. Para sincronizar tus entrenamientos automáticamente entre tu computadora y tu celular, podés conectar tu proyecto gratuito de Supabase.
        </p>

        {/* Credentials Form */}
        <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 bg-[#0B0D10] p-4 rounded-2xl border border-[#1E2530] text-xs">
          <div className="font-bold text-white mb-2">Credenciales de Proyecto Supabase</div>

          <div>
            <label className="block text-[#9299A5] mb-1">Project URL (VITE_SUPABASE_URL)</label>
            <input
              type="url"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
            />
          </div>

          <div>
            <label className="block text-[#9299A5] mb-1">Anon Public Key (VITE_SUPABASE_ANON_KEY)</label>
            <input
              type="password"
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono-num"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-[#6D7787]">
              También podés colocarlas en el archivo <code>.env</code>
            </span>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-bold text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#354052] transition"
            >
              Guardar Credenciales
            </button>
          </div>
        </form>

        {/* Auth section if configured */}
        {SupabaseService.isConfigured() && (
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-3 text-xs">
            <div className="font-bold text-white">Inicio de Sesión en tu Base de Datos</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#9299A5] mb-1">Email</label>
                <input
                  type="email"
                  value={sbEmail}
                  onChange={(e) => setSbEmail(e.target.value)}
                  placeholder="santino@ejemplo.com"
                  className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-[#9299A5] mb-1">Contraseña</label>
                <input
                  type="password"
                  value={sbPassword}
                  onChange={(e) => setSbPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#15191F] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isAuthLoading}
                onClick={handleSupabaseSignIn}
                className="px-4 py-2 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition disabled:opacity-50"
              >
                {isAuthLoading ? 'Conectando...' : 'Iniciar Sesión'}
              </button>
              <button
                type="button"
                disabled={isAuthLoading}
                onClick={handleSupabaseSignUp}
                className="px-4 py-2 rounded-xl font-semibold text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#354052] transition disabled:opacity-50"
              >
                Registrar Cuenta
              </button>
              <button
                type="button"
                onClick={handleSupabaseSignOut}
                className="px-3 py-2 text-[#9299A5] hover:text-white transition"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Copyable SQL Schema */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Database className="w-4 h-4 text-[#B7F56A]" />
              <span>Script SQL de Tablas y Seguridad RLS para Supabase</span>
            </div>
            <button
              onClick={copySqlToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-[#B7F56A] hover:bg-[#cbf988] transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? '¡Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#9299A5]">
            Pegá este código en el <strong>SQL Editor</strong> de tu panel de Supabase para crear automáticamente las tablas de perfil, entrenamientos, mediciones y objetivos con políticas de seguridad RLS donde cada usuario solo accede a sus propios datos.
          </p>
        </div>
      </div>

      {/* 4. PWA Installation & Windows Startup Guide */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#FF6B2C]" />
          <h2 className="font-display font-bold text-lg text-white tracking-wide">
            GUÍA DE INSTALACIÓN PWA Y AUTO-INICIO EN WINDOWS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mobile Install Instructions */}
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-2.5">
            <div className="font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#B7F56A]" />
              <span>Instalación en Celular (Android / iOS)</span>
            </div>
            <ul className="space-y-2 text-[#9299A5] leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-white">Android (Chrome):</strong> Al abrir la app en Chrome, tocá el menú de 3 puntos arriba a la derecha y seleccioná <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.
              </li>
              <li>
                <strong className="text-white">iPhone (Safari):</strong> Tocá el botón <strong>Compartir</strong> (ícono de flecha hacia arriba) en la barra inferior y seleccioná <strong>«Agregar a inicio»</strong>.
              </li>
              <li>
                La app se ejecutará a pantalla completa como una app nativa, con su icono albirrojo/naranja y acceso sin conexión.
              </li>
            </ul>
          </div>

          {/* Desktop & Windows Startup */}
          <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-2.5">
            <div className="font-bold text-white flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#FF6B2C]" />
              <span>Instalación en PC y Auto-Inicio en Windows</span>
            </div>
            <ul className="space-y-2 text-[#9299A5] leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-white">Instalar en PC:</strong> En Chrome o Edge, hacé clic en el botón de instalar en la barra de direcciones o tocá el botón «Instalar App» arriba.
              </li>
              <li>
                <strong className="text-white">Inicio Automático en Windows:</strong>
                <ol className="list-decimal list-inside pl-2 space-y-1 mt-1 text-[11px]">
                  <li>Presioná <kbd className="px-1.5 py-0.5 rounded bg-[#1F2633] text-white">Win + R</kbd> en tu teclado.</li>
                  <li>Escribí <code>shell:startup</code> y presioná Enter (abrirá la carpeta de inicio de Windows).</li>
                  <li>Arrastrá el acceso directo de COURTSIDE de tu escritorio adentro de esa carpeta.</li>
                </ol>
              </li>
            </ul>
          </div>
        </div>

        <PWAInstallButton variant="settings" />
      </div>

      {/* 5. Backup, Import & Data Privacy */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#B7F56A]" />
          <h2 className="font-display font-bold text-lg text-white tracking-wide">
            CONTROL DE DATOS Y PRIVACIDAD
          </h2>
        </div>

        <p className="text-xs text-[#9299A5] leading-relaxed">
          Tenés el control total de tus datos deportivos. Podés exportar una copia completa en JSON, restaurarla en cualquier navegador o restablecer los valores de prueba.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onExportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0B0D10] border border-[#26303E] hover:bg-[#1E2532] transition"
          >
            <Download className="w-4 h-4 text-[#FF6B2C]" />
            <span>Descargar Copia de Seguridad (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0B0D10] border border-[#26303E] hover:bg-[#1E2532] transition cursor-pointer">
            <Upload className="w-4 h-4 text-[#B7F56A]" />
            <span>Restaurar Copia de Seguridad</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={onResetData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#26303E] hover:bg-[#1E2532] transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restablecer Datos de Demostración</span>
          </button>

          <button
            onClick={onClearAllData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-[#0B0D10] border border-red-500/30 hover:bg-red-500/20 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Borrar Todos los Datos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
