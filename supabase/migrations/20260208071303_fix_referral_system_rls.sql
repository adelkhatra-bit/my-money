/*
  # Fix Referral System RLS Policies
  
  1. Changes
    - Add INSERT policy for users to create their own referral_system entry
    - Add UPDATE policy for users to update their own referral_system entry
  
  2. Security
    - Users can only insert/update their own referral_system record
    - Maintains existing SELECT policies
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can insert own referral data" ON referral_system;
DROP POLICY IF EXISTS "Users can update own referral data" ON referral_system;

-- Allow users to create their own referral system entry
CREATE POLICY "Users can insert own referral data"
  ON referral_system FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Allow users to update their own referral system entry
CREATE POLICY "Users can update own referral data"
  ON referral_system FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles WHERE user_id = auth.uid()
    )
  );