import { supabase } from '../lib/supabaseClient';
import { activeTradingContext } from './activeTradingContext';

const locks = new Map();
const LOCK_TTL = 20000;

export async function acquireLock(userId, actionType = 'position_creation') {
  const lockKey = `${userId}_${actionType}`;
  const now = Date.now();

  const existingLock = locks.get(lockKey);
  if (existingLock && (now - existingLock.timestamp) < LOCK_TTL) {
    const remainingSeconds = Math.ceil((LOCK_TTL - (now - existingLock.timestamp)) / 1000);
    throw new Error(
      `Action déjà en cours. Veuillez patienter ${remainingSeconds} secondes.`
    );
  }

  const context = activeTradingContext.getContext();
  if (!context) {
    throw new Error('Context trading non initialisé');
  }

  if (context.lockState || context.positionState) {
    throw new Error('Une position est déjà active. Fermez-la avant d\'ouvrir une nouvelle position.');
  }

  const { data: existingPosition } = await supabase
    .from('positions')
    .select('id, market, platform, status')
    .eq('account_id', context.accountId)
    .eq('status', 'open')
    .maybeSingle();

  if (existingPosition) {
    throw new Error(
      `Position déjà ouverte sur ${existingPosition.market} (${existingPosition.platform}). ` +
      `ID: ${existingPosition.id}. Fermez-la avant d'en ouvrir une nouvelle.`
    );
  }

  locks.set(lockKey, {
    timestamp: now,
    userId,
    actionType
  });

  console.log(`🔒 Lock acquis: ${lockKey}`);

  return {
    lockKey,
    release: () => releaseLock(lockKey)
  };
}

export function releaseLock(lockKey) {
  if (locks.has(lockKey)) {
    locks.delete(lockKey);
    console.log(`🔓 Lock libéré: ${lockKey}`);
  }
}

export function isLocked(userId, actionType = 'position_creation') {
  const lockKey = `${userId}_${actionType}`;
  const existingLock = locks.get(lockKey);

  if (!existingLock) return false;

  const now = Date.now();
  if ((now - existingLock.timestamp) >= LOCK_TTL) {
    locks.delete(lockKey);
    return false;
  }

  return true;
}

export async function hasActivePosition(accountId) {
  const { data: position, error } = await supabase
    .from('positions')
    .select('id')
    .eq('account_id', accountId)
    .eq('status', 'open')
    .maybeSingle();

  if (error) {
    console.error('Error checking active position:', error);
    return false;
  }

  return !!position;
}

export async function checkAndDebitCredit(userId, market, cost = 1) {
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('credits')
    .eq('user_id', userId)
    .eq('market', market)
    .maybeSingle();

  if (!wallet) {
    throw new Error(`Aucun wallet trouvé pour le marché ${market}`);
  }

  const currentCredits = parseInt(wallet.credits) || 0;

  if (currentCredits < cost) {
    throw new Error(
      `Crédits insuffisants pour ${market}. ` +
      `Disponible: ${currentCredits}, Requis: ${cost}`
    );
  }

  const { error } = await supabase
    .from('user_wallets')
    .update({ credits: currentCredits - cost })
    .eq('user_id', userId)
    .eq('market', market);

  if (error) {
    console.error('Error debiting credit:', error);
    throw new Error('Échec du débit des crédits');
  }

  console.log(`💳 ${cost} crédit(s) débité(s) pour ${market}. Reste: ${currentCredits - cost}`);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    market,
    amount: -cost,
    type: 'debit',
    reason: 'position_opened',
    balance_after: currentCredits - cost
  });

  return currentCredits - cost;
}

export async function refundCredit(userId, market, amount = 1, reason = 'position_cancelled') {
  const { data: wallet } = await supabase
    .from('user_wallets')
    .select('credits')
    .eq('user_id', userId)
    .eq('market', market)
    .maybeSingle();

  if (!wallet) {
    console.warn(`Wallet not found for refund: ${userId} / ${market}`);
    return;
  }

  const currentCredits = parseInt(wallet.credits) || 0;
  const newBalance = currentCredits + amount;

  const { error } = await supabase
    .from('user_wallets')
    .update({ credits: newBalance })
    .eq('user_id', userId)
    .eq('market', market);

  if (error) {
    console.error('Error refunding credit:', error);
    return;
  }

  console.log(`💰 ${amount} crédit(s) remboursé(s) pour ${market}. Nouveau solde: ${newBalance}`);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    market,
    amount,
    type: 'credit',
    reason,
    balance_after: newBalance
  });
}

export function cleanupExpiredLocks() {
  const now = Date.now();
  for (const [key, lock] of locks.entries()) {
    if ((now - lock.timestamp) >= LOCK_TTL) {
      locks.delete(key);
      console.log(`🧹 Lock expiré nettoyé: ${key}`);
    }
  }
}

setInterval(cleanupExpiredLocks, 30000);
