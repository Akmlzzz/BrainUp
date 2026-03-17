import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ──────────────────────────────────────────────
export type UserRole = 'admin' | 'learner';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  options: Record<string, string>; // { a: '...', b: '...', c: '...', d: '...' }
  correct_answer: string;
}

export interface Submission {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  created_at: string;
}

// ── Auth Helpers ───────────────────────────────────────
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.replace('/login');
}
