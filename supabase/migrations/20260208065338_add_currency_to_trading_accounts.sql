/*
  # Add Currency Field to Trading Accounts

  1. Changes
    - Add `currency` column to `trading_accounts` table
    - Set default value to 'USD'
    - Update existing records to use USD
  
  2. Notes
    - This allows users to manage accounts in different currencies (USD, EUR, GBP)
    - Risk limits will be calculated based on the selected currency
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trading_accounts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE trading_accounts 
    ADD COLUMN currency text DEFAULT 'USD' NOT NULL;

    ALTER TABLE trading_accounts 
    ADD CONSTRAINT currency_check CHECK (currency IN ('USD', 'EUR', 'GBP'));

    COMMENT ON COLUMN trading_accounts.currency IS 'Currency for the trading account (USD, EUR, GBP)';
  END IF;
END $$;
