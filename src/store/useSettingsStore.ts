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
  is_wallet_enabled: boolean;
  is_member_quick_actions_enabled: boolean;
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
        .maybeSingle(); // Use maybeSingle to handle empty table gracefully
      
      if (error) throw error;
      
      if (data) {
        set({ settings: data, loading: false, initialized: true });
      } else {
        // Fallback defaults if no row exists yet
        set({ 
          settings: {
            id: '00000000-0000-0000-0000-000000000000',
            app_name: 'সঞ্চয় অ্যাপ',
            app_tagline: 'সঞ্চয় ও ঋণের নির্ভরযোগ্য মাধ্যম',
            welcome_text: 'স্বাগতম জানাই আমাদের ডিজিটাল প্ল্যাটফর্মে',
            logo_url: null,
            primary_color: '#10b981',
            secondary_color: '#059669',
            footer_text: 'পরিচালনায়: গ্রামীণ ক্ষুদ্র সঞ্চয় সমিতি',
            organization_name: 'গ্রামীণ সমিতি লিমিটেড',
            is_wallet_enabled: true,
            is_member_quick_actions_enabled: true
          },
          loading: false,
          initialized: true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      set({ loading: false, initialized: true });
    }
  },
  updateSettings: async (updates) => {
    const current = get().settings;
    if (!current) throw new Error('Settings not initialized');

    try {
      // Create a clean payload with only valid columns
      const payload: any = {
        id: current.id,
        app_name: updates.app_name ?? current.app_name,
        app_tagline: updates.app_tagline ?? current.app_tagline,
        welcome_text: updates.welcome_text ?? current.welcome_text,
        logo_url: updates.logo_url === undefined ? current.logo_url : updates.logo_url,
        footer_text: updates.footer_text ?? current.footer_text,
        organization_name: updates.organization_name ?? current.organization_name,
        primary_color: updates.primary_color ?? current.primary_color,
        secondary_color: updates.secondary_color ?? current.secondary_color,
        is_wallet_enabled: updates.is_wallet_enabled ?? (current.is_wallet_enabled ?? true),
        is_member_quick_actions_enabled: updates.is_member_quick_actions_enabled ?? (current.is_member_quick_actions_enabled ?? true),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('app_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // If it's a column missing error, try a fallback without the extra columns
        if (error.message?.includes('column')) {
          console.warn('Falling back to basic settings update due to schema mismatch');
          const fallbackPayload = { ...payload };
          
          // List of columns that might be missing in older schemas
          const potentialMissingColumns = ['primary_color', 'secondary_color', 'is_wallet_enabled'];
          
          potentialMissingColumns.forEach(col => {
            if (error.message?.includes(col)) {
              delete (fallbackPayload as any)[col];
            }
          });
          
          const { error: retryError } = await supabase
            .from('app_settings')
            .upsert(fallbackPayload, { onConflict: 'id' });
          
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      
      set({ settings: { ...current, ...updates } });
    } catch (error: any) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}));
