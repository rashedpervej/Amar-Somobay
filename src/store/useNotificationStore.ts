import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  source_module?: 'plan' | 'wallet';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: (userId: string) => Promise<void>;
  fetchNotifications: (userId: string) => Promise<() => void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (data: {
    user_id: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    source_module?: 'plan' | 'wallet';
  }) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  loadNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('relation "public.notifications" does not exist')) {
          console.warn('Notifications table not yet created. Please run the SQL setup script.');
          return;
        }
        throw error;
      }

      if (data) {
        const currentNotifications = get().notifications;
        const hasChanged = JSON.stringify(data) !== JSON.stringify(currentNotifications);
        
        if (hasChanged) {
          set({ 
            notifications: data,
            unreadCount: data.filter(n => !n.is_read).length
          });
        }
      }
    } catch (err) {
      console.error('Load notifications error:', err);
    }
  },

  fetchNotifications: async (userId) => {
    if (!userId) return () => {};

    try {
      // Avoid redundant loads if we are already loading for this user
      set({ loading: true });
      await get().loadNotifications(userId);
      set({ loading: false });

      const channelName = `notifications-${userId}`;
      
      // Clean up any existing channel with this name first
      const existingChannel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
      if (existingChannel) {
        await supabase.removeChannel(existingChannel);
      }

      const channel = supabase.channel(channelName);
      
      const subscription = channel
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          }, 
          () => {
            get().loadNotifications(userId);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to notifications for user:', userId);
          }
        });

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (err) {
      console.error('Subscribe notifications error:', err);
      set({ loading: false });
      return () => {};
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        const updated = get().notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        set({ 
          notifications: updated,
          unreadCount: updated.filter(n => !n.is_read).length
        });
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) {
        const updated = get().notifications.map(n => ({ ...n, is_read: true }));
        set({ 
          notifications: updated,
          unreadCount: 0
        });
      }
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  },

  addNotification: async (data) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: data.user_id,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          source_module: data.source_module || 'plan'
        }]);

      if (error) throw error;
    } catch (err) {
      console.error('Add notification error:', err);
    }
  }
}));
