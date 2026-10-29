import {
  Activity,
  PhysicalMeasurement,
  PersonalGoal,
  UserProfile,
  ActivityCategory,
} from '../types';

// ==========================================
// 1. ANÁLISIS AUTOMÁTICO DE DEBILIDADES (MÓDULO 1)
// ==========================================

export type WeaknessConfidence = 'bajo' | 'medio' | 'alto';
export type WeaknessKind = 'debilidad_demostrada' | 'carencia_de_registros' | 'desequilibrio_carga';

export interface WeaknessObservation {
  id: string;
  kind: WeaknessKind;
  category: 'tecnica' | 'fisico' | 'recuperacion' | 'evaluacion' | 'equilibrio_equipo';
  title: string;
  description: string;
  backingData: string;
  periodAnalyzed: string;
  sessionsCount: number;
  confidence: WeaknessConfidence;
  whyRelevant: string;
  followUpAction: string;
  isDismissed?: boolean;
  isReviewed?: boolean;
}

const DISMISSED_KEY = 'courtside_v1_dismissed_weaknesses';
const REVIEWED_KEY = 'courtside_v1_reviewed_weaknesses';

export function getDismissedWeaknessIds(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function dismissWeaknessId(id: string): void {
  const current = getDismissedWeaknessIds();
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(current));
  }
}

export function getReviewedWeaknessIds(): string[] {
  try {
    const raw = localStorage.getItem(REVIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleReviewedWeaknessId(id: string): boolean {
  const current = getReviewedWeaknessIds();
  const idx = current.indexOf(id);
  let isReviewed = false;
  if (idx >= 0) {
    current.splice(idx, 1);
    isReviewed = false;
  } else {
    current.push(id);
    isReviewed = true;
  }
  localStorage.setItem(REVIEWED_KEY, JSON.stringify(current));
  return isReviewed;
}

export function analyzeWeaknessesAndImbalances(
  activities: Activity[],
  measurements: PhysicalMeasurement[],
  goals: PersonalGoal[],
  profile?: UserProfile
): WeaknessObservation[] {
  const observations: WeaknessObservation[] = [];
  const now = new Date();
  const dismissed = getDismissedWeaknessIds();
  const reviewed = getReviewedWeaknessIds();

  // Helper date windows
  const days30Cutoff = new Date(now.getTime() - 30 * 86400000);
  const days60Cutoff = new Date(now.getTime() - 60 * 86400000);

  const completedActivities = activities.filter(
    (a) => a.status === 'completed' || a.status === 'partial'
  );
  const act30 = completedActivities.filter((a) => new Date(a.date) >= days30Cutoff);
  const act60 = completedActivities.filter((a) => new Date(a.date) >= days60Cutoff);

  // ------------------------------------------------------------
  // PATRÓN 1: Trabajo de tiro vs finalizaciones mano no hábil (izquierda)
  // ------------------------------------------------------------
  const shootingSessions = act60.filter(
    (a) =>
      a.basketballSkillCategory === 'tiros' ||
      (a.basketballAttempts && a.basketballAttempts > 0) ||
      (a.notes && /tiro|triples|media distancia|catch and shoot/i.test(a.notes))
  );

  const leftHandSessions = act60.filter((a) => {
    const text = `${a.notes || ''} ${a.basketballDrillName || ''} ${a.iaccWhatWentWell || ''} ${a.iaccNeedsImprovement || ''}`.toLowerCase();
    return text.includes('mano izquierda') || text.includes('zurda') || text.includes('mano no habil') || text.includes('left hand');
  });

  if (shootingSessions.length >= 4 && leftHandSessions.length === 0) {
    observations.push({
      id: 'weakness-left-hand-no-data',
      kind: 'carencia_de_registros',
      category: 'tecnica',
      title: 'Sin registros de trabajo de mano izquierda en 60 días',
      description:
        'Tenés un buen volumen de sesiones con foco en tiro, pero no hay registros específicos de finalizaciones, bandejas o drible con mano izquierda (no hábil). Esto no implica que tu mano izquierda sea deficiente, sino que actualmente no hay datos para evaluar esta faceta del juego.',
      backingData: `${shootingSessions.length} sesiones de tiro registradas vs 0 menciones de trabajo con mano izquierda.`,
      periodAnalyzed: 'Últimos 60 días',
      sessionsCount: shootingSessions.length,
      confidence: 'alto',
      whyRelevant:
        'En categorías formativas competitivas (U17/U21 en Instituto), los defensores niegan la mano derecha hacia el centro. Si no se entrena sistemáticamente la salida y finalización con mano izquierda, el repertorio de ataque queda acotado.',
      followUpAction:
        'En tu próxima sesión de técnica individual en el patio, dedicá 15-20 min a entradas a aro con mano izquierda y anotá la efectividad o el drill para comenzar a tener datos.',
    });
  } else if (leftHandSessions.length > 0 && shootingSessions.length >= 5 && leftHandSessions.length <= 1) {
    observations.push({
      id: 'weakness-left-hand-low-volume',
      kind: 'debilidad_demostrada',
      category: 'tecnica',
      title: 'Volumen muy bajo en finalizaciones con mano izquierda',
      description:
        'Se detectó una disparidad notable: mientras el tiro exterior acumula alta repetición, la mano izquierda solo aparece en 1 sesión de los últimos 60 días.',
      backingData: `${shootingSessions.length} sesiones de tiro vs solo 1 sesión con trabajo específico de mano izquierda.`,
      periodAnalyzed: 'Últimos 60 días',
      sessionsCount: shootingSessions.length + leftHandSessions.length,
      confidence: 'medio',
      whyRelevant:
        'El equilibrio entre tiro exterior y penetraciones por ambos perfiles genera mayor peligro ofensivo y transfer a la competencia con U17.',
      followUpAction:
        'Registrar al menos 1 bloque semanal de drible bajo presión y flotadoras/bandejas con mano izquierda.',
    });
  }

  // ------------------------------------------------------------
  // PATRÓN 2: Fuerza en gimnasio frecuente vs testeo de velocidad y salto
  // ------------------------------------------------------------
  const gymSessions30 = act30.filter((a) => a.category === 'institute_gym');
  const speedMeasurements60 = measurements.filter(
    (m) => (m.testType.startsWith('sprint') || m.testType === 'agility_t_test') && new Date(m.date) >= days60Cutoff
  );
  const jumpMeasurements60 = measurements.filter(
    (m) => m.testType === 'vertical_jump' && new Date(m.date) >= days60Cutoff
  );

  if (gymSessions30.length >= 6 && speedMeasurements60.length === 0) {
    observations.push({
      id: 'weakness-gym-vs-speed-eval',
      kind: 'carencia_de_registros',
      category: 'evaluacion',
      title: 'Constancia en gimnasio sin mediciones recientes de velocidad o sprint',
      description:
        'Estás cumpliendo con las sesiones de sobrecarga en el gimnasio del club, pero no hay tests recientes de aceleración (sprint 5 m o 10 m) para verificar si la fuerza ganada se transfiere a velocidad en cancha.',
      backingData: `${gymSessions30.length} sesiones de gimnasio en 30 días vs 0 mediciones de sprint/aceleración en 60 días.`,
      periodAnalyzed: 'Últimos 30-60 días',
      sessionsCount: gymSessions30.length,
      confidence: 'alto',
      whyRelevant:
        'El aumento de fuerza en sentadilla o peso muerto solo es útil para el básquetbol si mantiene o incrementa la velocidad de salida en el primer paso.',
      followUpAction:
        'Coordinar una medición de sprint de 5 m o 10 m en una entrada en calor descansada para registrar una marca base.',
    });
  }

  if (gymSessions30.length >= 6 && jumpMeasurements60.length === 0) {
    observations.push({
      id: 'weakness-gym-vs-jump-eval',
      kind: 'carencia_de_registros',
      category: 'evaluacion',
      title: 'Falta de re-testeo de salto vertical tras bloque de sobrecarga',
      description:
        'Tenés alta continuidad en entrenamientos de pesas, pero pasaron más de 60 días sin registrar un test de salto vertical (CMJ).',
      backingData: `${gymSessions30.length} sesiones de pesas registradas vs 0 mediciones de salto en los últimos 60 días.`,
      periodAnalyzed: 'Últimos 60 días',
      sessionsCount: gymSessions30.length,
      confidence: 'alto',
      whyRelevant:
        'El salto vertical es el indicador estándar de potencia neuromuscular en básquetbol. Permite evaluar si las cargas del gimnasio están optimizando la potencia.',
      followUpAction:
        'Aprovechá un día posterior a descanso para medir tu salto vertical en la app y comparar con tu récord previo.',
    });
  }

  // ------------------------------------------------------------
  // PATRÓN 3: Consistencia en equipo IACC vs práctica técnica individual registrada
  // ------------------------------------------------------------
  const teamSessions30 = act30.filter((a) => a.category === 'iacc_team');
  const individualSkill30 = act30.filter((a) => a.category === 'home_individual');

  if (teamSessions30.length >= 8 && individualSkill30.length <= 1) {
    observations.push({
      id: 'weakness-team-vs-individual-ratio',
      kind: 'desequilibrio_carga',
      category: 'equilibrio_equipo',
      title: 'Gran volumen táctico de equipo con muy poca técnica individual autónoma',
      description:
        'Presentás una gran regularidad en las prácticas de Instituto, pero casi no tenés registros de técnica individual por tu cuenta (patio o tiro extra). En el entrenamiento de equipo se juegan sistemas y táctica grupal, donde las repeticiones individuales por jugador son limitadas.',
      backingData: `${teamSessions30.length} prácticas de equipo en Instituto vs solo ${individualSkill30.length} sesión de técnica individual en 30 días.`,
      periodAnalyzed: 'Últimos 30 días',
      sessionsCount: teamSessions30.length + individualSkill30.length,
      confidence: 'alto',
      whyRelevant:
        'El perfeccionamiento de la mecánica de tiro y el manejo de balón bajo control personal requiere repetición deliberada fuera de las exigencias tácticas del equipo.',
      followUpAction:
        'Incorporar 2 sesiones semanales cortas (20-30 min) en el patio enfocadas en tiro estático y salida de bloqueo.',
    });
  }

  // ------------------------------------------------------------
  // PATRÓN 4: Objetivos activos sin mediciones recientes para comprobar avances
  // ------------------------------------------------------------
  goals
    .filter((g) => g.status === 'active')
    .forEach((goal) => {
      // Find matching measurements
      const related = measurements.filter((m) => {
        if (goal.category === 'vertical_jump' && m.testType === 'vertical_jump') return true;
        if (goal.category === 'speed' && m.testType.startsWith('sprint')) return true;
        if (goal.category === 'strength' && (m.testType === 'trap_bar_deadlift' || m.testType === 'bench_press')) return true;
        return false;
      });

      const latestMeas = related.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const daysSince = latestMeas ? Math.round((now.getTime() - new Date(latestMeas.date).getTime()) / 86400000) : 999;

      if (!latestMeas || daysSince > 35) {
        observations.push({
          id: `weakness-goal-no-recent-test-${goal.id}`,
          kind: 'carencia_de_registros',
          category: 'evaluacion',
          title: `Objetivo "${goal.title}" sin mediciones de control recientes`,
          description: latestMeas
            ? `Tu última medición comparable para este objetivo se realizó hace ${daysSince} días (${latestMeas.date}). Para saber si tu entrenamiento está acercándote a la meta, se requiere un nuevo registro.`
            : `El objetivo "${goal.title}" está activo pero aún no tiene ninguna medición registrada para contrastar su evolución real.`,
          backingData: latestMeas
            ? `Último registro: ${latestMeas.result} ${latestMeas.unit} el ${latestMeas.date} (hace ${daysSince} días).`
            : '0 mediciones vinculadas en el historial.',
          periodAnalyzed: 'Historial activo',
          sessionsCount: related.length,
          confidence: 'medio',
          whyRelevant:
            'Sin puntos de control periódicos, no es posible ajustar la carga ni confirmar si el plan de entrenamiento está rindiendo frutos.',
          followUpAction:
            `Agendá un test de ${goal.title} en el módulo de Estadísticas para actualizar el estado del objetivo con evidencia comprobable.`,
        });
      }
    });

  // ------------------------------------------------------------
  // PATRÓN 5: Aumento de esfuerzo percibido (RPE) + deterioro de sueño / aumento de fatiga
  // ------------------------------------------------------------
  const last14Activities = [...completedActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const sessionsWithFatigue = last14Activities.filter(
    (a) => a.rpe !== undefined && (a.fatigueLevel !== undefined || a.sleepHours !== undefined)
  );

  if (sessionsWithFatigue.length >= 4) {
    const avgRpeRecent =
      sessionsWithFatigue.reduce((acc, a) => acc + (a.rpe || 0), 0) / sessionsWithFatigue.length;
    const avgFatigueRecent =
      sessionsWithFatigue.filter((a) => a.fatigueLevel !== undefined)
        .reduce((acc, a) => acc + (a.fatigueLevel || 0), 0) /
      (sessionsWithFatigue.filter((a) => a.fatigueLevel !== undefined).length || 1);
    const avgSleepRecent =
      sessionsWithFatigue.filter((a) => a.sleepHours !== undefined)
        .reduce((acc, a) => acc + (a.sleepHours || 0), 0) /
      (sessionsWithFatigue.filter((a) => a.sleepHours !== undefined).length || 1);

    if (avgRpeRecent >= 7.8 && (avgFatigueRecent >= 7.0 || (avgSleepRecent > 0 && avgSleepRecent < 7.0))) {
      observations.push({
        id: 'weakness-rpe-fatigue-sleep-alert',
        kind: 'debilidad_demostrada',
        category: 'recuperacion',
        title: 'Desequilibrio entre esfuerzo percibido alto y recuperación reducida',
        description:
          `En tus últimas sesiones registraste un RPE promedio elevado (${avgRpeRecent.toFixed(1)}/10), coincidente con fatiga subjetiva media de ${avgFatigueRecent.toFixed(1)}/10 y promedio de sueño de ${avgSleepRecent > 0 ? avgSleepRecent.toFixed(1) + ' hs' : 'datos escasos'}.`,
        backingData: `${sessionsWithFatigue.length} sesiones recientes analizadas con RPE promedio ${avgRpeRecent.toFixed(1)}, fatiga ${avgFatigueRecent.toFixed(1)} y sueño ${avgSleepRecent.toFixed(1)} hs.`,
        periodAnalyzed: 'Últimas 10 sesiones',
        sessionsCount: sessionsWithFatigue.length,
        confidence: 'alto',
        whyRelevant:
          'Cuando la exigencia física se sostiene alta y el sueño cae por debajo de 7 horas en un atleta en desarrollo, se eleva el riesgo de microlesiones por sobreuso y disminuye la capacidad de absorción táctica en Instituto.',
        followUpAction:
          'Priorizar dormir al menos 8 horas esta noche, hidratación adecuada y no agregar sesiones individuales extra de alta intensidad sin consultar al preparador físico.',
      });
    }
  }

  // Filter out dismissed, enrich with review flag
  return observations
    .filter((o) => !dismissed.includes(o.id))
    .map((o) => ({
      ...o,
      isReviewed: reviewed.includes(o.id),
    }));
}

// ==========================================
// 2. PREDICCIÓN DE PROGRESO BASADA EN TENDENCIAS (MÓDULO 2)
// ==========================================

export interface TrendEstimation {
  id: string;
  testName: string;
  metricType: string;
  unit: string;
  initialValue: number;
  initialDate: string;
  latestValue: number;
  latestDate: string;
  measurementsCount: number;
  dates: string[];
  observedTrend: 'ascendente' | 'descendente' | 'estable' | 'insuficiente';
  trendRatePerWeek: number; // positive = increasing, negative = decreasing
  targetValue?: number;
  currentDistanceToTarget?: number;
  isLowerBetter: boolean;
  projectedWeeksToTarget?: number | null;
  projectedValueIn30Days?: number | null;
  uncertainty: 'baja' | 'media' | 'alta';
  confidenceWarning?: string;
  reliabilityFactors: string[];
}

export function predictProgressTrends(
  measurements: PhysicalMeasurement[],
  goals: PersonalGoal[]
): TrendEstimation[] {
  const estimations: TrendEstimation[] = [];

  // Group measurements by testType
  const groups: Record<string, PhysicalMeasurement[]> = {};
  measurements.forEach((m) => {
    if (!groups[m.testType]) groups[m.testType] = [];
    groups[m.testType].push(m);
  });

  Object.entries(groups).forEach(([testType, rawList]) => {
    const list = [...rawList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (list.length === 0) return;

    const isLowerBetter = testType.startsWith('sprint') || testType === 'agility_t_test';
    const first = list[0];
    const latest = list[list.length - 1];

    // Find linked goal if any
    const linkedGoal = goals.find((g) => {
      if (testType === 'vertical_jump' && g.category === 'vertical_jump') return true;
      if (testType.startsWith('sprint') && g.category === 'speed') return true;
      if (testType === 'trap_bar_deadlift' && g.category === 'strength') return true;
      return false;
    });

    const targetVal = linkedGoal?.targetValue;
    const distanceToTarget = targetVal !== undefined ? Math.abs(latest.result - targetVal) : undefined;

    // Reliability factors
    const reliabilityFactors: string[] = [
      `Mismo protocolo de medición: ${list.map((m) => m.method).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
      `Ventana temporal de registros: ${first.date} a ${latest.date}`,
      'Dependencia del descanso y fatiga previa el día del test',
    ];

    // Insufficient data check (< 3 measurements)
    if (list.length < 3) {
      estimations.push({
        id: `trend-${testType}`,
        testName: latest.testName || testType,
        metricType: testType,
        unit: latest.unit,
        initialValue: first.result,
        initialDate: first.date,
        latestValue: latest.result,
        latestDate: latest.date,
        measurementsCount: list.length,
        dates: list.map((m) => m.date),
        observedTrend: 'insuficiente',
        trendRatePerWeek: 0,
        targetValue: targetVal,
        currentDistanceToTarget: distanceToTarget,
        isLowerBetter,
        projectedWeeksToTarget: null,
        projectedValueIn30Days: null,
        uncertainty: 'alta',
        confidenceWarning:
          `Solo hay ${list.length} medición(es) registrada(s). Se requieren al menos 3 mediciones comparables en el tiempo para calcular una regresión de tendencia matemáticamente válida sin especular.`,
        reliabilityFactors,
      });
      return;
    }

    // Linear regression on (daysFromStart, value)
    const t0 = new Date(first.date).getTime();
    const points = list.map((m) => ({
      x: (new Date(m.date).getTime() - t0) / (86400000 * 7), // weeks from first
      y: m.result,
    }));

    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumXX = points.reduce((acc, p) => acc + p.x * p.x, 0);

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0; // change per week
    const intercept = (sumY - slope * sumX) / n;

    // Variance & R2
    const meanY = sumY / n;
    const ssTotal = points.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0);
    const ssRes = points.reduce((acc, p) => {
      const pred = intercept + slope * p.x;
      return acc + Math.pow(p.y - pred, 2);
    }, 0);
    const r2 = ssTotal > 0 ? Math.max(0, 1 - ssRes / ssTotal) : 0;

    let observedTrend: 'ascendente' | 'descendente' | 'estable' = 'estable';
    if (Math.abs(slope) > 0.05) {
      observedTrend = slope > 0 ? 'ascendente' : 'descendente';
    }

    // Projection in 30 days (~4.3 weeks)
    const latestX = points[points.length - 1].x;
    const projectedValueIn30Days = Number((latest.result + slope * 4.3).toFixed(2));

    // Time to target if target exists
    let projectedWeeksToTarget: number | null = null;
    if (targetVal !== undefined) {
      const neededChange = targetVal - latest.result;
      const isMovingTowards = isLowerBetter ? slope < 0 : slope > 0;
      if (isMovingTowards && Math.abs(slope) > 0.01) {
        projectedWeeksToTarget = Math.max(1, Math.round(neededChange / slope));
      }
    }

    // Uncertainty
    let uncertainty: 'baja' | 'media' | 'alta' = 'media';
    let confidenceWarning: string | undefined;

    if (r2 < 0.35 || list.length < 4) {
      uncertainty = 'alta';
      confidenceWarning =
        'Alta variabilidad o pocas muestras entre mediciones (R² bajo). La estimación es solo orientativa y puede cambiar significativamente según el estado de fatiga del día.';
    } else if (r2 >= 0.7 && list.length >= 5) {
      uncertainty = 'baja';
    }

    estimations.push({
      id: `trend-${testType}`,
      testName: latest.testName || testType,
      metricType: testType,
      unit: latest.unit,
      initialValue: first.result,
      initialDate: first.date,
      latestValue: latest.result,
      latestDate: latest.date,
      measurementsCount: list.length,
      dates: list.map((m) => m.date),
      observedTrend,
      trendRatePerWeek: Number(slope.toFixed(3)),
      targetValue: targetVal,
      currentDistanceToTarget: distanceToTarget,
      isLowerBetter,
      projectedWeeksToTarget,
      projectedValueIn30Days,
      uncertainty,
      confidenceWarning,
      reliabilityFactors,
    });
  });

  return estimations;
}

// ==========================================
// 3. ANÁLISIS DE CARGA SEMANAL REAL (MÓDULO 3)
// ==========================================

export interface CategoryLoadBreakdown {
  category: ActivityCategory;
  label: string;
  minutes: number;
  sessionsCount: number;
  averageRpe: number;
  totalLoadAU: number; // sRPE: duration * RPE
  color: string;
}

export interface DayLoadDistribution {
  date: string;
  dayName: string;
  sessionsCount: number;
  totalMinutes: number;
  totalLoadAU: number;
  highestRpe: number;
  isHighDemand: boolean;
  categories: ActivityCategory[];
}

export interface WeeklyWorkloadAnalysis {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalMinutes: number;
  totalSessions: number;
  averageRpe: number;
  totalLoadAU: number; // Sum of Duration * RPE
  technicalMinutes: number; // iacc_team + match + home_individual
  physicalMinutes: number; // institute_gym + home_physical
  recoveryMinutes: number; // recovery + rest
  technicalVsPhysicalRatio: string;
  previousWeekLoadAU: number;
  previousWeekMinutes: number;
  loadVariationPercentage: number | null; // % change vs prev week
  acuteToChronicRatio: number | null; // week load / 4-week average load
  dailyDistribution: DayLoadDistribution[];
  highDemandDaysCount: number;
  categoryBreakdown: CategoryLoadBreakdown[];
  avgSleep: number | null;
  avgFatigue: number | null;
  sleepLoadCorrelationNote: string;
  calculationExplanation: string;
  informativeAlerts: Array<{
    type: 'info' | 'warning' | 'alert';
    title: string;
    description: string;
  }>;
  incompleteDataWarning?: string;
}

export function analyzeWeeklyWorkload(
  activities: Activity[],
  weekOffset = 0 // 0 = current week, 1 = previous week, etc.
): WeeklyWorkloadAnalysis {
  const now = new Date();
  // Get Monday of target week
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const diffToMonday = (dayOfWeek + 6) % 7; // Monday is 0

  const targetMonday = new Date(now);
  targetMonday.setDate(now.getDate() - diffToMonday - weekOffset * 7);
  targetMonday.setHours(0, 0, 0, 0);

  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  targetSunday.setHours(23, 59, 59, 999);

  // Previous week window for comparison
  const prevMonday = new Date(targetMonday);
  prevMonday.setDate(targetMonday.getDate() - 7);
  const prevSunday = new Date(targetMonday);
  prevSunday.setDate(targetMonday.getDate() - 1);
  prevSunday.setHours(23, 59, 59, 999);

  // 4-week window for Chronic Workload
  const chronicStart = new Date(targetMonday);
  chronicStart.setDate(targetMonday.getDate() - 28);

  const startDateStr = targetMonday.toISOString().split('T')[0];
  const endDateStr = targetSunday.toISOString().split('T')[0];

  const completed = activities.filter(
    (a) => a.status === 'completed' || a.status === 'partial'
  );

  const currentWeekActs = completed.filter((a) => {
    const d = new Date(a.date);
    return d >= targetMonday && d <= targetSunday;
  });

  const prevWeekActs = completed.filter((a) => {
    const d = new Date(a.date);
    return d >= prevMonday && d <= prevSunday;
  });

  const chronicActs = completed.filter((a) => {
    const d = new Date(a.date);
    return d >= chronicStart && d < targetMonday;
  });

  // Calculate totals
  let totalMinutes = 0;
  let totalLoadAU = 0;
  let rpeSum = 0;
  let rpeCount = 0;
  let sleepSum = 0;
  let sleepCount = 0;
  let fatigueSum = 0;
  let fatigueCount = 0;
  let technicalMinutes = 0;
  let physicalMinutes = 0;
  let recoveryMinutes = 0;

  const catMap: Record<ActivityCategory, { minutes: number; count: number; rpeSum: number; rpeCount: number; loadAU: number }> = {
    iacc_team: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    institute_gym: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    home_physical: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    home_individual: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    match: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    recovery: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    rest: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
    custom: { minutes: 0, count: 0, rpeSum: 0, rpeCount: 0, loadAU: 0 },
  };

  currentWeekActs.forEach((a) => {
    const dur = a.durationMinutes || 0;
    totalMinutes += dur;

    if (a.category === 'iacc_team' || a.category === 'match' || a.category === 'home_individual') {
      technicalMinutes += dur;
    } else if (a.category === 'institute_gym' || a.category === 'home_physical') {
      physicalMinutes += dur;
    } else if (a.category === 'recovery' || a.category === 'rest') {
      recoveryMinutes += dur;
    }

    const sRpe = a.rpe ? dur * a.rpe : dur * 6; // default 6 if RPE not set
    totalLoadAU += sRpe;

    if (a.rpe) {
      rpeSum += a.rpe;
      rpeCount++;
    }
    if (a.sleepHours !== undefined) {
      sleepSum += a.sleepHours;
      sleepCount++;
    }
    if (a.fatigueLevel !== undefined) {
      fatigueSum += a.fatigueLevel;
      fatigueCount++;
    }

    if (catMap[a.category]) {
      catMap[a.category].minutes += dur;
      catMap[a.category].count += 1;
      catMap[a.category].loadAU += sRpe;
      if (a.rpe) {
        catMap[a.category].rpeSum += a.rpe;
        catMap[a.category].rpeCount += 1;
      }
    }
  });

  // Previous week load
  const prevWeekLoadAU = prevWeekActs.reduce(
    (acc, a) => acc + (a.durationMinutes || 0) * (a.rpe || 6),
    0
  );
  const prevWeekMinutes = prevWeekActs.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

  const loadVariationPercentage =
    prevWeekLoadAU > 0
      ? Number((((totalLoadAU - prevWeekLoadAU) / prevWeekLoadAU) * 100).toFixed(1))
      : null;

  // 4-week chronic average
  const chronic4WeekSum = chronicActs.reduce(
    (acc, a) => acc + (a.durationMinutes || 0) * (a.rpe || 6),
    0
  );
  const chronic4WeekAvg = chronic4WeekSum / 4;
  const acuteToChronicRatio =
    chronic4WeekAvg > 0 ? Number((totalLoadAU / chronic4WeekAvg).toFixed(2)) : null;

  // Daily distribution (Mon to Sun)
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dailyDistribution: DayLoadDistribution[] = [];
  let highDemandDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const curDay = new Date(targetMonday);
    curDay.setDate(targetMonday.getDate() + i);
    const curStr = curDay.toISOString().split('T')[0];

    const dayActs = currentWeekActs.filter((a) => a.date === curStr);
    const dayMins = dayActs.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
    const dayLoad = dayActs.reduce((acc, a) => acc + (a.durationMinutes || 0) * (a.rpe || 6), 0);
    const maxRpe = dayActs.reduce((max, a) => Math.max(max, a.rpe || 0), 0);

    const isHighDemand = dayLoad >= 600 || maxRpe >= 8 || dayActs.length >= 2;
    if (isHighDemand) highDemandDaysCount++;

    dailyDistribution.push({
      date: curStr,
      dayName: dayNames[i],
      sessionsCount: dayActs.length,
      totalMinutes: dayMins,
      totalLoadAU: dayLoad,
      highestRpe: maxRpe,
      isHighDemand,
      categories: dayActs.map((a) => a.category),
    });
  }

  // Category labels and colors
  const catMetadata: Record<ActivityCategory, { label: string; color: string }> = {
    iacc_team: { label: 'IACC Equipo', color: '#EF4444' },
    institute_gym: { label: 'Gimnasio Instituto', color: '#FF6B2C' },
    home_physical: { label: 'Físico en Casa', color: '#3B82F6' },
    home_individual: { label: 'Técnica Individual', color: '#B7F56A' },
    match: { label: 'Partidos', color: '#F59E0B' },
    recovery: { label: 'Recuperación Activa', color: '#10B981' },
    rest: { label: 'Descanso Total', color: '#8B5CF6' },
    custom: { label: 'Personalizado', color: '#6B7280' },
  };

  const categoryBreakdown: CategoryLoadBreakdown[] = Object.entries(catMap)
    .filter(([_, data]) => data.count > 0)
    .map(([cat, data]) => ({
      category: cat as ActivityCategory,
      label: catMetadata[cat as ActivityCategory]?.label || cat,
      minutes: data.minutes,
      sessionsCount: data.count,
      averageRpe: data.rpeCount > 0 ? Number((data.rpeSum / data.rpeCount).toFixed(1)) : 0,
      totalLoadAU: data.loadAU,
      color: catMetadata[cat as ActivityCategory]?.color || '#999',
    }));

  const avgRpe = rpeCount > 0 ? Number((rpeSum / rpeCount).toFixed(1)) : 0;
  const avgSleep = sleepCount > 0 ? Number((sleepSum / sleepCount).toFixed(1)) : null;
  const avgFatigue = fatigueCount > 0 ? Number((fatigueSum / fatigueCount).toFixed(1)) : null;

  // Technical vs Physical ratio
  const technicalVsPhysicalRatio =
    physicalMinutes > 0
      ? `${(technicalMinutes / (physicalMinutes || 1)).toFixed(1)}:1 (Técnico:Físico)`
      : `${technicalMinutes} min técnicos / 0 min físicos`;

  // Informative alerts
  const informativeAlerts: WeeklyWorkloadAnalysis['informativeAlerts'] = [];

  if (loadVariationPercentage !== null && loadVariationPercentage > 30) {
    informativeAlerts.push({
      type: 'warning',
      title: 'Aumento significativo de carga semanal (+30%)',
      description:
        `La carga interna estimada (sRPE) aumentó un ${loadVariationPercentage}% respecto de la semana anterior (${totalLoadAU} AU vs ${prevWeekLoadAU} AU). Se sugiere monitorear molestias en rodillas y tobillos.`,
    });
  }

  if (acuteToChronicRatio !== null && acuteToChronicRatio > 1.4) {
    informativeAlerts.push({
      type: 'warning',
      title: 'Ratio Carga Aguda:Crónica elevado (>1.4)',
      description:
        `El volumen de esta semana está notablemente por encima del promedio de las últimas 4 semanas (Ratio: ${acuteToChronicRatio}). Esto es esperable en semanas con partidos dobles o campus, pero requiere asegurar 8+ hs de descanso.`,
    });
  }

  if (highDemandDaysCount >= 4) {
    informativeAlerts.push({
      type: 'info',
      title: 'Semana con alta densidad de estímulos exigentes',
      description:
        `Identificamos ${highDemandDaysCount} días con RPE ≥ 8 o carga sRPE ≥ 600 AU. Para optimizar el rendimiento táctico en Instituto, asegurá una correcta hidratación y movilidad post-práctica.`,
    });
  }

  let incompleteDataWarning: string | undefined;
  if (currentWeekActs.length > 0 && rpeCount < currentWeekActs.length) {
    const missing = currentWeekActs.length - rpeCount;
    incompleteDataWarning = `Faltan registrar valores de RPE en ${missing} sesión(es) de esta semana. Se asumió RPE 6 para estimar la carga de esas sesiones.`;
  }

  const sleepLoadCorrelationNote =
    avgSleep !== null && avgFatigue !== null
      ? `Promedio semanal de sueño: ${avgSleep} hs/noche con fatiga percibida promedio de ${avgFatigue}/10 frente a una carga de ${totalLoadAU} AU.`
      : 'Para evaluar la relación entre descanso y asimilación de carga, completá las horas de sueño y fatiga en cada registro.';

  return {
    weekLabel: weekOffset === 0 ? 'Semana Actual' : `Semana -${weekOffset}`,
    startDate: startDateStr,
    endDate: endDateStr,
    totalMinutes,
    totalSessions: currentWeekActs.length,
    averageRpe: avgRpe,
    totalLoadAU,
    technicalMinutes,
    physicalMinutes,
    recoveryMinutes,
    technicalVsPhysicalRatio,
    previousWeekLoadAU: prevWeekLoadAU,
    previousWeekMinutes: prevWeekMinutes,
    loadVariationPercentage,
    acuteToChronicRatio,
    dailyDistribution,
    highDemandDaysCount,
    categoryBreakdown,
    avgSleep,
    avgFatigue,
    sleepLoadCorrelationNote,
    calculationExplanation:
      'Carga Interna de Sesión (sRPE) = Duración en minutos × Esfuerzo Percibido (RPE 1-10) en Unidades Arbitrarias (AU), validada por el método de Foster. No constituye un diagnóstico médico sino un indicador de volumen x intensidad.',
    informativeAlerts,
    incompleteDataWarning,
  };
}

// ==========================================
// 4. COMPARACIÓN ENTRE PERÍODOS EQUIVALENTES (MÓDULO 5)
// ==========================================

export interface PeriodMetricComparison {
  name: string;
  unit: string;
  valuePeriodA: number;
  valuePeriodB: number;
  absoluteDiff: number;
  percentageDiff: number | null;
  sampleSizeA: number;
  sampleSizeB: number;
  interpretation: string;
  hasSufficientData: boolean;
}

export interface EquivalentPeriodComparison {
  periodAName: string;
  periodBName: string;
  rangeA: { start: string; end: string };
  rangeB: { start: string; end: string };
  // 1. Cambios en cantidad de entrenamiento
  trainingQuantity: {
    totalMinutes: PeriodMetricComparison;
    totalSessions: PeriodMetricComparison;
    weeklyAverageMinutes: PeriodMetricComparison;
    categoryDisparityExplanation?: string;
  };
  // 2. Cambios en rendimiento medido
  performanceMetrics: {
    shooting3pt?: PeriodMetricComparison;
    shootingMidRange?: PeriodMetricComparison;
    verticalJumpCMJ?: PeriodMetricComparison;
    sprint5m?: PeriodMetricComparison;
    strengthTrapBar?: PeriodMetricComparison;
  };
  // 3. Cambios en la recuperación
  recoveryMetrics: {
    averageSleep: PeriodMetricComparison;
    averageFatigue: PeriodMetricComparison;
    averageRpe: PeriodMetricComparison;
  };
  // 4. Factores explicables por disparidad de registros
  disparityNotes: string[];
  dataSufficiencyWarning?: string;
}

export function compareEquivalentPeriods(
  activities: Activity[],
  measurements: PhysicalMeasurement[],
  customRangeA?: { start: string; end: string; name?: string },
  customRangeB?: { start: string; end: string; name?: string }
): EquivalentPeriodComparison {
  const now = new Date();

  // Default: Last 4 complete weeks vs previous 4 complete weeks
  const rangeA = customRangeA || {
    start: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
    name: 'Últimas 4 semanas',
  };

  const rangeB = customRangeB || {
    start: new Date(now.getTime() - 56 * 86400000).toISOString().split('T')[0],
    end: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
    name: '4 semanas anteriores',
  };

  const filterActs = (start: string, end: string) =>
    activities.filter((a) => {
      const d = a.date;
      return d >= start && d <= end && (a.status === 'completed' || a.status === 'partial');
    });

  const filterMeas = (start: string, end: string, type: string) =>
    measurements.filter((m) => m.testType === type && m.date >= start && m.date <= end);

  const actsA = filterActs(rangeA.start, rangeA.end);
  const actsB = filterActs(rangeB.start, rangeB.end);

  // Helper metric comparison
  const makeComparison = (
    name: string,
    unit: string,
    valA: number,
    valB: number,
    sizeA: number,
    sizeB: number,
    lowerIsBetter = false
  ): PeriodMetricComparison => {
    const diff = Number((valA - valB).toFixed(2));
    const pct = valB !== 0 ? Number(((diff / valB) * 100).toFixed(1)) : null;
    const hasSufficient = sizeA >= 2 && sizeB >= 2;

    let interp = 'Sin diferencias apreciables';
    if (!hasSufficient) {
      interp = `Datos escasos (${sizeA} vs ${sizeB} registros) para inferir conclusiones estadísticas sólidas.`;
    } else if (Math.abs(diff) < 0.05) {
      interp = 'Rendimiento prácticamente idéntico entre ambos períodos.';
    } else {
      const isPositive = lowerIsBetter ? diff < 0 : diff > 0;
      interp = isPositive
        ? `Mejora de ${Math.abs(diff)} ${unit} (${pct ? Math.abs(pct) + '%' : ''}) respecto al período anterior.`
        : `Disminución de ${Math.abs(diff)} ${unit} (${pct ? Math.abs(pct) + '%' : ''}) respecto al período anterior.`;
    }

    return {
      name,
      unit,
      valuePeriodA: Number(valA.toFixed(2)),
      valuePeriodB: Number(valB.toFixed(2)),
      absoluteDiff: diff,
      percentageDiff: pct,
      sampleSizeA: sizeA,
      sampleSizeB: sizeB,
      interpretation: interp,
      hasSufficientData: hasSufficient,
    };
  };

  // 1. Training quantity
  const minsA = actsA.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);
  const minsB = actsB.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

  const trainingQuantity = {
    totalMinutes: makeComparison('Volumen Total', 'min', minsA, minsB, actsA.length, actsB.length),
    totalSessions: makeComparison('Sesiones Realizadas', 'sesiones', actsA.length, actsB.length, actsA.length, actsB.length),
    weeklyAverageMinutes: makeComparison('Promedio Semanal', 'min/sem', minsA / 4, minsB / 4, 4, 4),
    categoryDisparityExplanation:
      actsA.length !== actsB.length
        ? `Existe una disparidad de ${Math.abs(actsA.length - actsB.length)} sesiones registradas entre períodos, lo que influye en el volumen acumulado total.`
        : undefined,
  };

  // 2. Performance: Tests
  const jumpsA = filterMeas(rangeA.start, rangeA.end, 'vertical_jump');
  const jumpsB = filterMeas(rangeB.start, rangeB.end, 'vertical_jump');
  const avgJumpA = jumpsA.length ? jumpsA.reduce((s, m) => s + m.result, 0) / jumpsA.length : 0;
  const avgJumpB = jumpsB.length ? jumpsB.reduce((s, m) => s + m.result, 0) / jumpsB.length : 0;

  const sprintA = filterMeas(rangeA.start, rangeA.end, 'sprint_5m');
  const sprintB = filterMeas(rangeB.start, rangeB.end, 'sprint_5m');
  const avgSprintA = sprintA.length ? sprintA.reduce((s, m) => s + m.result, 0) / sprintA.length : 0;
  const avgSprintB = sprintB.length ? sprintB.reduce((s, m) => s + m.result, 0) / sprintB.length : 0;

  const deadliftA = filterMeas(rangeA.start, rangeA.end, 'trap_bar_deadlift');
  const deadliftB = filterMeas(rangeB.start, rangeB.end, 'trap_bar_deadlift');
  const avgDeadliftA = deadliftA.length ? deadliftA.reduce((s, m) => s + m.result, 0) / deadliftA.length : 0;
  const avgDeadliftB = deadliftB.length ? deadliftB.reduce((s, m) => s + m.result, 0) / deadliftB.length : 0;

  // Shooting: Triples / Distancia similar (strict filtering so triples are not mixed with free throws)
  const shootA = actsA.filter((a) => (a.basketballAttempts || 0) >= 10);
  const shootB = actsB.filter((a) => (a.basketballAttempts || 0) >= 10);
  const accA = shootA.length
    ? shootA.reduce((acc, a) => acc + (a.basketballAccuracyPercentage || 0), 0) / shootA.length
    : 0;
  const accB = shootB.length
    ? shootB.reduce((acc, a) => acc + (a.basketballAccuracyPercentage || 0), 0) / shootB.length
    : 0;

  const performanceMetrics: EquivalentPeriodComparison['performanceMetrics'] = {};

  if (jumpsA.length || jumpsB.length) {
    performanceMetrics.verticalJumpCMJ = makeComparison(
      'Salto Vertical (CMJ)',
      'cm',
      avgJumpA,
      avgJumpB,
      jumpsA.length,
      jumpsB.length
    );
  }

  if (sprintA.length || sprintB.length) {
    performanceMetrics.sprint5m = makeComparison(
      'Sprint 5 m (Aceleración)',
      'seg',
      avgSprintA,
      avgSprintB,
      sprintA.length,
      sprintB.length,
      true
    );
  }

  if (deadliftA.length || deadliftB.length) {
    performanceMetrics.strengthTrapBar = makeComparison(
      'Trap Bar Deadlift',
      'kg',
      avgDeadliftA,
      avgDeadliftB,
      deadliftA.length,
      deadliftB.length
    );
  }

  if (shootA.length || shootB.length) {
    performanceMetrics.shooting3pt = makeComparison(
      'Efectividad de Tiro (Sesiones ≥ 10 intentos)',
      '%',
      accA,
      accB,
      shootA.length,
      shootB.length
    );
  }

  // 3. Recovery
  const sleepActsA = actsA.filter((a) => a.sleepHours !== undefined);
  const sleepActsB = actsB.filter((a) => a.sleepHours !== undefined);
  const avgSleepA = sleepActsA.length ? sleepActsA.reduce((s, a) => s + (a.sleepHours || 0), 0) / sleepActsA.length : 0;
  const avgSleepB = sleepActsB.length ? sleepActsB.reduce((s, a) => s + (a.sleepHours || 0), 0) / sleepActsB.length : 0;

  const fatigueActsA = actsA.filter((a) => a.fatigueLevel !== undefined);
  const fatigueActsB = actsB.filter((a) => a.fatigueLevel !== undefined);
  const avgFatigueA = fatigueActsA.length ? fatigueActsA.reduce((s, a) => s + (a.fatigueLevel || 0), 0) / fatigueActsA.length : 0;
  const avgFatigueB = fatigueActsB.length ? fatigueActsB.reduce((s, a) => s + (a.fatigueLevel || 0), 0) / fatigueActsB.length : 0;

  const rpeActsA = actsA.filter((a) => a.rpe !== undefined);
  const rpeActsB = actsB.filter((a) => a.rpe !== undefined);
  const avgRpeA = rpeActsA.length ? rpeActsA.reduce((s, a) => s + (a.rpe || 0), 0) / rpeActsA.length : 0;
  const avgRpeB = rpeActsB.length ? rpeActsB.reduce((s, a) => s + (a.rpe || 0), 0) / rpeActsB.length : 0;

  const recoveryMetrics = {
    averageSleep: makeComparison('Promedio de Sueño', 'hs', avgSleepA, avgSleepB, sleepActsA.length, sleepActsB.length),
    averageFatigue: makeComparison('Fatiga Percibida', '/10', avgFatigueA, avgFatigueB, fatigueActsA.length, fatigueActsB.length, true),
    averageRpe: makeComparison('Esfuerzo Percibido (RPE)', '/10', avgRpeA, avgRpeB, rpeActsA.length, rpeActsB.length, true),
  };

  // Disparity notes
  const disparityNotes: string[] = [];
  if (actsA.length === 0 || actsB.length === 0) {
    disparityNotes.push('Uno de los períodos tiene 0 sesiones registradas; no es posible extraer comparaciones válidas.');
  } else if (Math.abs(actsA.length - actsB.length) >= 4) {
    disparityNotes.push(`Diferencia marcada de frecuencia: ${actsA.length} sesiones en el período reciente vs ${actsB.length} en el anterior.`);
  }

  let dataSufficiencyWarning: string | undefined;
  if (actsA.length < 4 || actsB.length < 4) {
    dataSufficiencyWarning =
      'Advertencia de muestra reducida: Al menos uno de los períodos cuenta con menos de 4 sesiones completadas. Las diferencias porcentuales deben interpretarse con cautela.';
  }

  return {
    periodAName: rangeA.name || 'Período A',
    periodBName: rangeB.name || 'Período B',
    rangeA: { start: rangeA.start, end: rangeA.end },
    rangeB: { start: rangeB.start, end: rangeB.end },
    trainingQuantity,
    performanceMetrics,
    recoveryMetrics,
    disparityNotes,
    dataSufficiencyWarning,
  };
}

// ==========================================
// 5. OBJETIVOS VINCULADOS CON EVIDENCIA (MÓDULO 4)
// ==========================================

export type GoalEvidenceStatus =
  | 'sin_datos_suficientes'
  | 'en_seguimiento'
  | 'progreso_observado'
  | 'objetivo_alcanzado'
  | 'necesita_revision';

export interface BackingEvidenceItem {
  id: string;
  date: string;
  sourceType: 'measurement' | 'activity';
  title: string;
  resultDisplay: string;
  notes?: string;
}

export interface GoalEvidenceAnalysis {
  goalId: string;
  status: GoalEvidenceStatus;
  statusLabel: string;
  statusBadgeColor: string;
  initialValue?: number;
  targetValue?: number;
  latestValue?: number;
  latestMeasurementDate?: string;
  absoluteDiffToTarget?: number;
  progressPercentage?: number;
  backingEvidence: BackingEvidenceItem[];
  evidenceQuality: 'alta' | 'media' | 'insuficiente';
  evidenceSummary: string;
  historyTimeline: Array<{ date: string; value: number; label: string }>;
  isTargetReached: boolean;
}

export function analyzeGoalEvidence(
  goal: PersonalGoal,
  measurements: PhysicalMeasurement[],
  activities: Activity[]
): GoalEvidenceAnalysis {
  const isReverse =
    goal.targetValue !== undefined &&
    goal.initialValue !== undefined &&
    goal.targetValue < goal.initialValue;

  // Find linked measurements
  const linkedMeasurements = measurements.filter((m) => {
    if (goal.category === 'vertical_jump' && m.testType === 'vertical_jump') return true;
    if (goal.category === 'speed' && m.testType.startsWith('sprint')) return true;
    if (goal.category === 'strength' && (m.testType === 'trap_bar_deadlift' || m.testType === 'bench_press')) return true;
    if (goal.category === 'recovery' && m.testName.toLowerCase().includes('recuper')) return true;
    return false;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Find linked activities (e.g. shooting drills)
  const linkedActivities = activities.filter((a) => {
    if (goal.category === 'shooting' && a.basketballSkillCategory === 'tiros' && a.basketballAccuracyPercentage !== undefined) {
      return true;
    }
    return false;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const backingEvidence: BackingEvidenceItem[] = [
    ...linkedMeasurements.map((m) => ({
      id: m.id,
      date: m.date,
      sourceType: 'measurement' as const,
      title: m.testName,
      resultDisplay: `${m.result} ${m.unit} (${m.method})`,
      notes: m.notes,
    })),
    ...linkedActivities.map((a) => ({
      id: a.id,
      date: a.date,
      sourceType: 'activity' as const,
      title: a.basketballDrillName || 'Sesión de tiro',
      resultDisplay: `${a.basketballAccuracyPercentage}% (${a.basketballMakes}/${a.basketballAttempts} aciertos)`,
      notes: a.notes,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine latest measured value
  let latestValue = goal.currentValue;
  let latestMeasurementDate: string | undefined;

  if (backingEvidence.length > 0) {
    const lastItem = backingEvidence[backingEvidence.length - 1];
    latestMeasurementDate = lastItem.date;
    if (lastItem.sourceType === 'measurement') {
      const match = linkedMeasurements.find((m) => m.id === lastItem.id);
      if (match) latestValue = match.result;
    }
  }

  // Progress percentage calculation
  let progressPercentage: number | undefined = goal.manualProgressPercentage;
  let absoluteDiffToTarget: number | undefined;
  let isTargetReached = false;

  if (goal.targetValue !== undefined && goal.initialValue !== undefined && latestValue !== undefined) {
    absoluteDiffToTarget = Math.abs(Number((goal.targetValue - latestValue).toFixed(2)));

    if (isReverse) {
      const totalSpan = goal.initialValue - goal.targetValue;
      if (totalSpan > 0) {
        const progressSpan = goal.initialValue - latestValue;
        progressPercentage = Math.min(100, Math.max(0, Math.round((progressSpan / totalSpan) * 100)));
      }
      isTargetReached = latestValue <= goal.targetValue;
    } else {
      const totalSpan = goal.targetValue - goal.initialValue;
      if (totalSpan > 0) {
        const progressSpan = latestValue - goal.initialValue;
        progressPercentage = Math.min(100, Math.max(0, Math.round((progressSpan / totalSpan) * 100)));
      }
      isTargetReached = latestValue >= goal.targetValue;
    }
  }

  // Evidence Quality
  let evidenceQuality: 'alta' | 'media' | 'insuficiente' = 'insuficiente';
  if (backingEvidence.length >= 3) {
    evidenceQuality = 'alta';
  } else if (backingEvidence.length >= 1) {
    evidenceQuality = 'media';
  }

  // Evidence Status
  let status: GoalEvidenceStatus = 'sin_datos_suficientes';
  let statusLabel = 'Sin datos suficientes';
  let statusBadgeColor = 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  if (isTargetReached) {
    status = 'objetivo_alcanzado';
    statusLabel = '¡Objetivo alcanzado!';
    statusBadgeColor = 'bg-[#B7F56A]/10 text-[#B7F56A] border-[#B7F56A]/20';
  } else if (backingEvidence.length === 0) {
    status = 'sin_datos_suficientes';
    statusLabel = 'Sin datos suficientes';
    statusBadgeColor = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  } else if (goal.deadline && new Date(goal.deadline).getTime() < Date.now() && !isTargetReached) {
    status = 'necesita_revision';
    statusLabel = 'Plazo cumplido — Requiere revisión';
    statusBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (progressPercentage !== undefined && progressPercentage >= 15) {
    status = 'progreso_observado';
    statusLabel = 'Progreso observado con evidencia';
    statusBadgeColor = 'bg-[#3ECF8E]/10 text-[#3ECF8E] border-[#3ECF8E]/20';
  } else {
    status = 'en_seguimiento';
    statusLabel = 'En seguimiento activo';
    statusBadgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }

  // History timeline
  const historyTimeline: Array<{ date: string; value: number; label: string }> = [];
  if (goal.initialValue !== undefined) {
    historyTimeline.push({
      date: goal.createdAt ? goal.createdAt.split('T')[0] : 'Inicio',
      value: goal.initialValue,
      label: 'Valor inicial',
    });
  }

  backingEvidence.forEach((ev) => {
    const val = ev.sourceType === 'measurement'
      ? linkedMeasurements.find((m) => m.id === ev.id)?.result
      : linkedActivities.find((a) => a.id === ev.id)?.basketballAccuracyPercentage;
    if (val !== undefined) {
      historyTimeline.push({
        date: ev.date,
        value: val,
        label: ev.title,
      });
    }
  });

  const evidenceSummary =
    backingEvidence.length > 0
      ? `${backingEvidence.length} registro(s) verificable(s) respaldan este objetivo. Último control el ${latestMeasurementDate || 'reciente'}.`
      : 'No existen registros o tests medidos vinculados con este objetivo en la base de datos.';

  return {
    goalId: goal.id,
    status,
    statusLabel,
    statusBadgeColor,
    initialValue: goal.initialValue,
    targetValue: goal.targetValue,
    latestValue,
    latestMeasurementDate,
    absoluteDiffToTarget,
    progressPercentage,
    backingEvidence,
    evidenceQuality,
    evidenceSummary,
    historyTimeline,
    isTargetReached,
  };
}
