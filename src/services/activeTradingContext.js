import { supabase } from '../lib/supabaseClient';

class ActiveTradingContext {
  constructor() {
    this.context = null;
    this.listeners = [];
  }

  async initialize(userId) {
    if (!userId) {
      throw new Error('UserId required to initialize trading context');
    }

    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!preferences) {
      return null;
    }

    const { data: account } = await supabase
      .from('trading_accounts')
      .eq('user_id', userId)
      .eq('id', preferences.active_account_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!account) {
      return null;
    }

    this.context = {
      userId,
      accountId: account.id,
      market: preferences.preferred_market || account.market,
      platform: account.platform,
      timeframe: preferences.preferred_timeframe || '15m',
      mode: account.account_type,
      capitalBase: parseFloat(account.initial_balance),
      currentBalance: parseFloat(account.current_balance),
      riskPercent: parseFloat(account.risk_per_trade),
      maxDailyLoss: parseFloat(account.max_daily_loss),
      maxTotalLoss: parseFloat(account.max_total_loss),
      stopLossValue: parseFloat(account.stop_loss_value || 0),
      currency: account.currency || 'USD',
      positionState: null,
      lockState: false
    };

    await this.checkActivePosition();
    this.notifyListeners();

    return this.context;
  }

  async checkActivePosition() {
    if (!this.context) return;

    const { data: activePosition } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', this.context.accountId)
      .eq('status', 'open')
      .maybeSingle();

    if (activePosition) {
      this.context.positionState = activePosition;
      this.context.lockState = true;
    } else {
      this.context.positionState = null;
      this.context.lockState = false;
    }
  }

  getContext() {
    return this.context;
  }

  isLocked() {
    return this.context?.lockState || false;
  }

  hasActivePosition() {
    return this.context?.positionState !== null;
  }

  async updateMarket(market) {
    if (!this.context) return;

    const { data: account } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', this.context.userId)
      .eq('market', market)
      .eq('status', 'active')
      .maybeSingle();

    if (!account) {
      throw new Error(`No active account found for market ${market}`);
    }

    this.context.market = market;
    this.context.accountId = account.id;
    this.context.platform = account.platform;
    this.context.capitalBase = parseFloat(account.initial_balance);
    this.context.currentBalance = parseFloat(account.current_balance);
    this.context.riskPercent = parseFloat(account.risk_per_trade);
    this.context.maxDailyLoss = parseFloat(account.max_daily_loss);
    this.context.maxTotalLoss = parseFloat(account.max_total_loss);
    this.context.stopLossValue = parseFloat(account.stop_loss_value || 0);
    this.context.currency = account.currency || 'USD';

    await supabase
      .from('user_preferences')
      .update({
        active_account_id: account.id,
        preferred_market: market
      })
      .eq('user_id', this.context.userId);

    await this.checkActivePosition();
    this.notifyListeners();
  }

  async updateTimeframe(timeframe) {
    if (!this.context) return;

    this.context.timeframe = timeframe;

    await supabase
      .from('user_preferences')
      .update({ preferred_timeframe: timeframe })
      .eq('user_id', this.context.userId);

    this.notifyListeners();
  }

  async updatePlatform(platform) {
    if (!this.context) return;

    const { data: account } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('user_id', this.context.userId)
      .eq('market', this.context.market)
      .eq('platform', platform)
      .eq('status', 'active')
      .maybeSingle();

    if (!account) {
      throw new Error(`No active account found for platform ${platform}`);
    }

    this.context.platform = platform;
    this.context.accountId = account.id;
    this.context.capitalBase = parseFloat(account.initial_balance);
    this.context.currentBalance = parseFloat(account.current_balance);
    this.context.riskPercent = parseFloat(account.risk_per_trade);
    this.context.maxDailyLoss = parseFloat(account.max_daily_loss);
    this.context.maxTotalLoss = parseFloat(account.max_total_loss);
    this.context.stopLossValue = parseFloat(account.stop_loss_value || 0);
    this.context.currency = account.currency || 'USD';

    await this.checkActivePosition();
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.context));
  }

  async lockForPosition(positionId) {
    if (!this.context) return;

    const { data: position } = await supabase
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .maybeSingle();

    if (position) {
      this.context.positionState = position;
      this.context.lockState = true;
      this.notifyListeners();
    }
  }

  async unlock() {
    if (!this.context) return;

    this.context.positionState = null;
    this.context.lockState = false;
    this.notifyListeners();
  }

  validateContext() {
    if (!this.context) {
      return { valid: false, error: 'Context not initialized' };
    }

    if (!this.context.accountId) {
      return { valid: false, error: 'No active account' };
    }

    if (!this.context.market) {
      return { valid: false, error: 'Market not selected' };
    }

    if (!this.context.platform) {
      return { valid: false, error: 'Platform not selected' };
    }

    if (this.context.lockState) {
      return { valid: false, error: 'Position already active' };
    }

    return { valid: true };
  }
}

export const activeTradingContext = new ActiveTradingContext();
