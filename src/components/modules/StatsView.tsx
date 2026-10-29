import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  Target,
  Plus,
  Calendar,
  Flame,
  Award,
  Trash2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Activity as ActivityIcon,
  Moon,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  Activity,
  PhysicalMeasurement,
  MeasurementType,
  PersonalGoal,
  UserProfile,
} from '../../types';
import {
  analyzeWeaknessesAndImbalances,
  analyzeWeeklyWorkload,
  predictProgressTrends,
  compareEquivalentPeriods,
  dismissWeaknessId,
  toggleReviewedWeaknessId,
  WeaknessObservation,
} from '../../services/sportsAnalytics';

interface Props {
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  goals?: PersonalGoal[];
  profile?: UserProfile;
  onSaveMeasurement: (m: PhysicalMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onOpenNewActivity: (category?: any) => void;
}

export const StatsView: React.FC<Props> = ({
  activities,
  measurements,
  goals = [],
  profile,
  onSaveMeasurement,
  onDeleteMeasurement,
  onOpenNewActivity,
}) => {
  const [activeTab, setActiveTab] = useState<
    'workload' | 'weaknesses' | 'predictions' | 'comparison' | 'measurements' | 'shooting'
  >('workload');

  // Workload state (week offset: 0 = current week, 1 = previous week)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Period comparison preset state
  const [comparisonPreset, setComparisonPreset] = useState<'4w' | '2w' | '1w'>('4w');

  // Dismissed and reviewed state for weaknesses
  const [weaknessRefreshKey, setWeaknessRefreshKey] = useState(0);

  // New measurement modal state
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);
  const [testType, setTestType] = useState<MeasurementType>('vertical_jump');
  const [testName, setTestName] = useState<string>('Salto Vertical CMJ');
  const [resultVal, setResultVal] = useState<string>('73');
  const [unitVal, setUnitVal] = useState<string>('cm');
  const [methodVal, setMethodVal] = useState<string>('Test Vertec / Tablero marcado');
  const [measNotes, setMeasNotes] = useState<string>('');
  const [measDate, setMeasDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Analytics Engine Calculations
  const weeklyWorkload = analyzeWeeklyWorkload(activities, weekOffset);
  const weaknessObservations = analyzeWeaknessesAndImbalances(
    activities,
    measurements,
    goals,
    profile
  );
  const trendPredictions = predictProgressTrends(measurements, goals);

  // Period comparison calculation based on preset
  const now = new Date();
  const getComparisonRanges = () => {
    if (comparisonPreset === '1w') {
      return {
        rangeA: {
          start: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
          name: 'Últimos 7 días',
        },
        rangeB: {
          start: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0],
          end: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0],
          name: '7 días previos',
        },
      };
    } else if (comparisonPreset === '2w') {
      return {
        rangeA: {
          start: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
          name: 'Últimos 14 días',
        },
        rangeB: {
          start: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
          end: new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0],
          name: '14 días previos',
        },
      };
    }
    // Default 4 weeks
    return {
      rangeA: {
        start: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        name: 'Últimas 4 semanas',
      },
      rangeB: {
        start: new Date(now.getTime() - 56 * 86400000).toISOString().split('T')[0],
        end: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
        name: '4 semanas anteriores',
      },
    };
  };

  const compRanges = getComparisonRanges();
  const periodComparison = compareEquivalentPeriods(
    activities,
    measurements,
    compRanges.rangeA,
    compRanges.rangeB
  );

  // Shooting evolution data (for Shooting Tab)
  const shootingData = activities
    .filter((a) => a.basketballAttempts && a.basketballAttempts > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Vertical jump measurements
  const jumpMeasurements = measurements
    .filter((m) => m.testType === 'vertical_jump')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Sprint measurements
  const sprintMeasurements = measurements
    .filter((m) => m.testType.startsWith('sprint'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreateMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultVal || isNaN(Number(resultVal))) return;

    onSaveMeasurement({
      id: `meas-${Date.now()}`,
      date: measDate,
      testType,
      testName,
      result: Number(resultVal),
      unit: unitVal,
      method: methodVal,
      notes: measNotes.trim() || undefined,
    });

    setShowAddMeasurementModal(false);
    setMeasNotes('');
  };

  const handleTestTypeChange = (type: MeasurementType) => {
    setTestType(type);
    switch (type) {
      case 'vertical_jump':
        setTestName('Salto Vertical CMJ');
        setUnitVal('cm');
        setResultVal('73');
        setMethodVal('Test Vertec / Tablero marcado');
        break;
      case 'sprint_10m':
        setTestName('Sprint aceleración 10 metros');
        setUnitVal('seg');
        setResultVal('1.68');
        setMethodVal('Células fotoeléctricas');
        break;
      case 'sprint_5m':
        setTestName('Sprint 5 metros (primer paso)');
        setUnitVal('seg');
        setResultVal('1.01');
        setMethodVal('Células fotoeléctricas');
        break;
      case 'trap_bar_deadlift':
        setTestName('Trap Bar Deadlift (5RM)');
        setUnitVal('kg');
        setResultVal('110');
        setMethodVal('Barra hexagonal en IACC');
        break;
      default:
        setTestName('Test físico');
        setUnitVal('reps');
        setResultVal('15');
        setMethodVal('Manual');
        break;
    }
  };

  const handleDismissObservation = (id: string) => {
    dismissWeaknessId(id);
    setWeaknessRefreshKey((k) => k + 1);
  };

  const handleToggleReviewed = (id: string) => {
    toggleReviewedWeaknessId(id);
    setWeaknessRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white tracking-wide">
              ESTADÍSTICAS Y RENDIMIENTO DEPORTIVO
            </h1>
            <p className="text-xs text-[#9299A5]">
              Análisis de carga semanal real, debilidades, predicción de tendencias y comparativas fidedignas.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddMeasurementModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#1F2633] hover:bg-[#2B3545] border border-[#354052] transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF6B2C]" />
          <span>Nueva medición física</span>
        </button>
      </div>

      {/* Navigation Tabs (Modules 1, 2, 3, 5 + Measurements + Shooting) */}
      <div className="flex items-center gap-2 border-b border-[#202734] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'workload', label: 'Carga Semanal Real', badge: 'sRPE' },
          {
            id: 'weaknesses',
            label: 'Análisis de Debilidades',
            badge: weaknessObservations.length > 0 ? `${weaknessObservations.length}` : undefined,
          },
          { id: 'predictions', label: 'Predicción de Progreso', badge: 'Tendencias' },
          { id: 'comparison', label: 'Comparar Períodos', badge: '4 Semanas' },
          { id: 'measurements', label: 'Salto & Velocidad (Tests)' },
          { id: 'shooting', label: 'Evolución de Tiro' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === t.id
                ? 'bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30'
                : 'text-[#9299A5] hover:text-white hover:bg-[#151921]'
            }`}
          >
            <span>{t.label}</span>
            {t.badge && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold ${
                  activeTab === t.id
                    ? 'bg-[#FF6B2C] text-black'
                    : 'bg-[#222A36] text-[#A6B2C2]'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ANÁLISIS DE CARGA SEMANAL REAL (MÓDULO 3)                */}
      {/* ============================================================== */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Week Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B2C]" />
              <span className="text-xs font-bold text-white">
                Período analizado: {weeklyWorkload.startDate} al {weeklyWorkload.endDate}
              </span>
              <span className="text-xs text-[#9299A5]">({weeklyWorkload.weekLabel})</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { offset: 0, label: 'Semana Actual' },
                { offset: 1, label: 'Semana -1' },
                { offset: 2, label: 'Semana -2' },
                { offset: 3, label: 'Semana -3' },
              ].map((btn) => (
                <button
                  key={btn.offset}
                  onClick={() => setWeekOffset(btn.offset)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    weekOffset === btn.offset
                      ? 'bg-[#FF6B2C] text-black font-bold'
                      : 'text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#222A36]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
              <span className="text-[11px] text-[#9299A5] uppercase font-bold tracking-wider block mb-1">
                Carga Acumulada (sRPE)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-2xl sm:text-3xl text-white">
                  {weeklyWorkload.totalLoadAU}
                </span>
                <span className="text-xs text-[#FF6B2C] font-bold">AU</span>
              </div>
              <span className="text-[10px] text-[#6D7787] mt-1 block">
                {weeklyWorkload.loadVariationPercentage !== null
                  ? `${weeklyWorkload.loadVariationPercentage > 0 ? '+' : ''}${weeklyWorkload.loadVariationPercentage}% vs sem. anterior`
                  : 'Primera semana evaluada'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
              <span className="text-[11px] text-[#9299A5] uppercase font-bold tracking-wider block mb-1">
                Volumen Total
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-2xl sm:text-3xl text-white">
                  {weeklyWorkload.totalMinutes}
                </span>
                <span className="text-xs text-[#9299A5]">minutos</span>
              </div>
              <span className="text-[10px] text-[#6D7787] mt-1 block">
                {weeklyWorkload.totalSessions} sesiones registradas
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
              <span className="text-[11px] text-[#9299A5] uppercase font-bold tracking-wider block mb-1">
                Esfuerzo Medio (RPE)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-2xl sm:text-3xl text-white">
                  {weeklyWorkload.averageRpe}
                </span>
                <span className="text-xs text-[#9299A5]">/ 10</span>
              </div>
              <span className="text-[10px] text-[#6D7787] mt-1 block">
                Escala Borg de percepción
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#15191F] border border-[#222A36]">
              <span className="text-[11px] text-[#9299A5] uppercase font-bold tracking-wider block mb-1">
                Distribución Trabajo
              </span>
              <div className="text-xs font-bold text-white mt-1">
                {weeklyWorkload.technicalVsPhysicalRatio}
              </div>
              <span className="text-[10px] text-[#6D7787] mt-1 block">
                {weeklyWorkload.technicalMinutes}m técnicos / {weeklyWorkload.physicalMinutes}m físicos
              </span>
            </div>
          </div>

          {/* Daily Workload Bar Chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Distribución Diaria de Carga (Lunes a Domingo)
                </h2>
                <p className="text-xs text-[#9299A5]">
                  Identificación de días con mayor concentración de exigencia física o doble turno.
                </p>
              </div>
              {weeklyWorkload.highDemandDaysCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{weeklyWorkload.highDemandDaysCount} días de alta exigencia</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {weeklyWorkload.dailyDistribution.map((d) => {
                const maxLoad = Math.max(
                  ...weeklyWorkload.dailyDistribution.map((x) => x.totalLoadAU),
                  1
                );
                const barHeightPct = Math.max(10, Math.round((d.totalLoadAU / maxLoad) * 100));

                return (
                  <div key={d.date} className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-mono-num font-bold text-white">
                      {d.totalLoadAU > 0 ? d.totalLoadAU : '-'}
                    </span>

                    <div className="w-full bg-[#0B0D10] rounded-xl h-36 flex flex-col justify-end p-1 border border-[#202734]">
                      <div
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-full rounded-lg transition-all ${
                          d.isHighDemand
                            ? 'bg-gradient-to-t from-[#FF6B2C] to-[#EF4444]'
                            : d.totalLoadAU > 0
                            ? 'bg-[#3B82F6]'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-bold text-white block">
                        {d.dayName.slice(0, 3)}
                      </span>
                      <span className="text-[10px] text-[#6D7787] block">
                        {d.totalMinutes > 0 ? `${d.totalMinutes}m` : 'Descanso'}
                      </span>
                      {d.isHighDemand && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B2C] mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <h2 className="font-display font-bold text-lg text-white">
              Desglose de Carga por Categoría de Entrenamiento
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#202734] text-[#6D7787] uppercase font-mono-num">
                    <th className="pb-3 font-semibold">Categoría</th>
                    <th className="pb-3 font-semibold text-right">Sesiones</th>
                    <th className="pb-3 font-semibold text-right">Minutos</th>
                    <th className="pb-3 font-semibold text-right">RPE Promedio</th>
                    <th className="pb-3 font-semibold text-right">Carga sRPE (AU)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B222D]">
                  {weeklyWorkload.categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-[#12161D]">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.label}</span>
                      </td>
                      <td className="py-3 text-right text-[#A6B2C2]">{cat.sessionsCount}</td>
                      <td className="py-3 text-right font-mono-num text-white">{cat.minutes} min</td>
                      <td className="py-3 text-right font-mono-num text-[#FF6B2C]">{cat.averageRpe}/10</td>
                      <td className="py-3 text-right font-mono-num font-bold text-white">
                        {cat.totalLoadAU} AU
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sleep, Fatigue Correlation & Educational Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-[#0B0D10] border border-[#222A36] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Moon className="w-4 h-4 text-[#8B5CF6]" />
                <span>Relación Sueño, Fatiga y Carga Acumulada</span>
              </div>
              <p className="text-xs text-[#9299A5] leading-relaxed">
                {weeklyWorkload.sleepLoadCorrelationNote}
              </p>
              {weeklyWorkload.avgSleep !== null && (
                <div className="pt-2 flex items-center gap-3 text-xs">
                  <span className="text-[#A6B2C2]">
                    Sueño promedio: <strong className="text-white">{weeklyWorkload.avgSleep} hs/noche</strong>
                  </span>
                  <span className="text-[#A6B2C2]">
                    Fatiga media: <strong className="text-white">{weeklyWorkload.avgFatigue}/10</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-[#0B0D10] border border-[#222A36] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Info className="w-4 h-4 text-[#FF6B2C]" />
                <span>Metodología de Cálculo</span>
              </div>
              <p className="text-xs text-[#9299A5] leading-relaxed">
                {weeklyWorkload.calculationExplanation}
              </p>
              {weeklyWorkload.incompleteDataWarning && (
                <p className="text-[11px] text-amber-400 font-semibold pt-1">
                  ⚠️ {weeklyWorkload.incompleteDataWarning}
                </p>
              )}
            </div>
          </div>

          {/* Informative Alerts */}
          {weeklyWorkload.informativeAlerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#6D7787] uppercase tracking-wider">
                Observaciones informativas de carga
              </h3>
              {weeklyWorkload.informativeAlerts.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1"
                >
                  <strong className="block font-bold">{alt.title}</strong>
                  <p className="text-amber-200/90">{alt.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ANÁLISIS AUTOMÁTICO DE DEBILIDADES (MÓDULO 1)             */}
      {/* ============================================================== */}
      {activeTab === 'weaknesses' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-2">
            <h2 className="font-display font-bold text-lg text-white">
              Análisis Conjunto de Desequilibrios y Debilidades
            </h2>
            <p className="text-xs text-[#9299A5] leading-relaxed">
              Diferenciamos de manera rigurosa entre una <strong>debilidad demostrada</strong> con datos concretos y una <strong>carencia de registros</strong>. Si no anotaste repeticiones de una habilidad, no afirmamos que tengas un bajo nivel, sino que faltan datos para evaluarte.
            </p>
            <div className="text-[11px] text-[#6D7787] flex items-center gap-2 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B7F56A]" />
              <span>Ninguna recomendación sustituye las directivas técnicas del cuerpo de entrenadores de Instituto.</span>
            </div>
          </div>

          {weaknessObservations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#15191F] border border-[#222A36] text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#B7F56A] mx-auto" />
              <h3 className="font-bold text-white text-sm">
                No se detectan desequilibrios críticos activos
              </h3>
              <p className="text-xs text-[#9299A5] max-w-md mx-auto">
                Tu historial muestra una adecuada correlación entre entrenamientos de básquetbol, trabajo de pesas en Instituto y descanso.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {weaknessObservations.map((obs) => {
                const isCarencia = obs.kind === 'carencia_de_registros';
                const isDesequilibrio = obs.kind === 'desequilibrio_carga';

                return (
                  <div
                    key={obs.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      obs.isReviewed
                        ? 'bg-[#10141A] border-[#1D2530] opacity-75'
                        : 'bg-[#15191F] border-[#222A36]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isCarencia
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : isDesequilibrio
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {isCarencia
                              ? 'Carencia de registros'
                              : isDesequilibrio
                              ? 'Desequilibrio de carga'
                              : 'Debilidad demostrada'}
                          </span>

                          <span className="text-[10px] text-[#6D7787]">
                            Confianza: <strong className="text-white capitalize">{obs.confidence}</strong> • {obs.periodAnalyzed}
                          </span>

                          {obs.isReviewed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B7F56A]/10 text-[#B7F56A] border border-[#B7F56A]/20">
                              ✓ Revisada
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-white">
                          {obs.title}
                        </h3>
                        <p className="text-xs text-[#A6B2C2] leading-relaxed">
                          {obs.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleReviewed(obs.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#A6B2C2] hover:text-white bg-[#0B0D10] border border-[#222A36] hover:bg-[#1E2633] transition"
                        >
                          {obs.isReviewed ? 'Desmarcar' : 'Marcar revisada'}
                        </button>
                        <button
                          onClick={() => handleDismissObservation(obs.id)}
                          className="p-1.5 rounded-xl text-[#6D7787] hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Descartar observación"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Backing Data & Follow Up Action Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#1F2734] text-xs">
                      <div className="p-3 rounded-xl bg-[#0B0D10] border border-[#1A212B] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6D7787]">
                          Datos que respaldan el patrón:
                        </span>
                        <p className="text-white font-medium">{obs.backingData}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-[#FF6B2C]/5 border border-[#FF6B2C]/20 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B2C]">
                          Acción de seguimiento sugerida:
                        </span>
                        <p className="text-white font-medium">{obs.followUpAction}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PREDICCIÓN DE PROGRESO BASADA EN TENDENCIAS (MÓDULO 2)   */}
      {/* ============================================================== */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-2">
            <h2 className="font-display font-bold text-lg text-white">
              Estimación de Progreso Basada en Tendencias Reales
            </h2>
            <p className="text-xs text-[#9299A5] leading-relaxed">
              Utilizamos regresión lineal y análisis de dispersión sobre tus mediciones reales. No prometemos fechas mágicas ni garantías; las proyecciones son orientativas y se suspenden cuando existe alta variabilidad o pocas muestras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendPredictions.map((trend) => (
              <div
                key={trend.id}
                className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      {trend.testName}
                    </h3>
                    <span className="text-[11px] text-[#6D7787]">
                      {trend.measurementsCount} mediciones ({trend.initialDate} a {trend.latestDate})
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      trend.observedTrend === 'ascendente'
                        ? 'bg-[#B7F56A]/10 text-[#B7F56A] border-[#B7F56A]/20'
                        : trend.observedTrend === 'descendente'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}
                  >
                    Tendencia {trend.observedTrend}
                  </span>
                </div>

                {/* Values Comparison */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#0B0D10] border border-[#1E2530] text-center">
                  <div>
                    <span className="text-[10px] text-[#6D7787] block">Valor Inicial</span>
                    <span className="text-xs font-bold text-white">
                      {trend.initialValue} {trend.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6D7787] block">Último Medido</span>
                    <span className="text-sm font-black text-[#FF6B2C]">
                      {trend.latestValue} {trend.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6D7787] block">Ritmo Semanal</span>
                    <span className="text-xs font-bold text-white">
                      {trend.trendRatePerWeek > 0 ? '+' : ''}{trend.trendRatePerWeek} {trend.unit}/sem
                    </span>
                  </div>
                </div>

                {/* Warning or Projection */}
                {trend.confidenceWarning ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>{trend.confidenceWarning}</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9299A5]">Estimación orientativa (próximos 30 días):</span>
                      <strong className="text-[#B7F56A] font-bold">
                        {trend.projectedValueIn30Days} {trend.unit}
                      </strong>
                    </div>
                    {trend.targetValue && (
                      <div className="flex items-center justify-between text-[11px] text-[#6D7787]">
                        <span>Distancia a meta ({trend.targetValue} {trend.unit}):</span>
                        <span className="text-white font-medium">
                          {trend.currentDistanceToTarget} {trend.unit}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-[#6D7787] block pt-1">
                      Incertidumbre: <strong className="text-white capitalize">{trend.uncertainty}</strong>. No es una garantía futura; depende de tu descanso y carga en Instituto.
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: COMPARACIÓN ENTRE PERÍODOS EQUIVALENTES (MÓDULO 5)       */}
      {/* ============================================================== */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Comparativa entre Períodos Equivalentes
              </h2>
              <p className="text-xs text-[#9299A5]">
                {periodComparison.periodAName} vs {periodComparison.periodBName}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: '4w', label: '4 semanas vs 4 previas' },
                { id: '2w', label: '14 días vs 14 previos' },
                { id: '1w', label: '7 días vs 7 previos' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setComparisonPreset(b.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    comparisonPreset === b.id
                      ? 'bg-[#FF6B2C] text-black font-bold'
                      : 'text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#222A36]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Quadrants of Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Cantidad de entrenamiento */}
            <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
              <span className="text-xs font-bold text-[#FF6B2C] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>1. Cambios en la Cantidad de Entrenamiento</span>
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D10]">
                  <span className="text-[#9299A5]">Volumen total registrado:</span>
                  <div className="text-right">
                    <span className="font-bold text-white">
                      {periodComparison.trainingQuantity.totalMinutes.valuePeriodA}m vs{' '}
                      {periodComparison.trainingQuantity.totalMinutes.valuePeriodB}m
                    </span>
                    <span className="text-[10px] text-[#B7F56A] block">
                      ({periodComparison.trainingQuantity.totalMinutes.percentageDiff !== null
                        ? `${periodComparison.trainingQuantity.totalMinutes.percentageDiff > 0 ? '+' : ''}${periodComparison.trainingQuantity.totalMinutes.percentageDiff}%`
                        : '-'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D10]">
                  <span className="text-[#9299A5]">Sesiones completadas:</span>
                  <span className="font-bold text-white">
                    {periodComparison.trainingQuantity.totalSessions.valuePeriodA} vs{' '}
                    {periodComparison.trainingQuantity.totalSessions.valuePeriodB} sesiones
                  </span>
                </div>
              </div>

              {periodComparison.trainingQuantity.categoryDisparityExplanation && (
                <p className="text-[11px] text-[#6D7787] italic">
                  * {periodComparison.trainingQuantity.categoryDisparityExplanation}
                </p>
              )}
            </div>

            {/* 2. Rendimiento medido */}
            <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
              <span className="text-xs font-bold text-[#3ECF8E] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>2. Cambios en el Rendimiento Medido</span>
              </span>

              <div className="space-y-2 text-xs">
                {Object.values(periodComparison.performanceMetrics).map((metric, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#0B0D10] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{metric.name}</span>
                      <span className="font-bold text-[#FF6B2C]">
                        {metric.valuePeriodA} {metric.unit} vs {metric.valuePeriodB} {metric.unit}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9299A5]">{metric.interpretation}</p>
                  </div>
                ))}
                {Object.keys(periodComparison.performanceMetrics).length === 0 && (
                  <p className="text-xs text-[#6D7787] p-2">
                    Sin pruebas físicas de control comparables en ambos períodos.
                  </p>
                )}
              </div>
            </div>

            {/* 3. Cambios en recuperación */}
            <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
              <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                <span>3. Cambios en la Recuperación</span>
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D10]">
                  <span className="text-[#9299A5]">Promedio de sueño:</span>
                  <span className="font-bold text-white">
                    {periodComparison.recoveryMetrics.averageSleep.valuePeriodA} hs vs{' '}
                    {periodComparison.recoveryMetrics.averageSleep.valuePeriodB} hs
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D10]">
                  <span className="text-[#9299A5]">Fatiga percibida:</span>
                  <span className="font-bold text-white">
                    {periodComparison.recoveryMetrics.averageFatigue.valuePeriodA}/10 vs{' '}
                    {periodComparison.recoveryMetrics.averageFatigue.valuePeriodB}/10
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0D10]">
                  <span className="text-[#9299A5]">Esfuerzo medio (RPE):</span>
                  <span className="font-bold text-white">
                    {periodComparison.recoveryMetrics.averageRpe.valuePeriodA}/10 vs{' '}
                    {periodComparison.recoveryMetrics.averageRpe.valuePeriodB}/10
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Notas metodológicas y limitaciones */}
            <div className="p-5 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
              <span className="text-xs font-bold text-[#6D7787] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>4. Metodología y Límites Estadísticos</span>
              </span>

              <div className="space-y-2 text-xs text-[#9299A5]">
                {periodComparison.disparityNotes.map((note, idx) => (
                  <p key={idx} className="p-2 rounded-xl bg-[#0B0D10] border border-[#202734]">
                    {note}
                  </p>
                ))}
                {periodComparison.dataSufficiencyWarning && (
                  <p className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    ⚠️ {periodComparison.dataSufficiencyWarning}
                  </p>
                )}
                <p className="text-[11px] text-[#6D7787] pt-1">
                  No declaramos mejoras estadísticamente significativas sin una cantidad de mediciones suficiente en idénticas condiciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: TESTS FÍSICOS (SALTO Y VELOCIDAD)                        */}
      {/* ============================================================== */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vertical Jump History Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Salto Vertical (CMJ)
                  </h3>
                  <span className="text-xs text-[#9299A5]">Evolución cronológica</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#FF6B2C] bg-[#FF6B2C]/10 px-2.5 py-1 rounded-xl border border-[#FF6B2C]/20">
                  {jumpMeasurements[jumpMeasurements.length - 1]?.result || 73} cm récord
                </span>
              </div>

              <div className="space-y-2">
                {jumpMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{m.result} cm</span>
                      <span className="text-[#6D7787] block text-[10px]">
                        {m.date} • {m.method}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteMeasurement(m.id)}
                      className="text-[#6D7787] hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprints History Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Velocidad y Aceleración
                  </h3>
                  <span className="text-xs text-[#9299A5]">Sprints de 5 m y 10 m</span>
                </div>
              </div>

              <div className="space-y-2">
                {sprintMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">
                        {m.testName}: {m.result} {m.unit}
                      </span>
                      <span className="text-[#6D7787] block text-[10px]">
                        {m.date} • {m.method}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteMeasurement(m.id)}
                      className="text-[#6D7787] hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: EVOLUCIÓN DE TIRO                                       */}
      {/* ============================================================== */}
      {activeTab === 'shooting' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <h2 className="font-display font-bold text-lg text-white">
              Historial de Efectividad en Sesiones de Tiro
            </h2>
            <p className="text-xs text-[#9299A5]">
              Registros ordenados cronológicamente sin promediar distancias incompatibles (triples vs tiros libres).
            </p>

            <div className="space-y-2">
              {shootingData.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {act.basketballDrillName || 'Tiro en patio'}
                      </span>
                      <span className="text-[10px] text-[#6D7787]">{act.date}</span>
                    </div>
                    <span className="text-[#A6B2C2] text-[11px] block">
                      {act.basketballMakes} de {act.basketballAttempts} aciertos (
                      {act.basketballAccuracyPercentage}%)
                    </span>
                  </div>

                  <span className="font-mono-num font-bold text-sm text-[#FF6B2C]">
                    {act.basketballAccuracyPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Measurement */}
      {showAddMeasurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#15191F] border border-[#222A36] p-6 text-white space-y-4">
            <h3 className="font-display font-bold text-lg">Nueva Medición Física</h3>
            <form onSubmit={handleCreateMeasurement} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">Tipo de Test</label>
                <select
                  value={testType}
                  onChange={(e) => handleTestTypeChange(e.target.value as any)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                >
                  <option value="vertical_jump">Salto Vertical (CMJ)</option>
                  <option value="sprint_5m">Sprint 5 metros (aceleración)</option>
                  <option value="sprint_10m">Sprint 10 metros</option>
                  <option value="trap_bar_deadlift">Trap Bar Deadlift (Fuerza)</option>
                  <option value="custom">Test Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Resultado y Unidad</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={resultVal}
                    onChange={(e) => setResultVal(e.target.value)}
                    className="flex-1 bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white font-mono"
                  />
                  <input
                    type="text"
                    value={unitVal}
                    onChange={(e) => setUnitVal(e.target.value)}
                    className="w-20 bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Método / Instrumento</label>
                <input
                  type="text"
                  value={methodVal}
                  onChange={(e) => setMethodVal(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Fecha</label>
                <input
                  type="date"
                  value={measDate}
                  onChange={(e) => setMeasDate(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B2C] text-black font-bold"
                >
                  Guardar medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
