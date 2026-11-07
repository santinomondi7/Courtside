/**
 * COURTSIDE — Sports Analytics Engine (Client & Fallback)
 * 
 * Provides local intelligence and athletic assessment when:
 * 1. The client is offline or running on mobile / desktop PWA.
 * 2. The backend /api endpoint is not available (e.g. static host, network error, or HTTP 404).
 * 3. Immediate local response is requested.
 * 
 * Complies with COURTSIDE Core Rules:
 * - Differentiates real weaknesses from lack of records (e.g. left-hand work).
 * - Never promises exact future dates or guarantees.
 * - Adheres strictly to Instituto Atlético Central Córdoba (IACC) athletic context.
 */

export interface SportsAnalystContext {
  profile?: {
    name?: string;
    club?: string;
    category?: string;
    heightCm?: number;
    weightKg?: number;
    wingspanCm?: number;
    dominantHand?: string;
  };
  activitiesCount?: number;
  measurementsCount?: number;
  goalsCount?: number;
  weaknesses?: any[];
  weeklyWorkloadSummary?: any;
  trendEstimations?: any[];
  periodComparisonSummary?: any;
  goalsEvidenceSummary?: any[];
  recentActivities?: any[];
  measurements?: any[];
}

export function generateLocalAnalystReply(
  userQuery: string,
  context?: SportsAnalystContext
): { reply: string; model: string; isLocalFallback: boolean } {
  const qLower = (userQuery || '').toLowerCase().trim();
  const weaknesses = context?.weaknesses || [];
  const workload = context?.weeklyWorkloadSummary || {};
  const trends = context?.trendEstimations || [];
  const goals = context?.goalsEvidenceSummary || [];
  const athleteName = context?.profile?.name || 'Santino';
  const club = context?.profile?.club || 'IACC';
  const category = context?.profile?.category || 'U17';

  let reply = '';

  if (qLower.includes('debilidad') || qLower.includes('desequilibrio')) {
    if (weaknesses.length > 0) {
      reply = `Hola ${athleteName}. Analizando tus ${context?.activitiesCount || 0} registros deportivos cruzados en ${club}, detectamos los siguientes patrones y observaciones clave:\n\n` +
        weaknesses.map((w: any, idx: number) =>
          `**${idx + 1}. ${w.title}** (${String(w.kind || '').replace(/_/g, ' ').toUpperCase()})\n` +
          `• **Datos que lo respaldan:** ${w.backingData}\n` +
          `• **Nivel de confianza analítica:** ${String(w.confidence || 'MEDIO').toUpperCase()}\n` +
          `• **Por qué es relevante:** ${w.whyRelevant}\n` +
          `• **Acción de seguimiento:** ${w.followUpAction}`
        ).join('\n\n') +
        `\n\n*Aclaración de rigor:* Ninguna observación estadística reemplaza el criterio del entrenador de Instituto. Son herramientas para que lleves un control objetivo de tus hábitos.`;
    } else {
      reply = `¡Buenas noticias, ${athleteName}! No se observan desequilibrios marcados en tus registros recientes. Mantenés una distribución consistente entre prácticas de ${category}, sesiones de gimnasio y descanso.`;
    }
  } else if (qLower.includes('mano izquierda') || qLower.includes('zurda') || qLower.includes('no habil') || qLower.includes('no hábil')) {
    const leftHandObs = weaknesses.find((w: any) => w.id?.includes('left-hand') || String(w.title || '').toLowerCase().includes('mano izquierda'));
    if (leftHandObs) {
      reply = `**Evaluación de Mano Izquierda:**\n\n` +
        `Actualmente **no hay registros suficientes de finalizaciones o entradas con mano izquierda** en tus últimos registros (${leftHandObs.backingData}).\n\n` +
        `*Aclaración metodológica importante:* Esto **NO** significa que tengas un mal desempeño con la mano izquierda, sino que no existe evidencia cuantificada en la app para medir tu efectividad real.\n\n` +
        `**Sugerencia práctica:** En tu próxima práctica individual, anotá una serie de 20 tiros o bandejas con mano no hábil para crear una marca de referencia objetiva.`;
    } else {
      reply = `Tenés sesiones con mención de trabajo técnico registradas. Para que el sistema evalúe tu evolución con mano izquierda con precisión estadística, te sugiero anotar los aciertos e intentos específicos de cada perfil en el módulo de Técnica Individual.`;
    }
  } else if (qLower.includes('carga') || qLower.includes('semana') || qLower.includes('fatiga') || qLower.includes('srpe') || qLower.includes('esfuerzo')) {
    const alerts = workload.informativeAlerts || [];
    reply = `**Análisis de Carga Semanal Real (Método Foster sRPE):**\n\n` +
      `• **Volumen total:** ${workload.totalMinutes || 0} minutos en ${workload.totalSessions || 0} sesiones completadas.\n` +
      `• **Carga interna acumulada:** ${workload.totalLoadAU || 0} AU (Unidades Arbitrarias: Duración × RPE).\n` +
      `• **Esfuerzo percibido promedio (RPE):** ${workload.averageRpe || 0}/10.\n` +
      `• **Distribución Técnico/Físico:** ${workload.technicalMinutes || 0} min técnicos vs ${workload.physicalMinutes || 0} min físicos (${workload.technicalVsPhysicalRatio || 'Equilibrado'}).\n` +
      `• **Relación Sueño / Fatiga:** ${workload.sleepLoadCorrelationNote || 'Sin datos suficientes de sueño en la semana'}.\n\n` +
      (alerts.length > 0
        ? `**Alertas informativas observadas:**\n` + alerts.map((a: any) => `• *${a.title}:* ${a.description}`).join('\n')
        : `Carga asimilada dentro de los parámetros habituales de entrenamiento. Recordá que la carga estimada es una herramienta de monitoreo deportivo, no un diagnóstico médico.`);
  } else if (qLower.includes('salto') || qLower.includes('vertical') || qLower.includes('cmj') || qLower.includes('potencia')) {
    const jumpTrend = trends.find((t: any) => t.metricType === 'vertical_jump');
    if (jumpTrend) {
      reply = `**Tendencia de Salto Vertical (CMJ):**\n\n` +
        `• **Último valor medido:** ${jumpTrend.latestValue} ${jumpTrend.unit} (${jumpTrend.latestDate}).\n` +
        `• **Valor inicial registrado:** ${jumpTrend.initialValue} ${jumpTrend.unit} (${jumpTrend.initialDate}).\n` +
        `• **Tendencia observada:** ${String(jumpTrend.observedTrend || '').toUpperCase()} (${jumpTrend.trendRatePerWeek > 0 ? '+' : ''}${jumpTrend.trendRatePerWeek} cm/semana).\n` +
        `• **Mediciones disponibles:** ${jumpTrend.measurementsCount} pruebas en el historial.\n` +
        (jumpTrend.targetValue ? `• **Distancia al objetivo (${jumpTrend.targetValue} cm):** Faltan ${jumpTrend.currentDistanceToTarget} cm.\n` : '') +
        (jumpTrend.projectedValueNextMonth ? `• **Estimación orientativa a 30 días:** ~${jumpTrend.projectedValueNextMonth} cm (sujeto a variabilidad biomecánica).\n` : '') +
        (jumpTrend.confidenceWarning ? `• *Advertencia de fiabilidad:* ${jumpTrend.confidenceWarning}\n` : '') +
        `\n*Recomendación:* Asegurate de testear con el mismo protocolo (Test Vertec / Tablero) y en condiciones similares de descanso.`;
    } else {
      reply = `No hay mediciones de salto vertical registradas en tu historial aún. Podés agregar tu primer test en la pestaña de Estadísticas para que comencemos a calcular tu curva de potencia.`;
    }
  } else if (qLower.includes('velocidad') || qLower.includes('sprint') || qLower.includes('agilidad')) {
    const speedTrend = trends.find((t: any) => t.metricType === 'speed' || t.metricType === 'sprint');
    if (speedTrend) {
      reply = `**Tendencia de Velocidad y Sprint:**\n\n` +
        `• **Último registro:** ${speedTrend.latestValue} ${speedTrend.unit} (${speedTrend.latestDate}).\n` +
        `• **Evolución:** ${String(speedTrend.observedTrend || '').toUpperCase()} con ${speedTrend.measurementsCount} muestras comparables.\n` +
        (speedTrend.confidenceWarning ? `• *Margen de incertidumbre:* ${speedTrend.confidenceWarning}\n` : '');
    } else {
      reply = `No disponemos de suficientes mediciones de velocidad (ej. 20m sprint o test de agilidad en cancha) para calcular una tendencia. Anotá tus tiempos de test en la pestaña de Estadísticas para proyectar tu velocidad.`;
    }
  } else if (qLower.includes('tiro') || qLower.includes('triple') || qLower.includes('lanzamiento') || qLower.includes('efectividad')) {
    reply = `**Análisis de Efectividad y Mecánica de Tiro:**\n\n` +
      `Contás con sesiones de tiro y técnica individual en tus registros recientes.\n\n` +
      `• **Recomendación analítica:** Para que la tendencia sea estadísticamente representativa, es clave anotar siempre **intentos totales vs aciertos** diferenciados por sector (tiros libres, triples en catch & shoot, y lanzamientos tras drible).\n` +
      `• **Rango de carga:** Series de 100 tiros post-entrenamiento en el patio suman repetición neuromuscular sin sobrecargar el tren inferior si el RPE se mantiene moderado (4 a 6).`;
  } else if (qLower.includes('u17') || qLower.includes('u21') || qLower.includes('instituto') || qLower.includes('sandrin') || qLower.includes('sandrín')) {
    reply = `**Entrenamientos en Instituto ACC (U17 vs U21):**\n\n` +
      `Tu perfil está configurado para diferenciar tus entrenamientos de categoría formativa (${category}) de las citaciones y prácticas con U21 en el Sandrín.\n\n` +
      `• **Impacto fisiológico:** El juego en U21 implica mayor intensidad de contacto y velocidad de ejecución, lo que suele traducirse en un RPE promedio más alto (+1.5 a +2.0 puntos).\n` +
      `• **Pauta de cuidado:** Registrá el esfuerzo percibido y las horas de descanso después de cada práctica U21 para advertirte si se produce un pico agudo de fatiga acumulada.`;
  } else if (qLower.includes('objetivo') || qLower.includes('meta')) {
    if (goals.length > 0) {
      reply = `**Estado de tus Objetivos Vinculados con Evidencia:**\n\n` +
        goals.map((g: any) =>
          `• **${g.title}:** ${g.statusLabel} (${g.progressPercentage !== undefined ? g.progressPercentage + '% de avance' : 'En seguimiento'})\n` +
          `  *Última medición registrada:* ${g.latestValue !== undefined ? g.latestValue + ' ' + (g.unit || '') : 'Sin medición aún'} | *Calidad de evidencia:* ${String(g.quality || 'MEDIA').toUpperCase()}\n` +
          `  *Detalle:* ${g.evidenceSummary}`
        ).join('\n\n') +
        `\n\n*Principio de COURTSIDE:* El porcentaje de avance no garantiza una fecha de cumplimiento; refleja el progreso medido de manera comprobable.`;
    } else {
      reply = `No tenés objetivos deportivos activos configurados en este momento. Podés crearlos desde el módulo de Objetivos para vincularlos con tus métricas reales.`;
    }
  } else if (qLower.includes('compar') || qLower.includes('mes anterior') || qLower.includes('cuatro semanas') || qLower.includes('periodo') || qLower.includes('período')) {
    const comp = context?.periodComparisonSummary;
    if (comp && comp.periodAName) {
      reply = `**Comparación entre Períodos Equivalentes (${comp.periodAName} vs ${comp.periodBName}):**\n\n` +
        `1. **Volumen de entrenamiento:** ${comp.minsA || 0} min (${comp.actsA || 0} sesiones) vs ${comp.minsB || 0} min (${comp.actsB || 0} sesiones).\n` +
        `2. **Recuperación:** Sueño promedio de ${comp.sleepA || 'N/A'} hs vs ${comp.sleepB || 'N/A'} hs; RPE promedio de ${comp.rpeA || 'N/A'}/10 vs ${comp.rpeB || 'N/A'}/10.\n` +
        `3. **Rendimiento medido:** ${comp.performanceSummary || 'Tests de rendimiento estables entre ambos ciclos'}.\n\n` +
        (comp.disparityNote ? `*Nota metodológica:* ${comp.disparityNote}` : '');
    } else {
      reply = `Para una comparación estadísticamente válida entre períodos equivalentes, se requieren al menos 4 semanas completas de registros en cada ciclo. Podés consultar la comparativa detallada en la pestaña de Estadísticas.`;
    }
  } else if (qLower.includes('motiv') || qLower.includes('enoj') || qLower.includes('bajon') || qLower.includes('mal') || qLower.includes('frustr')) {
    reply = `Santino, entendemos perfectamente la exigencia que vivís en Instituto. En el básquetbol formativo de alto nivel, la frustración y el enojo cuando las cosas no salen son completamente normales.\n\n` +
      `**Recordá estos tres principios basados en datos:**\n` +
      `1. **El progreso deportivo no es una línea recta:** Los atletas de élite tienen días donde el tiro no entra o las piernas pesan. Lo que define tu evolución es la consistencia con la que volvés a entrenar al día siguiente.\n` +
      `2. **Tu historial no miente:** Ya completaste ${context?.activitiesCount || 0} sesiones de esfuerzo real. Ningún mal partido ni entrenamiento difícil borra las horas acumuladas de gimnasio, tiro y fundamentos.\n` +
      `3. **Enfocate en el proceso, no solo en el resultado inmediato:** En IACC se valora la actitud defensiva, la intensidad y las ganas de aprender. ¡Cabeza arriba y a seguir metiéndole, Gloria!`;
  } else {
    reply = `Hola ${athleteName}. Soy tu analista de rendimiento en **COURTSIDE**, con acceso directo a tus registros de ${club} (${category}), gimnasio y preparación física.\n\n` +
      `Actualmente contás con **${context?.activitiesCount || 0} actividades completadas**, **${context?.measurementsCount || 0} mediciones físicas** y **${context?.goalsCount || 0} objetivos en seguimiento**.\n\n` +
      `Podés consultarme dudas puntuales como:\n` +
      `• *¿Cuál es mi principal debilidad según mis registros?*\n` +
      `• *¿Estoy trabajando suficiente mi mano izquierda?*\n` +
      `• *¿Cómo fue mi carga interna y fatiga esta semana?*\n` +
      `• *¿Qué tendencia muestra mi salto vertical?*\n` +
      `• *¿Qué objetivos tienen respaldo de mediciones reales?*\n` +
      `• *Compará mis últimas cuatro semanas con las anteriores.*`;
  }

  return {
    reply,
    model: 'courtside-sports-analytics-engine',
    isLocalFallback: true,
  };
}
