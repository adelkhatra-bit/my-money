import { supabase } from '../lib/supabaseClient';
import { validateRisk } from './riskCalculator';
import { positionManager } from './positionManager';

class TradingViewAlertService {
  constructor() {
    this.subscription = null;
    this.callbacks = new Set();
    this.isListening = false;
  }

  async startListening(userId, callback) {
    if (this.isListening) {
      console.log('[TradingViewAlerts] Already listening');
      return;
    }

    console.log('[TradingViewAlerts] Starting to listen for alerts...');
    this.isListening = true;

    if (callback) {
      this.callbacks.add(callback);
    }

    this.subscription = supabase
      .channel('tradingview_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tradingview_alerts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[TradingViewAlerts] New alert received:', payload.new);
          this.handleNewAlert(payload.new);
        }
      )
      .subscribe();

    const { data: pendingAlerts, error } = await supabase
      .from('tradingview_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[TradingViewAlerts] Error fetching pending alerts:', error);
    } else if (pendingAlerts && pendingAlerts.length > 0) {
      console.log(`[TradingViewAlerts] Found ${pendingAlerts.length} pending alerts`);
      pendingAlerts.forEach(alert => this.handleNewAlert(alert));
    }
  }

  stopListening() {
    console.log('[TradingViewAlerts] Stopping listener...');
    this.isListening = false;

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    this.callbacks.clear();
  }

  async handleNewAlert(alert) {
    console.log('[TradingViewAlerts] Processing alert:', {
      id: alert.id,
      symbol: alert.symbol,
      side: alert.side,
      entry: alert.entry
    });

    const analysis = await this.analyzeAlert(alert);

    await supabase
      .from('tradingview_alerts')
      .update({
        bot_response: analysis,
        processed_at: new Date().toISOString()
      })
      .eq('id', alert.id);

    this.callbacks.forEach(callback => {
      try {
        callback({
          ...alert,
          analysis
        });
      } catch (error) {
        console.error('[TradingViewAlerts] Error in callback:', error);
      }
    });
  }

  async analyzeAlert(alert) {
    const { symbol, side, entry, sl, tp1, tp2, timeframe } = alert;

    const riskReward = tp1 && sl
      ? Math.abs(tp1 - entry) / Math.abs(entry - sl)
      : 0;

    const stopLossDistance = Math.abs(entry - sl);
    const stopLossPips = stopLossDistance;

    const riskCheck = {
      valid: stopLossDistance > 0,
      reason: stopLossDistance > 0 ? 'Risk acceptable' : 'Invalid stop loss'
    };

    const openPositions = await positionManager.getOpenPositions();
    const hasConflict = openPositions.some(pos =>
      pos.symbol === symbol && pos.direction !== side
    );

    let decision = 'pending';
    let reason = [];

    if (!riskCheck.valid) {
      decision = 'rejected';
      reason.push(`Risk: ${riskCheck.reason}`);
    }

    if (hasConflict) {
      decision = 'rejected';
      reason.push(`Position conflict: Already ${openPositions.find(p => p.symbol === symbol)?.direction} on ${symbol}`);
    }

    if (riskReward < 1.5) {
      reason.push(`Low R:R (${riskReward.toFixed(2)})`);
      if (decision !== 'rejected') {
        decision = 'warning';
      }
    }

    if (decision === 'pending' && riskCheck.valid && !hasConflict) {
      decision = 'confirmed';
      reason.push('All checks passed');
    }

    return {
      decision,
      reason: reason.join(', '),
      risk_reward: riskReward.toFixed(2),
      stop_loss_distance: stopLossPips.toFixed(2),
      checked_at: new Date().toISOString(),
      timeframe_verified: timeframe,
      entry_verified: entry,
      position_check: !hasConflict,
      risk_check: riskCheck.valid
    };
  }

  async confirmAlert(alertId) {
    const { error } = await supabase
      .from('tradingview_alerts')
      .update({ status: 'confirmed' })
      .eq('id', alertId);

    if (error) {
      console.error('[TradingViewAlerts] Error confirming alert:', error);
      return { success: false, error };
    }

    return { success: true };
  }

  async rejectAlert(alertId, reason) {
    const { error } = await supabase
      .from('tradingview_alerts')
      .update({
        status: 'rejected',
        bot_response: {
          decision: 'rejected',
          reason,
          rejected_at: new Date().toISOString()
        }
      })
      .eq('id', alertId);

    if (error) {
      console.error('[TradingViewAlerts] Error rejecting alert:', error);
      return { success: false, error };
    }

    return { success: true };
  }

  addCallback(callback) {
    this.callbacks.add(callback);
  }

  removeCallback(callback) {
    this.callbacks.delete(callback);
  }
}

export const tradingViewAlertService = new TradingViewAlertService();
