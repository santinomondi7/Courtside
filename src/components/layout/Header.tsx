import React from 'react';
import {
  Plus,
  Cloud,
  CloudOff,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Calendar,
  Flame,
} from 'lucide-react';
import { UserProfile, AppSyncInfo } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  profile: UserProfile;
  syncInfo: AppSyncInfo;
  onOpenNewActivity: () => void;
  onOpenProfileSettings: () => void;
  onManualSync: () => void;
  onOpenDeviceSync: () => void;
}

export const Header: React.FC<Props> = ({
  profile,
  syncInfo,
  onOpenNewActivity,
  onOpenProfileSettings,
  onManualSync,
  onOpenDeviceSync,
}) => {
  // Format current Argentine date: e.g. "Jueves, 15 de Octubre"
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#0B0D10]/90 backdrop-blur-md border-b border-[#1C232E]">
      {/* Brand & Club Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Glowing Court Emblem */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E2530] to-[#12161C] border border-[#2B3545] shadow-inner group">
            <span className="font-display font-extrabold text-lg tracking-wider text-[#FF6B2C]">
              C
            </span>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#B7F56A] ring-2 ring-[#0B0D10]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl tracking-wider text-white">
                COURTSIDE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono-num font-bold bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30 tracking-tight">
                PRO
              </span>
            </div>
            {/* Club Affiliation Badge */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-[#9299A5] tracking-tight truncate max-w-[150px] sm:max-w-none">
                IACC • Formativas Gloria
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Performance Quick Indicator (Hidden on small screens) */}
      <div className="hidden lg:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#15191F] border border-[#222A36] text-[#9299A5]">
          <Calendar className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span className="capitalize">{capitalizedDate}</span>
        </div>
      </div>

      {/* Right controls: Sync Status + PWA + Quick Add + Player Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Device Sync Button (Celular ↔ PC) */}
        <button
          onClick={onOpenDeviceSync}
          title="Vincular con tu celular o computadora"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#15191F] hover:bg-[#1E2633] border border-[#2B3545] text-white transition active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-[#B7F56A] animate-pulse" />
          <span className="hidden sm:inline">Celular ↔ PC</span>
        </button>

        {/* Sync Status Badge */}
        <button
          onClick={onManualSync}
          title={
            syncInfo.state === 'synced'
              ? 'Sincronizado con la nube'
              : syncInfo.state === 'syncing'
              ? 'Sincronizando cambios...'
              : syncInfo.state === 'sync_error'
              ? `Error de sincronización: ${syncInfo.errorMessage || 'Reintentar'}`
              : 'Guardado localmente. Tocá para sincronizar.'
          }
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono-num bg-[#15191F] hover:bg-[#1B222C] border border-[#222935] transition active:scale-95"
        >
          {syncInfo.state === 'synced' ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-[#B7F56A]" />
              <span className="hidden md:inline text-[11px] text-[#B7F56A] font-semibold">
                Sincronizado
              </span>
            </>
          ) : syncInfo.state === 'syncing' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-[#FF6B2C] animate-spin" />
              <span className="hidden md:inline text-[11px] text-[#FF6B2C] font-semibold">
                Sincronizando...
              </span>
            </>
          ) : syncInfo.state === 'sync_error' ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden md:inline text-[11px] text-yellow-400 font-semibold">
                Reintentar
              </span>
            </>
          ) : (
            <>
              <HardDrive className="w-3.5 h-3.5 text-[#9299A5]" />
              <span className="hidden md:inline text-[11px] text-[#9299A5]">
                Local
              </span>
            </>
          )}
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Primary Call to Action: + Registrar actividad */}
        <button
          onClick={onOpenNewActivity}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FF6B2C] hover:bg-[#FF8243] text-black shadow-lg shadow-[#FF6B2C]/20 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Registrar actividad</span>
          <span className="sm:hidden font-extrabold">+ Registrar</span>
        </button>

        {/* Player Avatar / Profile Trigger */}
        <button
          onClick={onOpenProfileSettings}
          title={`Perfil de ${profile.name} (#${profile.jerseyNumber})`}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#1F2633] to-[#15191F] border border-[#2B3545] hover:border-[#FF6B2C] transition"
        >
          <span className="font-display font-bold text-sm text-white">
            #{profile.jerseyNumber}
          </span>
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#0B0D10]" />
        </button>
      </div>
    </header>
  );
};
