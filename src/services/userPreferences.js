import { supabase } from '../lib/supabaseClient';

class UserPreferencesService {
  async getPreferences(userId) {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileData) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', profileData.id)
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
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileData) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: profileData.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log('[UserPrefs] ✅ Préférences sauvegardées:', {
        market: preferences.last_market,
        platform: preferences.last_platform,
        timeframe: preferences.last_timeframe,
        accountId: preferences.last_account_id
      });

      return data;
    } catch (error) {
      console.error('[UserPrefs] ❌ Erreur sauvegarde:', error);
      throw error;
    }
  }

  async setActiveAccount(userId, accountId, market, platform) {
    return this.savePreferences(userId, {
      last_account_id: accountId,
      last_market: market,
      last_platform: platform
    });
  }

  async updateLastSelection(userId, market, platform, timeframe, accountId = null) {
    const prefs = {
      last_market: market,
      last_platform: platform,
      last_timeframe: timeframe
    };
    if (accountId) {
      prefs.last_account_id = accountId;
    }
    return this.savePreferences(userId, prefs);
  }
}

export const userPreferencesService = new UserPreferencesService();
