import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface AppSettings {
  id: string;
  app_name: string;
  app_tagline: string;
  welcome_text: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  footer_text: string;
  organization_name: string;
}

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  initialized: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: true,
  initialized: false,
  fetchSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      set({ settings: data, loading: false, initialized: true });
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback defaults
      set({ 
        settings: {
          id: '0',
          app_name: 'Sanchoy App',
          app_tagline: 'সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম',
          welcome_text: 'স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে',
          logo_url: null,
          primary_color: '#10b981',
          secondary_color: '#059669',
          footer_text: 'পরিচালনায়: গ্রামীণ ক্ষুদ্র সঞ্চয় সমিতি',
          organization_name: 'গ্রামীণ সমিতি লিমিটেড'
        },
        loading: false,
        initialized: true
      });
    }
  },
  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) return;

    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', current.id);

      if (error) throw error;
      set({ settings: { ...current, ...updates } });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}));
