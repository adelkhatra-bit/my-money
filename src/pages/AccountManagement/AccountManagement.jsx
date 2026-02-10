import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { positionService } from '../../services/positionService';
import { userPreferencesService } from '../../services/userPreferences';
import styles from './AccountManagement.module.css';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [userProfileId, setUserProfileId] = useState(null);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMarket, setFilterMarket] = useState('all');
  const [newAccount, setNewAccount] = useState({
    name: '',
    platform: 'binance',
    market: 'BTC',
    capital: '',
    capitalOption: 'preset',
    risk_per_trade_percent: '0.5',
    max_daily_loss: '',
    max_total_loss: '',
    currency: 'USD'
  });

  const capitalPresets = [200, 400, 600, 800, 1000, 1500, 2000, 3000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 700000];
  const ftmoPresets = [10000, 25000, 50000, 100000, 200000];

  const calculateRiskLimits = (capital, platform, market) => {
    const cap = parseFloat(capital);
    if (!cap || cap < 200) return { daily: '', total: '', risk: '' };

    let dailyPercent, totalPercent, riskPercent;

    if ((market === 'NASDAQ' || market === 'GOLD') && (platform === 'ftmo' || platform === 'topstep')) {
      dailyPercent = 5;
      totalPercent = 10;
      riskPercent = 1;
    } else if (cap < 500) {
      dailyPercent = 3;
      totalPercent = 15;
      riskPercent = 0.5;
    } else if (cap < 1000) {
      dailyPercent = 3;
      totalPercent = 15;
      riskPercent = 0.5;
    } else if (cap < 5000) {
      dailyPercent = 4;
      totalPercent = 20;
      riskPercent = 1;
    } else if (cap < 10000) {
      dailyPercent = 4;
      totalPercent = 20;
      riskPercent = 1;
    } else {
      dailyPercent = 5;
      totalPercent = 25;
      riskPercent = 1;
    }

    return {
      daily: (cap * dailyPercent / 100).toFixed(2),
      total: (cap * totalPercent / 100).toFixed(2),
      risk: riskPercent.toString()
    };
  };

  const handleCapitalChange = (value) => {
    const limits = calculateRiskLimits(value, newAccount.platform, newAccount.market);
    setNewAccount({
      ...newAccount,
      capital: value,
      max_daily_loss: limits.daily,
      max_total_loss: limits.total,
      risk_per_trade_percent: limits.risk
    });
  };

  const handleMarketChange = (market) => {
    const newPlatform = (market === 'NASDAQ' || market === 'GOLD') ? 'ftmo' : 'binance';
    const limits = calculateRiskLimits(newAccount.capital, newPlatform, market);
    setNewAccount({
      ...newAccount,
      market: market,
      platform: newPlatform,
      max_daily_loss: limits.daily,
      max_total_loss: limits.total,
      risk_per_trade_percent: limits.risk
    });
  };

  const handlePlatformChange = (platform) => {
    const limits = calculateRiskLimits(newAccount.capital, platform, newAccount.market);
    setNewAccount({
      ...newAccount,
      platform: platform,
      max_daily_loss: limits.daily,
      max_total_loss: limits.total,
      risk_per_trade_percent: limits.risk
    });
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setLoading(false);
        return;
      }

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            is_super_admin: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          alert('Impossible de créer votre profil. Veuillez vous reconnecter.');
          setLoading(false);
          return;
        }

        profile = newProfile;
      }

      setUserProfileId(profile.id);

      const prefs = await userPreferencesService.getPreferences(profile.id);
      if (prefs && prefs.active_account_id) {
        setActiveAccountId(prefs.active_account_id);
        console.log('✅ Compte actif chargé depuis préférences:', prefs.active_account_id);
      }

      const { data: accountsData } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (accountsData) {
        const accountsWithStats = await Promise.all(
          accountsData.map(async (account) => {
            const stats = await calculateAccountStats(profile.id, account.id);
            return { ...account, stats };
          })
        );
        setAccounts(accountsWithStats);
      } else {
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAccountStats = async (userId, accountId) => {
    try {
      const stats = await positionService.getAccountStats(userId, accountId);

      console.log('📊 [AccountManagement] Stats loaded from DB:', {
        accountId,
        totalTrades: stats.total_trades,
        wins: stats.wins,
        losses: stats.losses,
        realizedPnl: stats.realized_pnl,
        winrate: stats.winrate
      });

      return {
        totalPnl: stats.realized_pnl,
        wins: stats.wins,
        losses: stats.losses,
        totalTrades: stats.total_trades,
        winrate: stats.winrate
      };
    } catch (error) {
      console.error('Error loading account stats:', error);
      return {
        totalPnl: 0,
        wins: 0,
        losses: 0,
        totalTrades: 0,
        winrate: 0
      };
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        alert('Erreur: ' + profileError.message);
        return;
      }

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            is_super_admin: false
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          alert('Impossible de créer votre profil. Détails: ' + createError.message + '. Veuillez vous reconnecter.');
          return;
        }

        profile = newProfile;
      }

      if (!newAccount.capital || parseFloat(newAccount.capital) < 200) {
        alert('Le capital doit être d\'au moins 200 ' + newAccount.currency);
        return;
      }

      const { error } = await supabase
        .from('trading_accounts')
        .insert({
          user_id: profile.id,
          name: newAccount.name,
          platform: newAccount.platform,
          market: newAccount.market,
          capital: parseFloat(newAccount.capital),
          currency: newAccount.currency,
          risk_per_trade_percent: parseFloat(newAccount.risk_per_trade_percent),
          max_daily_loss: newAccount.max_daily_loss ? parseFloat(newAccount.max_daily_loss) : null,
          max_total_loss: newAccount.max_total_loss ? parseFloat(newAccount.max_total_loss) : null
        });

      if (error) {
        console.error('Error creating trading account:', error);
        throw error;
      }

      alert('Compte créé avec succès !');
      setShowForm(false);
      setNewAccount({
        name: '',
        platform: 'binance',
        market: 'BTC',
        capital: '',
        capitalOption: 'preset',
        risk_per_trade_percent: '0.5',
        max_daily_loss: '',
        max_total_loss: '',
        currency: 'USD'
      });
      loadAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Erreur lors de la création du compte: ' + error.message);
    }
  };

  const toggleAccountStatus = async (accountId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('trading_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId);

      if (error) throw error;

      loadAccounts();
    } catch (error) {
      console.error('Error toggling account:', error);
    }
  };

  const startEditAccount = (account) => {
    setEditingAccount({
      ...account,
      capitalOption: 'custom'
    });
    setShowForm(false);
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();

    try {
      if (!editingAccount.capital || parseFloat(editingAccount.capital) < 200) {
        alert('Le capital doit être d\'au moins 200 ' + editingAccount.currency);
        return;
      }

      const { error } = await supabase
        .from('trading_accounts')
        .update({
          name: editingAccount.name,
          platform: editingAccount.platform,
          market: editingAccount.market,
          capital: parseFloat(editingAccount.capital),
          currency: editingAccount.currency,
          risk_per_trade_percent: parseFloat(editingAccount.risk_per_trade_percent),
          max_daily_loss: editingAccount.max_daily_loss ? parseFloat(editingAccount.max_daily_loss) : null,
          max_total_loss: editingAccount.max_total_loss ? parseFloat(editingAccount.max_total_loss) : null
        })
        .eq('id', editingAccount.id);

      if (error) {
        console.error('Error updating account:', error);
        throw error;
      }

      alert('Compte mis à jour avec succès !');
      setEditingAccount(null);
      loadAccounts();
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
    }
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le compte "${accountName}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      alert('Compte supprimé avec succès');
      loadAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleEditCapitalChange = (value) => {
    const limits = calculateRiskLimits(value);
    setEditingAccount({
      ...editingAccount,
      capital: value,
      max_daily_loss: limits.daily,
      max_total_loss: limits.total
    });
  };

  const handleSetActiveAccount = async (accountId, market, platform) => {
    try {
      if (!userProfileId) {
        alert('Erreur: Profil utilisateur non chargé');
        return;
      }

      await userPreferencesService.setActiveAccount(userProfileId, accountId, market, platform);
      setActiveAccountId(accountId);

      console.log('✅ [AccountManagement] Compte actif défini:', {
        accountId,
        market,
        platform
      });

      alert('Compte actif défini avec succès !');
    } catch (error) {
      console.error('Error setting active account:', error);
      alert('Erreur lors de la définition du compte actif: ' + error.message);
    }
  };

  const filteredAccounts = accounts.filter(account => {
    if (filterStatus !== 'all' && filterStatus === 'active' && !account.is_active) return false;
    if (filterStatus !== 'all' && filterStatus === 'inactive' && account.is_active) return false;
    if (filterMarket !== 'all' && account.market !== filterMarket) return false;
    return true;
  });

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestion des Comptes de Trading</h1>
        <button
          className={styles.addBtn}
          onClick={() => {
            setShowForm(!showForm);
            setEditingAccount(null);
          }}
        >
          {showForm ? 'Annuler' : '+ Ajouter un compte'}
        </button>
      </div>

      {!showForm && !editingAccount && accounts.length > 0 && (
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label>Statut:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Marché:</label>
            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tous</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>
          <div className={styles.filterInfo}>
            {filteredAccounts.length} compte{filteredAccounts.length > 1 ? 's' : ''} affiché{filteredAccounts.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {editingAccount && (
        <form onSubmit={handleUpdateAccount} className={styles.form}>
          <h2>Modifier le compte: {editingAccount.name}</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nom du compte *</label>
              <input
                type="text"
                value={editingAccount.name}
                onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                placeholder="Ex: Binance Personnel"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Plateforme *</label>
              <select
                value={editingAccount.platform}
                onChange={(e) => setEditingAccount({ ...editingAccount, platform: e.target.value })}
                required
              >
                <option value="binance">Binance</option>
                <option value="bybit">Bybit</option>
                <option value="coinbase">Coinbase</option>
                <option value="ftmo">FTMO</option>
                <option value="topstep">TopStep</option>
                <option value="apex">Apex</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Marché *</label>
              <select
                value={editingAccount.market}
                onChange={(e) => setEditingAccount({ ...editingAccount, market: e.target.value })}
                required
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="NASDAQ">NASDAQ</option>
                <option value="GOLD">GOLD</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Devise *</label>
              <select
                value={editingAccount.currency}
                onChange={(e) => {
                  setEditingAccount({ ...editingAccount, currency: e.target.value });
                  if (editingAccount.capital) {
                    handleEditCapitalChange(editingAccount.capital);
                  }
                }}
                required
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Capital *</label>
              <input
                type="number"
                step="1"
                min="200"
                value={editingAccount.capital}
                onChange={(e) => handleEditCapitalChange(e.target.value)}
                placeholder="Entrer un montant"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Risque par trade (%) *</label>
              <input
                type="number"
                step="0.1"
                value={editingAccount.risk_per_trade_percent}
                onChange={(e) => setEditingAccount({ ...editingAccount, risk_per_trade_percent: e.target.value })}
                placeholder="Ex: 0.5"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Perte max journalière ({editingAccount.currency})</label>
              <input
                type="number"
                step="0.01"
                value={editingAccount.max_daily_loss || ''}
                onChange={(e) => setEditingAccount({ ...editingAccount, max_daily_loss: e.target.value })}
                placeholder="Auto-calculé"
              />
              <small className={styles.helperText}>
                {editingAccount.capital && parseFloat(editingAccount.capital) >= 200 && editingAccount.max_daily_loss
                  ? `${((parseFloat(editingAccount.max_daily_loss) / parseFloat(editingAccount.capital)) * 100).toFixed(1)}% du capital`
                  : 'Calculé automatiquement selon votre capital'}
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Perte max totale ({editingAccount.currency})</label>
              <input
                type="number"
                step="0.01"
                value={editingAccount.max_total_loss || ''}
                onChange={(e) => setEditingAccount({ ...editingAccount, max_total_loss: e.target.value })}
                placeholder="Auto-calculé"
              />
              <small className={styles.helperText}>
                {editingAccount.capital && parseFloat(editingAccount.capital) >= 200 && editingAccount.max_total_loss
                  ? `${((parseFloat(editingAccount.max_total_loss) / parseFloat(editingAccount.capital)) * 100).toFixed(1)}% du capital`
                  : 'Calculé automatiquement selon votre capital'}
              </small>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn}>
              Sauvegarder les modifications
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setEditingAccount(null)}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleCreateAccount} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Nom du compte *</label>
              <input
                type="text"
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Ex: Binance Personnel"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Plateforme *</label>
              <select
                value={newAccount.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                required
              >
                {(newAccount.market === 'BTC' || newAccount.market === 'ETH') && (
                  <>
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="coinbase">Coinbase</option>
                  </>
                )}
                {(newAccount.market === 'NASDAQ' || newAccount.market === 'GOLD') && (
                  <>
                    <option value="ftmo">FTMO</option>
                    <option value="topstep">TopStep</option>
                    <option value="apex">Apex</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Marché *</label>
              <select
                value={newAccount.market}
                onChange={(e) => handleMarketChange(e.target.value)}
                required
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="NASDAQ">NASDAQ</option>
                <option value="GOLD">GOLD</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Devise *</label>
              <select
                value={newAccount.currency}
                onChange={(e) => {
                  setNewAccount({ ...newAccount, currency: e.target.value });
                  if (newAccount.capital) {
                    handleCapitalChange(newAccount.capital);
                  }
                }}
                required
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Capital *</label>
              {newAccount.capitalOption === 'preset' ? (
                <select
                  value={newAccount.capital}
                  onChange={(e) => handleCapitalChange(e.target.value)}
                  required
                >
                  <option value="">Sélectionner un montant</option>
                  {((newAccount.market === 'NASDAQ' || newAccount.market === 'GOLD') && (newAccount.platform === 'ftmo' || newAccount.platform === 'topstep')
                    ? ftmoPresets
                    : capitalPresets
                  ).map((amount) => (
                    <option key={amount} value={amount}>
                      {amount.toLocaleString()} {newAccount.currency}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  step="1"
                  min="200"
                  value={newAccount.capital}
                  onChange={(e) => handleCapitalChange(e.target.value)}
                  placeholder="Entrer un montant"
                  required
                />
              )}
              <button
                type="button"
                className={styles.toggleCapitalBtn}
                onClick={() => setNewAccount({
                  ...newAccount,
                  capitalOption: newAccount.capitalOption === 'preset' ? 'custom' : 'preset',
                  capital: ''
                })}
              >
                {newAccount.capitalOption === 'preset' ? 'Autre montant' : 'Montants prédéfinis'}
              </button>
            </div>

            <div className={styles.formGroup}>
              <label>Risque par trade (%) *</label>
              <input
                type="number"
                step="0.1"
                value={newAccount.risk_per_trade_percent}
                onChange={(e) => setNewAccount({ ...newAccount, risk_per_trade_percent: e.target.value })}
                placeholder="Ex: 0.5"
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Perte max journalière ({newAccount.currency})</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.max_daily_loss}
                onChange={(e) => setNewAccount({ ...newAccount, max_daily_loss: e.target.value })}
                placeholder="Auto-calculé"
              />
              <small className={styles.helperText}>
                {newAccount.capital && parseFloat(newAccount.capital) >= 200 && newAccount.max_daily_loss
                  ? `${((parseFloat(newAccount.max_daily_loss) / parseFloat(newAccount.capital)) * 100).toFixed(1)}% du capital`
                  : 'Calculé automatiquement selon votre capital'}
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Perte max totale ({newAccount.currency})</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.max_total_loss}
                onChange={(e) => setNewAccount({ ...newAccount, max_total_loss: e.target.value })}
                placeholder="Auto-calculé"
              />
              <small className={styles.helperText}>
                {newAccount.capital && parseFloat(newAccount.capital) >= 200 && newAccount.max_total_loss
                  ? `${((parseFloat(newAccount.max_total_loss) / parseFloat(newAccount.capital)) * 100).toFixed(1)}% du capital`
                  : 'Calculé automatiquement selon votre capital'}
              </small>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Créer le compte
          </button>
        </form>
      )}

      <div className={styles.accountsList}>
        {accounts.length === 0 ? (
          <div className={styles.empty}>
            Aucun compte configuré. Créez-en un pour commencer.
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className={styles.empty}>
            Aucun compte ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          filteredAccounts.map((account) => (
            <div key={account.id} className={`${styles.accountCard} ${!account.is_active ? styles.inactive : ''} ${activeAccountId === account.id ? styles.activeAccount : ''}`}>
              <div className={styles.accountHeader}>
                <div className={styles.accountTitleRow}>
                  <h3>{account.name}</h3>
                  {activeAccountId === account.id && (
                    <span className={styles.activeBadge}>⭐ COMPTE ACTIF</span>
                  )}
                </div>
                <div className={styles.headerActions}>
                  {activeAccountId !== account.id && account.is_active && (
                    <button
                      className={styles.setActiveBtn}
                      onClick={() => handleSetActiveAccount(account.id, account.market, account.platform)}
                      title="Définir comme compte actif"
                    >
                      ⭐ Définir actif
                    </button>
                  )}
                  <button
                    className={styles.toggleBtn}
                    onClick={() => toggleAccountStatus(account.id, account.is_active)}
                  >
                    {account.is_active ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => startEditAccount(account)}
                    title="Modifier le compte"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteAccount(account.id, account.name)}
                    title="Supprimer le compte"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.accountDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Plateforme:</span>
                  <span className={styles.detailValue}>{account.platform}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Marché:</span>
                  <span className={styles.detailValue}>{account.market}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Capital Initial:</span>
                  <span className={styles.detailValue}>
                    {account.capital.toFixed(2)} {account.currency || 'USD'}
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Risque/trade:</span>
                  <span className={styles.detailValue}>{account.risk_per_trade_percent}%</span>
                </div>
                {account.max_daily_loss && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Perte max/jour:</span>
                    <span className={styles.detailValue}>
                      {account.max_daily_loss.toFixed(2)} {account.currency || 'USD'}
                    </span>
                  </div>
                )}
                {account.max_total_loss && (
                  <div className={styles.detail}>
                    <span className={styles.detailLabel}>Perte max totale:</span>
                    <span className={styles.detailValue}>
                      {account.max_total_loss.toFixed(2)} {account.currency || 'USD'}
                    </span>
                  </div>
                )}
              </div>

              {account.stats && (
                <div className={styles.statsSection}>
                  <h4 className={styles.statsTitle}>📊 Statistiques de Trading</h4>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>💰 Balance Actuelle</div>
                      <div className={styles.statValue}>
                        {(account.capital + account.stats.totalPnl).toFixed(2)} {account.currency || 'USD'}
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>📊 PnL Total</div>
                      <div className={`${styles.statValue} ${account.stats.totalPnl >= 0 ? styles.positive : styles.negative}`}>
                        {account.stats.totalPnl >= 0 ? '+' : ''}{account.stats.totalPnl.toFixed(2)} {account.currency || 'USD'}
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>📈 Total Trades</div>
                      <div className={styles.statValue}>{account.stats.totalTrades}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>✅ Gains</div>
                      <div className={`${styles.statValue} ${styles.positive}`}>{account.stats.wins}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>❌ Pertes</div>
                      <div className={`${styles.statValue} ${styles.negative}`}>{account.stats.losses}</div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statLabel}>🎯 Winrate</div>
                      <div className={`${styles.statValue} ${account.stats.winrate >= 50 ? styles.positive : account.stats.winrate > 0 ? '' : styles.neutral}`}>
                        {account.stats.winrate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
