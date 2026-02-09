import { supabase } from '../lib/supabaseClient';

class PositionService {
  async hasOpenPosition(userId, accountId) {
    try {
      const { data, error } = await supabase
        .rpc('check_user_has_open_position', {
          target_user_id: userId,
          target_account_id: accountId
        });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('[Position] Erreur check open:', error);
      const { data } = await supabase
        .from('positions')
        .select('id')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('status', 'OPEN')
        .maybeSingle();

      return data !== null;
    }
  }

  async getOpenPosition(userId, accountId) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Position] Erreur get open:', error);
      return null;
    }
  }

  async getPositionHistory(userId, accountId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .in('status', ['CLOSED', 'STOPPED'])
        .not('closed_at', 'is', null)
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Position] Erreur historique:', error);
      return [];
    }
  }

  async getAccountStats(userId, accountId) {
    try {
      const { data, error } = await supabase
        .rpc('get_account_stats', {
          target_user_id: userId,
          target_account_id: accountId
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const stats = data[0];
        return {
          total_trades: parseInt(stats.total_trades) || 0,
          wins: parseInt(stats.wins) || 0,
          losses: parseInt(stats.losses) || 0,
          realized_pnl: parseFloat(stats.total_pnl) || 0,
          winrate: parseFloat(stats.win_rate) || 0
        };
      }

      return {
        total_trades: 0,
        wins: 0,
        losses: 0,
        realized_pnl: 0,
        winrate: 0
      };
    } catch (error) {
      console.error('[Position] Erreur stats:', error);
      return {
        total_trades: 0,
        wins: 0,
        losses: 0,
        realized_pnl: 0,
        winrate: 0
      };
    }
  }

  calculateUnrealizedPnL(position, currentPrice) {
    if (!position || !currentPrice) return 0;

    const quantity = parseFloat(position.position_size) || 1;
    const entryPrice = parseFloat(position.entry_price);

    let pnl = 0;
    if (position.direction === 'LONG') {
      pnl = (currentPrice - entryPrice) * quantity;
    } else {
      pnl = (entryPrice - currentPrice) * quantity;
    }

    return pnl;
  }

  calculatePnLPercent(position, currentPrice) {
    if (!position || !currentPrice) return 0;

    const entryPrice = parseFloat(position.entry_price);

    if (position.direction === 'LONG') {
      return ((currentPrice - entryPrice) / entryPrice) * 100;
    } else {
      return ((entryPrice - currentPrice) / entryPrice) * 100;
    }
  }

  shouldTriggerStopLoss(position, currentPrice) {
    if (!position || !currentPrice) return false;

    const sl = parseFloat(position.stop_loss);

    if (position.direction === 'LONG') {
      return currentPrice <= sl;
    } else {
      return currentPrice >= sl;
    }
  }

  shouldTriggerTP1(position, currentPrice) {
    if (!position || !currentPrice) return false;
    if (position.tp1_reached) return false;

    const tp1 = parseFloat(position.take_profit_1);

    if (position.direction === 'LONG') {
      return currentPrice >= tp1;
    } else {
      return currentPrice <= tp1;
    }
  }

  shouldTriggerTP2(position, currentPrice) {
    if (!position || !currentPrice) return false;

    const tp2 = parseFloat(position.take_profit_2);
    if (!tp2) return false;

    if (position.direction === 'LONG') {
      return currentPrice >= tp2;
    } else {
      return currentPrice <= tp2;
    }
  }

  async moveStopLossToBreakEven(positionId, entryPrice, direction) {
    try {
      const offset = direction === 'LONG' ? 1.001 : 0.999;
      const newSL = entryPrice * offset;

      const { error } = await supabase
        .from('positions')
        .update({
          stop_loss: newSL,
          be_moved: true,
          tp1_reached: true,
          tp1_reached_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', positionId);

      if (error) throw error;

      console.log('[Position] ✅ SL déplacé au Break-Even:', {
        positionId,
        oldSL: direction === 'LONG' ? 'en dessous' : 'au dessus',
        newSL: newSL.toFixed(2),
        offset: ((offset - 1) * 100).toFixed(1) + '%'
      });

      return { success: true, newSL };
    } catch (error) {
      console.error('[Position] ❌ Erreur déplacement BE:', error);
      return { success: false, error };
    }
  }

  async closePosition(positionId, closeReason, exitPrice) {
    try {
      const { data: position } = await supabase
        .from('positions')
        .select('*')
        .eq('id', positionId)
        .single();

      if (!position) throw new Error('Position introuvable');

      const quantity = parseFloat(position.position_size) || 1;
      const entryPrice = parseFloat(position.entry_price);

      let realizedPnL = 0;
      if (position.direction === 'LONG') {
        realizedPnL = (exitPrice - entryPrice) * quantity;
      } else {
        realizedPnL = (entryPrice - exitPrice) * quantity;
      }

      const pnlPercent = ((realizedPnL / (entryPrice * quantity)) * 100);
      const finalStatus = closeReason === 'SL' ? 'STOPPED' : 'CLOSED';
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('positions')
        .update({
          status: finalStatus,
          exit_price: exitPrice,
          exit_time: now,
          realized_pnl: realizedPnL,
          unrealized_pnl: 0,
          pnl: realizedPnL,
          pnl_percent: pnlPercent,
          close_reason: closeReason,
          closed_at: now,
          updated_at: now
        })
        .eq('id', positionId);

      if (error) throw error;

      await supabase.from('position_history').insert({
        position_id: positionId,
        account_id: position.account_id,
        user_id: position.user_id,
        market: position.market,
        platform: position.platform,
        direction: position.direction,
        entry_price: entryPrice,
        exit_price: exitPrice,
        position_size: quantity,
        realized_pnl: realizedPnL,
        close_reason: closeReason,
        tp1_reached: position.tp1_reached || false,
        be_moved: position.be_moved || false,
        entry_time: position.entry_time || position.created_at,
        closed_at: now
      });

      console.log('[Position] ✅ Position clôturée:', {
        positionId,
        reason: closeReason,
        exitPrice: exitPrice.toFixed(2),
        pnl: realizedPnL.toFixed(2),
        pnlPercent: pnlPercent.toFixed(2) + '%'
      });

      return { success: true, realizedPnL, pnlPercent };
    } catch (error) {
      console.error('[Position] ❌ Erreur clôture:', error);
      return { success: false, error };
    }
  }
}

export const positionService = new PositionService();
