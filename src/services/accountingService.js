import { supabase } from '../lib/supabaseClient';

export async function calculateRealStats(accountId) {
  if (!accountId) {
    throw new Error('accountId requis pour calculer les stats');
  }

  const { data: account } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();

  if (!account) {
    throw new Error('Compte trading non trouvé');
  }

  const { data: closedPositions } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)
    .in('status', ['CLOSED', 'STOPPED'])
    .order('closed_at', { ascending: true });

  const { data: openPosition } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'OPEN')
    .maybeSingle();

  const initialBalance = parseFloat(account.initial_balance || account.capital || 0);
  let realizedPnL = 0;
  let totalGains = 0;
  let totalLosses = 0;
  let winCount = 0;
  let lossCount = 0;

  if (closedPositions && closedPositions.length > 0) {
    closedPositions.forEach(pos => {
      const pnl = parseFloat(pos.realized_pnl || 0);
      realizedPnL += pnl;

      if (pnl > 0) {
        totalGains += pnl;
        winCount++;
      } else if (pnl < 0) {
        totalLosses += Math.abs(pnl);
        lossCount++;
      }
    });
  }

  let unrealizedPnL = 0;
  if (openPosition) {
    unrealizedPnL = parseFloat(openPosition.unrealized_pnl || 0);
  }

  const currentBalance = initialBalance + realizedPnL;
  const equity = currentBalance + unrealizedPnL;
  const totalTrades = closedPositions ? closedPositions.length : 0;
  const winrate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  await supabase
    .from('trading_accounts')
    .update({
      current_balance: currentBalance.toFixed(2),
      total_pnl: realizedPnL.toFixed(2),
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);

  return {
    accountId,
    initialBalance,
    currentBalance,
    equity,
    realizedPnL,
    unrealizedPnL,
    totalGains,
    totalLosses,
    totalTrades,
    winCount,
    lossCount,
    winrate,
    profitFactor: totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0
  };
}

export async function updatePositionPnL(positionId, currentPrice) {
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('id', positionId)
    .maybeSingle();

  if (!position || position.status !== 'OPEN') {
    return null;
  }

  const entryPrice = parseFloat(position.entry_price);
  const size = parseFloat(position.position_size);
  const direction = position.direction;

  let unrealizedPnL = 0;

  if (direction === 'LONG') {
    unrealizedPnL = (currentPrice - entryPrice) * size;
  } else if (direction === 'SHORT') {
    unrealizedPnL = (entryPrice - currentPrice) * size;
  }

  await supabase
    .from('positions')
    .update({
      unrealized_pnl: unrealizedPnL.toFixed(2),
      updated_at: new Date().toISOString()
    })
    .eq('id', positionId);

  return unrealizedPnL;
}

export async function closePosition(positionId, exitPrice, closeReason = 'TP') {
  const { data: position } = await supabase
    .from('positions')
    .select('*')
    .eq('id', positionId)
    .maybeSingle();

  if (!position) {
    throw new Error('Position non trouvée');
  }

  if (position.status !== 'OPEN') {
    throw new Error('Position déjà fermée');
  }

  const entryPrice = parseFloat(position.entry_price);
  const size = parseFloat(position.position_size);
  const direction = position.direction;

  let realizedPnL = 0;

  if (direction === 'LONG') {
    realizedPnL = (exitPrice - entryPrice) * size;
  } else if (direction === 'SHORT') {
    realizedPnL = (entryPrice - exitPrice) * size;
  }

  const now = new Date().toISOString();
  const finalStatus = closeReason === 'SL' ? 'STOPPED' : 'CLOSED';

  await supabase
    .from('positions')
    .update({
      status: finalStatus,
      exit_price: exitPrice.toFixed(2),
      realized_pnl: realizedPnL.toFixed(2),
      unrealized_pnl: 0,
      close_reason: closeReason,
      closed_at: now,
      updated_at: now
    })
    .eq('id', positionId);

  await supabase.from('position_history').insert({
    position_id: positionId,
    account_id: position.account_id,
    user_id: position.user_id,
    market: position.market,
    platform: position.platform,
    direction,
    entry_price: entryPrice,
    exit_price: exitPrice,
    position_size: size,
    realized_pnl: realizedPnL,
    close_reason: closeReason,
    tp1_reached: position.tp1_reached || false,
    be_moved: position.be_moved || false,
    entry_time: position.entry_time || position.created_at,
    closed_at: now
  });

  await calculateRealStats(position.account_id);

  console.log(`✅ Position ${positionId} fermée: ${closeReason}, PnL: ${realizedPnL.toFixed(2)}`);

  return {
    positionId,
    exitPrice,
    realizedPnL,
    closeReason
  };
}

export async function getAccountSummary(accountId) {
  const stats = await calculateRealStats(accountId);

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    stats,
    recentPositions: positions || []
  };
}

export async function getDailyStats(accountId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { data: todayPositions } = await supabase
    .from('positions')
    .select('*')
    .eq('account_id', accountId)
    .in('status', ['CLOSED', 'STOPPED'])
    .gte('closed_at', todayISO);

  let dailyPnL = 0;
  let dailyTrades = 0;
  let dailyWins = 0;

  if (todayPositions) {
    dailyTrades = todayPositions.length;
    todayPositions.forEach(pos => {
      const pnl = parseFloat(pos.realized_pnl || 0);
      dailyPnL += pnl;
      if (pnl > 0) dailyWins++;
    });
  }

  return {
    dailyPnL,
    dailyTrades,
    dailyWins,
    dailyWinrate: dailyTrades > 0 ? (dailyWins / dailyTrades) * 100 : 0
  };
}

export async function cleanupGhostPositions() {
  try {
    await supabase.rpc('cleanup_ghost_positions');
    console.log('✅ Nettoyage positions fantômes effectué');
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur nettoyage positions fantômes:', error);
    return { success: false, error };
  }
}
