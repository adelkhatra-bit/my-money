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

The following improvements have been automatically applied via database migrations:

### Indexes Created (Migration: 20260208054726)
- ✅ `idx_position_credits_user_id` on `position_credits(user_id)`
- ✅ `idx_positions_account_id` on `positions(account_id)`
- ✅ `idx_positions_signal_id` on `positions(signal_id)`
- ✅ `idx_positions_user_id` on `positions(user_id)`
- ✅ `idx_trading_accounts_user_id` on `trading_accounts(user_id)`

**Note on "Unused Index" Warnings:** It's normal for new indexes to show as "unused" initially. These indexes will be automatically utilized by PostgreSQL's query planner when relevant queries are executed. The indexes are correctly configured and will improve performance as your application runs queries.

### RLS Policies Optimized (Migration: 20260208054726)
All Row Level Security policies use the optimized `(SELECT auth.uid())` pattern instead of direct `auth.uid()` calls. This prevents re-evaluation for each row and dramatically improves query performance at scale.

### RLS Policies Consolidated (Migration: consolidate_rls_policies)
Policies have been consolidated to eliminate multiple permissive policies per action while maintaining the same security posture:

**user_profiles:**
- ✅ SELECT: Single policy for users + super admins
- ✅ UPDATE: Single policy for users only

**trading_accounts:**
- ✅ SELECT: Single policy for users + super admins
- ✅ INSERT, UPDATE, DELETE: Separate policies for user-owned data

**position_credits:**
- ✅ SELECT: Single policy for users + super admins
- ✅ INSERT, UPDATE, DELETE: Separate policies for super admins only

**positions:**
- ✅ SELECT: Single policy for users + super admins
- ✅ INSERT, UPDATE, DELETE: Separate policies for user-owned data

**signals:**
- ✅ SELECT: Single policy allowing active signals to all + all signals to super admins
- ✅ INSERT, UPDATE, DELETE: Separate policies for super admins only

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
