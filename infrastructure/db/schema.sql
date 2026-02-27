-- Nyati API Platform - Database Schema
-- Run this in your Supabase SQL Editor

-- Create the API Keys Table
CREATE TABLE api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  key_hint TEXT NOT NULL,          -- e.g., "ry_...1234" (to show in UI)
  secret_hash TEXT NOT NULL,        -- The actual hashed key (never store raw keys!)
  is_active BOOLEAN DEFAULT true,
  tier TEXT DEFAULT 'free',         -- 'free', 'builder', 'nyati'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own keys
CREATE POLICY "Users can manage their own keys" 
ON api_keys FOR ALL 
USING (auth.uid() = user_id);

-- Create a table for user profiles (optional, for tier info)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,           -- Unique username starting with @
  credits INTEGER DEFAULT 100,    -- Free tier starts with 100 credits
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Anyone can check username availability (for real-time validation)
CREATE POLICY "Anyone can check usernames"
ON profiles FOR SELECT
USING (true);
