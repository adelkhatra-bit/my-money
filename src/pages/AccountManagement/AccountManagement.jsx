import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './AccountManagement.module.css';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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

  const calculateRiskLimits = (capital) => {
    const cap = parseFloat(capital);
    if (!cap || cap < 200) return { daily: '', total: '' };

    let dailyPercent, totalPercent;

    if (cap < 500) {
      dailyPercent = 3;
      totalPercent = 15;
    } else if (cap < 1000) {
      dailyPercent = 3;
      totalPercent = 15;
    } else if (cap < 5000) {
      dailyPercent = 4;
      totalPercent = 20;
    } else if (cap < 10000) {
      dailyPercent = 4;
      totalPercent = 20;
    } else {
      dailyPercent = 5;
      totalPercent = 25;
    }

    return {
      daily: (cap * dailyPercent / 100).toFixed(2),
      total: (cap * totalPercent / 100).toFixed(2)
    };
  };

  const handleCapitalChange = (value) => {
    const limits = calculateRiskLimits(value);
    setNewAccount({
      ...newAccount,
      capital: value,
      max_daily_loss: limits.daily,
      max_total_loss: limits.total
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

      const { data: accountsData } = await supabase
        .from('trading_accounts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      alert('Erreur de chargement: ' + error.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestion des Comptes de Trading</h1>
        <button
          className={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annuler' : '+ Ajouter un compte'}
        </button>
      </div>

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
                onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })}
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
                value={newAccount.market}
                onChange={(e) => setNewAccount({ ...newAccount, market: e.target.value })}
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
                  {capitalPresets.map((amount) => (
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
        ) : (
          accounts.map((account) => (
            <div key={account.id} className={`${styles.accountCard} ${!account.is_active ? styles.inactive : ''}`}>
              <div className={styles.accountHeader}>
                <h3>{account.name}</h3>
                <button
                  className={styles.toggleBtn}
                  onClick={() => toggleAccountStatus(account.id, account.is_active)}
                >
                  {account.is_active ? 'Actif' : 'Inactif'}
                </button>
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
                  <span className={styles.detailLabel}>Capital:</span>
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
