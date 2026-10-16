import {
  Activity,
  PhysicalMeasurement,
  PersonalGoal,
  UserProfile,
  RoutineTemplate,
  AppSyncInfo,
} from '../types';

const STORAGE_KEYS = {
  PROFILE: 'courtside_v1_profile',
  ACTIVITIES: 'courtside_v1_activities',
  MEASUREMENTS: 'courtside_v1_measurements',
  GOALS: 'courtside_v1_goals',
  TEMPLATES: 'courtside_v1_templates',
  SYNC_INFO: 'courtside_v1_sync_info',
  SUPABASE_CONFIG: 'courtside_v1_supabase_config',
};

// Initial default profile for 16-year-old athlete at Instituto Atlético Central Córdoba (IACC)
export const DEFAULT_PROFILE: UserProfile = {
  name: 'Santino',
  nickname: 'Santi',
  club: 'Instituto Atlético Central Córdoba (IACC)',
  category: 'U17 / Formativas Gloria',
  age: 16,
  heightCm: 187,
  weightKg: 77,
  wingspanCm: 191,
  dominantHand: 'Derecha',
  jerseyNumber: 7,
  weeklyTargetMinutes: 480, // 8 hours
  weeklyTargetSessions: 6,
};

// Initial starter routines based on official Home Training Plan (PDF)
export const DEFAULT_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'tmpl-home-a',
    title: 'SESIÓN A: Salto bilateral + arranque + empuje/tirón',
    category: 'home_physical',
    description: 'Plan en casa: Pliometría bilateral, Fuerza + Core en pares alternados y Velocidad lineal.',
    targetMinutes: 75,
    items: [
      // Pliometría (18 min)
      { name: 'Salto al cajón (baja caminando)', sets: '3', reps: '4 reps', notes: 'Pausa: 90 s. Clave: Salto máximo, aterriza suave' },
      { name: 'Drop jump desde 25 cm', sets: '3', reps: '4 reps', notes: 'Pausa: 2 min. Clave: Contacto menor a 0,2 s' },
      { name: 'Pogo jumps', sets: '2', reps: '10 reps', notes: 'Pausa: 60 s. Clave: Tobillo rígido' },
      // Fuerza + Core (30 min)
      { name: '1a. Sentadilla búlgara', sets: '3', reps: '6/pierna', notes: 'Pausa: 75 s. Clave: Bajada 4 s, subida explosiva; RIR 2' },
      { name: '1b. Dominada explosiva (prona)', sets: '3', reps: '4-5 reps', notes: 'Pausa: 75 s. Clave: Sube rápido, baja 3 s; RIR 2-3' },
      { name: '2a. Peso muerto a una pierna', sets: '3', reps: '8/pierna', notes: 'Pausa: 60 s. Clave: Tempo 3-1-1; RIR 2' },
      { name: '2b. Flexión con palmada', sets: '3', reps: '5 reps', notes: 'Pausa: 75 s. Clave: Máxima velocidad' },
      { name: '3a. Rueda abdominal desde rodillas', sets: '2', reps: '6-10 reps', notes: 'Pausa: 45 s. Clave: RIR 3' },
      { name: '3b. Dead bug', sets: '2', reps: '8/lado', notes: 'Pausa: 45 s. Clave: Lento, lumbar pegada' },
      // Velocidad (12 min)
      { name: 'Arranques lineales 4 m', sets: '3', reps: '5 reps', notes: 'Pausa: 45 s. Clave: Conos a 0,5 m y 4,5 m de la pared' },
      { name: 'Sprint 3 m + frenada en 2 pasos + arranque vuelta 3 m', sets: '3', reps: '3 reps', notes: 'Pausa: 45 s. Clave: Conos a 2 m y 5 m' },
      { name: 'Deslizamientos defensivos 2,5 m', sets: '3', reps: '8 s', notes: 'Pausa: 45 s. Clave: A lo largo del pasillo' },
    ],
  },
  {
    id: 'tmpl-home-b',
    title: 'SESIÓN B: Unilateral + cambios de dirección',
    category: 'home_physical',
    description: 'Plan en casa: Pliometría unilateral, Fuerza + Core unilateral y Cambios de dirección.',
    targetMinutes: 75,
    items: [
      // Pliometría (18 min)
      { name: 'Subida al cajón a una pierna (baja caminando)', sets: '3', reps: '3/pierna', notes: 'Pausa: 90 s. Clave: Sin impulso de la pierna libre' },
      { name: 'Bajada desde 25 cm y aterrizaje a una pierna', sets: '2', reps: '4/pierna', notes: 'Pausa: 60 s. Clave: Estabilizar, rodilla alineada' },
      { name: 'Saltos laterales tipo patinador', sets: '3', reps: '5/lado', notes: 'Pausa: 60 s. Clave: Amplitud de 1 m' },
      { name: 'Pogo a una pierna', sets: '2', reps: '8/pierna', notes: 'Pausa: 60 s. Clave: Contacto corto' },
      // Fuerza + Core (30 min)
      { name: '1a. Pistol squat a cajón (mancuerna al pecho)', sets: '3', reps: '4/pierna', notes: 'Pausa: 75 s. Clave: Bajada 4 s, subida explosiva; RIR 2' },
      { name: '1b. Dominada supina con pausa de 2 s arriba', sets: '3', reps: '5 reps', notes: 'Pausa: 75 s. Clave: Sube rápido, baja 3 s' },
      { name: '2a. Gemelo a una pierna con cajon', sets: '3', reps: '10/pierna', notes: 'Pausa: 45 s. Clave: Tempo 3-1-X' },
      { name: '2b. Flexión declinada (pies en cajón)', sets: '3', reps: '6-8 reps', notes: 'Pausa: 75 s. Clave: Bajada 3 s, subida explosiva; RIR 2' },
      { name: '3a. Rueda abdominal', sets: '2', reps: '6-10 reps', notes: 'Pausa: 45 s. Clave: RIR 3' },
      { name: '3b. Plancha lateral con elevación de cadera', sets: '2', reps: '10/lado', notes: 'Pausa: 45 s. Clave: Controlado' },
      // Cambios de dirección (12 min)
      { name: 'Shuttle en 3 conos (ida-vuelta-ida)', sets: '3', reps: '4 reps', notes: 'Pausa: 60 s. Clave: Conos separados 2 m' },
      { name: 'Salida cruzada desde postura defensiva', sets: '3', reps: '3/lado', notes: 'Pausa: 45 s. Clave: 2-3 pasos en diagonal' },
      { name: 'Desaceleración: sprint 4 m + frenada en 2 pasos', sets: '3', reps: '4 reps', notes: 'Pausa: 45 s. Clave: Cierra con salto al aro' },
    ],
  },
  {
    id: 'tmpl-gym-iacc',
    title: 'Gimnasio Instituto — Bloque Fuerza Principal',
    category: 'gym',
    description: 'Rutina del gimnasio del club Instituto (tren inferior y empujes).',
    targetMinutes: 60,
    items: [
      { name: 'Trap Bar Deadlift (Peso muerto barra hexagonal)', sets: '4', reps: '5 reps', notes: 'Priorizar velocidad concéntrica' },
      { name: 'Sentadilla frontal (Front Squat)', sets: '4', reps: '6 reps', notes: 'Tronco erguido y profundidad controlada' },
      { name: 'Hip Thrust con barra', sets: '3', reps: '8 reps', notes: 'Extensión completa de cadera' },
      { name: 'Press militar con mancuernas', sets: '3', reps: '8 reps', notes: 'Core bloqueado' },
      { name: 'Remo con soporte al pecho', sets: '4', reps: '8 reps', notes: 'Retracción escapular limpia' },
    ],
  },
];

// Helper to calculate exact Argentine / local ISO dates relative to today
const getRelativeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-seed-1',
    date: getRelativeDate(0), // Today
    startTime: '18:30',
    durationMinutes: 90,
    category: 'iacc_team',
    status: 'completed',
    rpe: 8,
    fatigueLevel: 6,
    sleepHours: 8,
    sorenessAreas: ['gemelos'],
    sorenessLevel: 3,
    notes: 'Entrenamiento con la U21 en el Ángel Sandrín. Mayor roce físico y ritmo de juego rápido.',
    iaccCategoryLevel: 'U21',
    iaccAttendance: 'present',
    iaccContents: ['táctica', 'tiro', 'transición', 'situaciones_juego', 'scrimmage'],
    iaccWhatWentWell: 'Mantuve buena lectura en los pick and roll y defendí intenso la primera línea.',
    iaccNeedsImprovement: 'Cerrar mejor el rebote defensivo ante los perimetrales que cargan.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'act-seed-2',
    date: getRelativeDate(1), // Yesterday
    startTime: '16:00',
    durationMinutes: 50,
    category: 'home_individual',
    status: 'completed',
    rpe: 6,
    fatigueLevel: 4,
    sleepHours: 8.5,
    notes: 'Práctica de tiro y cambios de mano en el patio. Excelente mecánica fluida.',
    basketballSkillCategory: 'tiros_libres',
    basketballDrillName: 'Rutina de 100 Tiros Libres con presión',
    basketballShotPosition: 'Línea de libres',
    basketballApproxDistanceMeters: 4.57,
    basketballAttempts: 100,
    basketballMakes: 84,
    basketballAccuracyPercentage: 84,
    basketballDifficulty: 3,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'act-seed-3',
    date: getRelativeDate(2),
    startTime: '15:00',
    durationMinutes: 65,
    category: 'institute_gym',
    status: 'completed',
    rpe: 8,
    fatigueLevel: 7,
    sleepHours: 7.5,
    sorenessAreas: ['cuádriceps', 'glúteos'],
    sorenessLevel: 4,
    notes: 'Día de fuerza explosiva en el gimnasio del club. Se sintió sólida la trap bar.',
    gymGoal: 'Fuerza máxima y potencia concéntrica',
    gymMuscleGroups: ['tren_inferior', 'potencia', 'core'],
    gymExercises: [
      { id: 'ex-1', name: 'Trap Bar Deadlift', sets: 4, reps: 5, weightKg: 105, restSeconds: 150, notes: 'Salida súper rápida' },
      { id: 'ex-2', name: 'Sentadilla frontal', sets: 4, reps: 6, weightKg: 70, restSeconds: 120, notes: 'Buena técnica sin flexionar espalda' },
      { id: 'ex-3', name: 'Hip Thrust con barra', sets: 3, reps: 8, weightKg: 90, restSeconds: 90, notes: 'Bloqueo arriba 2 seg' },
      { id: 'ex-4', name: 'Press militar mancuernas', sets: 3, reps: 8, weightKg: 18, restSeconds: 90, notes: '18kg por lado' },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'act-seed-4',
    date: getRelativeDate(3),
    startTime: '17:00',
    durationMinutes: 45,
    category: 'home_physical',
    status: 'completed',
    rpe: 7,
    fatigueLevel: 5,
    sleepHours: 8,
    notes: 'Sesión A de pliometría en casa. Rodillas bien, buen despegue en pogo jumps.',
    homeSessionName: 'Sesión A — Pliometría y Potencia Reactiva',
    homeGoal: 'Reducir tiempo de contacto en suelo y acelerar despegue',
    homeExercises: [
      { id: 'he-1', name: 'Activación de tobillos y tibiales', prescribedSets: '3', prescribedReps: '30 seg', completed: true, actualSets: 3, actualReps: 30 },
      { id: 'he-2', name: 'Pogo Jumps reactivos', prescribedSets: '4', prescribedReps: '15 reps', completed: true, actualSets: 4, actualReps: 15 },
      { id: 'he-3', name: 'Drop Freeze (caída y frenado)', prescribedSets: '4', prescribedReps: '6 reps', completed: true, actualSets: 4, actualReps: 6 },
      { id: 'he-4', name: 'Split Squat Jumps explosivos', prescribedSets: '3', prescribedReps: '5 reps/pierna', completed: true, actualSets: 3, actualReps: 5 },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'act-seed-5',
    date: getRelativeDate(4),
    startTime: '19:00',
    durationMinutes: 90,
    category: 'iacc_team',
    status: 'completed',
    rpe: 9,
    fatigueLevel: 7,
    sleepHours: 7,
    notes: 'Entrenamiento formativo U17 táctico fuerte de 5 contra 5 y balance defensivo.',
    iaccCategoryLevel: 'U17',
    iaccAttendance: 'present',
    iaccContents: ['defensa', 'transición', 'situaciones_juego', 'acondicionamiento'],
    iaccWhatWentWell: 'Defensa del balón y comunicación de bloqueos indirectos.',
    iaccNeedsImprovement: 'Evitar faltas prematuras al intentar anticipar pases.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'act-seed-6',
    date: getRelativeDate(5),
    startTime: '17:30',
    durationMinutes: 40,
    category: 'home_individual',
    status: 'completed',
    rpe: 5,
    fatigueLevel: 3,
    sleepHours: 8,
    notes: 'Manejo de balón con dos balones y cambios de dirección entre conos en el patio.',
    basketballSkillCategory: 'manejo_balon',
    basketballDrillName: 'Two-Ball Dribbling + In & Out Crossovers',
    basketballDifficulty: 4,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'act-seed-7',
    date: getRelativeDate(7),
    startTime: '10:00',
    durationMinutes: 40,
    category: 'match',
    status: 'completed',
    rpe: 9,
    fatigueLevel: 8,
    sleepHours: 8,
    notes: 'Partido de torneo asociativo. Gran triunfo del equipo.',
    matchOpponent: 'Atenas de Córdoba',
    matchResult: 'Victoria',
    matchScore: '78 - 71',
    matchMinutesPlayed: 24,
    matchPoints: 14,
    matchAssists: 5,
    matchRebounds: 6,
    matchSteals: 3,
    matchBlocks: 1,
    matchFouls: 2,
    matchPlusMinus: 9,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const INITIAL_MEASUREMENTS: PhysicalMeasurement[] = [
  {
    id: 'meas-1',
    date: getRelativeDate(25),
    testType: 'vertical_jump',
    testName: 'Salto Vertical con contramovimiento (CMJ)',
    result: 68,
    unit: 'cm',
    method: 'Test Vertec / Tablero marcado',
    notes: 'Medición previa al inicio del bloque de fuerza.',
    isPersonalRecord: false,
  },
  {
    id: 'meas-2',
    date: getRelativeDate(5),
    testType: 'vertical_jump',
    testName: 'Salto Vertical con contramovimiento (CMJ)',
    result: 72.5,
    unit: 'cm',
    method: 'Test Vertec / Tablero marcado',
    notes: '¡Nuevo récord personal! Se nota la transferencia de la trap bar y pliometría.',
    isPersonalRecord: true,
  },
  {
    id: 'meas-3',
    date: getRelativeDate(20),
    testType: 'sprint_10m',
    testName: 'Sprint de aceleración 10 metros',
    result: 1.76,
    unit: 'seg',
    method: 'Células fotoeléctricas en Instituto',
    notes: 'Salida desde postura de básquetbol.',
    isPersonalRecord: false,
  },
  {
    id: 'meas-4',
    date: getRelativeDate(6),
    testType: 'sprint_10m',
    testName: 'Sprint de aceleración 10 metros',
    result: 1.69,
    unit: 'seg',
    method: 'Células fotoeléctricas en Instituto',
    notes: 'Mejora en los primeros 3 pasos de aceleración.',
    isPersonalRecord: true,
  },
  {
    id: 'meas-5',
    date: getRelativeDate(6),
    testType: 'sprint_5m',
    testName: 'Sprint inicial 5 metros (primer paso explosivo)',
    result: 1.02,
    unit: 'seg',
    method: 'Células fotoeléctricas en Instituto',
    notes: 'Excelente inclinación del tronco en la salida.',
    isPersonalRecord: true,
  },
  {
    id: 'meas-6',
    date: getRelativeDate(2),
    testType: 'trap_bar_deadlift',
    testName: 'Trap Bar Deadlift (5RM estimado)',
    result: 105,
    unit: 'kg',
    method: 'Barra hexagonal en gimnasio IACC',
    notes: '4 series de 5 reps impecables con 105kg.',
    isPersonalRecord: true,
  },
];

export const INITIAL_GOALS: PersonalGoal[] = [
  {
    id: 'goal-1',
    title: 'Superar 75 cm de Salto Vertical (CMJ)',
    category: 'vertical_jump',
    description: 'Objetivo de salto para volcar la pelota con facilidad con dos manos en carrera.',
    initialValue: 68,
    targetValue: 75,
    currentValue: 72.5,
    unit: 'cm',
    deadline: getRelativeDate(-60), // In 60 days
    status: 'active',
    history: [
      { date: getRelativeDate(25), value: 68, comment: 'Línea base' },
      { date: getRelativeDate(5), value: 72.5, comment: 'Test oficial en Instituto' },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'goal-2',
    title: 'Bajar de 1.65 seg en Sprint de 10 metros',
    category: 'acceleration',
    description: 'Acelerar el primer paso y la transición ofensiva en contragolpe.',
    initialValue: 1.76,
    targetValue: 1.65,
    currentValue: 1.69,
    unit: 'seg',
    deadline: getRelativeDate(-45),
    status: 'active',
    history: [
      { date: getRelativeDate(20), value: 1.76, comment: 'Primer registro' },
      { date: getRelativeDate(6), value: 1.69, comment: 'Mejora con trabajo de potencia' },
    ],
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'goal-3',
    title: 'Alcanzar 85% de efectividad en Tiros Libres',
    category: 'shooting',
    description: 'Efectividad promedio sostenida en sesiones de 100 tiros libres.',
    initialValue: 76,
    targetValue: 85,
    currentValue: 84,
    unit: '%',
    deadline: getRelativeDate(-30),
    status: 'active',
    history: [
      { date: getRelativeDate(18), value: 76, comment: '76/100 en el patio' },
      { date: getRelativeDate(1), value: 84, comment: '84/100 en la última sesión' },
    ],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'goal-4',
    title: 'Constancia semanal: 6 sesiones registradas',
    category: 'consistency',
    description: 'Mantener la disciplina de registrar cada entrenamiento de equipo, gimnasio y patio.',
    initialValue: 4,
    targetValue: 6,
    currentValue: 6,
    unit: 'sesiones/sem',
    deadline: getRelativeDate(-14),
    status: 'active',
    history: [
      { date: getRelativeDate(7), value: 5, comment: '5 de 6' },
      { date: getRelativeDate(0), value: 6, comment: '6 de 6 cumplidas esta semana' },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

// Memory fallback in case localStorage is disabled
let memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  } catch (err) {
    console.warn(`LocalStorage read failed for ${key}:`, err);
    return memoryStore[key] || null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
  } catch (err) {
    console.warn(`LocalStorage write failed for ${key}:`, err);
    memoryStore[key] = value;
  }
}

export const StorageService = {
  // PROFILE
  getProfile(): UserProfile {
    const raw = safeGetItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    safeSetItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  // ACTIVITIES
  getActivities(): Activity[] {
    const raw = safeGetItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) {
      this.saveAllActivities(INITIAL_ACTIVITIES);
      return INITIAL_ACTIVITIES;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  },

  saveAllActivities(activities: Activity[]): void {
    safeSetItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  },

  saveActivity(activity: Activity): Activity {
    const list = this.getActivities();
    const existingIndex = list.findIndex((a) => a.id === activity.id);
    const now = new Date().toISOString();

    let updatedActivity: Activity;
    if (existingIndex >= 0) {
      updatedActivity = {
        ...activity,
        updatedAt: now,
      };
      list[existingIndex] = updatedActivity;
    } else {
      updatedActivity = {
        ...activity,
        id: activity.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: activity.createdAt || now,
        updatedAt: now,
      };
      list.unshift(updatedActivity);
    }

    this.saveAllActivities(list);
    return updatedActivity;
  },

  deleteActivity(id: string): void {
    const list = this.getActivities().filter((a) => a.id !== id);
    this.saveAllActivities(list);
  },

  duplicateActivity(id: string): Activity | null {
    const original = this.getActivities().find((a) => a.id === id);
    if (!original) return null;

    const today = new Date().toISOString().split('T')[0];
    const clone: Activity = {
      ...original,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: today,
      status: 'planned',
      notes: original.notes ? `[Copia de sesión anterior] ${original.notes}` : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveActivity(clone);
  },

  // MEASUREMENTS
  getMeasurements(): PhysicalMeasurement[] {
    const raw = safeGetItem(STORAGE_KEYS.MEASUREMENTS);
    if (!raw) {
      this.saveAllMeasurements(INITIAL_MEASUREMENTS);
      return INITIAL_MEASUREMENTS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_MEASUREMENTS;
    } catch {
      return INITIAL_MEASUREMENTS;
    }
  },

  saveAllMeasurements(measurements: PhysicalMeasurement[]): void {
    safeSetItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
  },

  saveMeasurement(measurement: PhysicalMeasurement): PhysicalMeasurement {
    const list = this.getMeasurements();
    const existingIndex = list.findIndex((m) => m.id === measurement.id);
    let updated: PhysicalMeasurement;

    if (existingIndex >= 0) {
      updated = { ...measurement };
      list[existingIndex] = updated;
    } else {
      updated = {
        ...measurement,
        id: measurement.id || `meas-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      list.unshift(updated);
    }

    // Re-evaluate personal record flag for this testType
    this.recalculatePRs(list, updated.testType);
    this.saveAllMeasurements(list);
    return updated;
  },

  deleteMeasurement(id: string): void {
    const list = this.getMeasurements().filter((m) => m.id !== id);
    this.saveAllMeasurements(list);
  },

  recalculatePRs(list: PhysicalMeasurement[], testType: string): void {
    const items = list.filter((m) => m.testType === testType);
    if (items.length === 0) return;

    // For sprint times, lower is better. For jumps, weight, reps, higher is better.
    const isSprint = testType.startsWith('sprint') || testType.includes('time');
    let bestValue = isSprint ? Infinity : -Infinity;

    // Sort chronologically to see evolution
    const sorted = [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach((item) => {
      let isPR = false;
      if (isSprint) {
        if (item.result < bestValue) {
          bestValue = item.result;
          isPR = true;
        }
      } else {
        if (item.result > bestValue) {
          bestValue = item.result;
          isPR = true;
        }
      }
      // Update original reference
      const orig = list.find((m) => m.id === item.id);
      if (orig) orig.isPersonalRecord = isPR;
    });
  },

  // GOALS
  getGoals(): PersonalGoal[] {
    const raw = safeGetItem(STORAGE_KEYS.GOALS);
    if (!raw) {
      this.saveAllGoals(INITIAL_GOALS);
      return INITIAL_GOALS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  },

  saveAllGoals(goals: PersonalGoal[]): void {
    safeSetItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  saveGoal(goal: PersonalGoal): PersonalGoal {
    const list = this.getGoals();
    const idx = list.findIndex((g) => g.id === goal.id);
    let updated: PersonalGoal;

    if (idx >= 0) {
      updated = { ...goal };
      list[idx] = updated;
    } else {
      updated = {
        ...goal,
        id: goal.id || `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      };
      list.unshift(updated);
    }

    this.saveAllGoals(list);
    return updated;
  },

  updateGoalProgress(id: string, newValue: number, comment?: string): PersonalGoal | null {
    const list = this.getGoals();
    const goal = list.find((g) => g.id === id);
    if (!goal) return null;

    goal.currentValue = newValue;
    if (!goal.history) goal.history = [];
    goal.history.push({
      date: new Date().toISOString().split('T')[0],
      value: newValue,
      comment: comment || 'Actualización de progreso',
    });

    // Check if goal reached
    if (goal.targetValue !== undefined && goal.initialValue !== undefined) {
      const isReverse = goal.targetValue < goal.initialValue; // e.g. sprints
      if (isReverse ? newValue <= goal.targetValue : newValue >= goal.targetValue) {
        goal.status = 'completed';
      }
    }

    this.saveAllGoals(list);
    return goal;
  },

  deleteGoal(id: string): void {
    const list = this.getGoals().filter((g) => g.id !== id);
    this.saveAllGoals(list);
  },

  // TEMPLATES
  getTemplates(): RoutineTemplate[] {
    const raw = safeGetItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) {
      this.saveAllTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  },

  saveAllTemplates(templates: RoutineTemplate[]): void {
    safeSetItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  saveTemplate(template: RoutineTemplate): RoutineTemplate {
    const list = this.getTemplates();
    const idx = list.findIndex((t) => t.id === template.id);
    let updated: RoutineTemplate;

    if (idx >= 0) {
      updated = { ...template };
      list[idx] = updated;
    } else {
      updated = {
        ...template,
        id: template.id || `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      };
      list.push(updated);
    }

    this.saveAllTemplates(list);
    return updated;
  },

  deleteTemplate(id: string): void {
    const list = this.getTemplates().filter((t) => t.id !== id);
    this.saveAllTemplates(list);
  },

  // FULL BACKUP EXPORT & IMPORT
  exportAllData(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'COURTSIDE',
      profile: this.getProfile(),
      activities: this.getActivities(),
      measurements: this.getMeasurements(),
      goals: this.getGoals(),
      templates: this.getTemplates(),
    };
    return JSON.stringify(data, null, 2);
  },

  importAllData(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'El archivo JSON no contiene una estructura válida.' };
      }

      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.activities)) this.saveAllActivities(data.activities);
      if (Array.isArray(data.measurements)) this.saveAllMeasurements(data.measurements);
      if (Array.isArray(data.goals)) this.saveAllGoals(data.goals);
      if (Array.isArray(data.templates)) this.saveAllTemplates(data.templates);

      const totalItems =
        (data.activities?.length || 0) +
        (data.measurements?.length || 0) +
        (data.goals?.length || 0);

      return {
        success: true,
        message: `Se importaron correctamente los datos (${totalItems} registros deportivos).`,
        count: totalItems,
      };
    } catch (err: any) {
      return { success: false, message: `Error al procesar el archivo: ${err.message || 'JSON inválido'}` };
    }
  },

  clearAllData(): void {
    safeSetItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.GOALS, JSON.stringify([]));
  },

  resetToDefaultSeeds(): void {
    this.saveProfile(DEFAULT_PROFILE);
    this.saveAllActivities(INITIAL_ACTIVITIES);
    this.saveAllMeasurements(INITIAL_MEASUREMENTS);
    this.saveAllGoals(INITIAL_GOALS);
    this.saveAllTemplates(DEFAULT_TEMPLATES);
  },
};
