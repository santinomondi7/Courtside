import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  CheckCircle2,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Activity as ActivityIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  PersonalGoal,
  GoalCategory,
  PhysicalMeasurement,
  Activity,
} from '../../types';
import { analyzeGoalEvidence } from '../../services/sportsAnalytics';

interface Props {
  goals: PersonalGoal[];
  measurements?: PhysicalMeasurement[];
  activities?: Activity[];
  onSaveGoal: (goal: PersonalGoal) => void;
  onUpdateGoalProgress: (id: string, newVal: number, comment?: string) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<Props> = ({
  goals,
  measurements = [],
  activities = [],
  onSaveGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoalForUpdate, setSelectedGoalForUpdate] = useState<PersonalGoal | null>(null);
  const [progressValueInput, setProgressValueInput] = useState<string>('');
  const [progressCommentInput, setProgressCommentInput] = useState<string>('');
  const [expandedEvidenceGoalId, setExpandedEvidenceGoalId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('vertical_jump');
  const [description, setDescription] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('cm');
  const [deadline, setDeadline] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: PersonalGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      initialValue: initialValue ? Number(initialValue) : undefined,
      targetValue: targetValue ? Number(targetValue) : undefined,
      currentValue: currentValue ? Number(currentValue) : (initialValue ? Number(initialValue) : undefined),
      unit: unit.trim() || 'pts',
      deadline: deadline || undefined,
      status: 'active',
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          value: currentValue ? Number(currentValue) : (initialValue ? Number(initialValue) : 0),
          comment: 'Meta creada',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    onSaveGoal(newGoal);
    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  const handleUpdateProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForUpdate || !progressValueInput) return;

    const val = Number(progressValueInput);
    onUpdateGoalProgress(selectedGoalForUpdate.id, val, progressCommentInput);

    // If reached, trigger athletic celebration
    if (selectedGoalForUpdate.targetValue !== undefined && selectedGoalForUpdate.initialValue !== undefined) {
      const isReverse = selectedGoalForUpdate.targetValue < selectedGoalForUpdate.initialValue;
      const isReached = isReverse ? val <= selectedGoalForUpdate.targetValue : val >= selectedGoalForUpdate.targetValue;
      if (isReached) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B2C', '#B7F56A', '#ffffff'],
        });
      }
    }

    setSelectedGoalForUpdate(null);
    setProgressValueInput('');
    setProgressCommentInput('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white tracking-wide">
              OBJETIVOS VINCULADOS CON EVIDENCIA REAL
            </h1>
            <p className="text-xs text-[#9299A5]">
              Seguimiento verificado con tests físicos y sesiones reales. Nunca se declaran metas alcanzadas a partir de estimaciones.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nuevo objetivo</span>
        </button>
      </div>

      {/* Educational Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex items-center gap-2.5 text-xs text-[#9299A5]">
        <ShieldCheck className="w-4 h-4 text-[#B7F56A] shrink-0" />
        <span>
          <strong>Rigor metodológico:</strong> El porcentaje de avance mide la distancia matemática recorrida entre el valor inicial y la última medición real registrada; no representa una probabilidad futura de alcanzar la meta.
        </span>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const evidence = analyzeGoalEvidence(goal, measurements, activities);
          const progressPct = evidence.progressPercentage || 0;
          const isCompleted = evidence.isTargetReached || goal.status === 'completed';
          const isExpanded = expandedEvidenceGoalId === goal.id;

          return (
            <div
              key={goal.id}
              className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between transition ${
                isCompleted
                  ? 'bg-gradient-to-br from-[#15191F] to-[#121A15] border-[#B7F56A]/40'
                  : 'bg-[#15191F] border-[#222A36]'
              }`}
            >
              <div>
                {/* Status Badges Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-num font-bold uppercase bg-[#FF6B2C]/20 text-[#FF6B2C]">
                      {goal.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${evidence.statusBadgeColor}`}
                    >
                      {evidence.statusLabel}
                    </span>

                    {goal.deadline && (
                      <span className="text-[10px] text-[#6D7787] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Plazo: {goal.deadline}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-[#6D7787] hover:text-red-400 p-1 rounded"
                    title="Eliminar meta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-display font-bold text-lg text-white mb-1">{goal.title}</h3>
                <p className="text-xs text-[#9299A5] mb-4 leading-relaxed">{goal.description}</p>

                {/* Values Comparison Grid */}
                {goal.targetValue !== undefined && (
                  <div className="flex items-baseline justify-between mb-3 text-xs bg-[#0B0D10] p-3 rounded-2xl border border-[#1E2530]">
                    <div>
                      <span className="text-[#6D7787] block text-[10px]">Inicial</span>
                      <span className="font-mono-num font-semibold text-white">
                        {goal.initialValue} {goal.unit}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[#9299A5] block text-[10px]">Última medición</span>
                      <span className="font-mono-num font-black text-base text-[#FF6B2C]">
                        {evidence.latestValue ?? goal.currentValue ?? goal.initialValue} {goal.unit}
                      </span>
                      {evidence.latestMeasurementDate && (
                        <span className="text-[9px] text-[#6D7787] block">
                          {evidence.latestMeasurementDate}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[#B7F56A] block text-[10px]">Meta</span>
                      <span className="font-mono-num font-bold text-white">
                        {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs font-mono-num">
                    <span className="text-[#9299A5]">Avance medido</span>
                    <span className={`font-bold ${isCompleted ? 'text-[#B7F56A]' : 'text-white'}`}>
                      {progressPct}%
                      {evidence.absoluteDiffToTarget !== undefined && !isCompleted && (
                        <span className="text-[10px] text-[#6D7787] font-normal ml-1">
                          (a {evidence.absoluteDiffToTarget} {goal.unit})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#0B0D10] rounded-full overflow-hidden border border-[#202734]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCompleted
                          ? 'bg-[#B7F56A]'
                          : 'bg-gradient-to-r from-[#FF6B2C] to-[#B7F56A]'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Evidence Summary Line */}
                <div className="flex items-center justify-between text-[11px] text-[#9299A5] pb-2">
                  <span>{evidence.evidenceSummary}</span>
                  <button
                    onClick={() =>
                      setExpandedEvidenceGoalId(isExpanded ? null : goal.id)
                    }
                    className="text-[#FF6B2C] hover:underline flex items-center gap-0.5 shrink-0 ml-2"
                  >
                    <span>{isExpanded ? 'Ocultar registros' : 'Ver evidencia'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Collapsible Backing Evidence Records */}
                {isExpanded && (
                  <div className="mt-2 p-3 rounded-2xl bg-[#0B0D10] border border-[#202734] space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-[#6D7787] uppercase tracking-wider block">
                      Registros de respaldo verificados ({evidence.backingEvidence.length}):
                    </span>
                    {evidence.backingEvidence.length === 0 ? (
                      <p className="text-[11px] text-[#6D7787] italic">
                        No hay tests o actividades asociados todavía. Al registrar una medición de esta categoría en Estadísticas se vinculará automáticamente.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {evidence.backingEvidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2 rounded-xl bg-[#15191F] border border-[#1E2530] flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              {ev.sourceType === 'measurement' ? (
                                <Zap className="w-3.5 h-3.5 text-[#FF6B2C]" />
                              ) : (
                                <ActivityIcon className="w-3.5 h-3.5 text-[#B7F56A]" />
                              )}
                              <div>
                                <span className="font-bold text-white block">{ev.title}</span>
                                <span className="text-[9px] text-[#6D7787]">{ev.date}</span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-[#FF6B2C]">
                              {ev.resultDisplay}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1E2530] mt-3">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B7F56A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Objetivo alcanzado con evidencia!</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#6D7787]">
                    Calidad de evidencia: <strong className="text-white capitalize">{evidence.evidenceQuality}</strong>
                  </span>
                )}

                <button
                  onClick={() => {
                    setSelectedGoalForUpdate(goal);
                    setProgressValueInput(
                      evidence.latestValue !== undefined
                        ? String(evidence.latestValue)
                        : goal.currentValue !== undefined
                        ? String(goal.currentValue)
                        : ''
                    );
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0B0D10] hover:bg-[#1A222D] border border-[#26303E] transition"
                >
                  Registrar control
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Update Progress Modal */}
      {selectedGoalForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#15191F] border border-[#2B3545] p-6 shadow-2xl text-white">
            <h3 className="font-display font-black text-lg mb-1">REGISTRAR CONTROL DE PROGRESO</h3>
            <p className="text-xs text-[#9299A5] mb-4 truncate">{selectedGoalForUpdate.title}</p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">
                  Nuevo valor medido ({selectedGoalForUpdate.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={progressValueInput}
                  onChange={(e) => setProgressValueInput(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num font-bold text-[#FF6B2C]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Comentario o contexto (opcional)</label>
                <input
                  type="text"
                  value={progressCommentInput}
                  onChange={(e) => setProgressCommentInput(e.target.value)}
                  placeholder="Ej. Medido con calzado de juego y buen descanso"
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForUpdate(null)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B2C] text-black font-bold"
                >
                  Guardar control
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#15191F] border border-[#2B3545] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-black text-lg mb-1">NUEVO OBJETIVO DEPORTIVO</h3>
            <p className="text-xs text-[#9299A5] mb-4">
              Definí una meta cuantificable para evaluar tus avances.
            </p>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">Título de la meta</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Salto Vertical a 78 cm"
                  required
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                >
                  <option value="vertical_jump">Salto Vertical</option>
                  <option value="speed">Velocidad / Sprints</option>
                  <option value="strength">Fuerza (Gimnasio)</option>
                  <option value="shooting">Efectividad de Tiro</option>
                  <option value="ballhandling">Manejo de Balón</option>
                  <option value="recovery">Recuperación y Sueño</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#9299A5] mb-1">Valor inicial</label>
                  <input
                    type="number"
                    step="any"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    placeholder="73"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Valor actual</label>
                  <input
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="73"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Valor objetivo</label>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="78"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#9299A5] mb-1">Unidad</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="cm, seg, kg, %"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Descripción y foco</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre el plan de entrenamiento o transferencia táctica..."
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FF6B2C] text-black font-bold"
                >
                  Crear objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
