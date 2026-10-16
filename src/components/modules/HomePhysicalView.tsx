import React, { useState, useEffect } from 'react';
import {
  Home,
  Plus,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
  Award,
} from 'lucide-react';
import { Activity, RoutineTemplate } from '../../types';

interface Props {
  activities: Activity[];
  templates: RoutineTemplate[];
  onOpenNewActivity: (category?: any, initialDate?: string) => void;
  onSelectActivity: (activity: Activity) => void;
}

interface PDFExercise {
  id: string;
  name: string;
  seriesReps: string;
  pausa: string;
  pausaSec: number;
  clave: string;
}

interface PDFBlock {
  title: string;
  durationMin: number;
  exercises: PDFExercise[];
}

export const HomePhysicalView: React.FC<Props> = ({
  activities,
  onOpenNewActivity,
  onSelectActivity,
}) => {
  const [selectedSession, setSelectedSession] = useState<'A' | 'B'>('A');
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Interactive Rest Timer
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerInitial, setTimerInitial] = useState<number>(60);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startTimer = (seconds: number) => {
    setTimerInitial(seconds);
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
  };

  const toggleTimer = () => {
    if (timerSeconds === null) {
      startTimer(timerInitial);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(timerInitial);
  };

  const toggleCheck = (id: string) => {
    setCompletedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Warmup from PDF
  const warmupBlock = {
    title: 'Calentamiento (15 min)',
    durationMin: 15,
    items: [
      {
        section: 'Movilidad 4 min',
        detail:
          'Tobillo a la pared 2 x 10, 90/90 de cadera, world’s greatest stretch, colgado + retracciones escapulares 2 x 8.',
      },
      {
        section: 'Soga 5 min',
        detail:
          'Suave, alternando pierna, pierna única 2 x 20 s, 4 x 20 s rápido / 10 s pausa.',
      },
      {
        section: 'Conos 6 min',
        detail:
          'Skips A 5 m x 3, pogo hops 2 x 10, puente de glúteo a una pierna 2 x 8, laterales con frenada, 2 arranques al 70%.',
      },
    ],
  };

  // Session A Blocks from PDF
  const sessionABlocks: PDFBlock[] = [
    {
      title: 'PLIOMETRÍA (18 min)',
      durationMin: 18,
      exercises: [
        {
          id: 'a-plio-1',
          name: 'Salto al cajón (baja caminando)',
          seriesReps: '3 x 4',
          pausa: '90 s',
          pausaSec: 90,
          clave: 'Salto máximo, aterriza suave',
        },
        {
          id: 'a-plio-2',
          name: 'Drop jump desde 25 cm',
          seriesReps: '3 x 4',
          pausa: '2 min',
          pausaSec: 120,
          clave: 'Contacto menor a 0,2 s',
        },
        {
          id: 'a-plio-3',
          name: 'Pogo jumps',
          seriesReps: '2 x 10',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Tobillo rígido',
        },
      ],
    },
    {
      title: 'FUERZA + CORE (30 min), pares alternados',
      durationMin: 30,
      exercises: [
        {
          id: 'a-fuerza-1a',
          name: '1a. Sentadilla búlgara',
          seriesReps: '3 x 6/pierna',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Bajada 4 s, subida explosiva; RIR 2',
        },
        {
          id: 'a-fuerza-1b',
          name: '1b. Dominada explosiva (prona)',
          seriesReps: '3 x 4-5',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Sube rápido, baja 3 s; RIR 2-3',
        },
        {
          id: 'a-fuerza-2a',
          name: '2a. Peso muerto a una pierna',
          seriesReps: '3 x 8/pierna',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Tempo 3-1-1; RIR 2',
        },
        {
          id: 'a-fuerza-2b',
          name: '2b. Flexión con palmada',
          seriesReps: '3 x 5',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Máxima velocidad',
        },
        {
          id: 'a-fuerza-3a',
          name: '3a. Rueda abdominal desde rodillas',
          seriesReps: '2 x 6-10',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'RIR 3',
        },
        {
          id: 'a-fuerza-3b',
          name: '3b. Dead bug',
          seriesReps: '2 x 8/lado',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Lento, lumbar pegada',
        },
      ],
    },
    {
      title: 'VELOCIDAD (12 min)',
      durationMin: 12,
      exercises: [
        {
          id: 'a-vel-1',
          name: 'Arranques lineales 4 m',
          seriesReps: '3 x 5 reps',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Conos a 0,5 m y 4,5 m de la pared',
        },
        {
          id: 'a-vel-2',
          name: 'Sprint 3 m + frenada en 2 pasos + arranque de vuelta 3 m',
          seriesReps: '3 x 3 reps',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Conos a 2 m y 5 m',
        },
        {
          id: 'a-vel-3',
          name: 'Deslizamientos defensivos 2,5 m',
          seriesReps: '3 x 8 s',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'A lo largo del pasillo',
        },
      ],
    },
  ];

  // Session B Blocks from PDF
  const sessionBBlocks: PDFBlock[] = [
    {
      title: 'PLIOMETRÍA (18 min)',
      durationMin: 18,
      exercises: [
        {
          id: 'b-plio-1',
          name: 'Subida al cajón a una pierna (baja caminando)',
          seriesReps: '3 x 3/pierna',
          pausa: '90 s',
          pausaSec: 90,
          clave: 'Sin impulso de la pierna libre',
        },
        {
          id: 'b-plio-2',
          name: 'Bajada desde 25 cm y aterrizaje a una pierna',
          seriesReps: '2 x 4/pierna',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Estabilizar, rodilla alineada',
        },
        {
          id: 'b-plio-3',
          name: 'Saltos laterales tipo patinador',
          seriesReps: '3 x 5/lado',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Amplitud de 1 m',
        },
        {
          id: 'b-plio-4',
          name: 'Pogo a una pierna',
          seriesReps: '2 x 8/pierna',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Contacto corto',
        },
      ],
    },
    {
      title: 'FUERZA + CORE (30 min), pares alternados',
      durationMin: 30,
      exercises: [
        {
          id: 'b-fuerza-1a',
          name: '1a. Pistol squat a cajón (mancuerna al pecho)',
          seriesReps: '3 x 4/pierna',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Bajada 4 s, subida explosiva; RIR 2',
        },
        {
          id: 'b-fuerza-1b',
          name: '1b. Dominada supina con pausa de 2 s arriba',
          seriesReps: '3 x 5',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Sube rápido, baja 3 s',
        },
        {
          id: 'b-fuerza-2a',
          name: '2a. Gemelo a una pierna con cajon',
          seriesReps: '3 x 10/pierna',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Tempo 3-1-X',
        },
        {
          id: 'b-fuerza-2b',
          name: '2b. Flexión declinada (pies en cajón)',
          seriesReps: '3 x 6-8',
          pausa: '75 s',
          pausaSec: 75,
          clave: 'Bajada 3 s, subida explosiva; RIR 2',
        },
        {
          id: 'b-fuerza-3a',
          name: '3a. Rueda abdominal',
          seriesReps: '2 x 6-10',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'RIR 3',
        },
        {
          id: 'b-fuerza-3b',
          name: '3b. Plancha lateral con elevación de cadera',
          seriesReps: '2 x 10/lado',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Controlado',
        },
      ],
    },
    {
      title: 'CAMBIOS DE DIRECCIÓN (12 min)',
      durationMin: 12,
      exercises: [
        {
          id: 'b-cod-1',
          name: 'Shuttle en 3 conos (ida-vuelta-ida)',
          seriesReps: '3 x 4 reps',
          pausa: '60 s',
          pausaSec: 60,
          clave: 'Conos separados 2 m',
        },
        {
          id: 'b-cod-2',
          name: 'Salida cruzada desde postura defensiva',
          seriesReps: '3 x 3/lado',
          pausa: '45 s',
          pausaSec: 45,
          clave: '2-3 pasos en diagonal',
        },
        {
          id: 'b-cod-3',
          name: 'Desaceleración: sprint 4 m + frenada en 2 pasos',
          seriesReps: '3 x 4 reps',
          pausa: '45 s',
          pausaSec: 45,
          clave: 'Cierra con salto al aro',
        },
      ],
    },
  ];

  const cooldownText =
    "Vuelta a la calma (2:07 a 2:15): flexor de cadera, pigeon o 90/90 y gemelos en pared 2 x 30 s/lado; colgado pasivo en barra 2 x 30 s; respiración nasal 2 min.";

  const activeBlocks = selectedSession === 'A' ? sessionABlocks : sessionBBlocks;
  const homeActivities = activities.filter((a) => a.category === 'home_physical');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/40 via-[#15191F] to-[#0B0D10] border border-blue-500/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono-num font-bold text-blue-400 uppercase tracking-wider">
                Plan Oficial Adjunto
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-wide">
              PLAN DE ENTRENAMIENTO EN CASA: SALTO, VELOCIDAD Y TREN SUPERIOR
            </h1>
            <p className="text-xs sm:text-sm text-[#9299A5] max-w-2xl">
              Rutina individual estructurada para potenciar salto vertical, aceleración y tren superior sin comprometer la frescura para las prácticas de Instituto.
            </p>
          </div>

          <button
            onClick={() => onOpenNewActivity('home_physical')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Registrar esta sesión hoy</span>
          </button>
        </div>
      </div>

      {/* Floating Rest Timer Widget (Useful for home training on PC and mobile) */}
      <div className="p-4 rounded-2xl bg-[#0B0D10] border border-[#222A36] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              timerSeconds !== null && timerSeconds === 0
                ? 'bg-[#B7F56A] text-black animate-pulse'
                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono-num font-bold text-[#9299A5] uppercase">
              Temporizador de Pausa entre Series
            </div>
            <div className="font-mono-num font-black text-xl text-white">
              {timerSeconds !== null
                ? `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`
                : '0:00'}
              {timerSeconds === 0 && <span className="text-[#B7F56A] text-xs ml-2 font-bold">¡Tiempo cumplido!</span>}
            </div>
          </div>
        </div>

        {/* Quick Pausas Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { label: '45s', sec: 45 },
            { label: '60s', sec: 60 },
            { label: '75s', sec: 75 },
            { label: '90s', sec: 90 },
            { label: '2 min', sec: 120 },
          ].map((preset) => (
            <button
              key={preset.sec}
              onClick={() => startTimer(preset.sec)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono-num font-semibold bg-[#15191F] hover:bg-[#1E2633] border border-[#2B3545] text-white transition active:scale-95"
            >
              {preset.label}
            </button>
          ))}

          {timerSeconds !== null && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={toggleTimer}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                title={isTimerRunning ? 'Pausar' : 'Reanudar'}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-1.5 rounded-lg bg-[#15191F] text-[#9299A5] hover:text-white border border-[#2B3545]"
                title="Reiniciar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Session Switcher (Sesión A vs Sesión B) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedSession('A')}
          className={`flex-1 py-3 px-4 rounded-2xl border text-left transition flex items-center justify-between ${
            selectedSession === 'A'
              ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'bg-[#15191F] border-[#222A36] text-[#9299A5] hover:text-white'
          }`}
        >
          <div>
            <div className="text-[10px] font-mono-num font-bold text-blue-400 uppercase tracking-wider">
              Día 1
            </div>
            <div className="font-display font-black text-lg text-white">
              SESIÓN A: Salto bilateral + arranque + empuje/tirón
            </div>
          </div>
          <span className="font-mono-num text-xs font-bold px-2 py-1 rounded-lg bg-[#0B0D10] text-blue-300">
            ~75 min
          </span>
        </button>

        <button
          onClick={() => setSelectedSession('B')}
          className={`flex-1 py-3 px-4 rounded-2xl border text-left transition flex items-center justify-between ${
            selectedSession === 'B'
              ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'bg-[#15191F] border-[#222A36] text-[#9299A5] hover:text-white'
          }`}
        >
          <div>
            <div className="text-[10px] font-mono-num font-bold text-blue-400 uppercase tracking-wider">
              Día 2
            </div>
            <div className="font-display font-black text-lg text-white">
              SESIÓN B: Unilateral + cambios de dirección
            </div>
          </div>
          <span className="font-mono-num text-xs font-bold px-2 py-1 rounded-lg bg-[#0B0D10] text-blue-300">
            ~75 min
          </span>
        </button>
      </div>

      {/* 1. Protocolo de Calentamiento (15 min) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
              {warmupBlock.title}
            </h3>
          </div>
          <span className="text-xs font-mono-num text-[#9299A5]">Activación previa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {warmupBlock.items.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] text-xs space-y-1">
              <span className="font-bold text-yellow-400">{item.section}</span>
              <p className="text-[#9299A5] leading-relaxed text-[11px]">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Workout Blocks from the PDF */}
      <div className="space-y-4">
        {activeBlocks.map((block, bIdx) => (
          <div key={bIdx} className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {block.title}
              </h3>
              <span className="text-xs font-mono-num text-blue-400 font-bold">
                {block.durationMin} min
              </span>
            </div>

            {/* Exercises table */}
            <div className="space-y-2 pt-1">
              {block.exercises.map((ex) => {
                const isDone = completedItems[ex.id];
                return (
                  <div
                    key={ex.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-blue-950/20 border-blue-500/50 text-white'
                        : 'bg-[#0B0D10] border-[#1E2530] text-[#9299A5]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggleCheck(ex.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition ${
                          isDone
                            ? 'bg-blue-500 border-blue-400 text-white'
                            : 'bg-[#15191F] border-[#2A3444] text-transparent hover:border-blue-400'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-sm ${
                              isDone ? 'text-white line-through opacity-70' : 'text-white'
                            }`}
                          >
                            {ex.name}
                          </span>
                        </div>
                        <div className="text-xs text-[#9299A5] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-[#FF6B2C] font-semibold">Clave: {ex.clave}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <div className="font-mono-num font-bold text-xs text-white">
                          {ex.seriesReps}
                        </div>
                        <div className="text-[10px] text-[#6D7787]">Pausa: {ex.pausa}</div>
                      </div>

                      <button
                        onClick={() => startTimer(ex.pausaSec)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#15191F] hover:bg-blue-600/30 border border-[#2B3545] text-xs font-mono-num text-blue-300 transition flex items-center gap-1 active:scale-95"
                        title={`Iniciar pausa de ${ex.pausa}`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pausa {ex.pausa}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Vuelta a la Calma */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0B0D10] border border-[#222A36] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#9299A5] leading-relaxed">
          <strong className="text-white">Vuelta a la calma:</strong> {cooldownText}
        </div>
      </div>

      {/* History of Completed Home Sessions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#15191F] border border-[#222A36] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-white tracking-wider uppercase">
            Sesiones de Físico en Casa Registradas
          </h3>
          <span className="text-xs text-[#9299A5]">{homeActivities.length} sesiones</span>
        </div>

        {homeActivities.length > 0 ? (
          <div className="space-y-3">
            {homeActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="p-4 rounded-2xl bg-[#0B0D10] border border-[#1E2530] hover:border-blue-500/40 hover:bg-[#12161D] transition cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                        {act.homeSessionName || 'Físico en Casa'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2633] text-[#9299A5]">
                        {act.date}
                      </span>
                    </div>
                    <div className="text-xs text-[#6D7787] flex items-center gap-2 mt-0.5">
                      <span>{act.durationMinutes} min</span>
                      {act.rpe !== undefined && <span>• RPE {act.rpe}/10</span>}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#6D7787] group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#6D7787]">
            Todavía no tenés sesiones registradas. Seguí la rutina de arriba y tocala para guardarla.
          </div>
        )}
      </div>
    </div>
  );
};
