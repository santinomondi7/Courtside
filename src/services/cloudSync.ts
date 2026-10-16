import { Activity, PhysicalMeasurement, PersonalGoal, UserProfile, RoutineTemplate } from '../types';

const STORAGE_SYNC_CODE = 'courtside_v1_sync_code';
const STORAGE_SUPABASE_URL = 'courtside_supabase_url';
const STORAGE_SUPABASE_KEY = 'courtside_supabase_key';
const STORAGE_SUPABASE_ENABLED = 'courtside_supabase_enabled';

export interface SyncPayload {
  profile: UserProfile;
  activities: Activity[];
  measurements: PhysicalMeasurement[];
  goals: PersonalGoal[];
  templates?: RoutineTemplate[];
  updatedAt: string;
}

export interface SupabaseConfig {
  url: string;
  key: string;
  enabled: boolean;
}

export const CloudSyncService = {
  // Get active Sync Code or generate default
  getSyncCode(): string {
    try {
      const stored = localStorage.getItem(STORAGE_SYNC_CODE);
      if (stored && stored.trim()) {
        return stored.trim().toUpperCase();
      }
    } catch {
      // fallback
    }
    // Default friendly code for Santino / IACC
    const defaultCode = 'SANTINO-IACC';
    this.setSyncCode(defaultCode);
    return defaultCode;
  },

  setSyncCode(code: string): void {
    const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    try {
      localStorage.setItem(STORAGE_SYNC_CODE, cleaned || 'SANTINO-IACC');
    } catch {
      // ignore
    }
  },

  // Supabase Configuration Management
  getSupabaseConfig(): SupabaseConfig {
    try {
      const url = (localStorage.getItem(STORAGE_SUPABASE_URL) || '').trim();
      const key = (localStorage.getItem(STORAGE_SUPABASE_KEY) || '').trim();
      const enabled = localStorage.getItem(STORAGE_SUPABASE_ENABLED) === 'true';
      return { url, key, enabled: enabled && Boolean(url && key) };
    } catch {
      return { url: '', key: '', enabled: false };
    }
  },

  setSupabaseConfig(url: string, key: string, enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_SUPABASE_URL, url.trim().replace(/\/+$/, ''));
      localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
      localStorage.setItem(STORAGE_SUPABASE_ENABLED, enabled ? 'true' : 'false');
    } catch {
      // ignore
    }
  },

  // Helper SQL Schema for user setup in Supabase SQL Editor
  getSupabaseSqlSchema(): string {
    return `-- Ejecutar en el SQL Editor de tu proyecto Supabase:
create table if not exists athlete_sync (
  sync_code text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar permisos de lectura y escritura para la app
alter table athlete_sync enable row level security;

create policy "Permitir acceso publico con anon key" 
  on athlete_sync 
  for all 
  using (true) 
  with check (true);
`;
  },

  // Test Supabase credentials
  async testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('http')) {
      return { success: false, message: 'La URL debe comenzar con https://' };
    }
    if (!cleanKey) {
      return { success: false, message: 'La clave Anon Key no puede estar vacía.' };
    }

    try {
      // Query the athlete_sync table with limit 1
      const endpoint = `${cleanUrl}/rest/v1/athlete_sync?select=sync_code&limit=1`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        return {
          success: true,
          message: '¡Conexión exitosa con tu base de datos Supabase! La tabla athlete_sync está lista.',
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          message:
            'Conectó a Supabase pero la tabla "athlete_sync" no existe todavía. Copiá y ejecutá el script SQL que te dejamos abajo en tu SQL Editor de Supabase.',
        };
      }

      const errText = await res.text();
      return {
        success: false,
        message: `Error al autenticar con Supabase (${res.status}): verifique la anon key o URL.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error de red al conectar con Supabase: ${err.message || 'Verifica la URL'}`,
      };
    }
  },

  // Push full state to the server and Supabase (if configured)
  async pushToCloud(payload: SyncPayload): Promise<{ success: boolean; error?: string; updatedAt?: string }> {
    const code = this.getSyncCode();
    const supa = this.getSupabaseConfig();
    let supaSuccess = false;

    // Push to Supabase if enabled
    if (supa.enabled && supa.url && supa.key) {
      try {
        const endpoint = `${supa.url}/rest/v1/athlete_sync`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            apikey: supa.key,
            Authorization: `Bearer ${supa.key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify({
            sync_code: code,
            data: payload,
            updated_at: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          supaSuccess = true;
        } else {
          console.warn('Supabase push status:', res.status);
        }
      } catch (err) {
        console.warn('Supabase sync push error:', err);
      }
    }

    // Always push to Express local/cloud API as well (dual-redundant and fast)
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        if (!supaSuccess) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${res.status}`);
        }
      }

      const resData = await res.json().catch(() => ({}));
      return { success: true, updatedAt: resData.updatedAt || new Date().toLocaleTimeString() };
    } catch (err: any) {
      if (supaSuccess) {
        return { success: true, updatedAt: new Date().toLocaleTimeString() };
      }
      console.warn('Push sync error:', err);
      return { success: false, error: err.message || 'Error de red al sincronizar' };
    }
  },

  // Pull state from Supabase or the server
  async pullFromCloud(): Promise<{ success: boolean; data?: SyncPayload; notFound?: boolean; error?: string }> {
    const code = this.getSyncCode();
    const supa = this.getSupabaseConfig();

    // 1. Try Supabase first if active
    if (supa.enabled && supa.url && supa.key) {
      try {
        const endpoint = `${supa.url}/rest/v1/athlete_sync?sync_code=eq.${encodeURIComponent(code)}&select=data,updated_at`;
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            apikey: supa.key,
            Authorization: `Bearer ${supa.key}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
            return { success: true, data: rows[0].data };
          }
        }
      } catch (err) {
        console.warn('Supabase pull error, falling back to local sync:', err);
      }
    }

    // 2. Fallback to built-in Express server sync
    try {
      const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 404) {
        return { success: false, notFound: true, error: 'Código no encontrado en la nube aún.' };
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const resData = await res.json();
      if (resData.found && resData.data) {
        return { success: true, data: resData.data };
      }

      return { success: false, notFound: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de red al consultar la nube' };
    }
  },

  // Returns direct sharing URL for mobile pairing
  getShareablePairingUrl(): string {
    const code = this.getSyncCode();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}?sync=${encodeURIComponent(code)}`;
  },
};
