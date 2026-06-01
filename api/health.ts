import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export default async function handler(req: any, res: any) {
  try {
    // Ping Supabase to keep it warm/active
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Supabase query failed during health check:', error);
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
    console.error('Vercel serverless health check error:', error);
    return res.status(200).json({
      status: 'error',
      message: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}
