import React, { useState } from 'react';
import {
  Target,
  Plus,
  Percent,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  Filter,
} from 'lucide-react';
import { Activity } from '../../types';

interface Props {
  activities: Activity[];
  onOpenNewActivity: (category?: any) => void;
  onSelectActivity: (activity: Activity) => void;
}

export const IndividualBasketballView: React.FC<Props> = ({
  activities,
  onOpenNewActivity,
  onSelectActivity,
}) => {
  const [skillFilter, setSkillFilter] = useState<string>('all');

  const individualActivities = activities.filter((a) => a.category === 'home_individual');

  const filteredActivities =
    skillFilter === 'all'
      ? individualActivities
      : individualActivities.filter((a) => a.basketballSkillCategory === skillFilter);

  // Shooting accuracy calculations
  const shootingSessions = individualActivities.filter(
    (a) => a.basketballAttempts && a.basketballAttempts > 0 && a.basketballMakes !== undefined
  );

  const totalAttempts = shootingSessions.reduce((acc, a) => acc + (a.basketballAttempts || 0), 0);
  const totalMakes = shootingSessions.reduce((acc, a) => acc + (a.basketballMakes || 0), 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalMakes / totalAttempts) * 100) : 0;

  // Free throws accuracy
  const freeThrowSessions = shootingSessions.filter(
    (a) => a.basketballSkillCategory === 'tiros_libres' || (a.basketballDrillName || '').toLowerCase().includes('libre')
  );
  const ftAttempts = freeThrowSessions.reduce((acc, a) => acc + (a.basketballAttempts || 0), 0);
  const ftMakes = freeThrowSessions.reduce((acc, a) => acc + (a.basketballMakes || 0), 0);
  const ftAccuracy = ftAttempts > 0 ? Math.round((ftMakes / ftAttempts) * 100) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#B7F56A]/15 via-[#15191F] to-[#0B0D10] border border-[#B7F56A]/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#B7F56A]" />
              <span className="text-xs font-mono-num font-bold text-[#B7F56A] uppercase tracking-wider">
                Aro en Patio • Espacio Reducido
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
              TÉCNICA INDIVIDUAL Y TIRO
            </h1>
            <p className="text-xs sm:text-sm text-[#9299A5] max-w-2xl">
              Medí tu efectividad de tiro real (tiros libres, mecánica, posiciones) y el volumen de repeticiones en manejo de balón y desplazamientos en tu patio.
            </p>
          </div>

          <button
            onClick={() => onOpenNewActivity('home_individual')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-black bg-[#B7F56A] hover:bg-[#cbf988] shadow-lg shadow-[#B7F56A]/20 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar práctica de básquet</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Efectividad General de Tiro</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-num font-black text-3xl text-[#B7F56A]">
              {totalAttempts > 0 ? `${overallAccuracy}%` : '—'}
            </span>
            <span className="text-xs text-[#9299A5]">
              {totalMakes}/{totalAttempts} tiros
            </span>
          </div>
          <div className="text-[10px] text-[#6D7787] mt-1">
            Fórmula: (Aciertos ÷ Intentos) × 100
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Efectividad en Tiros Libres</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-num font-black text-3xl text-white">
              {ftAccuracy !== null ? `${ftAccuracy}%` : '—'}
            </span>
            {ftAttempts > 0 && (
              <span className="text-xs text-[#9299A5]">
                {ftMakes}/{ftAttempts}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">
            {freeThrowSessions.length} sesiones de libres registradas
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Sesiones Individuales</div>
          <div className="font-mono-num font-black text-3xl text-white">
            {individualActivities.length}
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">
            {individualActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0)} min en patio
          </div>
        </div>
      </div>

      {/* Filter by skill */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Todas las destrezas' },
          { id: 'tiros_libres', label: 'Tiros libres' },
          { id: 'mecanica_tiro', label: 'Mecánica de tiro' },
          { id: 'lanzamientos_posicion', label: 'Posiciones de tiro' },
          { id: 'manejo_balon', label: 'Manejo de balón' },
          { id: 'finalizaciones_aro', label: 'Finalizaciones' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSkillFilter(btn.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              skillFilter === btn.id
                ? 'bg-[#B7F56A] text-black border-[#B7F56A]'
                : 'bg-[#15191F] border-[#222A36] text-[#9299A5] hover:text-white'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
            Prácticas en el Patio
          </h3>
          <span className="text-xs text-[#9299A5]">{filteredActivities.length} prácticas</span>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] hover:border-[#B7F56A]/40 hover:bg-[#12161D] transition cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#B7F56A]/15 border border-[#B7F56A]/30 flex items-center justify-center text-[#B7F56A] font-bold text-xs shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-[#B7F56A] transition-colors">
                          {act.basketballDrillName || 'Práctica Individual'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2633] text-[#9299A5]">
                          {act.date}
                        </span>
                      </div>
                      <div className="text-xs text-[#6D7787] flex items-center gap-2 mt-0.5">
                        <span>{act.durationMinutes} min</span>
                        {act.basketballSkillCategory && (
                          <span className="capitalize">• {act.basketballSkillCategory.replace('_', ' ')}</span>
                        )}
                        {act.basketballShotPosition && <span>• {act.basketballShotPosition}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {act.basketballAccuracyPercentage !== undefined && (
                      <div className="text-right">
                        <div className="font-mono-num font-black text-sm text-[#B7F56A]">
                          {act.basketballAccuracyPercentage}%
                        </div>
                        <div className="text-[10px] text-[#6D7787]">
                          {act.basketballMakes}/{act.basketballAttempts} aciertos
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
                  </div>
                </div>

                {act.notes && (
                  <p className="mt-2 text-xs text-[#9299A5] italic bg-[#15191F]/40 p-2 rounded-lg border border-[#1E2530]">
                    "{act.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Target className="w-10 h-10 text-[#6D7787] mx-auto" />
            <p className="text-sm font-bold text-white">No tenés prácticas registradas para este filtro</p>
            <p className="text-xs text-[#6D7787] max-w-sm mx-auto">
              Registrá tus tiros libres o trabajo de balón en el patio para ver tu curva de efectividad.
            </p>
            <button
              onClick={() => onOpenNewActivity('home_individual')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#B7F56A] hover:bg-[#cbf988] transition"
            >
              + Registrar práctica
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
