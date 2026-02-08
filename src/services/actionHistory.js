import { supabase } from '../lib/supabaseClient';

export const logAction = async (userId, actionType, market, platform, details = {}) => {
  try {
    const { error } = await supabase
      .from('action_history')
      .insert({
        user_id: userId,
        action_type: actionType,
        market,
        platform,
        details
      });

    if (error) {
      console.error('Error logging action:', error);
    }
  } catch (error) {
    console.error('Error in logAction:', error);
  }
};

export const getActionHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching action history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActionHistory:', error);
    return [];
  }
};

export const getActionHistoryByType = async (userId, actionType, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('action_history')
      .select('*')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching action history by type:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActionHistoryByType:', error);
    return [];
  }
};
