import React from 'react';
import {
  Dumbbell,
  Plus,
  Flame,
  ChevronRight,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import { Activity, RoutineTemplate } from '../../types';

interface Props {
  activities: Activity[];
  templates: RoutineTemplate[];
  onOpenNewActivity: (category?: any) => void;
  onSelectActivity: (activity: Activity) => void;
}

export const GymSessionView: React.FC<Props> = ({
  activities,
  templates,
  onOpenNewActivity,
  onSelectActivity,
}) => {
  const gymActivities = activities.filter((a) => a.category === 'institute_gym');
  const gymTemplates = templates.filter((t) => t.category === 'gym');

  const totalGymMinutes = gymActivities.reduce(
    (acc, a) => (a.status === 'completed' || a.status === 'partial' ? acc + (a.durationMinutes || 0) : acc),
    0
  );

  const totalExercisesLogged = gymActivities.reduce((acc, act) => {
    return acc + (act.gymExercises?.length || 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF6B2C]/20 via-[#15191F] to-[#0B0D10] border border-[#FF6B2C]/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-[#FF6B2C]" />
              <span className="text-xs font-mono-num font-bold text-[#FF6B2C] uppercase tracking-wider">
                Gimnasio del Club
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
              GIMNASIO INSTITUTO — FUERZA Y CARGAS
            </h1>
            <p className="text-xs sm:text-sm text-[#9299A5] max-w-2xl">
              Registrá las series, repeticiones y cargas efectivas de tus sesiones de pesas en Instituto. Llevá un registro claro de tus levantamientos y el foco de cada sesión.
            </p>
          </div>

          <button
            onClick={() => onOpenNewActivity('institute_gym')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-black bg-[#FF6B2C] hover:bg-[#FF8243] shadow-lg shadow-[#FF6B2C]/25 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar sesión gimnasio</span>
          </button>
        </div>
      </div>

      {/* Stats Cards (without volume tonnage) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="flex items-center justify-between text-xs text-[#9299A5] mb-1">
            <span>Sesiones Registradas</span>
            <Calendar className="w-4 h-4 text-[#FF6B2C]" />
          </div>
          <div className="font-mono-num font-black text-3xl text-white">{gymActivities.length}</div>
          <div className="text-[11px] text-[#6D7787] mt-1">{totalGymMinutes} minutos totales en el gym</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="flex items-center justify-between text-xs text-[#9299A5] mb-1">
            <span>Series y Ejercicios</span>
            <Layers className="w-4 h-4 text-[#B7F56A]" />
          </div>
          <div className="font-mono-num font-black text-3xl text-[#B7F56A]">
            {totalExercisesLogged}
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">
            Ejercicios cargados con series y pesos
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="flex items-center justify-between text-xs text-[#9299A5] mb-1">
            <span>Intensidad Media</span>
            <Flame className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-mono-num font-black text-3xl text-white">
            {gymActivities.length > 0
              ? (
                  gymActivities.reduce((acc, a) => acc + (a.rpe || 0), 0) / gymActivities.length
                ).toFixed(1)
              : '0'}{' '}
            <span className="text-xs text-[#9299A5]">/ 10</span>
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">RPE promedio registrado</div>
        </div>
      </div>

      {/* Routine Templates / Saved Gym Guidelines */}
      {gymTemplates.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
          <h3 className="font-display font-bold text-sm text-white tracking-wider uppercase mb-3">
            Plantillas y Referencias Frecuentes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gymTemplates.map((t) => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-[#FF6B2C]">{t.title}</span>
                  <span className="text-[10px] font-mono-num text-[#9299A5]">~{t.targetMinutes} min</span>
                </div>
                <p className="text-xs text-[#9299A5] mb-3">{t.description}</p>
                <div className="space-y-1 text-xs">
                  {t.items.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[#6D7787] text-[11px]">
                      <span className="text-white truncate max-w-[180px]">{it.name}</span>
                      <span className="font-mono-num">
                        {it.sets}×{it.reps}
                      </span>
                    </div>
                  ))}
                  {t.items.length > 3 && (
                    <div className="text-[10px] text-[#FF6B2C] pt-1">
                      +{t.items.length - 3} ejercicios más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
            Sesiones de Gimnasio Registradas
          </h3>
          <span className="text-xs text-[#9299A5]">{gymActivities.length} sesiones</span>
        </div>

        {gymActivities.length > 0 ? (
          <div className="space-y-3">
            {gymActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] hover:border-[#FF6B2C]/40 hover:bg-[#12161D] transition cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] font-bold text-xs shrink-0">
                      <Dumbbell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-[#FF6B2C] transition-colors">
                          {act.gymGoal || 'Sesión de Fuerza Instituto'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2633] text-[#9299A5]">
                          {act.date}
                        </span>
                      </div>
                      <div className="text-xs text-[#6D7787] flex items-center gap-2 mt-0.5">
                        <span>{act.durationMinutes} min</span>
                        {act.rpe !== undefined && <span>• RPE {act.rpe}/10</span>}
                        {act.gymExercises && <span>• {act.gymExercises.length} ejercicios</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Exercises detail list */}
                {act.gymExercises && act.gymExercises.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#18202A]">
                    {act.gymExercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#15191F] text-xs text-[#9299A5]"
                      >
                        <span className="font-medium text-white truncate max-w-[160px]">
                          {ex.name}
                        </span>
                        <span className="font-mono-num font-semibold text-[#FF8243]">
                          {ex.sets} × {ex.reps} reps @ {ex.weightKg} kg
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Dumbbell className="w-10 h-10 text-[#6D7787] mx-auto" />
            <p className="text-sm font-bold text-white">No tenés sesiones de gimnasio registradas</p>
            <p className="text-xs text-[#6D7787] max-w-sm mx-auto">
              Registrá tus días de pesas en el club para medir tu progreso de fuerza y controlar los ejercicios que realizás.
            </p>
            <button
              onClick={() => onOpenNewActivity('institute_gym')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition"
            >
              + Registrar primera sesión de gimnasio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
