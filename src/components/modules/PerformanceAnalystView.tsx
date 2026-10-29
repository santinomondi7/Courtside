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
} from '../../types';
import {
  analyzeWeaknessesAndImbalances,
  analyzeWeeklyWorkload,
  predictProgressTrends,
  compareEquivalentPeriods,
  analyzeGoalEvidence,
} from '../../services/sportsAnalytics';

interface Props {
  profile: UserProfile;
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  goals: PersonalGoal[];
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
        content: `Hola ${profile.name || 'Santino'}. Soy tu **Basketball Performance Analyst** en COURTSIDE.\n\nAnalizo conjuntamente tus registros de entrenamientos en Instituto (U17/U21), gimnasio del club, técnica individual en patio, físico en casa y mediciones de salto y velocidad.\n\n¿Qué te gustaría analizar hoy? Podés elegir una de las preguntas sugeridas o escribirme directamente.`,
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

      const recentActivities = [...activities]
        .filter((a) => a.status === 'completed' || a.status === 'partial')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8)
        .map((a) => ({
          date: a.date,
          category: a.category,
          level: a.iaccCategoryLevel,
          duration: a.durationMinutes,
          rpe: a.rpe,
          fatigue: a.fatigueLevel,
          sleep: a.sleepHours,
          shootingAttempts: a.basketballAttempts,
          shootingMakes: a.basketballMakes,
          notes: a.notes,
        }));

      const contextPayload = {
        profile,
        activitiesCount: activities.length,
        measurementsCount: measurements.length,
        goalsCount: goals.length,
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
          name: m.testName,
          result: m.result,
          unit: m.unit,
          method: m.method,
          isPersonalRecord: m.isPersonalRecord,
        })),
      };

      const res = await fetch('/api/analyst/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: contextPayload,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const resData = await res.json();
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: resData.reply,
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: resData.model,
        isRealAI: resData.isRealAI,
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
    '¿Cuál es mi principal debilidad según mis registros?',
    '¿Estoy trabajando suficiente mi mano izquierda?',
    '¿Cómo fue mi carga interna y fatiga esta semana?',
    '¿Qué tendencia muestra mi salto vertical?',
    '¿Qué objetivos tienen respaldo de mediciones reales?',
    'Compará mis últimas cuatro semanas con las anteriores',
    '¿Qué datos me faltan para evaluar mi potencia?',
    '¿Estoy entrenando más o realmente estoy mejorando?',
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
              Asistente de inteligencia artificial basado exclusivamente en tu historial real de Instituto, gimnasio y técnica.
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
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-[#FF6B2C] text-black font-medium shadow-md shadow-[#FF6B2C]/10'
                      : 'bg-[#0B0D10] text-[#DCE2EC] border border-[#202734]'
                  }`}
                >
                  <p>{msg.content}</p>

                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-black/70' : 'text-[#6D7787]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.modelUsed && (
                      <span className="font-mono text-[9px] opacity-75">
                        {msg.modelUsed === 'gemini-3.8-flash' ? '⚡ Gemini 3.8 Flash' : '🧠 Motor Deportivo Courtside'}
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
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0B0D10] border border-[#202734] text-xs text-[#9299A5] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-ping" />
                <span>Consultando historial deportivo y calculando métricas reales...</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
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
            placeholder="Preguntale al Performance Analyst (ej. ¿Estoy acumulando fatiga? ¿Qué tal mi tiro?)..."
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
