import { supabase } from '../lib/supabaseClient';

class UserPreferencesService {
  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select(`
          *,
          trading_accounts(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[UserPrefs] Erreur lecture:', error);
      return null;
    }
  }

  async savePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[UserPrefs] ✅ Préférences sauvegardées:', {
        market: preferences.last_market,
        platform: preferences.last_platform,
        timeframe: preferences.last_timeframe,
        account: preferences.active_account_id
      });

      return data;
    } catch (error) {
      console.error('[UserPrefs] ❌ Erreur sauvegarde:', error);
      throw error;
    }
  }

  async setActiveAccount(userId, accountId, market, platform) {
    return this.savePreferences(userId, {
      active_account_id: accountId,
      last_market: market,
      last_platform: platform
    });
  }

  async updateLastSelection(userId, market, platform, timeframe) {
    return this.savePreferences(userId, {
      last_market: market,
      last_platform: platform,
      last_timeframe: timeframe
    });
  }
}

export const userPreferencesService = new UserPreferencesService();
