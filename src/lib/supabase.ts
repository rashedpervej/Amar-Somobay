import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing! Check your Secrets panel.');
}

// Fallback to placeholder only if strictly necessary to avoid immediate crash on initialization, 
// though any actual fetch will still fail if these are invalid.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// Gracefully catch and recover from invalid/expired Supabase refresh token errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || String(event.reason || '');
    const isRefreshError = 
      errorMsg.includes('Refresh Token Not Found') || 
      errorMsg.includes('Invalid Refresh Token') || 
      errorMsg.toLowerCase().includes('refresh token') ||
      errorMsg.toLowerCase().includes('refresh_token');

    if (isRefreshError) {
      console.warn('Caught and stabilized invalid refresh token session error globally:', errorMsg);
      event.preventDefault(); // Suppress runtime crashed overlay/popup

      // Clear the obsolete storage tokens to start clean
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Redirect to login page if currently on a protected layout
      const publicPaths = ['/login', '/signup', '/'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
  });
}
