import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Target,
  ArrowUpRight,
  TrendingUp,
  Zap,
  Calendar,
  Users,
  Dumbbell,
  Home,
  Trophy,
  HeartPulse,
  Coffee,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  PlayCircle,
  Plus,
  Brain,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  Activity,
  PhysicalMeasurement,
  PersonalGoal,
  UserProfile,
  ActivityCategory,
  AthleticRecommendation,
} from '../../types';
import { MOTIVATIONAL_CUES } from '../../data/motivationalQuotes';

interface Props {
  profile: UserProfile;
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  goals: PersonalGoal[];
  recommendations: AthleticRecommendation[];
  onOpenNewActivity: (category?: ActivityCategory) => void;
  onSelectActivity: (activity: Activity) => void;
  onNavigateSection: (section: any) => void;
}

export const Dashboard: React.FC<Props> = ({
  profile,
  activities,
  measurements,
  goals,
  recommendations,
  onOpenNewActivity,
  onSelectActivity,
  onNavigateSection,
}) => {
  // Current time & week boundaries
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12 ? 'Buenos días' : currentHour < 20 ? 'Buenas tardes' : 'Buenas noches';

  // Mental resilience state
  const [mentalCategory, setMentalCategory] = useState<
    'all' | 'frustration' | 'u21_roce' | 'shooting' | 'next_play'
  >('all');
  const [mentalQuoteIndex, setMentalQuoteIndex] = useState<number>(0);
  const [showResetProtocol, setShowResetProtocol] = useState<boolean>(false);

  const filteredQuotes =
    mentalCategory === 'all'
      ? MOTIVATIONAL_CUES
      : MOTIVATIONAL_CUES.filter((q) => q.category === mentalCategory);
  const currentQuote =
    filteredQuotes[mentalQuoteIndex % filteredQuotes.length] || MOTIVATIONAL_CUES[0];

  // Calculate current week activities (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);

  const completedActivities = activities.filter(
    (a) => a.status === 'completed' || a.status === 'partial'
  );

  const thisWeekActivities = completedActivities.filter((a) => new Date(a.date) >= oneWeekAgo);
  const lastWeekActivities = completedActivities.filter((a) => {
    const d = new Date(a.date);
    return d >= twoWeeksAgo && d < oneWeekAgo;
  });

  const thisWeekMinutes = thisWeekActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const lastWeekMinutes = lastWeekActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

  const weeklyTargetMinutes = profile.weeklyTargetMinutes || 480;
  const progressPercent = Math.min(100, Math.round((thisWeekMinutes / weeklyTargetMinutes) * 100));

  const minutesDiff = thisWeekMinutes - lastWeekMinutes;
  const minutesComparisonText =
    lastWeekMinutes > 0
      ? minutesDiff >= 0
        ? `+${minutesDiff} min que semana anterior`
        : `${minutesDiff} min que semana anterior`
      : 'Primer período registrado';

  // Shooting accuracy from real records
  const shootingSessions = completedActivities.filter(
    (a) =>
      a.category === 'home_individual' &&
      a.basketballAttempts &&
      a.basketballAttempts > 0 &&
      a.basketballMakes !== undefined
  );

  const totalShotsAttempted = shootingSessions.reduce((acc, a) => acc + (a.basketballAttempts || 0), 0);
  const totalShotsMade = shootingSessions.reduce((acc, a) => acc + (a.basketballMakes || 0), 0);
  const overallShootingAccuracy =
    totalShotsAttempted > 0 ? Math.round((totalShotsMade / totalShotsAttempted) * 100) : null;

  // Best vertical jump measurement
  const jumpMeasurements = measurements.filter((m) => m.testType === 'vertical_jump');
  const bestJump = jumpMeasurements.reduce(
    (max, m) => (m.result > (max?.result || 0) ? m : max),
    null as PhysicalMeasurement | null
  );

  // Best sprint measurement (10m or 5m, lower is better)
  const sprintMeasurements = measurements.filter((m) => m.testType.startsWith('sprint'));
  const bestSprint = sprintMeasurements.reduce(
    (best, m) => (!best || m.result < best.result ? m : best),
    null as PhysicalMeasurement | null
  );

  // Next planned session by the player
  const plannedActivities = activities
    .filter((a) => a.status === 'planned' && new Date(a.date) >= new Date(now.toISOString().split('T')[0]))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextPlannedSession = plannedActivities[0] || null;

  // Recent 5 activities
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryMeta = (cat: ActivityCategory) => {
    switch (cat) {
      case 'iacc_team':
        return { label: 'IACC Equipo', color: '#EF4444', bg: 'bg-red-500/15', border: 'border-red-500/30' };
      case 'institute_gym':
        return { label: 'Gimnasio IACC', color: '#FF6B2C', bg: 'bg-[#FF6B2C]/15', border: 'border-[#FF6B2C]/30' };
      case 'home_physical':
        return { label: 'Físico en Casa', color: '#3B82F6', bg: 'bg-blue-500/15', border: 'border-blue-500/30' };
      case 'home_individual':
        return { label: 'Técnica Individual', color: '#B7F56A', bg: 'bg-[#B7F56A]/15', border: 'border-[#B7F56A]/30' };
      case 'match':
        return { label: 'Partido Oficial', color: '#F59E0B', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
      case 'recovery':
        return { label: 'Recuperación', color: '#10B981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
      case 'rest':
        return { label: 'Descanso', color: '#8B5CF6', bg: 'bg-purple-500/15', border: 'border-purple-500/30' };
      default:
        return { label: 'Actividad', color: '#EC4899', bg: 'bg-pink-500/15', border: 'border-pink-500/30' };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Greeting & Club Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#15191F] via-[#12161C] to-[#0B0D10] border border-[#202734]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-num text-[#9299A5] uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-[#B7F56A]" />
            {profile.club}
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
            {greeting}, {profile.name} <span className="text-[#FF6B2C]">#{profile.jerseyNumber}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9299A5] mt-0.5">
            {thisWeekActivities.length > 0
              ? `Completaste ${thisWeekActivities.length} sesiones en los últimos 7 días con un volumen de ${thisWeekMinutes} minutos.`
              : 'Semana lista para registrar entrenamientos y mediciones de rendimiento.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewActivity()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-[#FF6B2C] hover:bg-[#FF8243] shadow-lg shadow-[#FF6B2C]/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar sesión</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Performance Card (Visual Centerpiece) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C222C] via-[#141820] to-[#0D1015] border border-[#2B3545] p-6 sm:p-8 court-glow">
        {/* Subtle geometric basketball court arc decorative background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-5">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="400" cy="200" r="180" fill="none" stroke="#FF6B2C" strokeWidth="8" />
            <line x1="220" y1="200" x2="400" y2="200" stroke="#FF6B2C" strokeWidth="6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono-num font-bold bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/40 uppercase tracking-wider">
                Período en curso
              </span>
              <span className="text-xs text-[#9299A5] font-medium">Últimos 7 días</span>
            </div>

            <div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide leading-none">
                TU RENDIMIENTO SEMANAL
              </h2>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-mono-num font-black text-4xl sm:text-5xl text-[#FF6B2C] tracking-tight">
                  {thisWeekMinutes}
                </span>
                <span className="text-sm font-semibold text-[#9299A5]">
                  / {weeklyTargetMinutes} min objetivo
                </span>
                <span className="text-xs font-mono-num font-bold text-[#B7F56A] bg-[#B7F56A]/10 border border-[#B7F56A]/30 px-2 py-0.5 rounded-md">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Comparison Pill */}
            <div className="flex items-center gap-2 text-xs text-[#9299A5]">
              <TrendingUp className="w-4 h-4 text-[#FF6B2C]" />
              <span>{minutesComparisonText}</span>
            </div>

            {/* Athletic Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-3 bg-[#0B0D10] rounded-full overflow-hidden border border-[#222A36]">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#B7F56A] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono-num text-[#6D7787]">
                <span>0 min</span>
                <span>Objetivo semanal: {weeklyTargetMinutes} min</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Inside Hero Card */}
          <div className="grid grid-cols-2 gap-3 sm:w-80 shrink-0">
            <div className="p-4 rounded-2xl bg-[#0B0D10]/80 border border-[#222A36] backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-[#9299A5] mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#FF6B2C]" />
                <span>Sesiones</span>
              </div>
              <div className="font-mono-num font-bold text-2xl text-white">
                {thisWeekActivities.length}
              </div>
              <div className="text-[10px] text-[#6D7787] mt-0.5">
                Meta: {profile.weeklyTargetSessions || 6} / sem
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0D10]/80 border border-[#222A36] backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs text-[#9299A5] mb-1">
                <Flame className="w-3.5 h-3.5 text-yellow-400" />
                <span>Constancia</span>
              </div>
              <div className="font-mono-num font-bold text-2xl text-[#B7F56A]">
                {Math.min(100, Math.round((thisWeekActivities.length / (profile.weeklyTargetSessions || 6)) * 100))}%
              </div>
              <div className="text-[10px] text-[#6D7787] mt-0.5">Cumplimiento</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0D10]/80 border border-[#222A36] backdrop-blur-sm col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#9299A5]">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  <span>Equipo IACC</span>
                </div>
                <span className="text-[11px] font-bold text-white">
                  {thisWeekActivities.filter((a) => a.category === 'iacc_team').length} sesiones
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Fortaleza Mental & Manejo de la Frustración (Mental Game & Reset) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#171D27] via-[#131720] to-[#0D1015] border border-[#273344] relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/20 border border-[#FF6B2C]/40 flex items-center justify-center text-[#FF6B2C]">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm sm:text-base text-white tracking-wide uppercase">
                Fortaleza Mental & Manejo de la Frustración
              </h3>
              <p className="text-[11px] text-[#9299A5]">
                Pautas competitivas para cuando no te salen las cosas, te enojás o entrenás contra rivales más grandes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowResetProtocol(!showResetProtocol)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showResetProtocol
                  ? 'bg-red-500/20 text-red-300 border-red-500/50'
                  : 'bg-[#0B0D10] text-[#FF6B2C] border-[#FF6B2C]/40 hover:bg-[#FF6B2C]/10'
              }`}
            >
              <span>{showResetProtocol ? '✕ Cerrar protocolo' : '🆘 ¿Saliste caliente? Reset 4x4'}</span>
            </button>
            <button
              onClick={() => setMentalQuoteIndex((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#242C3A] hover:bg-[#1A222E] transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Otro consejo</span>
            </button>
          </div>
        </div>

        {/* Categories selector */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'frustration', label: '😤 Bronca y Frustración' },
            { id: 'u21_roce', label: '⚡ Roce con U21' },
            { id: 'shooting', label: '🎯 Confianza en Tiro' },
            { id: 'next_play', label: '🔄 Siguiente Jugada' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setMentalCategory(cat.id as any);
                setMentalQuoteIndex(0);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                mentalCategory === cat.id
                  ? 'bg-[#FF6B2C] text-black border-[#FF6B2C] font-bold'
                  : 'bg-[#0B0D10] border-[#202734] text-[#9299A5] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Active Quote Card */}
        <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#202836] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-bold bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/30 uppercase tracking-wider">
              {currentQuote.tag}
            </span>
            <span className="text-xs text-[#9299A5] font-semibold">{currentQuote.author}</span>
          </div>

          <p className="text-sm text-white font-medium italic leading-relaxed">
            "{currentQuote.quote}"
          </p>

          {currentQuote.actionableStep && (
            <div className="pt-2 border-t border-[#1B222D] flex items-start gap-2 text-xs text-[#B7F56A]">
              <span className="font-bold shrink-0">⚡ Qué hacer ahora:</span>
              <span>{currentQuote.actionableStep}</span>
            </div>
          )}
        </div>

        {/* Expandable Protocol for High Anger / Slumps */}
        {showResetProtocol && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-950/30 to-[#0B0D10] border border-red-500/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>⚡ Protocolo de Emergencia: Desarme del Enojo en 3 Pasos</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B0D10]/80 border border-red-500/20">
                <span className="font-bold text-white block mb-1">1. Respiración 4x4 (Biológica)</span>
                <p className="text-[#9299A5] leading-relaxed">
                  Inhalá 4 segundos por la nariz, sostené 4 segundos, y soltá en 4 segundos. Esto baja el cortisol y le quita la sangre a la rabia para devolvérsela a la visión periférica.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10]/80 border border-red-500/20">
                <span className="font-bold text-white block mb-1">2. Separá Error de Identidad</span>
                <p className="text-[#9299A5] leading-relaxed">
                  Errar un tiro, perder un pase o que un jugador de U21 te mueva en el poste <em>NO significa</em> que seas malo. Significa que estás en el proceso de desarrollo. El enojo solo agranda el error.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10]/80 border border-red-500/20">
                <span className="font-bold text-white block mb-1">3. Foco en lo Inmediato</span>
                <p className="text-[#9299A5] leading-relaxed">
                  En el básquetbol, la siguiente posesión arranca en 3 segundos. Olvidate del pasado: sprint a balance defensivo, hablá en los bloqueos y tocá la pelota con un pase seguro.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Real Performance Quick Stats Grid (Backed exclusively by verified records) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
            Métricas Clave de Rendimiento
          </h3>
          <button
            onClick={() => onNavigateSection('stats')}
            className="text-xs font-semibold text-[#FF6B2C] hover:text-[#FF8243] flex items-center gap-1"
          >
            Ver análisis completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Shooting Accuracy */}
          <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#9299A5] mb-2">
                <span className="font-semibold text-white">Efectividad de Tiro</span>
                <Target className="w-4 h-4 text-[#B7F56A]" />
              </div>
              {overallShootingAccuracy !== null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num font-black text-3xl text-[#B7F56A]">
                      {overallShootingAccuracy}%
                    </span>
                    <span className="text-xs text-[#9299A5]">promedio</span>
                  </div>
                  <p className="text-[11px] text-[#9299A5] mt-1">
                    {totalShotsMade} de {totalShotsAttempted} tiros convertidos en patio.
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-[#6D7787]">Todavía no hay tiros registrados.</p>
                  <button
                    onClick={() => onOpenNewActivity('home_individual')}
                    className="mt-2 text-xs font-bold text-[#FF6B2C] hover:underline"
                  >
                    + Registrar práctica de tiro
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Vertical Jump PR */}
          <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#9299A5] mb-2">
                <span className="font-semibold text-white">Salto Vertical Máx</span>
                <Zap className="w-4 h-4 text-[#FF6B2C]" />
              </div>
              {bestJump ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num font-black text-3xl text-white">
                      {bestJump.result}
                    </span>
                    <span className="text-xs font-bold text-[#FF6B2C]">{bestJump.unit}</span>
                  </div>
                  <p className="text-[11px] text-[#9299A5] mt-1">
                    Récord verificado el {bestJump.date} ({bestJump.testName}).
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-[#6D7787]">Sin medición de salto registrada.</p>
                  <button
                    onClick={() => onNavigateSection('stats')}
                    className="mt-2 text-xs font-bold text-[#FF6B2C] hover:underline"
                  >
                    + Registrar test de salto
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Sprint Speed PR */}
          <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#9299A5] mb-2">
                <span className="font-semibold text-white">Mejor Sprint Registrado</span>
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              {bestSprint ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num font-black text-3xl text-white">
                      {bestSprint.result}
                    </span>
                    <span className="text-xs font-bold text-yellow-400">{bestSprint.unit}</span>
                  </div>
                  <p className="text-[11px] text-[#9299A5] mt-1 truncate" title={bestSprint.testName}>
                    {bestSprint.testName} ({bestSprint.date})
                  </p>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-[#6D7787]">Sin tiempos de sprint registrados.</p>
                  <button
                    onClick={() => onNavigateSection('stats')}
                    className="mt-2 text-xs font-bold text-[#FF6B2C] hover:underline"
                  >
                    + Registrar sprint
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Active Goals */}
          <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#9299A5] mb-2">
                <span className="font-semibold text-white">Objetivos Deportivos</span>
                <Trophy className="w-4 h-4 text-[#FF8243]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-num font-black text-3xl text-white">
                  {goals.filter((g) => g.status === 'active').length}
                </span>
                <span className="text-xs text-[#9299A5]">en seguimiento</span>
              </div>
              <p className="text-[11px] text-[#9299A5] mt-1">
                {goals.filter((g) => g.status === 'completed').length} cumplidos en total.
              </p>
            </div>
            <button
              onClick={() => onNavigateSection('goals')}
              className="mt-3 text-xs font-bold text-[#FF6B2C] hover:underline text-left"
            >
              Ver objetivos →
            </button>
          </div>
        </div>
      </div>

      {/* 4. Coach Recommendations Card (Explainable Sports Advice) */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FF6B2C]" />
            <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
              Asistente de Rendimiento y Prevención
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.slice(0, 2).map((rec) => {
              const isAlert = rec.type === 'alert';
              const isWarning = rec.type === 'warning';
              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition ${
                    isAlert
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : isWarning
                      ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-200'
                      : 'bg-[#15191F] border-[#252E3C] text-[#F5F6F8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-white">
                      {isAlert ? (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                      )}
                      <span>{rec.title}</span>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-[#9299A5] leading-relaxed">{rec.description}</p>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-[#6D7787] italic truncate max-w-[280px]">
                      {rec.evidence}
                    </span>
                    {rec.actionLabel && (
                      <button
                        onClick={() => {
                          if (rec.actionCategory) {
                            onOpenNewActivity(rec.actionCategory);
                          } else {
                            onNavigateSection('stats');
                          }
                        }}
                        className="font-bold text-[#FF6B2C] hover:underline shrink-0 ml-2"
                      >
                        {rec.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Next Planned Activity & Quick Launch Pads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Planned Activity */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-[#15191F] border border-[#222A36] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-num font-bold text-[#9299A5] uppercase tracking-wider">
                Próxima Actividad
              </span>
              <Calendar className="w-4 h-4 text-[#FF6B2C]" />
            </div>

            {nextPlannedSession ? (
              <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#222A36] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono-num font-bold text-[#FF6B2C]">
                    {nextPlannedSession.date} {nextPlannedSession.startTime ? `• ${nextPlannedSession.startTime}` : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF6B2C]/15 text-[#FF6B2C]">
                    Planificada
                  </span>
                </div>
                <div className="font-bold text-sm text-white">
                  {getCategoryMeta(nextPlannedSession.category).label}
                </div>
                <div className="text-xs text-[#9299A5]">
                  Duración prevista: {nextPlannedSession.durationMinutes} minutos
                </div>
                {nextPlannedSession.notes && (
                  <p className="text-xs text-[#6D7787] italic line-clamp-2">
                    "{nextPlannedSession.notes}"
                  </p>
                )}
                <button
                  onClick={() => onSelectActivity(nextPlannedSession)}
                  className="mt-2 w-full py-2 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition"
                >
                  Abrir / Completar sesión
                </button>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1F2633] text-[#FF6B2C] flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">No tenés sesiones planificadas</p>
                  <p className="text-[11px] text-[#6D7787] mt-0.5">
                    Planificá tu próximo entrenamiento en Instituto o práctica en casa.
                  </p>
                </div>
                <button
                  onClick={() => onOpenNewActivity()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1F2633] hover:bg-[#2A3445] border border-[#2E394A] transition"
                >
                  + Planificar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch Pads (Universal Entry Points) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono-num font-bold text-[#9299A5] uppercase tracking-wider">
              Accesos Rápidos de Registro
            </span>
            <span className="text-xs text-[#6D7787]">Seleccioná para abrir formulario directo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { cat: 'iacc_team' as ActivityCategory, label: 'Entrenamiento IACC', icon: Users, color: '#EF4444' },
              { cat: 'institute_gym' as ActivityCategory, label: 'Gimnasio Instituto', icon: Dumbbell, color: '#FF6B2C' },
              { cat: 'home_physical' as ActivityCategory, label: 'Físico en Casa', icon: Home, color: '#3B82F6' },
              { cat: 'home_individual' as ActivityCategory, label: 'Práctica de Tiro / Patio', icon: Target, color: '#B7F56A' },
              { cat: 'match' as ActivityCategory, label: 'Partido Competitivo', icon: Trophy, color: '#F59E0B' },
              { cat: 'recovery' as ActivityCategory, label: 'Recuperación / Descanso', icon: HeartPulse, color: '#10B981' },
            ].map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.cat}
                  onClick={() => onOpenNewActivity(btn.cat)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#0B0D10] border border-[#1F2633] hover:border-[#2F394A] hover:bg-[#141A23] transition group text-left"
                >
                  <div
                    className="p-2 rounded-xl shrink-0 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${btn.color}20`, color: btn.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#FF6B2C] transition-colors leading-tight">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. Recent Activity Timeline */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF6B2C]" />
            <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
              Actividad Reciente
            </h3>
          </div>
          <button
            onClick={() => onNavigateSection('history')}
            className="text-xs font-semibold text-[#FF6B2C] hover:text-[#FF8243]"
          >
            Ver historial completo →
          </button>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-2.5">
            {recentActivities.map((act) => {
              const meta = getCategoryMeta(act.category);
              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] hover:border-[#2F394A] hover:bg-[#121720] transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-[#FF6B2C] transition-colors">
                          {meta.label}
                        </span>
                        {act.status === 'completed' && (
                          <span className="text-[10px] text-[#B7F56A] font-medium">✓ Completada</span>
                        )}
                        {act.status === 'planned' && (
                          <span className="text-[10px] text-[#FF6B2C] font-medium">Planificada</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6D7787] flex items-center gap-2 mt-0.5">
                        <span>{act.date}</span>
                        {act.durationMinutes > 0 && <span>• {act.durationMinutes} min</span>}
                        {act.rpe !== undefined && act.rpe > 0 && <span>• RPE {act.rpe}/10</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {act.basketballAccuracyPercentage !== undefined && (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono-num font-bold text-[#B7F56A] bg-[#B7F56A]/10 border border-[#B7F56A]/20">
                        {act.basketballAccuracyPercentage}% tiro
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#6D7787]">
            Todavía no tenés actividades registradas. Tocá «+ Registrar actividad» para comenzar.
          </div>
        )}
      </div>
    </div>
  );
};
