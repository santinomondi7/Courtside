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
} from 'lucide-react';
import { Activity, PhysicalMeasurement, MeasurementType } from '../../types';

interface Props {
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  onSaveMeasurement: (m: PhysicalMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
  onOpenNewActivity: (category?: any) => void;
}

export const StatsView: React.FC<Props> = ({
  activities,
  measurements,
  onSaveMeasurement,
  onDeleteMeasurement,
  onOpenNewActivity,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'shooting'>('overview');
  const [showAddMeasurementModal, setShowAddMeasurementModal] = useState(false);

  // New measurement form state
  const [testType, setTestType] = useState<MeasurementType>('vertical_jump');
  const [testName, setTestName] = useState<string>('Salto Vertical CMJ');
  const [resultVal, setResultVal] = useState<string>('73');
  const [unitVal, setUnitVal] = useState<string>('cm');
  const [methodVal, setMethodVal] = useState<string>('Test Vertec / Tablero');
  const [measNotes, setMeasNotes] = useState<string>('');
  const [measDate, setMeasDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter activities by selected time range
  const now = new Date();
  const getCutoffDays = () => {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case 'all':
        return 365;
    }
  };

  const cutoff = new Date(now.getTime() - getCutoffDays() * 86400000);
  const filteredActivities = activities.filter((a) => {
    const d = new Date(a.date);
    return d >= cutoff && (a.status === 'completed' || a.status === 'partial');
  });

  // Calculate training minutes by week (last 4 weeks)
  const weeklyMinutes: Array<{ label: string; minutes: number }> = [];
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 86400000);
    const end = new Date(now.getTime() - i * 7 * 86400000);
    const mins = activities
      .filter((a) => {
        const d = new Date(a.date);
        return d >= start && d < end && (a.status === 'completed' || a.status === 'partial');
      })
      .reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    weeklyMinutes.push({
      label: i === 0 ? 'Esta sem' : `Sem -${i}`,
      minutes: mins,
    });
  }

  // Category distribution
  const categoryCounts: Record<string, { label: string; count: number; minutes: number; color: string }> = {
    iacc_team: { label: 'IACC Equipo', count: 0, minutes: 0, color: '#EF4444' },
    institute_gym: { label: 'Gimnasio', count: 0, minutes: 0, color: '#FF6B2C' },
    home_physical: { label: 'Físico en Casa', count: 0, minutes: 0, color: '#3B82F6' },
    home_individual: { label: 'Técnica Individual', count: 0, minutes: 0, color: '#B7F56A' },
    match: { label: 'Partidos', count: 0, minutes: 0, color: '#F59E0B' },
    recovery: { label: 'Recuperación', count: 0, minutes: 0, color: '#10B981' },
  };

  filteredActivities.forEach((a) => {
    if (categoryCounts[a.category]) {
      categoryCounts[a.category].count += 1;
      categoryCounts[a.category].minutes += a.durationMinutes || 0;
    }
  });

  const totalFilteredMinutes = filteredActivities.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

  // Shooting evolution data
  const shootingData = activities
    .filter((a) => a.category === 'home_individual' && a.basketballAttempts && a.basketballAttempts > 0)
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
              ESTADÍSTICAS Y ANÁLISIS DE EVOLUCIÓN
            </h1>
            <p className="text-xs text-[#9299A5]">
              Gráficos basados exclusivamente en tus registros reales de básquetbol y mediciones físicas.
            </p>
          </div>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0B0D10] border border-[#222A36] rounded-xl p-1">
            {[
              { id: '7d', label: '7 días' },
              { id: '30d', label: '30 días' },
              { id: '90d', label: '90 días' },
              { id: 'all', label: 'Todo' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  timeRange === btn.id
                    ? 'bg-[#FF6B2C] text-black font-bold'
                    : 'text-[#9299A5] hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddMeasurementModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#1F2633] hover:bg-[#2B3545] border border-[#354052] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF6B2C]" />
            <span className="hidden sm:inline">Nueva medición</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202734] pb-2">
        {[
          { id: 'overview', label: 'Cargas y Volumen' },
          { id: 'measurements', label: 'Salto y Velocidad (Tests)' },
          { id: 'shooting', label: 'Evolución de Tiro' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30'
                : 'text-[#9299A5] hover:text-white hover:bg-[#151921]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & LOAD DISTRIBUTION */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Minutes per week bar chart */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
                  Minutos de Entrenamiento por Semana
                </h3>
                <p className="text-xs text-[#9299A5]">Volumen de carga en las últimas 4 semanas</p>
              </div>
              <div className="text-xs font-mono-num font-bold text-[#FF6B2C]">
                {totalFilteredMinutes} min en el período seleccionado
              </div>
            </div>

            {/* Visual Bar Graph */}
            <div className="pt-4 grid grid-cols-4 gap-3 sm:gap-6 items-end h-48 bg-[#0B0D10] p-4 rounded-2xl border border-[#1E2530]">
              {weeklyMinutes.map((wm, idx) => {
                const maxMins = Math.max(...weeklyMinutes.map((w) => w.minutes), 480);
                const heightPct = Math.round((wm.minutes / maxMins) * 100);

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-mono-num font-bold text-white mb-1 group-hover:text-[#FF6B2C] transition-colors">
                      {wm.minutes} m
                    </span>
                    <div className="w-full max-w-[48px] bg-[#1F2633] rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-[#FF6B2C] to-[#FF8243] rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-125"
                        style={{ height: `${Math.max(8, heightPct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono-num text-[#6D7787] mt-2">{wm.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category distribution breakdown */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
              Distribución por Categoría de Entrenamiento
            </h3>

            <div className="space-y-3">
              {Object.entries(categoryCounts).map(([key, cat]) => {
                const sharePct =
                  totalFilteredMinutes > 0 ? Math.round((cat.minutes / totalFilteredMinutes) * 100) : 0;

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold text-white">{cat.label}</span>
                        <span className="text-[#6D7787]">({cat.count} sesiones)</span>
                      </div>
                      <div className="font-mono-num font-bold text-white">
                        {cat.minutes} min <span className="text-[#6D7787]">({sharePct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-[#0B0D10] rounded-full overflow-hidden border border-[#202734]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${sharePct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHYSICAL MEASUREMENTS (VERTICAL JUMP & SPRINTS) */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          {/* Vertical Jump Timeline */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#FF6B2C]" />
                <div>
                  <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
                    Evolución de Salto Vertical (CMJ)
                  </h3>
                  <p className="text-xs text-[#9299A5]">Mayor altura = Mayor explosividad (en cm)</p>
                </div>
              </div>

              {jumpMeasurements.length > 0 && (
                <div className="text-right">
                  <div className="font-mono-num font-black text-xl text-[#B7F56A]">
                    {Math.max(...jumpMeasurements.map((m) => m.result))} cm
                  </div>
                  <div className="text-[10px] text-[#6D7787]">Récord personal actual</div>
                </div>
              )}
            </div>

            {jumpMeasurements.length > 0 ? (
              <div className="space-y-2 pt-2">
                {jumpMeasurements.map((jm) => (
                  <div
                    key={jm.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 flex items-center justify-center font-mono-num font-bold text-xs text-[#FF6B2C]">
                        {jm.result}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{jm.testName}</span>
                          {jm.isPersonalRecord && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B7F56A]/20 text-[#B7F56A] border border-[#B7F56A]/30">
                              ★ Récord Personal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6D7787] mt-0.5">
                          {jm.date} • Método: {jm.method}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDeleteMeasurement(jm.id)}
                        className="text-[#6D7787] hover:text-red-400 p-1"
                        title="Eliminar medición"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6D7787]">
                No tenés mediciones de salto vertical. Tocá «Nueva medición» arriba para registrar tu primera prueba.
              </div>
            )}
          </div>

          {/* Sprints 5m and 10m Timeline */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
                    Tiempos de Sprint (5m y 10m)
                  </h3>
                  <p className="text-xs text-[#9299A5]">
                    Menor tiempo = Mayor aceleración y velocidad (en segundos)
                  </p>
                </div>
              </div>
            </div>

            {sprintMeasurements.length > 0 ? (
              <div className="space-y-2 pt-2">
                {sprintMeasurements.map((sm) => (
                  <div
                    key={sm.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center font-mono-num font-bold text-xs text-yellow-400">
                        {sm.result}s
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{sm.testName}</span>
                          {sm.isPersonalRecord && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B7F56A]/20 text-[#B7F56A] border border-[#B7F56A]/30">
                              ★ Mejor Marca
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6D7787] mt-0.5">
                          {sm.date} • {sm.method}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteMeasurement(sm.id)}
                      className="text-[#6D7787] hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#6D7787]">
                No tenés registros de sprints. Agregá tu tiempo de 5m o 10m para monitorear tu aceleración.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SHOOTING EVOLUTION */}
      {activeTab === 'shooting' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
            <div>
              <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
                Histórico de Efectividad en Lanzamientos
              </h3>
              <p className="text-xs text-[#9299A5]">
                Curva de aciertos calculada automáticamente a partir de cada práctica en el patio
              </p>
            </div>

            {shootingData.length > 0 ? (
              <div className="space-y-3 pt-2">
                {shootingData.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {s.basketballDrillName || 'Práctica de tiro'}
                        </span>
                        <span className="text-xs text-[#6D7787]">• {s.date}</span>
                      </div>
                      <div className="text-xs text-[#9299A5] mt-0.5">
                        Posición: {s.basketballShotPosition || 'No especificada'} •{' '}
                        {s.basketballMakes} de {s.basketballAttempts} convertidos
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2.5 bg-[#1F2633] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#B7F56A] rounded-full"
                          style={{ width: `${s.basketballAccuracyPercentage || 0}%` }}
                        />
                      </div>
                      <span className="font-mono-num font-black text-sm text-[#B7F56A] w-12 text-right">
                        {s.basketballAccuracyPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Target className="w-10 h-10 text-[#6D7787] mx-auto" />
                <p className="text-sm font-bold text-white">No tenés prácticas de tiro registradas</p>
                <p className="text-xs text-[#6D7787] max-w-sm mx-auto">
                  Para graficar la evolución de tiro, registrá intentos y conversiones en la sección de técnica individual.
                </p>
                <button
                  onClick={() => onOpenNewActivity('home_individual')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#B7F56A] hover:bg-[#cbf988] transition"
                >
                  + Registrar práctica de tiro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal to record a new physical test */}
      {showAddMeasurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#15191F] border border-[#2B3545] p-6 shadow-2xl text-white">
            <h3 className="font-display font-black text-xl mb-4">REGISTRAR MEDICIÓN FÍSICA</h3>

            <form onSubmit={handleCreateMeasurement} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">Tipo de prueba</label>
                <select
                  value={testType}
                  onChange={(e) => handleTestTypeChange(e.target.value as MeasurementType)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                >
                  <option value="vertical_jump">Salto Vertical (CMJ)</option>
                  <option value="sprint_10m">Sprint 10 metros</option>
                  <option value="sprint_5m">Sprint 5 metros (primer paso)</option>
                  <option value="trap_bar_deadlift">Trap Bar Deadlift (Fuerza)</option>
                  <option value="custom">Otra prueba personalizada</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Nombre descriptivo del test</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9299A5] mb-1">Resultado numérico</label>
                  <input
                    type="number"
                    step="0.01"
                    value={resultVal}
                    onChange={(e) => setResultVal(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num font-bold text-[#FF6B2C]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Unidad</label>
                  <input
                    type="text"
                    value={unitVal}
                    onChange={(e) => setUnitVal(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9299A5] mb-1">Fecha</label>
                  <input
                    type="date"
                    value={measDate}
                    onChange={(e) => setMeasDate(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Método de medición</label>
                  <input
                    type="text"
                    value={methodVal}
                    onChange={(e) => setMethodVal(e.target.value)}
                    placeholder="Vertec, fotocélulas, etc."
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Notas / Condiciones</label>
                <input
                  type="text"
                  value={measNotes}
                  onChange={(e) => setMeasNotes(e.target.value)}
                  placeholder="Ej. Post-calentamiento dinámico en Instituto"
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252E3C]">
                <button
                  type="button"
                  onClick={() => setShowAddMeasurementModal(false)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243]"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
