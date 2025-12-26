import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  license_number: string;
  years_of_experience: number;
  bio: string;
  is_verified: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Symptom {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id?: string;
  symptoms: string[];
  description: string;
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  ai_recommendation: string;
  doctor_notes: string;
  created_at: string;
  updated_at: string;
}
