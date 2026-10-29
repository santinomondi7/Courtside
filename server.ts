import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

  // API Route: Basketball Performance Analyst (IA con Gemini + Contexto Deportivo Real)
  app.post('/api/analyst/chat', async (req, res) => {
    const { messages, context } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de mensajes válida.' });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Build sports system prompt with verified ground truth
    const sportsSystemInstruction = `Sos "Basketball Performance Analyst", un asistente de inteligencia artificial y analista de rendimiento deportivo integrado exclusivamente en COURTSIDE para Santino (16 años, jugador formativo en Instituto Atlético Central Córdoba - IACC).

REGLAS DE ORO OBLIGATORIAS:
1. Actuá como un analista de datos deportivos riguroso, empático y constructivo. NO sos el director técnico ni el preparador físico de IACC, ni un profesional médico: NUNCA contradigas las indicaciones de los entrenadores del club.
2. Basate EXCLUSIVAMENTE en los registros reales provistos en el CONTEXTO DEPORTIVO VERIFICADO. NUNCA inventes números, partidos o estadísticas que no figuren en los datos.
3. CITÁ SIEMPRE FECHAS, SESIONES, MEDICIONES O PERÍODOS concretos que respaldan tus conclusiones (por ejemplo: "En tu test del 24 de Octubre registraste 73 cm...", "En las últimas 4 semanas sumaste 1.420 minutos...").
4. Diferenciá claramente entre:
   - Observaciones comprobadas (datos reales medidos).
   - Hipótesis o interpretaciones (posibles explicaciones tácticas o fisiológicas).
   - Estimaciones de tendencia (proyecciones orientativas, aclarando el margen de incertidumbre).
5. DIFERENCIÁ UNA DEBILIDAD REAL DE UNA FALTA DE REGISTROS: Si Santino no anotó lanzamientos o entradas con mano izquierda, NO afirmes que es malo con esa mano; señalá que no hay registros suficientes para evaluarla.
6. Si una pregunta no cuenta con datos suficientes para responderse, declaralo de forma explícita y explicá qué medición o registro permitiría responderla.
7. Mantené un tono profesional, alentador y albirrojo (identidad de Instituto).

CONTEXTO DEPORTIVO VERIFICADO DEL ATLETA:
- Atleta: ${context?.profile?.name || 'Santino'} (${context?.profile?.club || 'IACC'}, categoría ${context?.profile?.category || 'U17'})
- Altura: ${context?.profile?.heightCm || 187} cm | Peso: ${context?.profile?.weightKg || 77} kg | Envergadura: ${context?.profile?.wingspanCm || 191} cm | Mano hábil: ${context?.profile?.dominantHand || 'Derecha'}
- Total de actividades registradas: ${context?.activitiesCount || 0}
- Total de mediciones físicas: ${context?.measurementsCount || 0}
- Total de objetivos activos: ${context?.goalsCount || 0}
- Resumen Carga Semanal Real: ${JSON.stringify(context?.weeklyWorkloadSummary || {})}
- Debilidades y Desequilibrios Detectados: ${JSON.stringify(context?.weaknesses || [])}
- Estimaciones de Tendencia (Salto/Velocidad): ${JSON.stringify(context?.trendEstimations || [])}
- Comparación de Períodos: ${JSON.stringify(context?.periodComparisonSummary || {})}
- Objetivos con Evidencia: ${JSON.stringify(context?.goalsEvidenceSummary || [])}
- Últimas 8 sesiones completadas: ${JSON.stringify(context?.recentActivities || [])}
- Récords y Mediciones Reales: ${JSON.stringify(context?.measurements || [])}
`;

    // Attempt calling Gemini API via @google/genai
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI();

        // Convert messages to contents format
        const contents = messages.map((m: any) => ({
          role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: sportsSystemInstruction,
            temperature: 0.25,
          },
        });

        const replyText = response.text || 'No se obtuvo una respuesta del analista.';
        return res.json({
          reply: replyText,
          model: 'gemini-3.8-flash',
          isRealAI: true,
          timestamp: new Date().toISOString(),
        });
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to deterministic sports analyst:', geminiErr?.message);
      }
    }

    // Deterministic Sports Analyst Fallback (when GEMINI_API_KEY is not set or failed)
    // Computes ground-truth answers directly from the sports analytics payload
    const qLower = lastUserMessage.toLowerCase();
    let reply = '';
    const weaknesses = context?.weaknesses || [];
    const workload = context?.weeklyWorkloadSummary || {};
    const trends = context?.trendEstimations || [];
    const goals = context?.goalsEvidenceSummary || [];
    const recentActs = context?.recentActivities || [];

    if (qLower.includes('debilidad') || qLower.includes('desequilibrio')) {
      if (weaknesses.length > 0) {
        reply = `Analizando tus ${context?.activitiesCount || 0} registros deportivos cruzados, identifiqué las siguientes observaciones prioritarias:\n\n` +
          weaknesses.map((w: any, idx: number) =>
            `**${idx + 1}. ${w.title}** (${w.kind.replace(/_/g, ' ').toUpperCase()})\n` +
            `• **Datos que lo respaldan:** ${w.backingData}\n` +
            `• **Por qué es relevante:** ${w.whyRelevant}\n` +
            `• **Acción recomendada:** ${w.followUpAction}`
          ).join('\n\n') +
          `\n\n*Nota de rigor:* Ninguna de estas observaciones reemplaza la planificación de los entrenadores de Instituto.`;
      } else {
        reply = `No detectamos desequilibrios marcados en tus registros recientes. Mantenés una distribución consistente entre prácticas de equipo, gimnasio y descanso.`;
      }
    } else if (qLower.includes('mano izquierda') || qLower.includes('zurda')) {
      const leftHandObs = weaknesses.find((w: any) => w.id?.includes('left-hand'));
      if (leftHandObs) {
        reply = `**Evaluación de Mano Izquierda:**\n\n` +
          `Actualmente **no hay registros suficientes de finalizaciones o entradas con mano izquierda** en tus últimos 60 días (${leftHandObs.backingData}).\n\n` +
          `*Aclaración importante:* Esto no significa que tengas un mal desempeño con la mano izquierda, sino que no existe evidencia cuantificada en la app para medir tu efectividad real.\n\n` +
          `**Sugerencia práctica:** En tu próxima práctica individual en el patio, registrá una serie de 20 tiros o bandejas con mano no hábil para crear una marca de referencia.`;
      } else {
        reply = `Tenés sesiones con mención de trabajo técnico registrada. Para evaluar tu evolución con mano izquierda con precisión estadística, te sugiero anotar los aciertos e intentos específicos de cada perfil en el módulo de Técnica Individual.`;
      }
    } else if (qLower.includes('carga') || qLower.includes('semana') || qLower.includes('fatiga')) {
      reply = `**Análisis de Carga Semanal Real (Método Foster sRPE):**\n\n` +
        `• **Volumen total:** ${workload.totalMinutes || 0} minutos en ${workload.totalSessions || 0} sesiones completadas.\n` +
        `• **Carga interna acumulada:** ${workload.totalLoadAU || 0} AU (Unidades Arbitrarias).\n` +
        `• **Esfuerzo percibido promedio (RPE):** ${workload.averageRpe || 0}/10.\n` +
        `• **Distribución Técnico/Físico:** ${workload.technicalMinutes || 0} min técnicos vs ${workload.physicalMinutes || 0} min físicos (${workload.technicalVsPhysicalRatio || 'Equilibrado'}).\n` +
        `• **Relación Sueño / Fatiga:** ${workload.sleepLoadCorrelationNote || 'Sin datos suficientes de sueño en la semana'}.\n\n` +
        (workload.informativeAlerts && workload.informativeAlerts.length > 0
          ? `**Alertas informativas observadas:**\n` + workload.informativeAlerts.map((a: any) => `• *${a.title}:* ${a.description}`).join('\n')
          : `Carga distribuida dentro de rangos normales de asimilación.`);
    } else if (qLower.includes('salto') || qLower.includes('vertical')) {
      const jumpTrend = trends.find((t: any) => t.metricType === 'vertical_jump');
      if (jumpTrend) {
        reply = `**Estado de tu Salto Vertical (CMJ):**\n\n` +
          `• **Último valor medido:** ${jumpTrend.latestValue} ${jumpTrend.unit} (${jumpTrend.latestDate}).\n` +
          `• **Valor inicial:** ${jumpTrend.initialValue} ${jumpTrend.unit} (${jumpTrend.initialDate}).\n` +
          `• **Tendencia observada:** ${jumpTrend.observedTrend.toUpperCase()} (${jumpTrend.trendRatePerWeek > 0 ? '+' : ''}${jumpTrend.trendRatePerWeek} cm por semana).\n` +
          `• **Muestras disponibles:** ${jumpTrend.measurementsCount} mediciones registradas.\n` +
          (jumpTrend.targetValue ? `• **Distancia al objetivo (${jumpTrend.targetValue} cm):** Faltan ${jumpTrend.currentDistanceToTarget} cm.\n` : '') +
          (jumpTrend.confidenceWarning ? `• *Advertencia de fiabilidad:* ${jumpTrend.confidenceWarning}\n` : '') +
          `\nPara evaluar tu salto de forma confiable, asegurate de testear siempre con el mismo protocolo (Test Vertec / Tablero) y tras un día de bajo cansancio.`;
      } else {
        reply = `No hay mediciones de salto vertical registradas en el historial. Podés agregar tu primer test en la pestaña de Estadísticas para que comencemos a calcular tu curva de potencia.`;
      }
    } else if (qLower.includes('objetivo') || qLower.includes('meta')) {
      if (goals.length > 0) {
        reply = `**Estado de Objetivos Vinculados con Evidencia:**\n\n` +
          goals.map((g: any) =>
            `• **${g.title}:** ${g.statusLabel} (${g.progressPercentage !== undefined ? g.progressPercentage + '% de avance' : 'En seguimiento'}).\n` +
            `  *Último valor medido:* ${g.latestValue !== undefined ? g.latestValue + ' ' + (g.unit || '') : 'Sin medición'} | *Evidencia:* ${g.evidenceSummary}`
          ).join('\n\n');
      } else {
        reply = `No tenés objetivos deportivos activos configurados en este momento. Podés crearlos desde el módulo de Objetivos.`;
      }
    } else if (qLower.includes('compar') || qLower.includes('mes anterior') || qLower.includes('cuatro semanas')) {
      const comp = context?.periodComparisonSummary;
      if (comp) {
        reply = `**Comparación entre Períodos Equivalentes (${comp.periodAName} vs ${comp.periodBName}):**\n\n` +
          `1. **Cantidad de entrenamiento:** ${comp.minsA || 0} min (${comp.actsA || 0} sesiones) vs ${comp.minsB || 0} min (${comp.actsB || 0} sesiones).\n` +
          `2. **Recuperación:** Sueño promedio de ${comp.sleepA || 'N/A'} hs vs ${comp.sleepB || 'N/A'} hs; RPE promedio de ${comp.rpeA || 'N/A'} vs ${comp.rpeB || 'N/A'}.\n` +
          `3. **Rendimiento medido:** ${comp.performanceSummary || 'Tests estables entre ambos períodos'}.\n\n` +
          (comp.disparityNote ? `*Nota metodológica:* ${comp.disparityNote}` : '');
      } else {
        reply = `Para realizar una comparación fidedigna entre períodos equivalentes, se requieren al menos 4 semanas completas de registros en cada ciclo. Podés consultar la comparativa detallada en la pestaña de Estadísticas.`;
      }
    } else {
      reply = `Hola Santino. Analicé tus registros deportivos de Instituto, gimnasio, técnica y físico.\n\n` +
        `Actualmente contás con **${context?.activitiesCount || 0} actividades completadas**, **${context?.measurementsCount || 0} mediciones físicas** y **${context?.goalsCount || 0} objetivos en seguimiento**.\n\n` +
        `Podés consultarme preguntas específicas como:\n` +
        `• *¿Cuál es mi principal debilidad según mis registros?*\n` +
        `• *¿Estoy trabajando suficiente mi mano izquierda?*\n` +
        `• *¿Cómo fue mi carga interna y fatiga esta semana?*\n` +
        `• *¿Qué tendencia muestra mi salto vertical?*\n` +
        `• *¿Qué objetivos tienen respaldo de mediciones reales?*`;
    }

    return res.json({
      reply,
      model: 'courtside-sports-analytics-engine',
      isRealAI: false,
      note: 'Respuesta generada mediante el motor analítico determinista de Courtside (para respuestas mediante LLM Gemini en vivo, asegurate de configurar GEMINI_API_KEY en las variables de entorno del servidor).',
      timestamp: new Date().toISOString(),
    });
  });

  // Setup Vite middlewares in dev, or static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`COURTSIDE Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start COURTSIDE server:', err);
  process.exit(1);
});
