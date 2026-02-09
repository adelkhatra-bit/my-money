import { supabase } from '../lib/supabaseClient';
import { getCurrentPrice } from './marketData';

class PositionManager {
  constructor() {
    this.monitoringInterval = null;
    this.callbacks = {
      onPriceUpdate: null,
      onTP1Hit: null,
      onTP2Hit: null,
      onSLHit: null,
      onPositionClosed: null
    };
  }

  async hasOpenPosition(userId) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (error) throw error;

      return { hasPosition: !!data, position: data };
    } catch (error) {
      console.error('Error checking open position:', error);
      return { hasPosition: false, position: null };
    }
  }

  async getOpenPosition(userId) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'OPEN')
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting open position:', error);
      return null;
    }
  }

  calculatePnL(position, currentPrice) {
    if (!position || !currentPrice) return 0;

    const entryPrice = parseFloat(position.entry_price);
    const quantity = parseFloat(position.quantity || 1);

    if (position.direction === 'LONG') {
      return (currentPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - currentPrice) * quantity;
    }
  }

  async monitorPosition(userId, positionId) {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log('🔍 Surveillance position démarrée:', positionId);

    this.monitoringInterval = setInterval(async () => {
      try {
        const position = await this.getOpenPosition(userId);

        if (!position || position.id !== positionId) {
          console.log('⏹️ Position non trouvée ou fermée, arrêt surveillance');
          this.stopMonitoring();
          return;
        }

        const currentPrice = await getCurrentPrice(position.market);
        if (!currentPrice) {
          console.log('⚠️ Prix actuel non disponible');
          return;
        }

        const pnl = this.calculatePnL(position, currentPrice);
        const entryPrice = parseFloat(position.entry_price);
        const stopLoss = parseFloat(position.stop_loss);
        const tp1 = parseFloat(position.take_profit_1);
        const tp2 = parseFloat(position.take_profit_2);

        console.log(`📊 Surveillance ${position.market} ${position.direction}:`, {
          currentPrice,
          entry: entryPrice,
          sl: stopLoss,
          tp1,
          tp2,
          pnl: pnl.toFixed(2)
        });

        if (this.callbacks.onPriceUpdate) {
          this.callbacks.onPriceUpdate({
            position,
            currentPrice,
            pnl
          });
        }

        const TP1_THRESHOLD = 0.001;
        const TP2_THRESHOLD = 0.001;
        const SL_THRESHOLD = 0.001;

        if (position.direction === 'LONG') {
          if (currentPrice >= tp2 * (1 - TP2_THRESHOLD)) {
            console.log('✅ TP2 ATTEINT (LONG)');
            await this.closePosition(position, 'TP2', currentPrice, pnl);
            if (this.callbacks.onTP2Hit) {
              this.callbacks.onTP2Hit(position, currentPrice, pnl);
            }
          } else if (
            currentPrice >= tp1 * (1 - TP1_THRESHOLD) &&
            position.tp1_hit !== true
          ) {
            console.log('🎯 TP1 ATTEINT (LONG)');
            await this.markTP1Hit(position.id);
            if (this.callbacks.onTP1Hit) {
              this.callbacks.onTP1Hit(position, currentPrice, pnl);
            }
          } else if (currentPrice <= stopLoss * (1 + SL_THRESHOLD)) {
            console.log('❌ SL ATTEINT (LONG)');
            await this.closePosition(position, 'SL', currentPrice, pnl);
            if (this.callbacks.onSLHit) {
              this.callbacks.onSLHit(position, currentPrice, pnl);
            }
          }
        } else {
          if (currentPrice <= tp2 * (1 + TP2_THRESHOLD)) {
            console.log('✅ TP2 ATTEINT (SHORT)');
            await this.closePosition(position, 'TP2', currentPrice, pnl);
            if (this.callbacks.onTP2Hit) {
              this.callbacks.onTP2Hit(position, currentPrice, pnl);
            }
          } else if (
            currentPrice <= tp1 * (1 + TP1_THRESHOLD) &&
            position.tp1_hit !== true
          ) {
            console.log('🎯 TP1 ATTEINT (SHORT)');
            await this.markTP1Hit(position.id);
            if (this.callbacks.onTP1Hit) {
              this.callbacks.onTP1Hit(position, currentPrice, pnl);
            }
          } else if (currentPrice >= stopLoss * (1 - SL_THRESHOLD)) {
            console.log('❌ SL ATTEINT (SHORT)');
            await this.closePosition(position, 'SL', currentPrice, pnl);
            if (this.callbacks.onSLHit) {
              this.callbacks.onSLHit(position, currentPrice, pnl);
            }
          }
        }
      } catch (error) {
        console.error('Erreur surveillance position:', error);
      }
    }, 5000);
  }

  async markTP1Hit(positionId) {
    try {
      const { data: position } = await supabase
        .from('positions')
        .select('*')
        .eq('id', positionId)
        .maybeSingle();

      if (!position) {
        console.error('Position non trouvée pour TP1');
        return;
      }

      const entryPrice = parseFloat(position.entry_price);
      const newSL = entryPrice * (position.direction === 'LONG' ? 1.001 : 0.999);

      const { error } = await supabase
        .from('positions')
        .update({
          tp1_hit: true,
          stop_loss: newSL
        })
        .eq('id', positionId);

      if (error) throw error;

      console.log('✅ TP1 atteint - SL déplacé au break-even:', {
        ancienSL: position.stop_loss,
        nouveauSL: newSL.toFixed(5),
        entry: entryPrice.toFixed(5),
        direction: position.direction
      });
    } catch (error) {
      console.error('Erreur marquage TP1:', error);
    }
  }

  async closePosition(position, closeReason, exitPrice, pnl) {
    try {
      const { error } = await supabase
        .from('positions')
        .update({
          status: 'CLOSED',
          exit_price: exitPrice,
          close_reason: closeReason,
          pnl: pnl,
          closed_at: new Date().toISOString()
        })
        .eq('id', position.id);

      if (error) throw error;

      console.log(`✅ Position fermée: ${closeReason}, PnL: ${pnl.toFixed(2)}`);

      await this.updateUserStats(position.user_id);

      this.stopMonitoring();

      if (this.callbacks.onPositionClosed) {
        this.callbacks.onPositionClosed(position, closeReason, exitPrice, pnl);
      }

      return true;
    } catch (error) {
      console.error('Erreur fermeture position:', error);
      return false;
    }
  }

  async updateUserStats(userId) {
    try {
      const { data: positions, error } = await supabase
        .from('positions')
        .select('pnl, status')
        .eq('user_id', userId)
        .eq('status', 'CLOSED');

      if (error) throw error;

      if (!positions || positions.length === 0) return;

      const wins = positions.filter(p => parseFloat(p.pnl) > 0).length;
      const losses = positions.filter(p => parseFloat(p.pnl) <= 0).length;
      const totalPnL = positions.reduce((sum, p) => sum + parseFloat(p.pnl || 0), 0);
      const totalTrades = positions.length;
      const winrate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;

      console.log('📊 Stats mises à jour:', {
        wins,
        losses,
        totalPnL: totalPnL.toFixed(2),
        totalTrades,
        winrate: `${winrate}%`
      });

      return {
        wins,
        losses,
        totalPnL,
        totalTrades,
        winrate: parseFloat(winrate)
      };
    } catch (error) {
      console.error('Erreur mise à jour stats:', error);
      return null;
    }
  }

  async getPositionHistory(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'CLOSED')
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      return [];
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Surveillance position arrêtée');
    }
  }

  setCallback(eventName, callback) {
    if (this.callbacks.hasOwnProperty(eventName)) {
      this.callbacks[eventName] = callback;
    }
  }

  clearCallbacks() {
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key] = null;
    });
  }
}

export const positionManager = new PositionManager();
