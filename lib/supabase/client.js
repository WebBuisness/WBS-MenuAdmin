'use client'
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration is missing in Admin Panel!', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey
    });
  }

  return createBrowserClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
  );
}

