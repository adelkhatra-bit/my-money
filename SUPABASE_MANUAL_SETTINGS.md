# Supabase Manual Configuration Settings

This document outlines the manual configuration settings that need to be applied in the Supabase Dashboard. These settings cannot be automated via SQL migrations.

## 1. Auth Database Connection Strategy

**Issue:** Auth server is configured to use a fixed number of connections (10), which doesn't scale with instance size increases.

**Solution:**
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database** → **Connection Pooling**
3. Find the **Auth Connection Pool** settings
4. Change from **Fixed (10 connections)** to **Percentage-based**
5. Set an appropriate percentage (recommended: 10-20% of total connections)
6. Click **Save**

**Why this matters:** Percentage-based allocation automatically scales the Auth server connections as you increase your database instance size, ensuring optimal performance.

---

## 2. Leaked Password Protection

**Issue:** Protection against compromised passwords is currently disabled.

**Solution:**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Policies**
3. Scroll to **Password Requirements** section
4. Enable **"Check for breached passwords"**
5. This will integrate with HaveIBeenPwned.org to prevent users from using compromised passwords
6. Click **Save**

**Why this matters:** This feature prevents users from registering or updating to passwords that have been found in data breaches, significantly improving account security.

---

## Performance and Security Improvements Applied via Migration

The following improvements have been automatically applied via database migration:

### Indexes Created
- ✅ `idx_position_credits_user_id` on `position_credits(user_id)`
- ✅ `idx_positions_account_id` on `positions(account_id)`
- ✅ `idx_positions_signal_id` on `positions(signal_id)`
- ✅ `idx_positions_user_id` on `positions(user_id)`
- ✅ `idx_trading_accounts_user_id` on `trading_accounts(user_id)`

### RLS Policies Optimized
All Row Level Security policies have been optimized to use `(select auth.*())` pattern instead of direct `auth.*()` calls. This prevents re-evaluation for each row and dramatically improves query performance at scale.

**Tables optimized:**
- ✅ `user_profiles` - 3 policies
- ✅ `trading_accounts` - 2 policies
- ✅ `position_credits` - 2 policies
- ✅ `signals` - 2 policies
- ✅ `positions` - 2 policies

---

## Notes on Multiple Permissive Policies

The following tables have multiple permissive policies for the same action. This is by design and provides proper separation between user and admin access:

- `position_credits` - Users can view their own credits, Super admins can view all
- `positions` - Users can manage their own positions, Super admins can view all
- `signals` - Users can view active signals, Super admins can manage all
- `trading_accounts` - Users can manage their own accounts, Super admins can view all
- `user_profiles` - Users can read their own profile, Super admins can read all

This design is secure and intentional. Do not consolidate these policies as it maintains clear separation of concerns.

---

## Verification

After applying the manual settings, you can verify the improvements:

1. **Check indexes:**
   ```sql
   SELECT tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public'
   AND indexname LIKE 'idx_%';
   ```

2. **Check RLS policies:**
   ```sql
   SELECT tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

3. **Performance testing:**
   - Run queries on `positions` filtered by `user_id` - should be significantly faster
   - Check query execution plans using `EXPLAIN ANALYZE`

---

## Support

If you encounter any issues with these configurations:
1. Check the Supabase Dashboard for any error messages
2. Verify your project's database version is up to date
3. Contact Supabase support if percentage-based connections are not available for your plan tier
