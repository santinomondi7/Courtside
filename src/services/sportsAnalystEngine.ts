/**
 * COURTSIDE — Open Basketball Sports Analytics & Coaching Engine
 *
 * Responds broadly and practically to any basketball performance, physical conditioning,
 * jump biomechanics, technique, recovery, nutrition, or mental-game question from Santino,
 * grounded in his real COURTSIDE records (IACC U17/U21, gym, shooting, and jump/speed tests).
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
  jumpBreakdown?: {
    cmjLatest?: { result: number; date: string } | null;
    armsLatest?: { result: number; date: string } | null;
    leftLegLatest?: { result: number; date: string } | null;
    rightLegLatest?: { result: number; date: string } | null;
    approachLatest?: { result: number; date: string } | null;
    armGainCm?: number | null;
    armGainPct?: number | null;
    singleLegAsymmetryPct?: number | null;
  };
  shootingSummary?: {
    sessions: number;
    attempts: number;
    makes: number;
    accuracyPct: number | null;
  };
}

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

export function generateLocalAnalystReply(
  userQuery: string,
  context?: SportsAnalystContext
): { reply: string; model: string; isLocalFallback: boolean } {
  const q = normalizeText(userQuery);
  const weaknesses = context?.weaknesses || [];
  const workload = context?.weeklyWorkloadSummary || {};
  const trends = context?.trendEstimations || [];
  const goals = context?.goalsEvidenceSummary || [];
  const measurements = context?.measurements || [];
  const jb = context?.jumpBreakdown;
  const shooting = context?.shootingSummary;
  const athleteName = context?.profile?.name || 'Santino';
  const club = context?.profile?.club || 'IACC';
  const category = context?.profile?.category || 'U17';

  const isAskingHowToImprove = includesAny(q, [
    'como mejorar',
    'como puedo mejorar',
    'como subir',
    'como aumentar',
    'como ganar',
    'que ejercicios',
    'ejercicios',
    'rutina',
    'drills',
    'tips',
    'consejos',
    'hacer para',
    'mejorar mi',
    'mejorar el',
    'mejorar la',
    'potenciar',
    'entrenar',
    'plan',
    'ayuda a',
  ]);

  const isAskingExplanation = includesAny(q, [
    'diferencia',
    'que es',
    'para que sirve',
    'por que',
    'significa',
    'explica',
    'comparar',
    'aporte',
    'asimetria',
  ]);

  // 1. SALTO VERTICAL / CMJ / CON BRAZOS (ABALAKOV) / A UN PIE / VOLCAR
  if (
    includesAny(q, [
      'salto',
      'saltar',
      'cmj',
      'abalakov',
      'un pie',
      'una pierna',
      'unipodal',
      'volcar',
      'volcada',
      'despegue',
      'pliometria',
      'explosividad',
      'asimetria',
    ])
  ) {
    const cmj = jb?.cmjLatest;
    const arms = jb?.armsLatest;
    const leftLeg = jb?.leftLegLatest;
    const rightLeg = jb?.rightLegLatest;
    const approach = jb?.approachLatest;
    const jumpTrend = trends.find((t: any) => t.metricType === 'vertical_jump');
    const trapBar = measurements
      .filter((m: any) => m.type === 'trap_bar_deadlift' || String(m.name || '').toLowerCase().includes('trap bar'))
      .slice(-1)[0];

    const dataBlockParts: string[] = [];
    if (cmj) dataBlockParts.push(`• **CMJ (sin brazos):** ${cmj.result} cm (${cmj.date})`);
    if (arms) {
      const gainStr =
        jb?.armGainCm !== null && jb?.armGainCm !== undefined
          ? ` — aporte de brazos: ${jb.armGainCm >= 0 ? '+' : ''}${jb.armGainCm} cm (${jb.armGainPct}%)`
          : '';
      dataBlockParts.push(`• **Salto con Brazos (Abalakov):** ${arms.result} cm (${arms.date})${gainStr}`);
    }
    if (leftLeg || rightLeg) {
      const asymStr =
        jb?.singleLegAsymmetryPct !== null && jb?.singleLegAsymmetryPct !== undefined
          ? ` — asimetría bilateral: **${jb.singleLegAsymmetryPct}%**`
          : '';
      dataBlockParts.push(
        `• **Saltos a Un Pie:** Izquierda ${leftLeg ? `${leftLeg.result} cm` : 'sin registro'} | Derecha ${rightLeg ? `${rightLeg.result} cm` : 'sin registro'}${asymStr}`
      );
    }
    if (approach) dataBlockParts.push(`• **Salto en Carrera:** ${approach.result} cm (${approach.date})`);
    if (trapBar) dataBlockParts.push(`• **Base de Fuerza (Trap Bar):** ${trapBar.result} ${trapBar.unit} (${trapBar.date})`);

    const dataSummary =
      dataBlockParts.length > 0
        ? `**Tus marcas actuales registradas:**\n${dataBlockParts.join('\n')}`
        : `**Tus marcas actuales:** Todavía no tenés todas las variantes cargadas en Estadísticas (podés registrar CMJ sin brazos, Con Brazos, Pie Izquierdo y Pie Derecho).`;

    if (isAskingHowToImprove || !isAskingExplanation) {
      const specificAsymmetryTip =
        jb?.singleLegAsymmetryPct !== null && jb?.singleLegAsymmetryPct !== undefined && jb.singleLegAsymmetryPct >= 10
          ? `\n• **Prioridad detectada (Asimetría ${jb.singleLegAsymmetryPct}%):** Empezá las series unilaterales por la pierna más débil (${(leftLeg?.result || 0) < (rightLeg?.result || 0) ? 'izquierda' : 'derecha'}) con el mismo volumen e intensidad.`
          : '';

      const armSwingTip =
        jb?.armGainPct !== null && jb?.armGainPct !== undefined && jb.armGainPct < 8
          ? `\n• **Oportunidad rápida en brazos:** Tu impulso de brazos suma hoy ${jb.armGainPct}% (lo óptimo es 10-15%). Trabajar el balanceo explosivo te puede dar +2 a +4 cm casi de inmediato.`
          : '';

      const reply =
        `**Cómo mejorar tu salto vertical (${athleteName} — ${category}):**\n\n` +
        `${dataSummary}\n\n` +
        `Para ganar centímetros reales en cancha (y proteger rodillas/tobillos), el salto se construye combinando **4 pilares**:\n\n` +
        `**1. Fuerza Máxima y Aplicación Rápida (Gimnasio IACC)**\n` +
        `• **Trap Bar Deadlift / Sentadilla:** Mové cargas moderadas-altas con **máxima intención de velocidad en la subida** (3-4 series de 3-5 reps). La fuerza es el "motor" del CMJ.\n` +
        `• **Trabajo unilateral:** Búlgaras explosivas y subidas rápidas al cajón para transferir fuerza al despegue a un pie.${specificAsymmetryTip}\n\n` +
        `**2. Pliometría y Reactividad (Calidad sobre cantidad)**\n` +
        `• **Saltos de contacto corto (Pogo Jumps):** 3x10 rebotes rápidos usando tobillos rígidos (menos tiempo en el piso = más energía elástica).\n` +
        `• **Box Jumps / Saltos con pausa en sentadilla:** 3-4 series de 3-4 saltos a máxima altura descansando 90 segundos entre series. *Nunca saltes fatigado si buscás altura máxima.*\n` +
        `• **Saltos a un pie con caída controlada:** 3x4 por pierna enfocándote en frenar firme y despegar vertical.\n\n` +
        `**3. Técnica de Brazos y Mecánica de Despegue**\n` +
        `• En el salto con brazos (Abalakov), llevá los brazos bien atrás en el descenso y lanzalos arriba al mismo tiempo que extendés cadera, rodillas y tobillos.\n` +
        `• En el salto en carrera a 1 pie, el último paso debe ser rápido y el pie debe frenar hacia adelante para transformar velocidad horizontal en altura vertical.${armSwingTip}\n\n` +
        `**4. Descanso y Monitoreo**\n` +
        `• El sistema nervioso necesita frescura para saltar alto: dormí 8+ hs y re-testeá tu CMJ, salto con brazos y saltos a un pie cada 3-4 semanas en un día descansado.\n` +
        `• *Coordinación:* Sumá o ajustá ejercicios pliométricos siempre en sintonía con la carga que te da el PF de Instituto.`;

      return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
    }

    // Explanation / comparison mode (CMJ vs arms vs single leg)
    const reply =
      `**Análisis Biomecánico de tus Saltos (CMJ, Con Brazos y Un Pie):**\n\n` +
      `${dataSummary}\n\n` +
      `• **CMJ (sin brazos / manos en cintura):** Mide la potencia pura de tus piernas (extensión de cadera, rodilla y tobillo) aislando la técnica de brazos.\n` +
      `• **Salto con Brazos (Abalakov):** Mide cuánto provecho le sacás al impulso coordinado de brazos y tronco. En básquetbol suele ser entre **10% y 15% superior** al CMJ sin brazos.\n` +
      `• **Saltos a Un Pie (Izquierdo vs Derecho):** Evalúan tu despegue real de bandeja/penetración y detectan asimetrías. Una diferencia menor al **10%** se considera equilibrada; mayor al **12-15%** conviene compensarla con trabajo unilateral.\n` +
      (jumpTrend && jumpTrend.measurementsCount >= 3
        ? `\n**Tendencia CMJ:** ${String(jumpTrend.observedTrend).toUpperCase()} (${jumpTrend.trendRatePerWeek > 0 ? '+' : ''}${jumpTrend.trendRatePerWeek} cm/sem).`
        : `\nSi querés, preguntame *"¿Cómo mejoro mi salto a un pie?"* o *"¿Qué rutina me conviene para subir el CMJ?"*.`);

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 2. VELOCIDAD, PRIMER PASO, SPRINT Y AGILIDAD
  if (
    includesAny(q, [
      'velocidad',
      'sprint',
      'rapido',
      'primer paso',
      'agilidad',
      'aceleracion',
      'cambio de ritmo',
      'cambio de direccion',
      'frenar',
      'desplazamiento',
    ])
  ) {
    const sprint5 = measurements.filter((m: any) => m.type === 'sprint_5m').slice(-1)[0];
    const sprint10 = measurements.filter((m: any) => m.type === 'sprint_10m').slice(-1)[0];
    const speedTrend = trends.find((t: any) => t.metricType?.startsWith('sprint'));

    const reply =
      `**Velocidad, Primer Paso y Agilidad en Cancha:**\n\n` +
      (sprint5 || sprint10
        ? `**Tus registros actuales:** ${sprint5 ? `Sprint 5m: **${sprint5.result} ${sprint5.unit}** (${sprint5.date})` : ''} ${sprint10 ? `| Sprint 10m: **${sprint10.result} ${sprint10.unit}** (${sprint10.date})` : ''}\n\n`
        : `Todavía no hay suficientes tests cronometrados de 5m/10m para trazar una curva, pero podés registrarlos en Estadísticas.\n\n`) +
      `**Cómo mejorar tu primer paso y aceleración en básquetbol:**\n` +
      `• **Postura e inclinación (Primeros 3 pasos):** Bajá el centro de gravedad antes de salir. El pecho apunta hacia adelante (45°), empujando el piso hacia atrás con fuerza en lugar de dar pasos cortos hacia arriba.\n` +
      `• **Fuerza horizontal y frenado:** Saltos horizontales (Broad Jumps), estocadas con empuje rápido y desaceleraciones a 1 pie (para frenar seco y cambiar de dirección sin perder equilibrio).\n` +
      `• **Salidas reactivas con balón:** 4-6 sprints cortos de 5 a 10 metros desde triple amenaza o salida cruzada con recuperación completa (60-90 seg entre pasadas).\n` +
      (speedTrend && speedTrend.confidenceWarning ? `\n*Nota estadística:* ${speedTrend.confidenceWarning}` : '');

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 3. TIRO, TRIPLES, MECÁNICA Y EFECTIVIDAD
  if (
    includesAny(q, [
      'tiro',
      'triple',
      'lanzamiento',
      'efectividad',
      'porcentaje',
      'libre',
      'catch',
      'mecanica',
      'errando',
      'meterla',
    ])
  ) {
    const accText =
      shooting && shooting.accuracyPct !== null
        ? `En tus registros de patio llevás **${shooting.makes}/${shooting.attempts} (${shooting.accuracyPct}%)** en ${shooting.sessions} sesiones.`
        : `Aún no registraste suficientes series cuantificadas (aciertos/intentos) en Técnica Individual.`;

    const reply =
      `**Análisis y Mejora de Tiro (${athleteName}):**\n\n` +
      `${accText}\n\n` +
      `**Claves prácticas para elevar tu efectividad en partido (U17/U21):**\n` +
      `• **Base y ritmo de pies antes de recibir:** En *catch & shoot*, llegá con los pies armados (1-2 o salto simultáneo) y la cadera cargada *antes* de que la pelota toque tus manos.\n` +
      `• **Transferencia vertical limpia:** Evitá lanzar hacia atrás o abrir los codos. El codo apunta al aro, la pelota sube por la línea del hombro y la muñeca termina suelta ("follow through" mantenido hasta que la pelota toque el aro).\n` +
      `• **Práctica con fatiga y tiempo real:** Combiná series de 50-100 tiros en el patio registrando aciertos/intentos separados por zona (esquinas, 45°, libres y tras drible) para medir progreso real sin mezclar distancias.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 4. MANO IZQUIERDA, DRIBLE Y FINALIZACIONES
  if (
    includesAny(q, [
      'mano izquierda',
      'zurda',
      'no habil',
      'drible',
      'dribling',
      'manejo',
      'bandeja',
      'finaliz',
      'aro',
      'penetr',
    ])
  ) {
    const leftHandObs = weaknesses.find(
      (w: any) => w.id?.includes('left-hand') || String(w.title || '').toLowerCase().includes('mano izquierda')
    );

    const reply =
      `**Desarrollo de Mano Izquierda, Drible y Finalizaciones:**\n\n` +
      (leftHandObs
        ? `• **Estado en tus datos:** ${leftHandObs.backingData}. *No significa que seas malo con la izquierda, sino que falta registrarlo para medir evolución.*\n\n`
        : `• **Estado en tus datos:** Tenés actividad técnica cargada; recordar anotar aciertos por perfil en Técnica Individual nos permite medir tu avance real con la mano no hábil.\n\n`) +
      `**Drills concretos para ganar confianza con mano izquierda:**\n` +
      `1. **Mikan & Reverse Mikan solo con izquierda:** 2 series de 20 conversiones seguidas buscando tablero alto y toque suave.\n` +
      `2. **Finalizaciones con contacto / ángulo cerrado:** Bandeja extendida, *floater* a 1 pie y finalización por lado izquierdo usando el cuerpo para proteger la pelota.\n` +
      `3. **Salida de ataque por perfil izquierdo:** Drible agresivo de 1-2 piques largos atacando la cadera del defensor y frenando en 1 o 2 tiempos.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 5. FUERZA, GIMNASIO Y PREPARACIÓN FÍSICA
  if (
    includesAny(q, [
      'fuerza',
      'gym',
      'gimnasio',
      'pesas',
      'trap bar',
      'sentadilla',
      'musculo',
      'pecho',
      'pierna',
      'core',
      'abdomen',
    ])
  ) {
    const trapBar = measurements.filter((m: any) => m.type === 'trap_bar_deadlift').slice(-1)[0];
    const reply =
      `**Fuerza y Preparación Física en ${club}:**\n\n` +
      (trapBar
        ? `• **Última marca de fuerza:** Trap Bar Deadlift **${trapBar.result} ${trapBar.unit}** (${trapBar.date}).\n`
        : `• Podés registrar tus marcas de Trap Bar Deadlift, Press Banca y Dominadas en la pestaña *Tests* de Estadísticas.\n`) +
      `\n**Cómo potenciar el gimnasio para transferirlo a la cancha:**\n` +
      `• **Tren inferior (Base de salto y defensa):** Trap Bar, sentadilla y trabajo a una pierna (búlgaras, step-ups). Bajada controlada y subida explosiva.\n` +
      `• **Core anti-rotación (Contacto U17/U21):** Planchas con desplazamiento, Pallof press y giros controlados para absorber choques en penetraciones sin perder el eje.\n` +
      `• **Tren superior funcional:** Remos, dominadas y press equilibran hombros y espalda para rebotes y pases largos.\n` +
      `• *Regla IACC:* Respetá siempre la progresión de cargas asignada por el preparador físico del club.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 6. DEFENSA, REBOTE Y LECTURA DE JUEGO
  if (includesAny(q, ['defensa', 'defender', 'rebote', 'robo', 'tapon', 'lectura', 'tactica', 'juego', 'pase'])) {
    const reply =
      `**Rendimiento Defensivo, Rebote y Lectura de Juego (${category}):**\n\n` +
      `En categorías competitivas de Instituto (y especialmente cuando subís a entrenar con U21), la defensa y la lectura sin balón definen minutos en cancha:\n\n` +
      `• **Postura y primer deslizamiento:** Cadera baja, pecho activo y pies rápidos sin cruzarlos. El primer paso defensivo lateral contiene la penetración sin hacer falta con las manos.\n` +
      `• **Cierre de rebote (Box Out):** Apenas sale el tiro rival, buscá contacto con antebrazo/cadera antes de mirar la pelota; tu salto vertical hace el resto en el segundo esfuerzo.\n` +
      `• **Comunicación constante:** Hablar en los bloqueos ("cambio", "seguilo", "ayuda") ordena al equipo y te mantiene conectado mentalmente incluso si un tiro no entró.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 7. CARGA SEMANAL, FATIGA, DOLORES Y PREVENCIÓN
  if (includesAny(q, ['carga', 'semana', 'fatiga', 'srpe', 'cansado', 'dolor', 'molestia', 'rodilla', 'tobillo', 'lesion'])) {
    const alerts = workload.informativeAlerts || [];
    const reply =
      `**Análisis de Carga Semanal Real (Método Foster sRPE) y Prevención:**\n\n` +
      `• **Volumen semanal:** ${workload.totalMinutes || 0} minutos en ${workload.totalSessions || 0} sesiones completadas.\n` +
      `• **Carga interna acumulada:** ${workload.totalLoadAU || 0} AU (Duración × RPE).\n` +
      `• **RPE medio:** ${workload.averageRpe || 0}/10 | **Distribución:** ${workload.technicalMinutes || 0} min técnicos vs ${workload.physicalMinutes || 0} min físicos.\n` +
      `• **Sueño y fatiga:** ${workload.sleepLoadCorrelationNote || 'Sin registros completos de sueño esta semana'}.\n\n` +
      (alerts.length > 0
        ? `**Alertas informativas detectadas:**\n${alerts.map((a: any) => `• *${a.title}:* ${a.description}`).join('\n')}\n\n`
        : '') +
      `**Cuidado preventivo:** Si sentís molestia puntual en rodillas (tendón rotuliano), tobillos o gemelos, evitá sumar saltos extra por tu cuenta y avisá al cuerpo médico/PF de Instituto. *(Este análisis monitorea carga, no reemplaza evaluación médica).*`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 8. RECUPERACIÓN, SUEÑO, HIDRATACIÓN Y NUTRICIÓN DEPORTIVA
  if (includesAny(q, ['sueno', 'dormir', 'descanso', 'recuper', 'comer', 'alimentacion', 'nutricion', 'hidrat', 'agua', 'proteina', 'comida'])) {
    const reply =
      `**Recuperación, Sueño y Combustible Deportivo (${athleteName}):**\n\n` +
      `Entrenando en doble estímulo (equipo + gimnasio/técnica a los 16 años), la recuperación es donde realmente se asimila la fuerza y el salto:\n\n` +
      `• **Sueño (Prioridad #1):** Apuntá a **8 a 9 horas por noche**. Dormir menos de 7 horas reduce la potencia del salto, la velocidad de reacción y la precisión de tiro al día siguiente.\n` +
      `• **Hidratación:** Llevá botella propia a cada práctica en Instituto; reponé líquido antes, durante y después (orina clara = buena hidratación).\n` +
      `• **Pre y Post Entrenamiento:** Carbohidratos de fácil digestión 60-90 min antes de entrenar (banana, tostadas, avena) para sostener intensidad, y proteína + carbohidratos dentro de la hora posterior para reparar fibra muscular.\n` +
      `• **Descarga activa:** Movilidad de cadera y tobillo de 10 minutos post-práctica acelera la recuperación para el día siguiente.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 9. FORTALEZA MENTAL, FRUSTRACIÓN, ENOJO Y CONFIANZA
  if (includesAny(q, ['motiv', 'enoj', 'bajon', 'mal', 'frustr', 'nervio', 'miedo', 'presion', 'confianza', 'cabeza', 'mental', 'caliente'])) {
    const reply =
      `**Fortaleza Mental & Manejo de la Frustración (${athleteName}):**\n\n` +
      `Que te enojes o frustres significa que te importa mejorar y competir en serio en Instituto. La clave no es no sentir bronca, sino **qué tan rápido volvés a la siguiente jugada**:\n\n` +
      `1. **Reset fisiológico en 6 segundos:** Inhalá profundo 4s, sostené 2-4s, soltá largo 4-6s. Baja la pulsación y te devuelve visión periférica en cancha.\n` +
      `2. **Regla de la Siguiente Posesión:** Un error (un tiro errado, una pérdida o un choque en U21) dura 3 segundos. Apenas pasa, sprint a balance defensivo, hablá fuerte en defensa o pedí un pase simple para recuperar ritmo.\n` +
      `3. **Tu historia en datos:** Tenés **${context?.activitiesCount || 0} sesiones registradas** de esfuerzo real. Un mal día no borra semanas de gimnasio, técnica y entrenamiento.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 10. U17 vs U21 E INSTITUTO
  if (includesAny(q, ['u17', 'u21', 'instituto', 'sandrin', 'partido', 'minutos', 'entrenador', 'dt'])) {
    const reply =
      `**Transición U17 / U21 en Instituto ACC:**\n\n` +
      `Entrenar en tu categoría base (U17) y sumar prácticas o citaciones con U21 acelera muchísimo tu techo competitivo:\n\n` +
      `• **Diferencia de ritmo:** En U21 el contacto físico y la velocidad de lectura son mayores (suele reflejarse en +1.5 a +2 puntos de RPE). No te compares en fuerza bruta todavía: compensá con **intensidad defensiva, toma rápida de decisiones, buen spacing y tiros abiertos sin dudar**.\n` +
      `• **Control de carga:** Diferenciá siempre U17 y U21 al registrar tus prácticas en COURTSIDE para detectar semanas con doble exigencia.`;

    return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
  }

  // 11. DEBILIDADES / DESEQUILIBRIOS
  if (includesAny(q, ['debilidad', 'desequilibrio', 'foco', 'falta', 'mejorar que'])) {
    if (weaknesses.length > 0) {
      const reply =
        `Analizando tus ${context?.activitiesCount || 0} registros cruzados en ${club}, estas son las observaciones prioritarias actuales:\n\n` +
        weaknesses
          .map(
            (w: any, idx: number) =>
              `**${idx + 1}. ${w.title}** (${String(w.kind || '').replace(/_/g, ' ').toUpperCase()})\n` +
              `• **Respaldo en datos:** ${w.backingData}\n` +
              `• **Relevancia:** ${w.whyRelevant}\n` +
              `• **Próximo paso:** ${w.followUpAction}`
          )
          .join('\n\n') +
        `\n\n*Nota:* Ninguna observación reemplaza las indicaciones del entrenador o preparador físico de Instituto.`;
      return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
    }
    return {
      reply: `¡Muy bien, ${athleteName}! No se observan desequilibrios críticos en tus registros recientes. Mantenés buena consistencia entre prácticas de ${category}, gimnasio y recuperación.`,
      model: 'courtside-sports-analytics-engine',
      isLocalFallback: true,
    };
  }

  // 12. OBJETIVOS CON EVIDENCIA
  if (includesAny(q, ['objetivo', 'meta'])) {
    if (goals.length > 0) {
      const reply =
        `**Estado de tus Objetivos Vinculados con Evidencia:**\n\n` +
        goals
          .map(
            (g: any) =>
              `• **${g.title}:** ${g.statusLabel} (${g.progressPercentage !== undefined ? g.progressPercentage + '% de avance' : 'En seguimiento'})\n` +
              `  *Última medición:* ${g.latestValue !== undefined ? g.latestValue + ' ' + (g.unit || '') : 'Sin medición aún'} | *Evidencia:* ${g.evidenceSummary}`
          )
          .join('\n\n');
      return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
    }
    return {
      reply: `Todavía no configuraste objetivos activos. Podés crear metas de salto CMJ, con brazos, a un pie, sprint o tiro en la pestaña **Objetivos**.`,
      model: 'courtside-sports-analytics-engine',
      isLocalFallback: true,
    };
  }

  // 13. COMPARACIÓN DE PERÍODOS
  if (includesAny(q, ['compar', 'mes anterior', 'cuatro semanas', 'periodo'])) {
    const comp = context?.periodComparisonSummary;
    if (comp && comp.periodAName) {
      const reply =
        `**Comparación entre Períodos (${comp.periodAName} vs ${comp.periodBName}):**\n\n` +
        `1. **Volumen:** ${comp.minsA || 0} min (${comp.actsA || 0} sesiones) vs ${comp.minsB || 0} min (${comp.actsB || 0} sesiones).\n` +
        `2. **Recuperación:** Sueño ${comp.sleepA || 'N/A'} hs vs ${comp.sleepB || 'N/A'} hs | RPE ${comp.rpeA || 'N/A'}/10 vs ${comp.rpeB || 'N/A'}/10.\n` +
        (comp.disparityNote ? `\n*Nota metodológica:* ${comp.disparityNote}` : '');
      return { reply, model: 'courtside-sports-analytics-engine', isLocalFallback: true };
    }
  }

  // 14. RESPUESTA ABIERTA E INTELIGENTE PARA CUALQUIER OTRA PREGUNTA
  const cmjText = jb?.cmjLatest ? `CMJ ${jb.cmjLatest.result} cm` : 'CMJ sin registrar';
  const armsText = jb?.armsLatest ? `Con brazos ${jb.armsLatest.result} cm` : 'Salto con brazos sin registrar';
  const topWeakness = weaknesses[0]?.title ? `• **Prioridad detectada:** ${weaknesses[0].title}\n` : '';

  const openReply =
    `Hola ${athleteName}, analicé tu consulta *"${userQuery}"* cruzándola con tu estado actual en **COURTSIDE** (${club} — ${category}):\n\n` +
    `**Tu panorama actual:**\n` +
    `• **Sesiones esta semana:** ${workload.totalSessions || 0} sesiones (${workload.totalMinutes || 0} min | Carga ${workload.totalLoadAU || 0} AU)\n` +
    `• **Saltos:** ${cmjText} | ${armsText}\n` +
    (shooting?.accuracyPct !== null && shooting?.accuracyPct !== undefined
      ? `• **Efectividad de tiro:** ${shooting.accuracyPct}% (${shooting.makes}/${shooting.attempts})\n`
      : '') +
    topWeakness +
    `\n**¿Cómo querés que avancemos con esto?** Podés preguntarme libremente sobre lo que necesites — por ejemplo:\n` +
    `• Planes o ejercicios concretos para mejorar el **salto CMJ, con brazos o a un pie**\n` +
    `• Técnica de **tiro, mano izquierda, primer paso o defensa**\n` +
    `• Análisis de **asimetrías, fatiga, recuperación, alimentación o manejo de la frustración**`;

  return {
    reply: openReply,
    model: 'courtside-sports-analytics-engine',
    isLocalFallback: true,
  };
}
