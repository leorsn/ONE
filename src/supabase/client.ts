import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/supabase/database.types';
import { ONE_SUPABASE_PUBLISHABLE_KEY, ONE_SUPABASE_URL } from '@/src/supabase/project';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ONE_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ONE_SUPABASE_PUBLISHABLE_KEY;

function runtimeScheme() {
  const scheme = Constants.expoConfig?.scheme;
  if (Array.isArray(scheme)) return scheme[0] || 'one';
  return scheme || 'one';
}

const appScheme = runtimeScheme();
export const NEVER_AUTH_CALLBACK_URL = `${appScheme}://auth/callback`;
export const NEVER_PASSWORD_RESET_URL = `${appScheme}://auth/reset-password`;
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
