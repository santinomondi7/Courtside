import { Activity, PhysicalMeasurement, PersonalGoal, AthleticRecommendation } from '../types';

export function generateAthleticRecommendations(
  activities: Activity[],
  measurements: PhysicalMeasurement[],
  goals: PersonalGoal[]
): AthleticRecommendation[] {
  const recommendations: AthleticRecommendation[] = [];
  const now = new Date();

  // Helper: filter activities in the last N days (completed only)
  const getActivitiesInDays = (days: number) => {
    const cutoff = new Date(now.getTime() - days * 86400000);
    return activities.filter((a) => {
      const d = new Date(a.date);
      return d >= cutoff && (a.status === 'completed' || a.status === 'partial');
    });
  };

  const last7Days = getActivitiesInDays(7);
  const last14Days = getActivitiesInDays(14);

  // 1. Check for pain / severe soreness safety alert (Priority 1)
  const recentPain = last7Days.filter(
    (a) => (a.sorenessLevel && a.sorenessLevel >= 7) || (a.sorenessAreas && a.sorenessAreas.length >= 3)
  );

  if (recentPain.length > 0) {
    const latestPain = recentPain[0];
    const areas = latestPain.sorenessAreas?.join(', ') || 'zonas musculares/articulares';
    recommendations.push({
      id: 'rec-medical-safety',
      type: 'alert',
      title: 'Atención: Nivel de molestia elevado registrado',
      description: `Registraste un nivel de dolor/molestia de ${latestPain.sorenessLevel}/10 en ${areas}. Se recomienda suspender saltos pliométricos y cargas máximas. Consultá con el cuerpo médico/kinesiólogo de Instituto si la molestia persiste o empeora.`,
      evidence: `Basado en tu registro del ${latestPain.date} (${latestPain.category}) con molestia de ${latestPain.sorenessLevel}/10 en ${areas}.`,
      actionLabel: 'Ver detalles de la sesión',
    });
  }

  // 2. High Cumulative Load / High Fatigue Warning (sRPE calculation: duration * RPE)
  const highExertionSessions = last7Days.filter((a) => a.rpe && a.rpe >= 8);
  const highFatigueSessions = last7Days.filter((a) => a.fatigueLevel && a.fatigueLevel >= 8);
  const totalMinutes7d = last7Days.reduce((acc, a) => acc + (a.durationMinutes || 0), 0);

  if (highExertionSessions.length >= 3 || highFatigueSessions.length >= 2) {
    recommendations.push({
      id: 'rec-fatigue-management',
      type: 'warning',
      title: 'Carga acumulada alta: Programá una descarga o movilidad',
      description:
        'Tuviste 3 o más sesiones con RPE ≥ 8 o fatiga elevada en los últimos 7 días. Para prevenir sobrecargas y mantener la frescura neuromuscular en los entrenamientos de Instituto, priorizá una sesión de movilidad activa, estiramientos y buen descanso nocturno.',
      evidence: `Registraste ${highExertionSessions.length} sesiones de alta exigencia (RPE ≥ 8) y ${totalMinutes7d} min de entrenamiento en los últimos 7 días.`,
      actionLabel: 'Registrar recuperación',
      actionCategory: 'recovery',
    });
  }

  // 3. Sleep quality check
  const sessionsWithSleep = last7Days.filter((a) => a.sleepHours !== undefined);
  if (sessionsWithSleep.length >= 2) {
    const avgSleep =
      sessionsWithSleep.reduce((acc, a) => acc + (a.sleepHours || 0), 0) / sessionsWithSleep.length;
    if (avgSleep < 7) {
      recommendations.push({
        id: 'rec-sleep-recovery',
        type: 'warning',
        title: 'Horas de sueño por debajo del objetivo para atletas',
        description:
          'A los 16 años y en etapa de desarrollo físico competitivo, dormir al menos 8 a 9 horas diarias es fundamental para la recuperación del sistema nervioso central, la producción hormonal y la absorción de las cargas de básquetbol.',
        evidence: `Tu promedio de sueño registrado en los últimos 7 días fue de ${avgSleep.toFixed(1)} horas por noche.`,
      });
    }
  }

  // 4. Physical Testing Freshness: Vertical jump & Sprints check
  const jumpTests = measurements.filter((m) => m.testType === 'vertical_jump');
  const sprintTests = measurements.filter((m) => m.testType.startsWith('sprint'));

  const latestJump = jumpTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (!latestJump) {
    recommendations.push({
      id: 'rec-no-jump-data',
      type: 'tip',
      title: 'Añadí tu medición base de Salto Vertical',
      description:
        'Registrar una medición periódica de salto vertical (CMJ) te permitirá comprobar de manera objetiva si el trabajo de gimnasio y pliometría está aumentando tu explosividad.',
      evidence: 'Todavía no hay ninguna medición de salto vertical en tus registros.',
      actionLabel: 'Registrar medición',
    });
  } else {
    const daysSinceJump = Math.round((now.getTime() - new Date(latestJump.date).getTime()) / 86400000);
    if (daysSinceJump > 28) {
      recommendations.push({
        id: 'rec-jump-retest',
        type: 'tip',
        title: 'Momento oportuno para re-testear Salto Vertical',
        description:
          'Han pasado más de 4 semanas desde tu última medición de salto vertical. Un re-test en un día de bajo cansancio te dará feedback claro sobre la transferencia de tus rutinas.',
        evidence: `Última medición: ${latestJump.result} ${latestJump.unit} el ${latestJump.date} (hace ${daysSinceJump} días).`,
        actionLabel: 'Registrar nueva medición',
      });
    }
  }

  // 5. Basketball shooting accuracy analysis
  const shootingSessions = activities.filter(
    (a) =>
      a.category === 'home_individual' &&
      a.basketballAttempts &&
      a.basketballAttempts >= 20 &&
      a.basketballMakes !== undefined
  );

  if (shootingSessions.length >= 3) {
    const sorted = [...shootingSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentShooting = sorted.slice(0, 3);
    const totalMakes = recentShooting.reduce((acc, s) => acc + (s.basketballMakes || 0), 0);
    const totalAttempts = recentShooting.reduce((acc, s) => acc + (s.basketballAttempts || 0), 0);
    const pct = Math.round((totalMakes / totalAttempts) * 100);

    if (pct >= 80) {
      recommendations.push({
        id: 'rec-shooting-positive',
        type: 'positive',
        title: 'Excelente ritmo de efectividad en lanzamientos',
        description:
          'Tu consistencia en las prácticas de tiro del patio se mantiene alta. Podés sumar mayor dificultad introduciendo tiros tras detención en 1 tiempo o con fatiga previa.',
        evidence: `Promedio de ${pct}% de acierto (${totalMakes}/${totalAttempts}) en tus últimas 3 sesiones registradas.`,
      });
    }
  }

  // 6. Consistency prompt
  if (last7Days.length === 0) {
    recommendations.push({
      id: 'rec-no-activities-week',
      type: 'tip',
      title: 'Comenzá a registrar tu semana deportiva',
      description:
        'Anotá los entrenamientos de Instituto, las sesiones de gimnasio y tus prácticas de tiro en casa para que el análisis de rendimiento cobre vida.',
      evidence: 'No tenés actividades registradas en los últimos 7 días.',
      actionLabel: 'Registrar actividad',
    });
  }

  return recommendations;
}
