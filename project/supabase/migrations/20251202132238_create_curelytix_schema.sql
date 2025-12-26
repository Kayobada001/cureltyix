/*
  # CurelyTix Healthcare Platform Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - References auth.users
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text) - 'patient', 'doctor', or 'admin'
      - `avatar_url` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `doctors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `specialization` (text)
      - `license_number` (text)
      - `years_of_experience` (integer)
      - `bio` (text)
      - `is_verified` (boolean)
      - `created_at` (timestamptz)
    
    - `patients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `date_of_birth` (date)
      - `gender` (text)
      - `phone` (text)
      - `address` (text)
      - `created_at` (timestamptz)
    
    - `symptoms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `category` (text)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `consultations`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `doctor_id` (uuid, foreign key to doctors, optional)
      - `symptoms` (text array)
      - `description` (text)
      - `status` (text) - 'pending', 'assigned', 'completed', 'cancelled'
      - `priority` (text) - 'low', 'medium', 'high', 'urgent'
      - `ai_recommendation` (text)
      - `doctor_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on their roles
    - Admin has full access
    - Doctors can view assigned consultations and update them
    - Patients can create and view their own consultations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization text NOT NULL,
  license_number text NOT NULL,
  years_of_experience integer DEFAULT 0,
  bio text DEFAULT '',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own profile"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY "Doctors can update their own profile"
  ON doctors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Patients can view verified doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    is_verified = true AND
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'patient'
    )
  );

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text,
  address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own profile"
  ON patients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Patients can update their own profile"
  ON patients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Doctors can view their patients"
  ON patients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor'
    )
  );

-- Create symptoms table
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view symptoms"
  ON symptoms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert symptoms"
  ON symptoms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update symptoms"
  ON symptoms FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  symptoms text[] NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_recommendation text DEFAULT '',
  doctor_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create consultations"
  ON consultations FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view assigned consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    ) OR
    (status = 'pending' AND EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'doctor'
    ))
  );

CREATE POLICY "Doctors can update assigned consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all consultations"
  ON consultations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all consultations"
  ON consultations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Insert some default symptoms
INSERT INTO symptoms (name, category, description) VALUES
  ('Fever', 'General', 'Elevated body temperature above normal range'),
  ('Cough', 'Respiratory', 'Sudden expulsion of air from the lungs'),
  ('Headache', 'Neurological', 'Pain in the head or upper neck'),
  ('Fatigue', 'General', 'Extreme tiredness or lack of energy'),
  ('Nausea', 'Digestive', 'Feeling of sickness with an urge to vomit'),
  ('Chest Pain', 'Cardiovascular', 'Discomfort or pain in the chest area'),
  ('Shortness of Breath', 'Respiratory', 'Difficulty breathing or feeling breathless'),
  ('Dizziness', 'Neurological', 'Feeling lightheaded or unsteady'),
  ('Abdominal Pain', 'Digestive', 'Pain in the stomach or belly area'),
  ('Skin Rash', 'Dermatological', 'Change in skin color or texture')
ON CONFLICT (name) DO NOTHING;