import { supabase } from '../lib/supabaseClient.js';

const DISCIPLINE_RULES = {
  MAX_TRADES_PER_DAY: 5,
  MAX_CONSECUTIVE_LOSSES: 2,
  COOLDOWN_AFTER_LOSSES: 30 * 60 * 1000
};

class TradeDiscipline {
  async canOpenPosition(userId, accountId) {
    try {
      const checks = await Promise.all([
        this._checkMaxTradesPerDay(userId, accountId),
        this._checkConsecutiveLosses(userId, accountId),
        this._checkMaxLossLimits(userId, accountId),
        this._checkExistingPosition(userId, accountId)
      ]);

      const failures = checks.filter(c => !c.allowed);

      if (failures.length > 0) {
        return {
          allowed: false,
          reason: failures[0].reason,
          message: failures[0].message,
          resetAt: failures[0].resetAt
        };
      }

      return {
        allowed: true,
        message: 'Toutes les vérifications disciplinaires passées'
      };
    } catch (error) {
      console.error('Trade discipline check error:', error);
      return {
        allowed: false,
        reason: 'SYSTEM_ERROR',
        message: 'Erreur lors de la vérification des règles de trading'
      };
    }
  }

  async _checkMaxTradesPerDay(userId, accountId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayPositions, error } = await supabase
      .from('positions')
      .select('id')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .in('status', ['CLOSED', 'STOPPED'])
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Error checking daily trades:', error);
      return { allowed: true };
    }

    const tradesCount = todayPositions?.length || 0;

    if (tradesCount >= DISCIPLINE_RULES.MAX_TRADES_PER_DAY) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        allowed: false,
        reason: 'MAX_DAILY_TRADES_REACHED',
        message: `Maximum de ${DISCIPLINE_RULES.MAX_TRADES_PER_DAY} trades/jour atteint. Réessayez demain.`,
        resetAt: tomorrow.toISOString()
      };
    }

    return { allowed: true };
  }

  async _checkConsecutiveLosses(userId, accountId) {
    const { data: recentPositions, error } = await supabase
      .from('positions')
      .select('pnl, closed_at')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .eq('status', 'CLOSED')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false })
      .limit(DISCIPLINE_RULES.MAX_CONSECUTIVE_LOSSES);

    if (error || !recentPositions || recentPositions.length < DISCIPLINE_RULES.MAX_CONSECUTIVE_LOSSES) {
      return { allowed: true };
    }

    const allLosses = recentPositions.every(p => parseFloat(p.pnl) < 0);

    if (allLosses) {
      const lastLossTime = new Date(recentPositions[0].closed_at);
      const cooldownEnd = new Date(lastLossTime.getTime() + DISCIPLINE_RULES.COOLDOWN_AFTER_LOSSES);
      const now = new Date();

      if (now < cooldownEnd) {
        return {
          allowed: false,
          reason: 'CONSECUTIVE_LOSSES_COOLDOWN',
          message: `Pause obligatoire après ${DISCIPLINE_RULES.MAX_CONSECUTIVE_LOSSES} pertes consécutives. Protection activée.`,
          resetAt: cooldownEnd.toISOString()
        };
      }
    }

    return { allowed: true };
  }

  async _checkMaxLossLimits(userId, accountId) {
    const { data: account, error } = await supabase
      .from('trading_accounts')
      .select('initial_balance, max_daily_loss, max_total_loss')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (error || !account) {
      console.error('Error fetching account:', error);
      return { allowed: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayPositions, error: posError } = await supabase
      .from('positions')
      .select('pnl, status')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .gte('created_at', today.toISOString());

    if (posError) {
      console.error('Error fetching positions:', posError);
      return { allowed: true };
    }

    const dailyPnL = (todayPositions || [])
      .filter(p => p.status === 'CLOSED')
      .reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);

    if (account.max_daily_loss && Math.abs(dailyPnL) >= Math.abs(account.max_daily_loss)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        allowed: false,
        reason: 'MAX_DAILY_LOSS_REACHED',
        message: `Perte max journalière atteinte (${dailyPnL.toFixed(2)}$). Trading bloqué jusqu'à demain.`,
        resetAt: tomorrow.toISOString()
      };
    }

    const { data: allPositions, error: allPosError } = await supabase
      .from('positions')
      .select('pnl, status')
      .eq('user_id', userId)
      .eq('account_id', accountId);

    if (allPosError) {
      console.error('Error fetching all positions:', allPosError);
      return { allowed: true };
    }

    const totalPnL = (allPositions || [])
      .filter(p => p.status === 'CLOSED')
      .reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);

    const currentBalance = parseFloat(account.initial_balance) + totalPnL;
    const drawdown = parseFloat(account.initial_balance) - currentBalance;

    if (account.max_total_loss && drawdown >= Math.abs(account.max_total_loss)) {
      return {
        allowed: false,
        reason: 'MAX_TOTAL_LOSS_REACHED',
        message: `Perte max totale atteinte (${drawdown.toFixed(2)}$). Compte bloqué. Contactez le support.`,
        resetAt: null
      };
    }

    return { allowed: true };
  }

  async _checkExistingPosition(userId, accountId) {
    const { data: openPosition, error } = await supabase
      .from('positions')
      .select('id')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .eq('status', 'OPEN')
      .maybeSingle();

    if (error) {
      console.error('Error checking existing position:', error);
      return { allowed: true };
    }

    if (openPosition) {
      return {
        allowed: false,
        reason: 'POSITION_ALREADY_OPEN',
        message: 'Une position est déjà ouverte. Fermez-la avant d\'en ouvrir une nouvelle.'
      };
    }

    return { allowed: true };
  }
}

export default new TradeDiscipline();
