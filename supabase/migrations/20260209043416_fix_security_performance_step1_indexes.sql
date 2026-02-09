/*
  # Fix Security - Step 1: Indexes

  1. Add Missing Foreign Key Indexes
    - action_history.user_id
    - signal_history.signal_id
    - signal_history.user_id

  2. Remove Unused Indexes
    - Various unused indexes identified by Supabase
*/

CREATE INDEX IF NOT EXISTS idx_action_history_user_id ON action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_history_signal_id ON signal_history(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_history_user_id ON signal_history(user_id);

DROP INDEX IF EXISTS idx_free_trial_requests_handled_by;
DROP INDEX IF EXISTS idx_positions_signal_id;
DROP INDEX IF EXISTS idx_referrals_referred_id;
DROP INDEX IF EXISTS idx_future_entries_user_market;
DROP INDEX IF EXISTS idx_future_entries_account;
DROP INDEX IF EXISTS idx_positions_user_account_status;
DROP INDEX IF EXISTS idx_positions_user_status;
DROP INDEX IF EXISTS idx_user_preferences_account;
DROP INDEX IF EXISTS idx_positions_exit_time;
