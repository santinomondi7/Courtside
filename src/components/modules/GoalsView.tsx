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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PersonalGoal, GoalCategory } from '../../types';

interface Props {
  goals: PersonalGoal[];
  onSaveGoal: (goal: PersonalGoal) => void;
  onUpdateGoalProgress: (id: string, newVal: number, comment?: string) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<Props> = ({
  goals,
  onSaveGoal,
  onUpdateGoalProgress,
  onDeleteGoal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoalForUpdate, setSelectedGoalForUpdate] = useState<PersonalGoal | null>(null);
  const [progressValueInput, setProgressValueInput] = useState<string>('');
  const [progressCommentInput, setProgressCommentInput] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('vertical_jump');
  const [description, setDescription] = useState('');
  const [initialValue, setInitialValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('cm');
  const [deadline, setDeadline] = useState('');

  const calculateProgress = (goal: PersonalGoal): number => {
    if (goal.targetValue === undefined || goal.initialValue === undefined || goal.currentValue === undefined) {
      return goal.manualProgressPercentage || 0;
    }

    const isReverse = goal.targetValue < goal.initialValue; // Sprints
    if (isReverse) {
      const totalSpan = goal.initialValue - goal.targetValue;
      if (totalSpan <= 0) return 0;
      const progressSpan = goal.initialValue - goal.currentValue;
      const pct = Math.round((progressSpan / totalSpan) * 100);
      return Math.min(100, Math.max(0, pct));
    } else {
      const totalSpan = goal.targetValue - goal.initialValue;
      if (totalSpan <= 0) return 0;
      const progressSpan = goal.currentValue - goal.initialValue;
      const pct = Math.round((progressSpan / totalSpan) * 100);
      return Math.min(100, Math.max(0, pct));
    }
  };

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
              OBJETIVOS PERSONALES DE RENDIMIENTO
            </h1>
            <p className="text-xs text-[#9299A5]">
              Establecé metas medibles de salto, velocidad, fuerza y tiro con seguimiento de avance.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Nuevo objetivo</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const progressPct = calculateProgress(goal);
          const isCompleted = goal.status === 'completed' || progressPct >= 100;

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between transition ${
                isCompleted
                  ? 'bg-gradient-to-br from-[#15191F] to-[#121A15] border-[#B7F56A]/40'
                  : 'bg-[#15191F] border-[#222A36]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-bold uppercase ${
                        isCompleted
                          ? 'bg-[#B7F56A]/20 text-[#B7F56A]'
                          : 'bg-[#FF6B2C]/20 text-[#FF6B2C]'
                      }`}
                    >
                      {goal.category}
                    </span>
                    {goal.deadline && (
                      <span className="text-[10px] text-[#6D7787] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Meta: {goal.deadline}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-[#6D7787] hover:text-red-400 p-1 rounded"
                      title="Eliminar meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-white mb-1">{goal.title}</h3>
                <p className="text-xs text-[#9299A5] mb-4 leading-relaxed">{goal.description}</p>

                {/* Values Comparison */}
                {goal.targetValue !== undefined && (
                  <div className="flex items-baseline justify-between mb-3 text-xs bg-[#0B0D10] p-3 rounded-2xl border border-[#1E2530]">
                    <div>
                      <span className="text-[#6D7787] block text-[10px]">Inicial</span>
                      <span className="font-mono-num font-semibold text-white">
                        {goal.initialValue} {goal.unit}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[#9299A5] block text-[10px]">Actual</span>
                      <span className="font-mono-num font-black text-base text-[#FF6B2C]">
                        {goal.currentValue ?? goal.initialValue} {goal.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[#B7F56A] block text-[10px]">Objetivo</span>
                      <span className="font-mono-num font-bold text-white">
                        {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-mono-num">
                    <span className="text-[#9299A5]">Progreso</span>
                    <span className={`font-bold ${isCompleted ? 'text-[#B7F56A]' : 'text-white'}`}>
                      {progressPct}%
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
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1E2530]">
                {isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#B7F56A]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Objetivo alcanzado!</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#6D7787]">En progreso</span>
                )}

                <button
                  onClick={() => {
                    setSelectedGoalForUpdate(goal);
                    setProgressValueInput(goal.currentValue !== undefined ? String(goal.currentValue) : '');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0B0D10] hover:bg-[#1A222D] border border-[#26303E] transition"
                >
                  Actualizar progreso
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
            <h3 className="font-display font-black text-lg mb-1">ACTUALIZAR PROGRESO</h3>
            <p className="text-xs text-[#9299A5] mb-4 truncate">{selectedGoalForUpdate.title}</p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">
                  Nuevo valor actual ({selectedGoalForUpdate.unit})
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
                  placeholder="Ej. Medido en el gimnasio del club"
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252E3C]">
                <button
                  type="button"
                  onClick={() => setSelectedGoalForUpdate(null)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243]"
                >
                  Guardar Avance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#15191F] border border-[#2B3545] p-6 shadow-2xl text-white">
            <h3 className="font-display font-black text-xl mb-4">NUEVO OBJETIVO DEPORTIVO</h3>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9299A5] mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const c = e.target.value as GoalCategory;
                    setCategory(c);
                    if (c === 'vertical_jump') setUnit('cm');
                    if (c === 'acceleration' || c === 'speed') setUnit('seg');
                    if (c === 'shooting') setUnit('%');
                    if (c === 'strength') setUnit('kg');
                    if (c === 'consistency') setUnit('sesiones/sem');
                  }}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                >
                  <option value="vertical_jump">Salto Vertical</option>
                  <option value="acceleration">Aceleración / Sprint 10m</option>
                  <option value="shooting">Efectividad de Tiro</option>
                  <option value="strength">Fuerza / Cargas Gimnasio</option>
                  <option value="consistency">Constancia de Entrenamientos</option>
                  <option value="ballhandling">Manejo de Balón</option>
                  <option value="custom">Otro objetivo</option>
                </select>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Título del objetivo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Bajar de 1.65 seg en 10 metros"
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Descripción / Propósito</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej. Mejorar el primer paso en contraataque"
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#9299A5] mb-1">Valor inicial</label>
                  <input
                    type="number"
                    step="any"
                    value={initialValue}
                    onChange={(e) => setInitialValue(e.target.value)}
                    placeholder="Ej. 1.76"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Valor meta</label>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="Ej. 1.65"
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num font-bold text-[#FF6B2C]"
                  />
                </div>
                <div>
                  <label className="block text-[#9299A5] mb-1">Unidad</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9299A5] mb-1">Fecha límite estimada (opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#252E3C] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#252E3C]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-[#9299A5] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243]"
                >
                  Crear Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
