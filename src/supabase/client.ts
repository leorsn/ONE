import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/supabase/database.types';
import { ONE_SUPABASE_PUBLISHABLE_KEY, ONE_SUPABASE_URL } from '@/src/supabase/project';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ONE_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ONE_SUPABASE_PUBLISHABLE_KEY;

export const ONE_AUTH_CALLBACK_URL = 'one://auth/callback';
export const ONE_PASSWORD_RESET_URL = 'one://auth/reset-password';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
