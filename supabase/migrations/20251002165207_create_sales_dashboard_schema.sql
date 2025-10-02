/*
  # Sales & Stock Dashboard - Complete Database Schema

  ## Overview
  This migration creates a comprehensive sales dashboard system with user management,
  personnel tracking, KPI management, and sales logging capabilities.

  ## 1. New Tables
  
  ### users
  - `id` (uuid, primary key) - References auth.users
  - `email` (text, unique, not null) - User email
  - `role` (text, not null) - User role: admin, editor, viewer
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### team_leaders
  - `id` (uuid, primary key) - Unique identifier
  - `tl_name` (text, not null) - Team leader name
  - `cluster` (text, not null) - Cluster assignment
  - `monthly_sales_target` (numeric, default 0) - Monthly sales target
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### captains
  - `id` (uuid, primary key) - Unique identifier
  - `captain_name` (text, not null) - Captain name
  - `cluster` (text, not null) - Cluster assignment
  - `monthly_sales_target` (numeric, default 0) - Monthly sales target
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### distribution_executives (DEs)
  - `id` (uuid, primary key) - Unique identifier
  - `de_name` (text, not null) - Distribution executive name
  - `cluster` (text, not null) - Cluster assignment
  - `monthly_sales_target` (numeric, default 0) - Monthly sales target
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### sales_log
  - `id` (uuid, primary key) - Unique identifier
  - `sale_date` (date, not null) - Date of sale
  - `person_id` (uuid, not null) - References captains or distribution_executives
  - `person_type` (text, not null) - Type: captain or de
  - `sales_amount` (numeric, not null, default 0) - Sales amount for the day
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp
  - Unique constraint on (sale_date, person_id)

  ### kpi_settings
  - `id` (uuid, primary key) - Unique identifier
  - `key` (text, unique, not null) - Setting key
  - `value` (jsonb, not null) - Setting value (flexible JSON structure)
  - `description` (text) - Setting description
  - `updated_at` (timestamptz) - Record update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Admin users can manage all data
  - Editor users can manage personnel and sales data
  - Viewer users can only read data
  - Public users have no access

  ## 3. Indexes
  - Composite indexes on sales_log for efficient date-range queries
  - Indexes on cluster fields for filtering
  - Index on person_type for sales_log queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Team Leaders table
CREATE TABLE IF NOT EXISTS team_leaders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tl_name text NOT NULL,
  cluster text NOT NULL,
  monthly_sales_target numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_leaders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team leaders"
  ON team_leaders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can manage team leaders"
  ON team_leaders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

-- Captains table
CREATE TABLE IF NOT EXISTS captains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  captain_name text NOT NULL,
  cluster text NOT NULL,
  monthly_sales_target numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE captains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read captains"
  ON captains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can manage captains"
  ON captains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

-- Distribution Executives table
CREATE TABLE IF NOT EXISTS distribution_executives (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  de_name text NOT NULL,
  cluster text NOT NULL,
  monthly_sales_target numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE distribution_executives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read distribution executives"
  ON distribution_executives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can manage distribution executives"
  ON distribution_executives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

-- Sales Log table
CREATE TABLE IF NOT EXISTS sales_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date date NOT NULL,
  person_id uuid NOT NULL,
  person_type text NOT NULL CHECK (person_type IN ('captain', 'de')),
  sales_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sale_date, person_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_log_date ON sales_log(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_log_person ON sales_log(person_id, person_type);
CREATE INDEX IF NOT EXISTS idx_sales_log_date_type ON sales_log(sale_date, person_type);

ALTER TABLE sales_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sales log"
  ON sales_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can manage sales log"
  ON sales_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'editor')
    )
  );

-- KPI Settings table
CREATE TABLE IF NOT EXISTS kpi_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read kpi settings"
  ON kpi_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage kpi settings"
  ON kpi_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_leaders_updated_at BEFORE UPDATE ON team_leaders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_captains_updated_at BEFORE UPDATE ON captains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_executives_updated_at BEFORE UPDATE ON distribution_executives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_log_updated_at BEFORE UPDATE ON sales_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpi_settings_updated_at BEFORE UPDATE ON kpi_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
