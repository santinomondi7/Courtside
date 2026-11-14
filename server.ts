import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const SYNC_FILE = path.join(DATA_DIR, 'sync-store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSyncStore(): Record<string, any> {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const content = fs.readFileSync(SYNC_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading sync store:', err);
  }
  return {};
}

function saveSyncStore(store: Record<string, any>) {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing sync store:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Global CORS and Preflight handling for cross-origin, mobile, and desktop PWA access
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (_req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Route: Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: Get cloud sync payload by sync code
  app.get('/api/sync/:syncCode', (req, res) => {
    const syncCode = req.params.syncCode.trim().toUpperCase();
    const store = loadSyncStore();
    const record = store[syncCode];

    if (!record) {
      return res.status(404).json({
        found: false,
        message: 'No se encontraron datos para este código de sincronización.',
      });
    }

    res.json({
      found: true,
      data: record.data,
      updatedAt: record.updatedAt,
      version: record.version || 1,
    });
  });

  // API Route: Save / update cloud sync payload
  app.post('/api/sync/:syncCode', (req, res) => {
    const syncCode = req.params.syncCode.trim().toUpperCase();
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Faltan los datos a sincronizar.' });
    }

    const store = loadSyncStore();
    store[syncCode] = {
      data,
      updatedAt: new Date().toISOString(),
      version: (store[syncCode]?.version || 0) + 1,
    };
    saveSyncStore(store);

    res.json({
      success: true,
      updatedAt: store[syncCode].updatedAt,
      version: store[syncCode].version,
    });
  });

  // API Route: Basketball Performance Analyst (Diagnostic check)
  app.get('/api/analyst/chat', (_req, res) => {
    res.json({
      status: 'ok',
      endpoint: '/api/analyst/chat',
      ready: true,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // API Route: Basketball Performance Analyst (IA con Gemini + Contexto Deportivo Real)
  app.post('/api/analyst/chat', async (req, res) => {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de mensajes válida.' });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Preset routine fallback reference if not explicitly included by older clients
    const defaultPresetRoutinesReference = [
      {
        title: 'SESIÓN A: Salto bilateral + arranque + empuje/tirón (Físico en Casa, ~75 min)',
        blocks:
          'Calentamiento 15 min (movilidad tobillo/cadera/escapular, soga 5 min, conos 6 min). ' +
          'Pliometría 18 min: Salto al cajón 3x4 (90s), Drop jump 25cm 3x4 (<0.2s contacto, 2min), Pogo jumps 2x10 (60s). ' +
          'Fuerza+Core 30 min pares alternados: 1a Sentadilla búlgara 3x6/pierna (4s bajada, subida explosiva, RIR 2) + 1b Dominada explosiva prona 3x4-5; ' +
          '2a Peso muerto 1 pierna 3x8/pierna (3-1-1) + 2b Flexión con palmada 3x5; ' +
          '3a Rueda abdominal rodillas 2x6-10 + 3b Dead bug 2x8/lado. ' +
          'Velocidad 12 min: Arranques lineales 4m 3x5, Sprint 3m+frenada 2 pasos+arranque 3m 3x3, Deslizamientos defensivos 2.5m 3x8s. Vuelta a la calma.',
      },
      {
        title: 'SESIÓN B: Unilateral + cambios de dirección (Físico en Casa, ~75 min)',
        blocks:
          'Calentamiento 15 min. ' +
          'Pliometría 18 min: Subida al cajón a 1 pierna 3x3/pierna (90s), Bajada 25cm y aterrizaje a 1 pierna 2x4/pierna (60s), Saltos laterales patinador 3x5/lado (1m amplitud, 60s), Pogo a 1 pierna 2x8/pierna (60s). ' +
          'Fuerza+Core 30 min pares alternados: 1a Pistol squat a cajón 3x4/pierna (4s bajada, subida explosiva) + 1b Dominada supina pausa 2s arriba 3x5; ' +
          '2a Gemelo 1 pierna con cajón 3x10/pierna (3-1-X) + 2b Flexión declinada pies en cajón 3x6-8; ' +
          '3a Rueda abdominal 2x6-10 + 3b Plancha lateral con elevación de cadera 2x10/lado. ' +
          'Cambios de dirección 12 min: Shuttle 3 conos 3x4, Salida cruzada desde postura defensiva 3x3/lado, Desaceleración sprint 4m + frenada 2 pasos + salto al aro 3x4. Vuelta a la calma.',
      },
    ];

    const presetRoutinesForPrompt =
      Array.isArray(context?.presetRoutines) && context.presetRoutines.length > 0
        ? context.presetRoutines
        : defaultPresetRoutinesReference;

    // Build sports system prompt: open, thoughtful, versatile basketball performance coach & analyst grounded in real records
    const sportsSystemInstruction = `Sos "Basketball Performance Analyst", el analista de rendimiento deportivo y coach integral de básquetbol de COURTSIDE para Santino (16 años, jugador formativo de Instituto Atlético Central Córdoba - IACC, categorías U17 y U21).

TU PROPÓSITO (RAZONÁ EN PROFUNDIDAD Y NO TE CIERRES):
- Pensá y razoná con criterio técnico, biomecánico y táctico ante CUALQUIER pregunta que te haga Santino: ya sea sobre sus sesiones predeterminadas de Físico en Casa (Sesión A y Sesión B), gimnasio del club, entrenamientos U17/U21, cómo mejorar el salto (CMJ sin brazos, salto con brazos/Abalakov, saltos a un pie izquierdo y derecho, salto en carrera), primer paso, tiro, mano izquierda, defensa, recuperación, sueño, alimentación, mentalidad o cualquier duda deportiva general.
- MUY IMPORTANTE: Toda la información sobre sus **rutinas predeterminadas** (Sesión A, Sesión B de Físico en Casa con calentamiento, bloques de pliometría/fuerza/core/velocidad/cambios de dirección y Gimnasio IACC) YA ESTÁ abajo en el CONTEXTO DEPORTIVO VERIFICADO. **NUNCA le pidas a Santino que te escriba o pegue sus sesiones predeterminadas ni sus datos ya cargados**: analizalas directamente desde el contexto.
- Usá sus datos reales (sesiones cargadas, mediciones, metas, debilidades y carga) para personalizar el razonamiento. Si todavía falta alguna medición puntual (ej. salto a un pie o sesiones cargadas), respondé igual su pregunta con análisis completo y sugerí registrar ese dato para darle seguimiento.

REGLAS DE RIGOR Y VERACIDAD:
1. NUNCA inventes fechas, tests, puntajes, porcentajes o entrenamientos personales realizados que no figuren en el CONTEXTO DEPORTIVO VERIFICADO. Si citás una marca o sesión realizada por Santino, que sea exactamente la que figura en el contexto.
2. NUNCA contradigas ni reemplaces las indicaciones del director técnico o preparador físico de IACC ni des diagnósticos médicos: cuando sugieras ajustes de carga o pliometría, recomendá coordinarlo con el PF del club.
3. Diferenciá claramente: (a) sus datos reales medidos y rutinas predeterminadas cargadas en la app, (b) tu análisis/razonamiento técnico-deportivo aplicado y (c) falta de registros cuando un test aún no fue cargado.
4. En saltos, diferenciá bien los protocolos: CMJ sin brazos (potencia pura de piernas), Salto con Brazos / Abalakov (impulso de brazos, normalmente +10-15% sobre CMJ) y Saltos a Un Pie Izquierdo vs Derecho (despegue en carrera y control de asimetría bilateral <10%).
5. Mantené un tono cercano, claro, argentino, motivador y albirrojo (identidad de Instituto). Si expresa enojo o frustración, ayudalo a resetear mentalmente recordando que el progreso no es lineal.

CONTEXTO DEPORTIVO VERIFICADO DEL ATLETA:
- Atleta: ${context?.profile?.name || 'Santino'} (${context?.profile?.club || 'IACC'}, categoría ${context?.profile?.category || 'U17'})
- Altura: ${context?.profile?.heightCm || 187} cm | Peso: ${context?.profile?.weightKg || 77} kg | Envergadura: ${context?.profile?.wingspanCm || 191} cm | Mano hábil: ${context?.profile?.dominantHand || 'Derecha'}
- Totales registrados: ${context?.activitiesCount || 0} actividades, ${context?.measurementsCount || 0} mediciones físicas, ${context?.goalsCount || 0} objetivos
- Resumen por Categoría: ${JSON.stringify(context?.categorySummary || {})}
- Rutinas y Sesiones Predeterminadas en la App (Físico en Casa Sesión A/B y Gimnasio): ${JSON.stringify(presetRoutinesForPrompt)}
- Perfil de Saltos (CMJ / Con Brazos / 1 Pie): ${JSON.stringify(context?.jumpBreakdown || {})}
- Resumen de Tiro en Patio: ${JSON.stringify(context?.shootingSummary || {})}
- Resumen Carga Semanal Real: ${JSON.stringify(context?.weeklyWorkloadSummary || {})}
- Debilidades y Desequilibrios Detectados: ${JSON.stringify(context?.weaknesses || [])}
- Estimaciones de Tendencia: ${JSON.stringify(context?.trendEstimations || [])}
- Comparación de Períodos: ${JSON.stringify(context?.periodComparisonSummary || {})}
- Objetivos con Evidencia: ${JSON.stringify(context?.goalsEvidenceSummary || [])}
- Últimas 20 sesiones completadas (con ejercicios y detalles): ${JSON.stringify(context?.recentActivities || [])}
- Todas las Mediciones Físicas Reales: ${JSON.stringify(context?.measurements || [])}
`;

    // Attempt calling Gemini API via @google/genai
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        // Convert messages to valid contents array
        const rawTurns = messages.map((m: any) => ({
          role: (m.role === 'assistant' || m.role === 'model') ? ('model' as const) : ('user' as const),
          text: typeof m.content === 'string' ? m.content.trim() : JSON.stringify(m.content),
        })).filter(t => t.text.length > 0);

        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
        for (const turn of rawTurns) {
          if (contents.length === 0 && turn.role !== 'user') {
            continue;
          }
          const prev = contents[contents.length - 1];
          if (prev && prev.role === turn.role) {
            prev.parts[0].text += `\n\n${turn.text}`;
          } else {
            contents.push({ role: turn.role, parts: [{ text: turn.text }] });
          }
        }

        if (contents.length === 0) {
          contents.push({
            role: 'user',
            parts: [{ text: lastUserMessage || 'Hola' }],
          });
        }

        // Primary model with deep thinking + fast backup model (all valid active models)
        const candidateConfigs: Array<{ model: string; thinkingLevel: ThinkingLevel }> = [
          { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.HIGH },
          { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MEDIUM },
        ];
        let replyText: string | null = null;
        let successfulModel = '';

        for (const candidate of candidateConfigs) {
          try {
            const response = await ai.models.generateContent({
              model: candidate.model,
              contents,
              config: {
                systemInstruction: sportsSystemInstruction,
                thinkingConfig: {
                  thinkingLevel: candidate.thinkingLevel,
                },
              },
            });

            if (response.text) {
              replyText = response.text;
              successfulModel = candidate.model;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[Analyst API] Model ${candidate.model} error:`, modelErr?.message || modelErr);
          }
        }

        if (replyText) {
          return res.json({
            reply: replyText,
            model: successfulModel,
            isRealAI: true,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (geminiErr: any) {
        console.warn('[Analyst API] Gemini integration error:', geminiErr?.message || geminiErr);
      }
    }

    // Open & Multi-Domain Sports Analyst Fallback (when GEMINI_API_KEY is not set or quota/network fails)
    const q = String(lastUserMessage || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    const hasAny = (terms: string[]) => terms.some((t) => q.includes(t));

    let reply = '';
    const weaknesses = context?.weaknesses || [];
    const workload = context?.weeklyWorkloadSummary || {};
    const trends = context?.trendEstimations || [];
    const goals = context?.goalsEvidenceSummary || [];
    const measurements = context?.measurements || [];
    const jb = context?.jumpBreakdown || {};
    const shooting = context?.shootingSummary || {};
    const athleteName = context?.profile?.name || 'Santino';

    if (
      hasAny([
        'fisico en casa',
        'predeterminad',
        'sesion a',
        'sesion b',
        'sesiones en casa',
        'rutina en casa',
        'plan en casa',
      ])
    ) {
      const homeCount = context?.categorySummary?.homePhysicalSessions ?? 0;
      reply =
        `**Análisis de tus Sesiones Predeterminadas de Físico en Casa (${athleteName}):**\n\n` +
        `• **Sesión A (Salto bilateral + arranque + empuje/tirón, ~75 min):** Incluye calentamiento (15 min), Pliometría (*Salto al cajón 3x4*, *Drop jump 25 cm 3x4 <0.2s*, *Pogo jumps 2x10*), Fuerza+Core en pares (*Búlgaras 4s bajada / subida explosiva*, *Dominada prona*, *Peso muerto a 1 pierna*, *Flexión con palmada*, *Rueda + Dead bug*) y Velocidad (*Arranques 4m*, *Sprint+frenada*, *Deslizamientos defensivos*).\n` +
        `• **Sesión B (Unilateral + cambios de dirección, ~75 min):** Pliometría unilateral (*Subida al cajón 1 pierna*, *Aterrizaje 1 pierna desde 25cm*, *Patinadores*, *Pogo 1 pierna*), Fuerza+Core (*Pistol squat a cajón*, *Dominada supina*, *Gemelo 1 pierna*, *Flexión declinada*, *Plancha lateral*) y Cambios de dirección (*Shuttle 3 conos*, *Salida cruzada*, *Desaceleración con salto al aro*).\n` +
        `• **Registros completados en tu historial:** ${homeCount} sesiones de Físico en Casa.\n\n` +
        `**Balance técnico:** La combinación de Sesión A (potencia elástica bilateral y salida lineal) + Sesión B (control unilateral y frenado) está muy bien orientada al básquet U17/U21. Asegurate de no hacerlas con las piernas muy cargadas tras doble turno en IACC y coordinar el volumen de saltos con el PF del club.`;
    } else if (
      hasAny([
        'salto',
        'saltar',
        'cmj',
        'abalakov',
        'un pie',
        'una pierna',
        'unipodal',
        'volcar',
        'despegue',
        'pliometria',
        'asimetria',
      ])
    ) {
      const parts: string[] = [];
      if (jb.cmjLatest) parts.push(`• **CMJ (sin brazos):** ${jb.cmjLatest.result} cm (${jb.cmjLatest.date})`);
      if (jb.armsLatest) {
        const gainStr =
          jb.armGainCm !== null && jb.armGainCm !== undefined
            ? ` — aporte de brazos: ${jb.armGainCm >= 0 ? '+' : ''}${jb.armGainCm} cm (${jb.armGainPct}%)`
            : '';
        parts.push(`• **Salto con Brazos (Abalakov):** ${jb.armsLatest.result} cm (${jb.armsLatest.date})${gainStr}`);
      }
      if (jb.leftLegLatest || jb.rightLegLatest) {
        const asym =
          jb.singleLegAsymmetryPct !== null && jb.singleLegAsymmetryPct !== undefined
            ? ` — asimetría bilateral: **${jb.singleLegAsymmetryPct}%**`
            : '';
        parts.push(
          `• **Saltos a Un Pie:** Izquierda ${jb.leftLegLatest ? jb.leftLegLatest.result + ' cm' : 'sin registro'} | Derecha ${jb.rightLegLatest ? jb.rightLegLatest.result + ' cm' : 'sin registro'}${asym}`
        );
      }
      if (jb.approachLatest) parts.push(`• **Salto en Carrera:** ${jb.approachLatest.result} cm (${jb.approachLatest.date})`);

      const dataHeader =
        parts.length > 0
          ? `**Tus registros actuales de salto:**\n${parts.join('\n')}`
          : `**Tus registros:** Aún podés cargar tus tests de CMJ, Salto con Brazos y Saltos a Un Pie en Estadísticas para ir midiendo cada avance.`;

      reply =
        `**Guía Práctica y Análisis de Salto Vertical (${athleteName}):**\n\n` +
        `${dataHeader}\n\n` +
        `**Cómo mejorar el salto de forma real y segura:**\n` +
        `1. **Fuerza explosiva en gimnasio (IACC):** Trap Bar Deadlift, sentadilla y búlgaras con **subida lo más rápida posible** (3-4 series de 3-5 repeticiones).\n` +
        `2. **Pliometría de calidad (fresco, nunca fatigado):** *Pogo jumps* (3x10 rebotes cortos de tobillo), saltos al cajón o al aro a máxima intensidad con 90 seg de pausa entre series.\n` +
        `3. **Uso de brazos (Abalakov):** Llevá los brazos atrás en el descenso y lanzalos explosivamente arriba sincronizados con la extensión de cadera y tobillos (suele sumar +10% a +15% respecto al CMJ sin brazos).\n` +
        `4. **Despegue a un pie y simetría:** Trabajá saltos unipodales y subidas rápidas al cajón empezando por la pierna más débil para mantener la asimetría por debajo del 10%.\n` +
        `5. **Descanso:** Dormí 8+ horas y coordiná cualquier bloque pliométrico extra con el PF de Instituto.`;
    } else if (hasAny(['velocidad', 'sprint', 'rapido', 'primer paso', 'agilidad', 'aceleracion'])) {
      reply =
        `**Cómo mejorar tu Velocidad y Primer Paso:**\n\n` +
        `• **Inclinación en salida:** En los primeros 3 pasos, bajá el centro de gravedad e incliná el torso hacia adelante (~45°) empujando el suelo hacia atrás.\n` +
        `• **Potencia horizontal y frenado:** Broad Jumps (salto horizontal), estocadas explosivas y frenadas a un pie para cambiar de dirección más rápido.\n` +
        `• **Sprints cortos:** 4-6 pasadas de 5m a 10m desde postura de triple amenaza con recuperación completa (60-90s).`;
    } else if (hasAny(['tiro', 'triple', 'lanzamiento', 'efectividad', 'porcentaje', 'libre', 'mecanica'])) {
      const accMsg =
        shooting?.accuracyPct !== null && shooting?.accuracyPct !== undefined
          ? `En tus registros de patio llevás **${shooting.makes}/${shooting.attempts} (${shooting.accuracyPct}%)** en ${shooting.sessions} sesiones.`
          : `Podés anotar aciertos e intentos por zona en Técnica Individual para medir tu porcentaje real.`;
      reply =
        `**Mejora de Tiro y Efectividad (${athleteName}):**\n\n` +
        `${accMsg}\n\n` +
        `• **Pies armados antes de recibir:** Cargá cadera y alineá los pies *antes* de que llegue el pase.\n` +
        `• **Trayectoria limpia:** Codo alineado al aro, extensión fluida hacia arriba y muñeca relajada manteniendo el gesto hasta que toque el aro.\n` +
        `• **Volumen inteligente:** Separar series de tiros libres, triples estáticos y tras drible te permite detectar en qué situación bajás tu efectividad.`;
    } else if (hasAny(['mano izquierda', 'zurda', 'no habil', 'drible', 'manejo', 'bandeja', 'finaliz'])) {
      const leftHandObs = weaknesses.find((w: any) => w.id?.includes('left-hand'));
      reply =
        `**Trabajo de Mano Izquierda, Drible y Finalizaciones:**\n\n` +
        (leftHandObs
          ? `• **Dato en tu historial:** ${leftHandObs.backingData}. *Falta registro, no significa que sea una mala mano.*\n\n`
          : '') +
        `• **Drills recomendados:** Mikan y Reverse Mikan solo con izquierda (2x20), bandejas extendidas con contacto protegido por el cuerpo y salidas agresivas de 1-2 piques largos por el perfil izquierdo.`;
    } else if (hasAny(['fuerza', 'gym', 'gimnasio', 'pesas', 'trap bar', 'sentadilla', 'pierna', 'core'])) {
      reply =
        `**Fuerza Funcional en Gimnasio (IACC):**\n\n` +
        `• **Tren inferior:** Trap Bar, sentadilla y trabajo unilateral (búlgaras/step-ups) con intención explosiva en la fase concéntrica.\n` +
        `• **Core y estabilidad:** Planchas con desplazamiento y ejercicios anti-rotación para absorber contacto contra U17/U21.\n` +
        `• Respetá siempre las cargas y progresiones indicadas por el preparador físico de Instituto.`;
    } else if (hasAny(['defensa', 'defender', 'rebote', 'robo', 'tapon', 'lectura', 'tactica'])) {
      reply =
        `**Defensa, Rebote y Lectura de Juego:**\n\n` +
        `• **Postura y desplazamientos:** Cadera baja, pasos cortos sin cruzar los pies y manos activas en línea de pase.\n` +
        `• **Box Out:** Contacto inmediato con el atacante apenas sale el tiro antes de ir a buscar el rebote.\n` +
        `• **Comunicación:** Hablar en ayudas y bloqueos te mantiene enchufado en todo momento.`;
    } else if (hasAny(['sueno', 'dormir', 'descanso', 'recuper', 'comer', 'alimentacion', 'nutricion', 'hidrat', 'agua'])) {
      reply =
        `**Recuperación, Sueño y Nutrición Deportiva:**\n\n` +
        `• **Sueño:** Apuntá a 8-9 hs diarias; dormir poco reduce la potencia de salto y precisión de tiro.\n` +
        `• **Pre/Post entrenamiento:** Carbohidratos antes (banana, tostadas, avena) para energía + proteína y carbohidratos después para recuperar músculo.\n` +
        `• **Hidratación:** Tomá agua constante antes, durante y después de entrenar en Instituto.`;
    } else if (hasAny(['motiv', 'enoj', 'bajon', 'mal', 'frustr', 'nervio', 'confianza', 'cabeza', 'mental'])) {
      reply =
        `**Fortaleza Mental y Manejo de la Frustración:**\n\n` +
        `1. **Reset 4x4:** Respirá 4s adentro, sostené 4s, soltá en 4s para bajar pulsaciones cuando algo sale mal.\n` +
        `2. **Siguiente jugada:** El error dura 3 segundos; pasá rápido a sprint defensivo, comunicación o un pase simple.\n` +
        `3. **Perspectiva:** Ya tenés ${context?.activitiesCount || 0} sesiones acumuladas. Un mal día no borra tu proceso.`;
    } else if (hasAny(['debilidad', 'desequilibrio'])) {
      if (weaknesses.length > 0) {
        reply =
          `Analizando tus ${context?.activitiesCount || 0} registros deportivos cruzados, identifiqué las siguientes observaciones:\n\n` +
          weaknesses
            .map(
              (w: any, idx: number) =>
                `**${idx + 1}. ${w.title}** (${String(w.kind || '').replace(/_/g, ' ').toUpperCase()})\n` +
                `• **Datos que lo respaldan:** ${w.backingData}\n` +
                `• **Por qué es relevante:** ${w.whyRelevant}\n` +
                `• **Acción recomendada:** ${w.followUpAction}`
            )
            .join('\n\n') +
          `\n\n*Nota:* Ninguna observación reemplaza las indicaciones de los entrenadores de Instituto.`;
      } else {
        reply = `No se detectan desequilibrios marcados en tus registros recientes. Mantenés buena consistencia entre entrenamientos, gimnasio y descanso.`;
      }
    } else if (hasAny(['carga', 'semana', 'fatiga', 'srpe'])) {
      reply =
        `**Análisis de Carga Semanal Real (Método Foster sRPE):**\n\n` +
        `• **Volumen total:** ${workload.totalMinutes || 0} minutos en ${workload.totalSessions || 0} sesiones.\n` +
        `• **Carga interna:** ${workload.totalLoadAU || 0} AU | **RPE promedio:** ${workload.averageRpe || 0}/10.\n` +
        `• **Distribución:** ${workload.technicalMinutes || 0} min técnicos vs ${workload.physicalMinutes || 0} min físicos.\n` +
        `• **Sueño / Fatiga:** ${workload.sleepLoadCorrelationNote || 'Sin datos completos de sueño en la semana'}.`;
    } else if (hasAny(['u17', 'u21', 'instituto', 'club'])) {
      reply =
        `**Entrenamientos IACC (U17 vs U21):**\n\n` +
        `• En U21 el contacto y la velocidad de juego suelen elevar el RPE (+1.5 a +2.0 puntos). Compensá la diferencia física con intensidad defensiva, lectura rápida y tiro abierto.\n` +
        `• Diferenciar cada sesión como U17 o U21 en la app permite cuidar tu carga semanal.`;
    } else if (hasAny(['objetivo', 'meta'])) {
      if (goals.length > 0) {
        reply =
          `**Estado de Objetivos Vinculados con Evidencia:**\n\n` +
          goals
            .map(
              (g: any) =>
                `• **${g.title}:** ${g.statusLabel} (${g.progressPercentage !== undefined ? g.progressPercentage + '% de avance' : 'En seguimiento'}).\n` +
                `  *Último valor:* ${g.latestValue !== undefined ? g.latestValue + ' ' + (g.unit || '') : 'Sin medición'} | *Evidencia:* ${g.evidenceSummary}`
            )
            .join('\n\n');
      } else {
        reply = `No tenés objetivos deportivos activos configurados. Podés crearlos en el módulo de Objetivos.`;
      }
    } else if (hasAny(['compar', 'mes anterior', 'cuatro semanas'])) {
      const comp = context?.periodComparisonSummary;
      if (comp && comp.periodAName) {
        reply =
          `**Comparación entre Períodos (${comp.periodAName} vs ${comp.periodBName}):**\n\n` +
          `1. **Cantidad:** ${comp.minsA || 0} min (${comp.actsA || 0} sesiones) vs ${comp.minsB || 0} min (${comp.actsB || 0} sesiones).\n` +
          `2. **Recuperación:** Sueño ${comp.sleepA || 'N/A'} hs vs ${comp.sleepB || 'N/A'} hs; RPE ${comp.rpeA || 'N/A'} vs ${comp.rpeB || 'N/A'}.\n` +
          (comp.disparityNote ? `*Nota:* ${comp.disparityNote}` : '');
      } else {
        reply = `Podés ver la comparativa completa entre períodos de 1, 2 o 4 semanas en Estadísticas -> Comparar Períodos.`;
      }
    } else {
      const cmjStr = jb.cmjLatest ? `CMJ ${jb.cmjLatest.result} cm` : 'CMJ sin registrar';
      const armsStr = jb.armsLatest ? `Con brazos ${jb.armsLatest.result} cm` : 'Con brazos sin registrar';
      reply =
        `Hola ${athleteName}. Analicé tu consulta *"${lastUserMessage}"* junto a tu estado actual en COURTSIDE:\n\n` +
        `• **Esta semana:** ${workload.totalSessions || 0} sesiones (${workload.totalMinutes || 0} min | ${workload.totalLoadAU || 0} AU)\n` +
        `• **Saltos:** ${cmjStr} | ${armsStr}\n` +
        `• **Historial total:** ${context?.activitiesCount || 0} actividades, ${context?.measurementsCount || 0} mediciones y ${context?.goalsCount || 0} metas.\n\n` +
        `Podés preguntarme libremente lo que necesites: cómo mejorar el salto (CMJ, con brazos o a un pie), ejercicios de primer paso, tiro, mano izquierda, recuperación, nutrición o preparación mental.`;
    }

    return res.json({
      reply,
      model: 'courtside-sports-analytics-engine',
      isRealAI: false,
      timestamp: new Date().toISOString(),
    });
  });

  // Setup Vite middlewares in dev, or static files in prod
  const distPath = path.join(__dirname, 'dist');
  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });

    // When HMR is disabled in middlewareMode, Vite 8's @vite/client still attempts a
    // WebSocket connection to port 24678, throwing "WebSocket closed without opened.".
    // Skip only transport.connect() while keeping all client helpers (updateStyle, createHotContext, etc.).
    app.use('/@vite/client', (req, res, next) => {
      delete req.headers['accept-encoding'];
      const chunks: Buffer[] = [];
      const origWrite = res.write.bind(res);
      const origEnd = res.end.bind(res);

      res.write = ((chunk: any, encoding?: any, cb?: any) => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8'));
        }
        if (typeof encoding === 'function') encoding();
        else if (typeof cb === 'function') cb();
        return true;
      }) as any;

      res.end = ((chunk?: any, encoding?: any, cb?: any) => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === 'string' ? (encoding as BufferEncoding) : 'utf8'));
        }
        const callback = typeof encoding === 'function' ? encoding : cb;
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode === 200 && raw.includes('transport.connect(')) {
          const patched = raw.replace(
            /transport\.connect\(createHMRHandler\(handleMessage\)\);?/g,
            '/* HMR disabled: WebSocket skipped */'
          );
          res.removeHeader('Content-Length');
          res.removeHeader('ETag');
          res.setHeader('Content-Length', Buffer.byteLength(patched, 'utf8'));
          return callback ? origEnd(patched, 'utf8', callback) : origEnd(patched, 'utf8');
        }
        if (chunks.length > 0) {
          const buf = Buffer.concat(chunks);
          return callback ? origEnd(buf, callback) : origEnd(buf);
        }
        return callback ? origEnd(callback) : origEnd();
      }) as any;

      void origWrite;
      next();
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`COURTSIDE Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start COURTSIDE server:', err);
  process.exit(1);
});
