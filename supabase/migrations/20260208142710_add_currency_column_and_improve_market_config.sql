/*
  # Ajout de la colonne currency et amélioration market_config

  1. Modifications
    - Ajout de currency dans trading_accounts si elle n'existe pas
    - Amélioration de market_config avec les heures de marché précises
  
  2. Notes
    - Les marchés crypto sont 24/7
    - NASDAQ et GOLD suivent les heures de marché traditionnelles
*/

-- Ajouter currency si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trading_accounts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN currency text DEFAULT 'USD';
  END IF;
END $$;

-- Mettre à jour market_config avec les bonnes informations
UPDATE market_config
SET 
  is_24_7 = true,
  trading_hours = '{"always_open": true}'::jsonb
WHERE market = 'BTC';

UPDATE market_config
SET 
  is_24_7 = true,
  trading_hours = '{"always_open": true}'::jsonb
WHERE market = 'ETH';

UPDATE market_config
SET 
  is_24_7 = false,
  trading_hours = '{
    "timezone": "America/New_York",
    "days": {
      "sunday": {"open": false},
      "monday": {"open": true, "start": "09:30", "end": "16:00"},
      "tuesday": {"open": true, "start": "09:30", "end": "16:00"},
      "wednesday": {"open": true, "start": "09:30", "end": "16:00"},
      "thursday": {"open": true, "start": "09:30", "end": "16:00"},
      "friday": {"open": true, "start": "09:30", "end": "16:00"},
      "saturday": {"open": false}
    }
  }'::jsonb
WHERE market = 'NASDAQ';

UPDATE market_config
SET 
  is_24_7 = false,
  trading_hours = '{
    "timezone": "America/New_York",
    "days": {
      "sunday": {"open": false},
      "monday": {"open": true, "start": "18:00", "end": "17:00"},
      "tuesday": {"open": true, "start": "18:00", "end": "17:00"},
      "wednesday": {"open": true, "start": "18:00", "end": "17:00"},
      "thursday": {"open": true, "start": "18:00", "end": "17:00"},
      "friday": {"open": true, "start": "18:00", "end": "17:00"},
      "saturday": {"open": false}
    }
  }'::jsonb
WHERE market = 'GOLD';
