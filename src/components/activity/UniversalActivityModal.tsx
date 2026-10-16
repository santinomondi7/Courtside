import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Dumbbell,
  Home,
  Target,
  Trophy,
  HeartPulse,
  Coffee,
  Activity as ActivityIcon,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { MOTIVATIONAL_CUES } from '../../data/motivationalQuotes';
import {
  Activity,
  ActivityCategory,
  ActivityStatus,
  GymExercise,
  HomeExercise,
} from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: Activity) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  initialActivity?: Activity | null;
  defaultCategory?: ActivityCategory;
}

const CATEGORIES: Array<{
  id: ActivityCategory;
  label: string;
  icon: any;
  color: string;
  desc: string;
}> = [
  { id: 'iacc_team', label: 'Entrenamiento IACC', icon: Users, color: '#EF4444', desc: 'Práctica de equipo del club' },
  { id: 'institute_gym', label: 'Gimnasio Instituto', icon: Dumbbell, color: '#FF6B2C', desc: 'Fuerza, cargas y potencia' },
  { id: 'home_physical', label: 'Físico en Casa', icon: Home, color: '#3B82F6', desc: 'Pliometría, core y estabilidad' },
  { id: 'home_individual', label: 'Técnica Individual', icon: Target, color: '#B7F56A', desc: 'Aro en patio, tiro y manejo' },
  { id: 'match', label: 'Partido', icon: Trophy, color: '#F59E0B', desc: 'Encuentro competitivo oficial/amistoso' },
  { id: 'recovery', label: 'Recuperación / Movilidad', icon: HeartPulse, color: '#10B981', desc: 'Estiramiento, foam roller, descarga' },
  { id: 'rest', label: 'Descanso Total', icon: Coffee, color: '#8B5CF6', desc: 'Día de regeneración pasiva' },
  { id: 'custom', label: 'Otra Actividad', icon: ActivityIcon, color: '#EC4899', desc: 'Sesión personalizada' },
];

const IACC_CONTENTS_LIST = [
  'Técnica individual',
  'Táctica ofensiva',
  'Táctica defensiva',
  'Tiro bajo presión',
  'Transición rápida',
  'Acondicionamiento físico',
  'Situaciones de juego (5v5)',
  'Pick and Roll',
  'Balance defensivo',
  'Scouting rival',
];

const BASKETBALL_SKILLS_LIST = [
  { id: 'tiros_libres', label: 'Tiros libres' },
  { id: 'mecanica_tiro', label: 'Mecánica de tiro' },
  { id: 'lanzamientos_posicion', label: 'Tiros por posición (Triple/Media)' },
  { id: 'manejo_balon', label: 'Manejo de balón (Dribbling)' },
  { id: 'cambios_mano', label: 'Cambios de mano y ritmo' },
  { id: 'finalizaciones_aro', label: 'Finalizaciones cerca del aro' },
  { id: 'trabajo_pies', label: 'Trabajo de pies (Footwork)' },
  { id: 'desplazamientos_defensivos', label: 'Desplazamientos defensivos' },
  { id: 'otro', label: 'Otra destreza específica' },
];

export const UniversalActivityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  initialActivity,
  defaultCategory = 'iacc_team',
}) => {
  const isEditing = Boolean(initialActivity?.id);

  // Core fields
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('18:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [category, setCategory] = useState<ActivityCategory>(defaultCategory);
  const [status, setStatus] = useState<ActivityStatus>('completed');
  const [rpe, setRpe] = useState<number>(7);
  const [fatigueLevel, setFatigueLevel] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<string>('8');
  const [sorenessAreasInput, setSorenessAreasInput] = useState<string>('');
  const [sorenessLevel, setSorenessLevel] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // IACC specifics
  const [iaccCategoryLevel, setIaccCategoryLevel] = useState<'U17' | 'U21'>('U17');
  const [iaccAttendance, setIaccAttendance] = useState<'present' | 'absent' | 'partial'>('present');
  const [iaccContents, setIaccContents] = useState<string[]>(['táctica', 'tiro']);
  const [iaccWhatWentWell, setIaccWhatWentWell] = useState<string>('');
  const [iaccNeedsImprovement, setIaccNeedsImprovement] = useState<string>('');

  // Gym specifics
  const [gymGoal, setGymGoal] = useState<string>('Fuerza y potencia');
  const [gymExercises, setGymExercises] = useState<GymExercise[]>([
    { id: '1', name: 'Trap Bar Deadlift', sets: 4, reps: 5, weightKg: 100, restSeconds: 120, notes: '' },
    { id: '2', name: 'Sentadilla frontal', sets: 4, reps: 6, weightKg: 65, restSeconds: 120, notes: '' },
  ]);

  // Home physical specifics
  const [homeSessionName, setHomeSessionName] = useState<string>('Sesión A — Pliometría y Potencia');
  const [homeGoal, setHomeGoal] = useState<string>('Despegue reactivo y estabilidad');
  const [homeExercises, setHomeExercises] = useState<HomeExercise[]>([
    { id: '1', name: 'Pogo Jumps reactivos', prescribedSets: '4', prescribedReps: '15 reps', completed: true, actualSets: 4, actualReps: 15 },
    { id: '2', name: 'Drop Freeze', prescribedSets: '4', prescribedReps: '6 reps', completed: true, actualSets: 4, actualReps: 6 },
  ]);

  // Basketball Skill specifics
  const [basketballSkillCategory, setBasketballSkillCategory] = useState<string>('tiros_libres');
  const [basketballDrillName, setBasketballDrillName] = useState<string>('Tiros Libres en el Patio');
  const [basketballShotPosition, setBasketballShotPosition] = useState<string>('Línea de libres');
  const [basketballApproxDistanceMeters, setBasketballApproxDistanceMeters] = useState<string>('4.57');
  const [basketballAttempts, setBasketballAttempts] = useState<string>('50');
  const [basketballMakes, setBasketballMakes] = useState<string>('42');
  const [basketballDifficulty, setBasketballDifficulty] = useState<number>(3);

  // Match specifics
  const [matchOpponent, setMatchOpponent] = useState<string>('');
  const [matchResult, setMatchResult] = useState<'Victoria' | 'Derrota'>('Victoria');
  const [matchScore, setMatchScore] = useState<string>('');
  const [matchMinutesPlayed, setMatchMinutesPlayed] = useState<string>('20');
  const [matchPoints, setMatchPoints] = useState<string>('');
  const [matchAssists, setMatchAssists] = useState<string>('');
  const [matchRebounds, setMatchRebounds] = useState<string>('');
  const [matchSteals, setMatchSteals] = useState<string>('');
  const [matchBlocks, setMatchBlocks] = useState<string>('');
  const [matchFouls, setMatchFouls] = useState<string>('');
  const [matchPlusMinus, setMatchPlusMinus] = useState<string>('');

  const [validationError, setValidationError] = useState<string | null>(null);
  const [showMentalReset, setShowMentalReset] = useState<boolean>(false);
  const [mentalResetIndex, setMentalResetIndex] = useState<number>(0);

  // Reset or Populate fields when initialActivity changes
  useEffect(() => {
    if (initialActivity) {
      setDate(initialActivity.date || new Date().toISOString().split('T')[0]);
      setStartTime(initialActivity.startTime || '18:00');
      setDurationMinutes(initialActivity.durationMinutes ?? 60);
      setCategory(initialActivity.category || 'iacc_team');
      setStatus(initialActivity.status || 'completed');
      setRpe(initialActivity.rpe ?? 7);
      setFatigueLevel(initialActivity.fatigueLevel ?? 5);
      setSleepHours(initialActivity.sleepHours !== undefined ? String(initialActivity.sleepHours) : '8');
      setSorenessAreasInput(initialActivity.sorenessAreas ? initialActivity.sorenessAreas.join(', ') : '');
      setSorenessLevel(initialActivity.sorenessLevel ?? 0);
      setNotes(initialActivity.notes || '');

      // IACC
      setIaccCategoryLevel(initialActivity.iaccCategoryLevel || 'U17');
      setIaccAttendance(initialActivity.iaccAttendance || 'present');
      setIaccContents(initialActivity.iaccContents || ['táctica', 'tiro']);
      setIaccWhatWentWell(initialActivity.iaccWhatWentWell || '');
      setIaccNeedsImprovement(initialActivity.iaccNeedsImprovement || '');

      // Gym
      setGymGoal(initialActivity.gymGoal || 'Fuerza y potencia');
      setGymExercises(initialActivity.gymExercises || []);

      // Home
      setHomeSessionName(initialActivity.homeSessionName || 'Sesión A');
      setHomeGoal(initialActivity.homeGoal || '');
      setHomeExercises(initialActivity.homeExercises || []);

      // Basketball skill
      setBasketballSkillCategory(initialActivity.basketballSkillCategory || 'tiros_libres');
      setBasketballDrillName(initialActivity.basketballDrillName || 'Práctica de tiro');
      setBasketballShotPosition(initialActivity.basketballShotPosition || '');
      setBasketballApproxDistanceMeters(initialActivity.basketballApproxDistanceMeters ? String(initialActivity.basketballApproxDistanceMeters) : '');
      setBasketballAttempts(initialActivity.basketballAttempts !== undefined ? String(initialActivity.basketballAttempts) : '');
      setBasketballMakes(initialActivity.basketballMakes !== undefined ? String(initialActivity.basketballMakes) : '');
      setBasketballDifficulty(initialActivity.basketballDifficulty ?? 3);

      // Match
      setMatchOpponent(initialActivity.matchOpponent || '');
      setMatchResult(initialActivity.matchResult || 'Victoria');
      setMatchScore(initialActivity.matchScore || '');
      setMatchMinutesPlayed(initialActivity.matchMinutesPlayed !== undefined ? String(initialActivity.matchMinutesPlayed) : '');
      setMatchPoints(initialActivity.matchPoints !== undefined ? String(initialActivity.matchPoints) : '');
      setMatchAssists(initialActivity.matchAssists !== undefined ? String(initialActivity.matchAssists) : '');
      setMatchRebounds(initialActivity.matchRebounds !== undefined ? String(initialActivity.matchRebounds) : '');
      setMatchSteals(initialActivity.matchSteals !== undefined ? String(initialActivity.matchSteals) : '');
      setMatchBlocks(initialActivity.matchBlocks !== undefined ? String(initialActivity.matchBlocks) : '');
      setMatchFouls(initialActivity.matchFouls !== undefined ? String(initialActivity.matchFouls) : '');
      setMatchPlusMinus(initialActivity.matchPlusMinus !== undefined ? String(initialActivity.matchPlusMinus) : '');
    } else {
      // Default new activity
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(defaultCategory);
      setDurationMinutes(category === 'rest' ? 0 : 60);
      setStatus('completed');
    }
  }, [initialActivity, defaultCategory, isOpen]);

  if (!isOpen) return null;

  // Calculate shooting accuracy in real-time
  const attemptsNum = parseInt(basketballAttempts, 10) || 0;
  const makesNum = parseInt(basketballMakes, 10) || 0;
  const accuracyPercentage = attemptsNum > 0 ? Math.min(100, Math.round((makesNum / attemptsNum) * 100)) : 0;


  const toggleIaccContent = (content: string) => {
    setIaccContents((prev) =>
      prev.includes(content) ? prev.filter((c) => c !== content) : [...prev, content]
    );
  };

  const addGymExercise = () => {
    setGymExercises((prev) => [
      ...prev,
      {
        id: `ex-${Date.now()}`,
        name: 'Nuevo ejercicio',
        sets: 3,
        reps: 8,
        weightKg: 20,
        restSeconds: 90,
      },
    ]);
  };

  const removeGymExercise = (index: number) => {
    setGymExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGymExercise = (index: number, field: keyof GymExercise, val: any) => {
    setGymExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const addHomeExercise = () => {
    setHomeExercises((prev) => [
      ...prev,
      {
        id: `hex-${Date.now()}`,
        name: 'Nuevo ejercicio',
        prescribedSets: '3',
        prescribedReps: '10',
        completed: true,
        actualSets: 3,
        actualReps: 10,
      },
    ]);
  };

  const removeHomeExercise = (index: number) => {
    setHomeExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const updateHomeExercise = (index: number, field: keyof HomeExercise, val: any) => {
    setHomeExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!date) {
      setValidationError('Por favor seleccioná una fecha.');
      return;
    }

    if (category !== 'rest' && status === 'completed' && durationMinutes <= 0) {
      setValidationError('La duración de una sesión completada debe ser mayor a 0 minutos.');
      return;
    }

    if (category === 'home_individual' && attemptsNum > 0 && makesNum > attemptsNum) {
      setValidationError('Los tiros convertidos no pueden ser mayores a los intentos.');
      return;
    }

    const sorenessAreas = sorenessAreasInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const activityToSave: Activity = {
      id: initialActivity?.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date,
      startTime: startTime || undefined,
      durationMinutes: category === 'rest' ? 0 : Number(durationMinutes) || 0,
      category,
      status,
      rpe: category === 'rest' ? 0 : Number(rpe),
      fatigueLevel: Number(fatigueLevel),
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      sorenessAreas: sorenessAreas.length > 0 ? sorenessAreas : undefined,
      sorenessLevel: Number(sorenessLevel),
      notes: notes.trim() || undefined,

      // IACC
      iaccCategoryLevel: category === 'iacc_team' ? iaccCategoryLevel : undefined,
      iaccAttendance: category === 'iacc_team' ? iaccAttendance : undefined,
      iaccContents: category === 'iacc_team' ? iaccContents : undefined,
      iaccWhatWentWell: category === 'iacc_team' ? iaccWhatWentWell.trim() || undefined : undefined,
      iaccNeedsImprovement: category === 'iacc_team' ? iaccNeedsImprovement.trim() || undefined : undefined,

      // Gym
      gymGoal: category === 'institute_gym' ? gymGoal.trim() || undefined : undefined,
      gymExercises: category === 'institute_gym' ? gymExercises : undefined,

      // Home physical
      homeSessionName: category === 'home_physical' ? homeSessionName.trim() || undefined : undefined,
      homeGoal: category === 'home_physical' ? homeGoal.trim() || undefined : undefined,
      homeExercises: category === 'home_physical' ? homeExercises : undefined,

      // Individual basketball
      basketballSkillCategory: category === 'home_individual' ? basketballSkillCategory : undefined,
      basketballDrillName: category === 'home_individual' ? basketballDrillName.trim() || undefined : undefined,
      basketballShotPosition: category === 'home_individual' ? basketballShotPosition.trim() || undefined : undefined,
      basketballApproxDistanceMeters:
        category === 'home_individual' && basketballApproxDistanceMeters
          ? Number(basketballApproxDistanceMeters)
          : undefined,
      basketballAttempts: category === 'home_individual' && attemptsNum > 0 ? attemptsNum : undefined,
      basketballMakes: category === 'home_individual' && attemptsNum > 0 ? makesNum : undefined,
      basketballAccuracyPercentage:
        category === 'home_individual' && attemptsNum > 0 ? accuracyPercentage : undefined,
      basketballDifficulty: category === 'home_individual' ? basketballDifficulty : undefined,

      // Match
      matchOpponent: category === 'match' ? matchOpponent.trim() || undefined : undefined,
      matchResult: category === 'match' ? matchResult : undefined,
      matchScore: category === 'match' ? matchScore.trim() || undefined : undefined,
      matchMinutesPlayed: category === 'match' && matchMinutesPlayed ? Number(matchMinutesPlayed) : undefined,
      matchPoints: category === 'match' && matchPoints ? Number(matchPoints) : undefined,
      matchAssists: category === 'match' && matchAssists ? Number(matchAssists) : undefined,
      matchRebounds: category === 'match' && matchRebounds ? Number(matchRebounds) : undefined,
      matchSteals: category === 'match' && matchSteals ? Number(matchSteals) : undefined,
      matchBlocks: category === 'match' && matchBlocks ? Number(matchBlocks) : undefined,
      matchFouls: category === 'match' && matchFouls ? Number(matchFouls) : undefined,
      matchPlusMinus: category === 'match' && matchPlusMinus ? Number(matchPlusMinus) : undefined,

      createdAt: initialActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(activityToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl bg-[#15191F] border border-[#273140] shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#202734] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
              {isEditing ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-display font-black text-xl tracking-wide">
                {isEditing ? 'EDITAR ACTIVIDAD' : 'REGISTRAR ACTIVIDAD'}
              </h2>
              <p className="text-xs text-[#9299A5]">
                {isEditing
                  ? 'Modificá los datos del entrenamiento registrado'
                  : 'Guardá tu entrenamiento real para alimentar tus estadísticas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && onDuplicate && initialActivity?.id && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(initialActivity.id);
                  onClose();
                }}
                title="Duplicar como nueva sesión"
                className="p-2 rounded-xl text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#202734] hover:bg-[#1E2633] transition"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            {isEditing && onDelete && initialActivity?.id && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialActivity.id);
                  onClose();
                }}
                title="Eliminar registro"
                className="p-2 rounded-xl text-red-400 hover:text-white bg-[#0B0D10] border border-[#202734] hover:bg-red-500/20 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#202734] hover:bg-[#1E2633] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {validationError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Category Selector */}
          <div>
            <label className="block text-xs font-mono-num font-bold text-[#9299A5] uppercase tracking-wider mb-2.5">
              1. Categoría de la actividad
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'rest') {
                        setDurationMinutes(0);
                        setRpe(0);
                      } else if (durationMinutes === 0) {
                        setDurationMinutes(60);
                        setRpe(7);
                      }
                    }}
                    className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-[#FF6B2C]/15 border-[#FF6B2C] text-white shadow-lg shadow-[#FF6B2C]/10'
                        : 'bg-[#0E1117] border-[#1F2633] text-[#9299A5] hover:border-[#2F394A] hover:text-white'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mb-2 ${
                        isSelected ? 'bg-[#FF6B2C] text-black font-bold' : 'bg-[#18202A]'
                      }`}
                      style={{ color: isSelected ? '#000' : cat.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white">{cat.label}</div>
                    <div className="text-[10px] text-[#6E7887] leading-tight mt-0.5">{cat.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Basic Schedule & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0B0D10] p-4 rounded-2xl border border-[#1E2530]">
            <div>
              <label className="block text-[11px] font-semibold text-[#9299A5] mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9299A5] mb-1">Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9299A5] mb-1">
                Duración (min)
              </label>
              <input
                type="number"
                min="0"
                max="360"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                disabled={category === 'rest'}
                className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#9299A5] mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
              >
                <option value="completed">Completada</option>
                <option value="partial">Parcial</option>
                <option value="planned">Planificada</option>
                <option value="cancelled">Cancelada</option>
                <option value="missed">No realizada</option>
              </select>
            </div>
          </div>

          {/* 3. Category Specific Module Fields */}

          {/* === IACC TEAM === */}
          {category === 'iacc_team' && (
            <div className="space-y-4 p-4 rounded-2xl bg-red-950/15 border border-red-500/25">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h3 className="font-display font-bold text-sm text-red-200 tracking-wide">
                  MÓDULO IACC — ENTRENAMIENTO DEL EQUIPO
                </h3>
              </div>
              <p className="text-[11px] text-[#9299A5] italic">
                Nota: COURTSIDE no diseña ni modifica la rutina de IACC. Registrá aquí lo que el cuerpo técnico del club indicó y cómo te sentiste.
              </p>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">
                  Categoría del entrenamiento en Instituto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIaccCategoryLevel('U17')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      iaccCategoryLevel === 'U17'
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                        : 'bg-[#0B0D10] border-[#222935] text-[#9299A5] hover:text-white'
                    }`}
                  >
                    🏀 U17 — Tu Categoría Base
                  </button>
                  <button
                    type="button"
                    onClick={() => setIaccCategoryLevel('U21')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      iaccCategoryLevel === 'U21'
                        ? 'bg-[#FF6B2C] text-black border-[#FF8243] shadow-md shadow-[#FF6B2C]/30'
                        : 'bg-[#0B0D10] border-[#222935] text-[#9299A5] hover:text-white'
                    }`}
                  >
                    ⚡ U21 — Roce Superior / LDD
                  </button>
                </div>
                {iaccCategoryLevel === 'U21' ? (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 text-[11px] text-[#FF8243] leading-relaxed">
                    <strong>⚡ Sesión con U21:</strong> Estás jugando con atletas mayores. El objetivo no es ganar por físico, sino absorber el ritmo, jugar con pase rápido a un toque y aprender a soportar el contacto sin frustrarte.
                  </div>
                ) : (
                  <div className="mt-2 p-2.5 rounded-xl bg-[#0B0D10] border border-[#222A36] text-[11px] text-[#9299A5] leading-relaxed">
                    <strong>🏀 Sesión con U17:</strong> Tu categoría competitiva en el club. Enfocate en tu liderazgo en cancha, toma de decisiones y consistencia en los sistemas.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Asistencia al club</label>
                <div className="flex gap-2">
                  {[
                    { id: 'present', label: 'Presente completo' },
                    { id: 'partial', label: 'Participación parcial' },
                    { id: 'absent', label: 'Ausente' },
                  ].map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => setIaccAttendance(att.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        iaccAttendance === att.id
                          ? 'bg-red-500 text-white border-red-400'
                          : 'bg-[#0B0D10] border-[#222935] text-[#9299A5] hover:text-white'
                      }`}
                    >
                      {att.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-2">
                  Contenidos trabajados en cancha (marcar los aplicados)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {IACC_CONTENTS_LIST.map((c) => {
                    const isChecked = iaccContents.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleIaccContent(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          isChecked
                            ? 'bg-[#FF6B2C] text-black font-bold border-[#FF6B2C]'
                            : 'bg-[#0B0D10] border-[#252E3C] text-[#9299A5] hover:text-white'
                        }`}
                      >
                        {isChecked ? `✓ ${c}` : `+ ${c}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    ¿Qué hiciste bien en la sesión?
                  </label>
                  <input
                    type="text"
                    value={iaccWhatWentWell}
                    onChange={(e) => setIaccWhatWentWell(e.target.value)}
                    placeholder="Ej. Buena lectura en PnR, intensidad defensiva"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    ¿Qué necesitás mejorar / corregir?
                  </label>
                  <input
                    type="text"
                    value={iaccNeedsImprovement}
                    onChange={(e) => setIaccNeedsImprovement(e.target.value)}
                    placeholder="Ej. Box out en tiros de esquina, evitar balancear el tiro"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* === INSTITUTE GYM === */}
          {category === 'institute_gym' && (
            <div className="space-y-4 p-4 rounded-2xl bg-[#FF6B2C]/5 border border-[#FF6B2C]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#FF6B2C]" />
                  <h3 className="font-display font-bold text-sm text-[#FF8243] tracking-wide">
                    MÓDULO DE GIMNASIO EN INSTITUTO
                  </h3>
                </div>
                <div className="text-[11px] font-mono-num font-bold text-[#9299A5] bg-[#15191F] border border-[#252E3C] px-2 py-0.5 rounded-lg">
                  {gymExercises.length} ejercicios
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Objetivo del bloque</label>
                <input
                  type="text"
                  value={gymGoal}
                  onChange={(e) => setGymGoal(e.target.value)}
                  placeholder="Ej. Fuerza máxima, potencia concéntrica, hipertrofia útil"
                  className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                />
              </div>

              {/* Exercises table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white">Ejercicios realizados</label>
                  <button
                    type="button"
                    onClick={addGymExercise}
                    className="flex items-center gap-1 text-xs font-bold text-[#FF6B2C] hover:text-[#FF8243]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar ejercicio
                  </button>
                </div>

                <div className="space-y-2">
                  {gymExercises.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-[#0B0D10] border border-[#1E2530] items-center text-xs"
                    >
                      <div className="col-span-5 sm:col-span-4">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => updateGymExercise(idx, 'name', e.target.value)}
                          placeholder="Nombre del ejercicio"
                          className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={ex.sets}
                          onChange={(e) => updateGymExercise(idx, 'sets', Number(e.target.value))}
                          placeholder="Series"
                          title="Series"
                          className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={ex.reps}
                          onChange={(e) => updateGymExercise(idx, 'reps', Number(e.target.value))}
                          placeholder="Reps"
                          title="Reps"
                          className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={ex.weightKg}
                            onChange={(e) => updateGymExercise(idx, 'weightKg', Number(e.target.value))}
                            placeholder="kg"
                            title="Peso en kg"
                            className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none"
                          />
                          <span className="absolute right-1 top-1.5 text-[9px] text-[#6E7887]">kg</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeGymExercise(idx)}
                          className="text-[#6E7887] hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-[10px] text-[#6E7887] flex items-center justify-between">
                  <span>Ajustá las series, repeticiones y peso utilizado en cada máquina o barra</span>
                  <span>{gymExercises.length} ejercicios registrados</span>
                </div>
              </div>
            </div>
          )}

          {/* === HOME PHYSICAL === */}
          {category === 'home_physical' && (
            <div className="space-y-4 p-4 rounded-2xl bg-blue-950/15 border border-blue-500/30">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-400" />
                <h3 className="font-display font-bold text-sm text-blue-300 tracking-wide">
                  ENTRENAMIENTO FÍSICO EN CASA (PLAN INDIVIDUAL)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Nombre de la sesión</label>
                  <input
                    type="text"
                    value={homeSessionName}
                    onChange={(e) => setHomeSessionName(e.target.value)}
                    placeholder="Ej. Sesión A - Pliometría y Potencia"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Objetivo</label>
                  <input
                    type="text"
                    value={homeGoal}
                    onChange={(e) => setHomeGoal(e.target.value)}
                    placeholder="Ej. Tiempo de contacto mínimo, fuerza de frenado"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white">Ejercicios del plan</label>
                  <button
                    type="button"
                    onClick={addHomeExercise}
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar ejercicio
                  </button>
                </div>

                <div className="space-y-2">
                  {homeExercises.map((hex, idx) => (
                    <div
                      key={hex.id || idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0B0D10] border border-[#1E2530] text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={hex.completed}
                        onChange={(e) => updateHomeExercise(idx, 'completed', e.target.checked)}
                        className="w-4 h-4 rounded text-blue-500 focus:ring-0"
                      />
                      <input
                        type="text"
                        value={hex.name}
                        onChange={(e) => updateHomeExercise(idx, 'name', e.target.value)}
                        placeholder="Nombre ejercicio"
                        className="flex-1 bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={hex.prescribedSets}
                        onChange={(e) => updateHomeExercise(idx, 'prescribedSets', e.target.value)}
                        placeholder="Series"
                        className="w-16 bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1 text-xs text-center text-white"
                      />
                      <input
                        type="text"
                        value={hex.prescribedReps}
                        onChange={(e) => updateHomeExercise(idx, 'prescribedReps', e.target.value)}
                        placeholder="Reps"
                        className="w-20 bg-[#15191F] border border-[#252E3C] rounded-lg px-2 py-1 text-xs text-center text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeHomeExercise(idx)}
                        className="text-[#6E7887] hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === HOME INDIVIDUAL BASKETBALL SKILL === */}
          {category === 'home_individual' && (
            <div className="space-y-4 p-4 rounded-2xl bg-[#B7F56A]/5 border border-[#B7F56A]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#B7F56A]" />
                  <h3 className="font-display font-bold text-sm text-[#B7F56A] tracking-wide">
                    TÉCNICA INDIVIDUAL (ARO EN PATIO / ESPACIO REDUCIDO)
                  </h3>
                </div>
                {attemptsNum > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-mono-num font-bold text-black bg-[#B7F56A] px-2.5 py-1 rounded-xl">
                    <span>Efectividad: {accuracyPercentage}%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Destreza trabajada</label>
                  <select
                    value={basketballSkillCategory}
                    onChange={(e) => setBasketballSkillCategory(e.target.value)}
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B7F56A]"
                  >
                    {BASKETBALL_SKILLS_LIST.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Nombre del ejercicio</label>
                  <input
                    type="text"
                    value={basketballDrillName}
                    onChange={(e) => setBasketballDrillName(e.target.value)}
                    placeholder="Ej. Tiros libres con fatiga, cambios entre piernas"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B7F56A]"
                  />
                </div>
              </div>

              {/* Shooting stats (shown if drill involves shooting) */}
              {basketballSkillCategory.includes('tiro') || basketballSkillCategory.includes('lanzamiento') ? (
                <div className="p-3 rounded-xl bg-[#0B0D10] border border-[#222A36] space-y-3">
                  <div className="text-xs font-bold text-[#B7F56A] flex items-center justify-between">
                    <span>Registro de Lanzamientos y Acierto</span>
                    <span className="text-[10px] text-[#9299A5]">Fórmula: (Aciertos ÷ Intentos) × 100</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-[#9299A5] mb-1">Posición / Zona</label>
                      <input
                        type="text"
                        value={basketballShotPosition}
                        onChange={(e) => setBasketballShotPosition(e.target.value)}
                        placeholder="Ej. Eje 6.75m / Codo"
                        className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9299A5] mb-1">Distancia aprox (m)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={basketballApproxDistanceMeters}
                        onChange={(e) => setBasketballApproxDistanceMeters(e.target.value)}
                        placeholder="Ej. 4.5"
                        className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9299A5] mb-1">Intentos totales</label>
                      <input
                        type="number"
                        min="1"
                        value={basketballAttempts}
                        onChange={(e) => setBasketballAttempts(e.target.value)}
                        placeholder="Ej. 50"
                        className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#9299A5] mb-1">Aciertos (metidos)</label>
                      <input
                        type="number"
                        min="0"
                        max={attemptsNum || undefined}
                        value={basketballMakes}
                        onChange={(e) => setBasketballMakes(e.target.value)}
                        placeholder="Ej. 41"
                        className="w-full bg-[#15191F] border border-[#252E3C] rounded-lg px-2.5 py-1.5 text-xs text-white font-bold text-[#B7F56A]"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Dificultad percibida: {basketballDifficulty} / 5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={basketballDifficulty}
                  onChange={(e) => setBasketballDifficulty(Number(e.target.value))}
                  className="w-full accent-[#B7F56A]"
                />
              </div>
            </div>
          )}

          {/* === MATCH SPECIFICS === */}
          {category === 'match' && (
            <div className="space-y-4 p-4 rounded-2xl bg-amber-950/15 border border-amber-500/30">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-sm text-amber-300 tracking-wide">
                  PARTIDO COMPETITIVO
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Rival</label>
                  <input
                    type="text"
                    value={matchOpponent}
                    onChange={(e) => setMatchOpponent(e.target.value)}
                    placeholder="Ej. Atenas / San Martín"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Resultado</label>
                  <select
                    value={matchResult}
                    onChange={(e) => setMatchResult(e.target.value as any)}
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Victoria">Victoria</option>
                    <option value="Derrota">Derrota</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">Tanteador final</label>
                  <input
                    type="text"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Ej. 78 - 71"
                    className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#0B0D10] p-3 rounded-xl border border-[#202734]">
                <div>
                  <label className="block text-[10px] text-[#9299A5]">Minutos</label>
                  <input
                    type="number"
                    value={matchMinutesPlayed}
                    onChange={(e) => setMatchMinutesPlayed(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9299A5]">Puntos</label>
                  <input
                    type="number"
                    value={matchPoints}
                    onChange={(e) => setMatchPoints(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white font-bold text-[#FF6B2C]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9299A5]">Asistencias</label>
                  <input
                    type="number"
                    value={matchAssists}
                    onChange={(e) => setMatchAssists(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9299A5]">Rebotes</label>
                  <input
                    type="number"
                    value={matchRebounds}
                    onChange={(e) => setMatchRebounds(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9299A5]">Robos</label>
                  <input
                    type="number"
                    value={matchSteals}
                    onChange={(e) => setMatchSteals(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#9299A5]">+/-</label>
                  <input
                    type="number"
                    value={matchPlusMinus}
                    onChange={(e) => setMatchPlusMinus(e.target.value)}
                    className="w-full bg-[#15191F] rounded p-1 text-center text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Athlete Load & Biofeedback (RPE, Fatigue, Sleep, Soreness) */}
          <div className="space-y-4 p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530]">
            <div className="text-xs font-mono-num font-bold text-[#9299A5] uppercase tracking-wider">
              Carga Percibida y Estado Físico
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* RPE */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Intensidad (RPE 1-10)</span>
                  <span className="font-mono-num font-bold text-[#FF6B2C]">{rpe}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  disabled={category === 'rest'}
                  className="w-full accent-[#FF6B2C]"
                />
                <div className="flex justify-between text-[10px] text-[#6E7887] mt-0.5">
                  <span>Muy suave</span>
                  <span>Extremo</span>
                </div>
              </div>

              {/* Fatigue */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Fatiga post-sesión</span>
                  <span className="font-mono-num font-bold text-yellow-400">{fatigueLevel}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={fatigueLevel}
                  onChange={(e) => setFatigueLevel(Number(e.target.value))}
                  className="w-full accent-yellow-400"
                />
                <div className="flex justify-between text-[10px] text-[#6E7887] mt-0.5">
                  <span>Fresco</span>
                  <span>Agotado</span>
                </div>
              </div>

              {/* Sleep */}
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Sueño noche anterior (hs)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="3"
                  max="14"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="Ej. 8.5"
                  className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Soreness / Pain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#18202A]">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Zonas con molestia o sobrecarga (opcional)
                </label>
                <input
                  type="text"
                  value={sorenessAreasInput}
                  onChange={(e) => setSorenessAreasInput(e.target.value)}
                  placeholder="Ej. gemelos, tendón rotuliano, hombro derecho"
                  className="w-full bg-[#15191F] border border-[#2B3545] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Nivel de molestia / dolor</span>
                  <span className={`font-mono-num font-bold ${sorenessLevel >= 7 ? 'text-red-400' : 'text-[#9299A5]'}`}>
                    {sorenessLevel}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={sorenessLevel}
                  onChange={(e) => setSorenessLevel(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          </div>

          {/* Mental Check-In & Frustration Reset */}
          <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#232C3A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#FF6B2C]" />
                <span className="text-xs font-bold text-white">
                  ¿Te sentiste frustrado, enojado o no te salieron las cosas hoy?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMentalReset(!showMentalReset)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                  showMentalReset
                    ? 'bg-[#FF6B2C] text-black border-[#FF6B2C]'
                    : 'bg-[#151922] text-[#9299A5] border-[#2A3445] hover:text-white'
                }`}
              >
                {showMentalReset ? 'Ocultar consejo' : '💡 Necesito un reset mental'}
              </button>
            </div>

            {showMentalReset && (
              <div className="mt-3 p-3 rounded-xl bg-[#151922] border border-[#FF6B2C]/30 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-num font-bold text-[#FF6B2C] uppercase tracking-wider">
                    {MOTIVATIONAL_CUES[mentalResetIndex % MOTIVATIONAL_CUES.length].tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMentalResetIndex((prev) => prev + 1)}
                    className="flex items-center gap-1 text-[11px] text-[#9299A5] hover:text-white transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ver otro consejo</span>
                  </button>
                </div>
                <p className="text-xs text-white italic font-medium leading-relaxed">
                  "{MOTIVATIONAL_CUES[mentalResetIndex % MOTIVATIONAL_CUES.length].quote}"
                </p>
                <div className="text-[11px] text-[#B7F56A] font-semibold flex items-center gap-1.5 pt-1 border-t border-[#232C3A]">
                  <span>⚡ Acción inmediata:</span>
                  <span>
                    {MOTIVATIONAL_CUES[mentalResetIndex % MOTIVATIONAL_CUES.length].actionableStep ||
                      'Escribí abajo qué sentís para soltarlo y no llevártelo a casa.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Personal Notes */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1">
              Notas y observaciones personales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Sensaciones, ajustes del entrenador, sensaciones de la pelota o foco táctico..."
              className="w-full bg-[#0B0D10] border border-[#2B3545] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF6B2C]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202734]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#252E3C] hover:bg-[#1E2532] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-[#FF6B2C] hover:bg-[#FF8243] shadow-lg shadow-[#FF6B2C]/25 transition active:scale-95"
            >
              {isEditing ? 'Guardar Cambios' : 'Registrar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
