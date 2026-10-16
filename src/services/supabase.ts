import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Activity, PhysicalMeasurement, PersonalGoal, UserProfile, AppSyncInfo } from '../types';

const STORAGE_SUPABASE_CONFIG = 'courtside_v1_supabase_custom_credentials';

export interface SupabaseSettings {
  url: string;
  anonKey: string;
}

let supabaseInstance: SupabaseClient | null = null;

export const SupabaseService = {
  getSettings(): SupabaseSettings {
    const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    try {
      const stored = localStorage.getItem(STORAGE_SUPABASE_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
        }
      }
    } catch {
      // ignore
    }

    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
    };
  },

  saveSettings(url: string, anonKey: string): void {
    localStorage.setItem(
      STORAGE_SUPABASE_CONFIG,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
    supabaseInstance = null; // Reset client
  },

  isConfigured(): boolean {
    const { url, anonKey } = this.getSettings();
    return Boolean(url && anonKey && url.startsWith('https://') && anonKey.length > 20);
  },

  getClient(): SupabaseClient | null {
    if (supabaseInstance) return supabaseInstance;

    const { url, anonKey } = this.getSettings();
    if (!this.isConfigured()) return null;

    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  },

  async getCurrentUser() {
    const client = this.getClient();
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getUser();
      if (error) return null;
      return data.user;
    } catch {
      return null;
    }
  },

  async signInWithEmail(email: string, password: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase no está configurado.');
    return await client.auth.signInWithPassword({ email, password });
  },

  async signUpWithEmail(email: string, password: string) {
    const client = this.getClient();
    if (!client) throw new Error('Supabase no está configurado.');
    return await client.auth.signUp({ email, password });
  },

  async signOut() {
    const client = this.getClient();
    if (!client) return;
    await client.auth.signOut();
  },

  async syncAllToCloud(
    activities: Activity[],
    measurements: PhysicalMeasurement[],
    goals: PersonalGoal[],
    profile: UserProfile
  ): Promise<{ success: boolean; error?: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, error: 'No hay credenciales de Supabase configuradas.' };
    }

    const user = await this.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Iniciá sesión en Supabase para sincronizar con la nube.' };
    }

    try {
      // Upsert profile
      await client.from('profiles').upsert({
        user_id: user.id,
        name: profile.name,
        club: profile.club,
        category: profile.category,
        age: profile.age,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        wingspan_cm: profile.wingspanCm,
        dominant_hand: profile.dominantHand,
        jersey_number: profile.jerseyNumber,
        weekly_target_minutes: profile.weeklyTargetMinutes,
        updated_at: new Date().toISOString(),
      });

      // Upsert activities
      if (activities.length > 0) {
        const payload = activities.map((a) => ({
          id: a.id,
          user_id: user.id,
          date: a.date,
          start_time: a.startTime || null,
          duration_minutes: a.durationMinutes,
          category: a.category,
          status: a.status,
          rpe: a.rpe || null,
          fatigue_level: a.fatigueLevel || null,
          sleep_hours: a.sleepHours || null,
          soreness_areas: a.sorenessAreas || [],
          soreness_level: a.sorenessLevel || null,
          notes: a.notes || null,
          raw_data: a, // Full payload for complete fidelity
          updated_at: a.updatedAt,
        }));

        const { error: actError } = await client.from('activities').upsert(payload, { onConflict: 'id' });
        if (actError) throw actError;
      }

      // Upsert measurements
      if (measurements.length > 0) {
        const mPayload = measurements.map((m) => ({
          id: m.id,
          user_id: user.id,
          date: m.date,
          test_type: m.testType,
          test_name: m.testName,
          result: m.result,
          unit: m.unit,
          method: m.method,
          notes: m.notes || null,
          is_personal_record: m.isPersonalRecord || false,
        }));
        const { error: measError } = await client.from('physical_measurements').upsert(mPayload, { onConflict: 'id' });
        if (measError) throw measError;
      }

      // Upsert goals
      if (goals.length > 0) {
        const gPayload = goals.map((g) => ({
          id: g.id,
          user_id: user.id,
          title: g.title,
          category: g.category,
          description: g.description,
          initial_value: g.initialValue || null,
          target_value: g.targetValue || null,
          current_value: g.currentValue || null,
          unit: g.unit,
          deadline: g.deadline || null,
          status: g.status,
          history: g.history || [],
        }));
        const { error: goalError } = await client.from('personal_goals').upsert(gPayload, { onConflict: 'id' });
        if (goalError) throw goalError;
      }

      return { success: true };
    } catch (err: any) {
      console.error('Supabase sync error:', err);
      return { success: false, error: err.message || 'Error de sincronización con Supabase.' };
    }
  },

  // Generates the official SQL to execute in Supabase dashboard
  getDatabaseSetupSQL(): string {
    return `-- ========================================================
-- COURTSIDE BASKETBALL PERFORMANCE COACH
-- Supabase Schema & Row Level Security (RLS) Policies
-- ========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  club TEXT DEFAULT 'Instituto Atlético Central Córdoba (IACC)',
  category TEXT DEFAULT 'U17',
  age INTEGER DEFAULT 16,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  wingspan_cm NUMERIC,
  dominant_hand TEXT,
  jersey_number INTEGER,
  weekly_target_minutes INTEGER DEFAULT 480,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activities Table (IACC Team, Gym, Home physical, Individual Skill, Matches)
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  duration_minutes INTEGER NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  rpe INTEGER,
  fatigue_level INTEGER,
  sleep_hours NUMERIC,
  soreness_areas TEXT[],
  soreness_level INTEGER,
  notes TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);

-- 3. Physical Measurements (Vertical Jump, Sprints, Trap Bar, etc.)
CREATE TABLE IF NOT EXISTS public.physical_measurements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  test_type TEXT NOT NULL,
  test_name TEXT NOT NULL,
  result NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  method TEXT,
  notes TEXT,
  is_personal_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_test ON public.physical_measurements(user_id, test_type);

-- 4. Personal Goals Table
CREATE TABLE IF NOT EXISTS public.personal_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  initial_value NUMERIC,
  target_value NUMERIC,
  current_value NUMERIC,
  unit TEXT NOT NULL,
  deadline DATE,
  status TEXT DEFAULT 'active',
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures user can ONLY access and modify their own data
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_goals ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Activities Policies
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Physical Measurements Policies
CREATE POLICY "Users can view own measurements" ON public.physical_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own measurements" ON public.physical_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own measurements" ON public.physical_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own measurements" ON public.physical_measurements FOR DELETE USING (auth.uid() = user_id);

-- Personal Goals Policies
CREATE POLICY "Users can view own goals" ON public.personal_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.personal_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.personal_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.personal_goals FOR DELETE USING (auth.uid() = user_id);
`;
  },
};
