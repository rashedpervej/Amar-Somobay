import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Health check endpoint (for Supabase keep-alive / UptimeRobot)
app.get('/api/health', async (req, res) => {
  try {
    // Querying exactly 1 row from profiles table to prevent sleep
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Database query failed during health check:', error);
      return res.status(200).json({
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check endpoint error:', error);
    return res.status(200).json({
      status: 'error',
      message: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Configure server middleware
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
