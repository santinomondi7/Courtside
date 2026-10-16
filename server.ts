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
