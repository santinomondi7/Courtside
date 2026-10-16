import React, { useState } from 'react';
import {
  Users,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Flame,
  Award,
  ChevronRight,
  Zap,
  Sparkles,
  ShieldCheck,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { Activity } from '../../types';
import { MOTIVATIONAL_CUES } from '../../data/motivationalQuotes';

interface Props {
  activities: Activity[];
  onOpenNewActivity: (category?: any) => void;
  onSelectActivity: (activity: Activity) => void;
}

export const IACCTeamView: React.FC<Props> = ({
  activities,
  onOpenNewActivity,
  onSelectActivity,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'U17' | 'U21'>('all');
  const [quoteIndex, setQuoteIndex] = useState(1); // Defaults to U21 cue

  const iaccActivities = activities.filter((a) => a.category === 'iacc_team');
  const u17Activities = iaccActivities.filter((a) => a.iaccCategoryLevel === 'U17' || !a.iaccCategoryLevel);
  const u21Activities = iaccActivities.filter((a) => a.iaccCategoryLevel === 'U21');

  const filteredActivities =
    levelFilter === 'all'
      ? iaccActivities
      : levelFilter === 'U17'
      ? u17Activities
      : u21Activities;

  const completedSessions = filteredActivities.filter((a) => a.status === 'completed');

  // Stats
  const totalMinutes = completedSessions.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const avgRpe =
    completedSessions.length > 0
      ? (
          completedSessions.reduce((acc, a) => acc + (a.rpe || 0), 0) / completedSessions.length
        ).toFixed(1)
      : '0';

  // Aggregate contents worked
  const contentCounts: Record<string, number> = {};
  completedSessions.forEach((s) => {
    s.iaccContents?.forEach((c) => {
      contentCounts[c] = (contentCounts[c] || 0) + 1;
    });
  });

  const topContents = Object.entries(contentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Relevant quotes for team practices and frustration/roce
  const relevantQuotes = MOTIVATIONAL_CUES.filter(
    (c) => c.category === 'u21_roce' || c.category === 'frustration' || c.category === 'next_play'
  );
  const activeQuote = relevantQuotes[quoteIndex % relevantQuotes.length];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950/40 via-[#15191F] to-[#0B0D10] border border-red-500/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono-num font-bold text-red-400 uppercase tracking-wider">
                Instituto Atlético Central Córdoba
              </span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
              ENTRENAMIENTOS DE EQUIPO — LA GLORIA
            </h1>
            <p className="text-xs sm:text-sm text-[#9299A5] max-w-2xl">
              Registro de prácticas dirigidas en IACC. Llevá el seguimiento separado de tus prácticas en{' '}
              <strong className="text-white">U17</strong> (tu categoría base) y tus sesiones con{' '}
              <strong className="text-[#FF6B2C]">U21</strong> (roce superior y desarrollo competitivo).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenNewActivity('iacc_team')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Registrar Práctica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mental Coaching Card for Practices / Roce / Frustration */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#1E2533] via-[#151922] to-[#12161E] border border-[#2B374A] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#FF6B2C]/20 border border-[#FF6B2C]/40 flex items-center justify-center text-[#FF6B2C] shrink-0 mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-num font-bold px-2 py-0.5 rounded bg-[#FF6B2C]/20 text-[#FF6B2C] uppercase tracking-wider">
                  {activeQuote.tag}
                </span>
                <span className="text-xs text-[#9299A5] font-semibold">{activeQuote.author}</span>
              </div>
              <p className="text-xs sm:text-sm text-white font-medium italic">
                "{activeQuote.quote}"
              </p>
              {activeQuote.actionableStep && (
                <p className="text-xs text-[#B7F56A] font-semibold flex items-center gap-1.5 pt-0.5">
                  <span>💡 Clave práctica:</span>
                  <span>{activeQuote.actionableStep}</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setQuoteIndex((prev) => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#232C3A] transition shrink-0 self-end sm:self-center"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Otro consejo mental</span>
          </button>
        </div>
      </div>

      {/* Category Level Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-[#15191F] border border-[#222A36]">
        <button
          onClick={() => setLevelFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            levelFilter === 'all'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-[#9299A5] hover:text-white hover:bg-[#1A212B]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Todas las prácticas</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30">
            {iaccActivities.length}
          </span>
        </button>

        <button
          onClick={() => setLevelFilter('U17')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            levelFilter === 'U17'
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'text-[#9299A5] hover:text-white hover:bg-[#1A212B]'
          }`}
        >
          <span>🏀 U17 — Categoría Base</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30">
            {u17Activities.length}
          </span>
        </button>

        <button
          onClick={() => setLevelFilter('U21')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            levelFilter === 'U21'
              ? 'bg-[#FF6B2C] text-black shadow-md shadow-[#FF6B2C]/30'
              : 'text-[#9299A5] hover:text-white hover:bg-[#1A212B]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>⚡ U21 — Roce Superior</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/30">
            {u21Activities.length}
          </span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">
            {levelFilter === 'all'
              ? 'Prácticas Totales IACC'
              : levelFilter === 'U17'
              ? 'Prácticas U17'
              : 'Prácticas U21'}
          </div>
          <div className="font-mono-num font-black text-3xl text-white">{completedSessions.length}</div>
          <div className="text-[11px] text-[#6D7787] mt-1">{totalMinutes} minutos en cancha</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Sesiones con U21</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-num font-black text-3xl text-[#FF6B2C]">{u21Activities.length}</span>
            <span className="text-xs text-[#9299A5]">sesiones</span>
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">Roce y físico con mayores</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Intensidad Media (RPE)</div>
          <div className="font-mono-num font-black text-3xl text-red-400">{avgRpe} / 10</div>
          <div className="text-[11px] text-[#6D7787] mt-1">Exigencia física y mental</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
          <div className="text-xs text-[#9299A5] mb-1">Foco Más Trabajado</div>
          <div className="font-display font-bold text-lg text-white truncate">
            {topContents[0] ? topContents[0][0] : 'Sin datos'}
          </div>
          <div className="text-[11px] text-[#6D7787] mt-1">
            {topContents[0] ? `${topContents[0][1]} sesiones enfocadas` : 'Registrá tus prácticas'}
          </div>
        </div>
      </div>

      {/* Top Contents Breakdown */}
      {topContents.length > 0 && (
        <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
          <h3 className="font-display font-bold text-sm text-white tracking-wider uppercase mb-3">
            Distribución de Contenidos en Prácticas {levelFilter !== 'all' ? `(${levelFilter})` : ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            {topContents.map(([content, count]) => (
              <span
                key={content}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0B0D10] border border-[#252E3C] text-white"
              >
                <span>{content}</span>
                <span className="font-mono-num text-[11px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
              Historial de Prácticas
            </h3>
            <span className="text-xs font-mono-num text-[#9299A5]">
              ({filteredActivities.length} {filteredActivities.length === 1 ? 'sesión' : 'sesiones'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewActivity('iacc_team')}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition"
            >
              + Nueva práctica
            </button>
          </div>
        </div>

        {filteredActivities.length > 0 ? (
          <div className="space-y-3">
            {filteredActivities.map((act) => {
              const isU21 = act.iaccCategoryLevel === 'U21';
              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className={`p-4 rounded-2xl bg-[#0B0D10] border transition cursor-pointer group ${
                    isU21
                      ? 'border-[#FF6B2C]/40 hover:border-[#FF6B2C] hover:bg-[#15120E]'
                      : 'border-[#1E2530] hover:border-red-500/40 hover:bg-[#12161D]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isU21
                            ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {isU21 ? 'U21' : 'U17'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">
                            {isU21 ? 'Entrenamiento U21 — Roce Superior' : 'Entrenamiento U17 — Formativas'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isU21
                                ? 'bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {isU21 ? '⚡ Roce U21' : '🏀 U17'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2633] text-[#9299A5]">
                            {act.date}
                          </span>
                        </div>
                        <div className="text-xs text-[#6D7787] flex items-center gap-2 mt-0.5">
                          <span>{act.durationMinutes} min</span>
                          {act.rpe !== undefined && <span>• RPE {act.rpe}/10</span>}
                          {act.iaccAttendance && (
                            <span>
                              •{' '}
                              {act.iaccAttendance === 'present'
                                ? 'Presente completo'
                                : act.iaccAttendance === 'partial'
                                ? 'Parcial'
                                : 'Ausente'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  {/* Contents tags */}
                  {act.iaccContents && act.iaccContents.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-[#18202A]">
                      {act.iaccContents.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#15191F] text-[#9299A5] border border-[#222A36]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Key reflections */}
                  {(act.iaccWhatWentWell || act.iaccNeedsImprovement) && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#15191F]/50 p-2.5 rounded-xl border border-[#1E2530]">
                      {act.iaccWhatWentWell && (
                        <div>
                          <span className="text-[#B7F56A] font-semibold">✓ Bien: </span>
                          <span className="text-[#9299A5]">{act.iaccWhatWentWell}</span>
                        </div>
                      )}
                      {act.iaccNeedsImprovement && (
                        <div>
                          <span className="text-[#FF6B2C] font-semibold">⚡ Corregir / Foco: </span>
                          <span className="text-[#9299A5]">{act.iaccNeedsImprovement}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <Users className="w-10 h-10 text-[#6D7787] mx-auto" />
            <p className="text-sm font-bold text-white">
              {levelFilter === 'all'
                ? 'No tenés entrenamientos de IACC registrados'
                : `No tenés entrenamientos registrados en ${levelFilter}`}
            </p>
            <p className="text-xs text-[#6D7787] max-w-sm mx-auto">
              {levelFilter === 'U21'
                ? 'Cuando te suban a entrenar con U21, registrá la práctica acá para evaluar tu adaptación al ritmo y roce físico.'
                : 'Registrá tus prácticas del club para llevar un seguimiento detallado.'}
            </p>
            <button
              onClick={() => onOpenNewActivity('iacc_team')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition"
            >
              + Registrar entrenamiento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
