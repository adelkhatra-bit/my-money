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
    risk_per_trade_percent: '0.5',
    max_daily_loss: '',
    max_total_loss: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: accountsData } = await supabase
          .from('trading_accounts')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        setAccounts(accountsData || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        alert('Profil introuvable');
        return;
      }

      const { error } = await supabase
        .from('trading_accounts')
        .insert({
          user_id: profile.id,
          ...newAccount,
          capital: parseFloat(newAccount.capital),
          risk_per_trade_percent: parseFloat(newAccount.risk_per_trade_percent),
          max_daily_loss: newAccount.max_daily_loss ? parseFloat(newAccount.max_daily_loss) : null,
          max_total_loss: newAccount.max_total_loss ? parseFloat(newAccount.max_total_loss) : null
        });

      if (error) throw error;

      alert('Compte créé avec succès !');
      setShowForm(false);
      setNewAccount({
        name: '',
        platform: 'binance',
        market: 'BTC',
        capital: '',
        risk_per_trade_percent: '0.5',
        max_daily_loss: '',
        max_total_loss: ''
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
              <label>Capital ($) *</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.capital}
                onChange={(e) => setNewAccount({ ...newAccount, capital: e.target.value })}
                placeholder="Ex: 10000"
                required
              />
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
              <label>Perte max journalière ($)</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.max_daily_loss}
                onChange={(e) => setNewAccount({ ...newAccount, max_daily_loss: e.target.value })}
                placeholder="Optionnel"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Perte max totale ($)</label>
              <input
                type="number"
                step="0.01"
                value={newAccount.max_total_loss}
                onChange={(e) => setNewAccount({ ...newAccount, max_total_loss: e.target.value })}
                placeholder="Optionnel"
              />
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
                  <span className={styles.detailValue}>${account.capital.toFixed(2)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Risque/trade:</span>
                  <span className={styles.detailValue}>{account.risk_per_trade_percent}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
