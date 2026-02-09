import { supabase } from '../lib/supabaseClient';

class UserPreferencesService {
  async getPreferences(userProfileId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userProfileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[UserPrefs] Erreur lecture:', error);
      return null;
    }
  }

  async savePreferences(userProfileId, preferences) {
    try {
      if (!userProfileId) {
        console.error('[UserPrefs] ❌ userProfileId manquant');
        return null;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userProfileId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      console.log('[UserPrefs] ✅ Préférences sauvegardées:', {
        userProfileId,
        market: preferences.last_market,
        platform: preferences.last_platform,
        timeframe: preferences.last_timeframe,
        accountId: preferences.last_account_id
      });

      return data;
    } catch (error) {
      console.error('[UserPrefs] ❌ Erreur sauvegarde:', error);
      return null;
    }
  }

  async setActiveAccount(userProfileId, accountId, market, platform) {
    return this.savePreferences(userProfileId, {
      last_account_id: accountId,
      last_market: market,
      last_platform: platform
    });
  }

  async updateLastSelection(userProfileId, market, platform, timeframe, accountId = null) {
    const prefs = {
      last_market: market,
      last_platform: platform,
      last_timeframe: timeframe
    };
    if (accountId) {
      prefs.last_account_id = accountId;
    }
    return this.savePreferences(userProfileId, prefs);
  }
}

export const userPreferencesService = new UserPreferencesService();
