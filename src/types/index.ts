export type ActivityCategory =
  | 'iacc_team'
  | 'institute_gym'
  | 'home_physical'
  | 'home_individual'
  | 'match'
  | 'recovery'
  | 'rest'
  | 'custom';

export type ActivityStatus = 'planned' | 'completed' | 'partial' | 'cancelled' | 'missed';

export interface GymExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  notes?: string;
}

export interface HomeExercise {
  id: string;
  name: string;
  prescribedSets: string;
  prescribedReps: string;
  restSeconds?: number;
  notes?: string;
  actualSets?: number;
  actualReps?: number;
  completed: boolean;
}

export interface Activity {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  durationMinutes: number;
  category: ActivityCategory;
  status: ActivityStatus;
  rpe?: number; // 1 to 10
  fatigueLevel?: number; // 1 to 10
  sleepHours?: number;
  sorenessAreas?: string[];
  sorenessLevel?: number; // 1 to 10
  notes?: string;

  // IACC Team specifics
  iaccCategoryLevel?: 'U17' | 'U21';
  iaccAttendance?: 'present' | 'absent' | 'partial';
  iaccContents?: string[]; // técnica, táctica, tiro, defensa, transición, físico, scrimmage, etc.
  iaccWhatWentWell?: string;
  iaccNeedsImprovement?: string;

  // Gym specifics
  gymGoal?: string;
  gymMuscleGroups?: string[];
  gymExercises?: GymExercise[];

  // Home physical specifics
  homeSessionName?: string; // e.g. "Sesión A - Fuerza y Pliometría"
  homeGoal?: string;
  homeExercises?: HomeExercise[];

  // Home individual basketball skill
  basketballSkillCategory?: string; // manejo_balon, tiros, pies, mecanica, etc.
  basketballDrillName?: string;
  basketballShotPosition?: string;
  basketballApproxDistanceMeters?: number;
  basketballAttempts?: number;
  basketballMakes?: number;
  basketballAccuracyPercentage?: number;
  basketballDifficulty?: number; // 1-5

  // Match specifics
  matchOpponent?: string;
  matchResult?: 'Victoria' | 'Derrota';
  matchScore?: string;
  matchMinutesPlayed?: number;
  matchPoints?: number;
  matchAssists?: number;
  matchRebounds?: number;
  matchSteals?: number;
  matchBlocks?: number;
  matchFouls?: number;
  matchPlusMinus?: number;

  createdAt: string;
  updatedAt: string;
}

export type MeasurementType =
  | 'vertical_jump'
  | 'sprint_5m'
  | 'sprint_10m'
  | 'agility_t_test'
  | 'trap_bar_deadlift'
  | 'bench_press'
  | 'pull_ups'
  | 'custom';

export interface PhysicalMeasurement {
  id: string;
  date: string;
  testType: MeasurementType;
  testName: string;
  result: number;
  unit: string; // cm, seg, kg, reps
  method: string;
  notes?: string;
  isPersonalRecord?: boolean;
}

export type GoalCategory =
  | 'vertical_jump'
  | 'speed'
  | 'acceleration'
  | 'strength'
  | 'shooting'
  | 'ballhandling'
  | 'consistency'
  | 'recovery'
  | 'custom';

export interface GoalHistoryPoint {
  date: string;
  value: number;
  comment?: string;
}

export interface PersonalGoal {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  initialValue?: number;
  targetValue?: number;
  currentValue?: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  manualProgressPercentage?: number;
  history: GoalHistoryPoint[];
  createdAt: string;
}

export interface UserProfile {
  name: string;
  nickname?: string;
  club: string;
  category: string;
  age: number;
  heightCm: number;
  weightKg: number;
  wingspanCm: number;
  dominantHand: 'Derecha' | 'Izquierda' | 'Ambidiestro';
  jerseyNumber: number;
  weeklyTargetMinutes: number;
  weeklyTargetSessions: number;
  avatarSeed?: string;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  category: 'gym' | 'home_physical' | 'basketball_skill';
  description: string;
  targetMinutes: number;
  items: Array<{
    name: string;
    sets: string;
    reps: string;
    notes?: string;
  }>;
}

export type SyncState = 'saved_locally' | 'syncing' | 'synced' | 'sync_error';

export interface AppSyncInfo {
  state: SyncState;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
  isCloudConnected: boolean;
  cloudUserEmail?: string | null;
}

export interface AthleticRecommendation {
  id: string;
  type: 'alert' | 'warning' | 'tip' | 'positive';
  title: string;
  description: string;
  evidence: string;
  actionLabel?: string;
  actionCategory?: ActivityCategory;
}
