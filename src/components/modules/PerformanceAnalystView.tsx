import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  RefreshCw,
  Bot,
  User,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  ChevronRight,
  Database,
  BarChart2,
} from 'lucide-react';
import {
  Activity,
  PhysicalMeasurement,
  PersonalGoal,
  UserProfile,
  RoutineTemplate,
} from '../../types';
import { DEFAULT_TEMPLATES } from '../../services/storage';
import {
  analyzeWeaknessesAndImbalances,
  analyzeWeeklyWorkload,
  predictProgressTrends,
  compareEquivalentPeriods,
  analyzeGoalEvidence,
} from '../../services/sportsAnalytics';
import { generateLocalAnalystReply } from '../../services/sportsAnalystEngine';

interface Props {
  profile: UserProfile;
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  goals: PersonalGoal[];
  templates?: RoutineTemplate[];
  onNavigateSection?: (section: any) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isRealAI?: boolean;
}

const STORAGE_CHAT_KEY = 'courtside_v1_analyst_chat_history';

export const PerformanceAnalystView: React.FC<Props> = ({
  profile,
  activities,
  measurements,
  goals,
  templates,
  onNavigateSection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CHAT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Hola ${profile.name || 'Santino'}. Soy tu **Basketball Performance Analyst** en COURTSIDE.\n\nNo me limito solo a leer estadísticas: podés preguntarme **lo que necesites** sobre cómo mejorar tu **salto vertical (CMJ sin brazos, salto con brazos/Abalakov, saltos a un pie)**, técnica de tiro, primer paso, mano izquierda, gimnasio, descanso o manejo de la frustración, además de analizar tus datos reales de Instituto (U17/U21).\n\n¿Qué querés trabajar o analizar hoy?`,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'courtside-sports-analytics',
        isRealAI: true,
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save conversation to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleClearChat = () => {
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Conversación reiniciada. Estoy listo para analizar tus ${activities.length} sesiones, ${measurements.length} mediciones y ${goals.length} objetivos registrados. ¿En qué aspecto querés enfocarte?`,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'courtside-sports-analytics',
      isRealAI: true,
    };
    setMessages([welcomeMsg]);
    setErrorMessage(null);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || isLoading) return;

    setErrorMessage(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Deterministic sports analytics calculations to ground the assistant
      const weaknesses = analyzeWeaknessesAndImbalances(activities, measurements, goals, profile);
      const weeklyLoad = analyzeWeeklyWorkload(activities, 0);
      const trends = predictProgressTrends(measurements, goals);
      const periodComp = compareEquivalentPeriods(activities, measurements);
      const goalsEvidence = goals.map((g) => {
        const ev = analyzeGoalEvidence(g, measurements, activities);
        return {
          title: g.title,
          statusLabel: ev.statusLabel,
          progressPercentage: ev.progressPercentage,
          latestValue: ev.latestValue,
          unit: g.unit,
          evidenceSummary: ev.evidenceSummary,
        };
      });

      const completedOrPartial = activities.filter(
        (a) => a.status === 'completed' || a.status === 'partial'
      );

      const recentActivities = [...completedOrPartial]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20)
        .map((a) => ({
          date: a.date,
          category: a.category,
          level: a.iaccCategoryLevel,
          duration: a.durationMinutes,
          rpe: a.rpe,
          fatigue: a.fatigueLevel,
          sleep: a.sleepHours,
          homeSessionName: a.homeSessionName,
          homeGoal: a.homeGoal,
          homeExercises: a.homeExercises,
          gymExercises: a.gymExercises,
          iaccContents: a.iaccContents,
          iaccWhatWentWell: a.iaccWhatWentWell,
          iaccNeedsImprovement: a.iaccNeedsImprovement,
          basketballSkillCategory: a.basketballSkillCategory,
          basketballDrillName: a.basketballDrillName,
          shootingAttempts: a.basketballAttempts,
          shootingMakes: a.basketballMakes,
          matchOpponent: a.matchOpponent,
          matchMinutesPlayed: a.matchMinutesPlayed,
          notes: a.notes,
        }));

      const categorySummary = {
        iaccU17Sessions: completedOrPartial.filter(
          (a) => a.category === 'iacc_team' && a.iaccCategoryLevel !== 'U21'
        ).length,
        iaccU21Sessions: completedOrPartial.filter(
          (a) => a.category === 'iacc_team' && a.iaccCategoryLevel === 'U21'
        ).length,
        gymSessions: completedOrPartial.filter((a) => a.category === 'institute_gym').length,
        homePhysicalSessions: completedOrPartial.filter((a) => a.category === 'home_physical').length,
        homeIndividualSessions: completedOrPartial.filter((a) => a.category === 'home_individual').length,
        matchSessions: completedOrPartial.filter((a) => a.category === 'match').length,
        recoverySessions: completedOrPartial.filter((a) => a.category === 'recovery').length,
      };

      const activeTemplates = templates && templates.length > 0 ? templates : DEFAULT_TEMPLATES;
      const presetRoutines = activeTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        description: t.description,
        targetMinutes: t.targetMinutes,
        warmupNote:
          t.category === 'home_physical'
            ? 'Calentamiento (15 min): Movilidad 4 min (tobillo a pared 2x10, 90/90 cadera, world greatest stretch, colgado + retracciones 2x8), Soga 5 min (suave, pierna única 2x20s, 4x20s rápido/10s), Conos 6 min (Skips A 5m x3, pogo hops 2x10, puente glúteo 1 pierna 2x8, laterales con frenada, 2 arranques 70%). Vuelta a la calma: flexor cadera, pigeon/90-90 y gemelos 2x30s/lado, colgado pasivo 2x30s, respiración nasal 2 min.'
            : undefined,
        exercises: t.items,
      }));

      const sortedMeas = [...measurements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestByType = (testType: PhysicalMeasurement['testType']) => {
        const found = sortedMeas.find((m) => m.testType === testType);
        return found ? { result: found.result, date: found.date } : null;
      };

      const cmjLatest = latestByType('vertical_jump');
      const armsLatest = latestByType('vertical_jump_arms');
      const leftLegLatest = latestByType('single_leg_jump_left');
      const rightLegLatest = latestByType('single_leg_jump_right');
      const approachLatest = latestByType('approach_jump');

      const armGainCm =
        cmjLatest && armsLatest ? Number((armsLatest.result - cmjLatest.result).toFixed(1)) : null;
      const armGainPct =
        cmjLatest && armsLatest && cmjLatest.result > 0
          ? Number((((armsLatest.result - cmjLatest.result) / cmjLatest.result) * 100).toFixed(1))
          : null;
      const singleLegAsymmetryPct =
        leftLegLatest && rightLegLatest && Math.max(leftLegLatest.result, rightLegLatest.result) > 0
          ? Number(
              (
                (Math.abs(leftLegLatest.result - rightLegLatest.result) /
                  Math.max(leftLegLatest.result, rightLegLatest.result)) *
                100
              ).toFixed(1)
            )
          : null;

      const jumpBreakdown = {
        cmjLatest,
        armsLatest,
        leftLegLatest,
        rightLegLatest,
        approachLatest,
        armGainCm,
        armGainPct,
        singleLegAsymmetryPct,
      };

      const shootingActs = activities.filter(
        (a) =>
          (a.status === 'completed' || a.status === 'partial') &&
          a.basketballAttempts &&
          a.basketballAttempts > 0
      );
      const totalAttempts = shootingActs.reduce((acc, a) => acc + (a.basketballAttempts || 0), 0);
      const totalMakes = shootingActs.reduce((acc, a) => acc + (a.basketballMakes || 0), 0);
      const shootingSummary = {
        sessions: shootingActs.length,
        attempts: totalAttempts,
        makes: totalMakes,
        accuracyPct: totalAttempts > 0 ? Number(((totalMakes / totalAttempts) * 100).toFixed(1)) : null,
      };

      const contextPayload = {
        profile,
        activitiesCount: activities.length,
        measurementsCount: measurements.length,
        goalsCount: goals.length,
        categorySummary,
        presetRoutines,
        jumpBreakdown,
        shootingSummary,
        weaknesses,
        weeklyWorkloadSummary: {
          totalMinutes: weeklyLoad.totalMinutes,
          totalSessions: weeklyLoad.totalSessions,
          averageRpe: weeklyLoad.averageRpe,
          totalLoadAU: weeklyLoad.totalLoadAU,
          technicalMinutes: weeklyLoad.technicalMinutes,
          physicalMinutes: weeklyLoad.physicalMinutes,
          technicalVsPhysicalRatio: weeklyLoad.technicalVsPhysicalRatio,
          sleepLoadCorrelationNote: weeklyLoad.sleepLoadCorrelationNote,
          informativeAlerts: weeklyLoad.informativeAlerts,
        },
        trendEstimations: trends,
        periodComparisonSummary: {
          periodAName: periodComp.periodAName,
          periodBName: periodComp.periodBName,
          minsA: periodComp.trainingQuantity.totalMinutes.valuePeriodA,
          minsB: periodComp.trainingQuantity.totalMinutes.valuePeriodB,
          actsA: periodComp.trainingQuantity.totalSessions.valuePeriodA,
          actsB: periodComp.trainingQuantity.totalSessions.valuePeriodB,
          sleepA: periodComp.recoveryMetrics.averageSleep.valuePeriodA,
          sleepB: periodComp.recoveryMetrics.averageSleep.valuePeriodB,
          rpeA: periodComp.recoveryMetrics.averageRpe.valuePeriodA,
          rpeB: periodComp.recoveryMetrics.averageRpe.valuePeriodB,
          disparityNote: periodComp.trainingQuantity.categoryDisparityExplanation,
        },
        goalsEvidenceSummary: goalsEvidence,
        recentActivities,
        measurements: measurements.map((m) => ({
          date: m.date,
          type: m.testType,
          name: m.testName,
          result: m.result,
          unit: m.unit,
          method: m.method,
          isPersonalRecord: m.isPersonalRecord,
          notes: m.notes,
        })),
      };

      let replyContent = '';
      let modelUsed = '';
      let isRealAI = false;

      try {
        const res = await fetch('/api/analyst/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            context: contextPayload,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          replyContent = resData.reply;
          modelUsed = resData.model;
          isRealAI = resData.isRealAI;
        } else {
          // If backend returns 404 or any HTTP error, activate client-side sports analyst engine seamlessly
          console.warn(`Analyst API responded with HTTP ${res.status}. Falling back to local sports analytics engine.`);
          const localFallback = generateLocalAnalystReply(promptToSend, contextPayload);
          replyContent = localFallback.reply;
          modelUsed = 'courtside-sports-analytics-engine';
          isRealAI = false;
        }
      } catch (fetchErr) {
        // If offline or network error reaching server, use local sports analytics engine
        console.warn('Network issue reaching /api/analyst/chat. Using local sports analytics engine:', fetchErr);
        const localFallback = generateLocalAnalystReply(promptToSend, contextPayload);
        replyContent = localFallback.reply;
        modelUsed = 'courtside-sports-analytics-engine';
        isRealAI = false;
      }

      if (replyContent) {
        const assistantMessage: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          modelUsed,
          isRealAI,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setErrorMessage('No se pudo generar una respuesta analítica. Intentá nuevamente.');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(
        err.message || 'No se pudo conectar con el servicio de análisis. Comprobá tu conexión a Internet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'Analizá mis sesiones predeterminadas de Físico en Casa (Sesión A y B)',
    '¿Cómo puedo mejorar mi salto vertical y el despegue a un pie?',
    'Analizá mi CMJ vs salto con brazos y saltos a un pie',
    '¿Qué ejercicios me ayudan a mejorar mi primer paso?',
    '¿Cuál es mi principal debilidad según mis registros?',
    '¿Cómo fue mi carga interna y fatiga esta semana?',
    '¿Cómo mejorar mi tiro y mi mano izquierda?',
    '¿Qué debería comer y descansar para rendir mejor en U17/U21?',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#15191F] border border-[#222A36]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl text-white tracking-wide">
                BASKETBALL PERFORMANCE ANALYST
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B2C]/20 text-[#FF6B2C] border border-[#FF6B2C]/30">
                IA & DATOS
              </span>
            </div>
            <p className="text-xs text-[#9299A5]">
              Consultá abiertamente sobre cómo mejorar tu salto, técnica, físico o mentalidad, con el respaldo de tu historial en IACC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9299A5] hover:text-white bg-[#0B0D10] border border-[#222A36] hover:bg-[#1E2633] transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Nueva conversación</span>
          </button>
        </div>
      </div>

      {/* Grounding Status Indicator Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#1E2530] flex flex-wrap items-center justify-between gap-3 text-xs text-[#9299A5]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#B7F56A] shrink-0" />
          <span>
            Analizando <strong className="text-white">{activities.length} sesiones</strong>,{' '}
            <strong className="text-white">{measurements.length} mediciones</strong> y{' '}
            <strong className="text-white">{goals.length} metas</strong> de Santino ({profile.club}).
          </span>
        </div>
        <span className="text-[11px] text-[#6D7787]">
          Respeto estricto a las directivas del DT y PF de Instituto
        </span>
      </div>

      {/* Chat Container */}
      <div className="rounded-3xl bg-[#15191F] border border-[#222A36] flex flex-col h-[580px] overflow-hidden shadow-2xl">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#FF6B2C] text-black font-medium shadow-md shadow-[#FF6B2C]/10 whitespace-pre-line'
                      : 'bg-[#0B0D10] text-[#DCE2EC] border border-[#202734]'
                  }`}
                >
                  {isUser ? (
                    <p>{msg.content}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {msg.content.split('\n').map((line, lIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={lIdx} className="h-1.5" />;

                        const renderInline = (text: string) => {
                          const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*)/g);
                          return parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                              return (
                                <strong key={pIdx} className="font-bold text-white">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                              return (
                                <em key={pIdx} className="italic text-[#B5C0D0]">
                                  {part.slice(1, -1)}
                                </em>
                              );
                            }
                            return part;
                          });
                        };

                        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
                          const headingText = trimmed.replace(/^#{2,3}\s+/, '');
                          return (
                            <p key={lIdx} className="text-xs sm:text-sm font-bold text-[#FF6B2C] pt-1">
                              {renderInline(headingText)}
                            </p>
                          );
                        }

                        if (/^(?:•|-|\*)\s+/.test(trimmed) || trimmed.startsWith('•') || trimmed.startsWith('-')) {
                          const bulletText = trimmed.replace(/^(?:•|-|\*)\s*/, '');
                          return (
                            <div key={lIdx} className="flex gap-2 items-start pl-1">
                              <span className="text-[#FF6B2C] select-none shrink-0">•</span>
                              <span className="flex-1">{renderInline(bulletText)}</span>
                            </div>
                          );
                        }

                        const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
                        if (numMatch) {
                          return (
                            <div key={lIdx} className="flex gap-2 items-start pl-1">
                              <span className="text-[#FF6B2C] font-bold select-none shrink-0">
                                {numMatch[1]}
                              </span>
                              <span className="flex-1">{renderInline(numMatch[2])}</span>
                            </div>
                          );
                        }

                        return <p key={lIdx}>{renderInline(line)}</p>;
                      })}
                    </div>
                  )}

                  <div
                    className={`mt-2.5 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-black/70' : 'text-[#6D7787]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-1.5 ${
                        msg.isRealAI
                          ? 'bg-[#FF6B2C]/15 text-[#FF6B2C] border border-[#FF6B2C]/30'
                          : 'bg-[#1E2530] text-[#9299A5] border border-[#2A3442]'
                      }`}>
                        {msg.isRealAI ? (
                          <>
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>IA Gemini ({msg.modelUsed?.replace('gemini-', '') || 'Activa'})</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Motor Deportivo Courtside</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#1E2633] border border-[#303B4C] flex items-center justify-center text-white shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] shrink-0">
                <Bot className="w-4 h-4 animate-spin text-[#FF6B2C]" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#202734] text-xs text-[#9299A5] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-ping" />
                <span>Analizando historial deportivo de Instituto con IA...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => {
                  const lastUser = [...messages].reverse().find(m => m.role === 'user');
                  if (lastUser) handleSendMessage(lastUser.content);
                }}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-[11px] transition shrink-0"
              >
                Reintentar
              </button>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 bg-[#0E1117] border-t border-[#1E2530] overflow-x-auto">
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[10px] font-bold text-[#6D7787] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-[#FF6B2C]" />
              Preguntas sugeridas:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg text-[11px] text-[#A6B2C2] hover:text-white bg-[#151921] hover:bg-[#202836] border border-[#263140] transition whitespace-nowrap disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3.5 bg-[#12161D] border-t border-[#202734] flex gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Preguntame lo que necesites: cómo mejorar tu salto, CMJ vs con brazos, saltos a un pie, tiro, descanso..."
            disabled={isLoading}
            className="flex-1 bg-[#0B0D10] border border-[#252E3C] focus:border-[#FF6B2C] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#6D7787] outline-none transition"
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="px-4 py-2.5 rounded-2xl bg-[#FF6B2C] hover:bg-[#FF8243] text-black font-bold text-xs sm:text-sm transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
