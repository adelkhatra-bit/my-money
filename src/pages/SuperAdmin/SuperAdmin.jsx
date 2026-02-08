import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './SuperAdmin.module.css';

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditForm, setCreditForm] = useState({
    market: 'BTC',
    credits: '',
    action: 'add'
  });
  const [trialRequests, setTrialRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadUsers();
    loadTrialRequests();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        const usersWithStats = await Promise.all(
          profiles.map(async (profile) => {
            const { data: positions } = await supabase
              .from('positions')
              .select('*')
              .eq('user_id', profile.id);

            const { data: credits } = await supabase
              .from('position_credits')
              .select('*')
              .eq('user_id', profile.id);

            const totalPnL = positions?.reduce((sum, p) => sum + (p.pnl || 0), 0) || 0;
            const wins = positions?.filter(p => p.status === 'TP1_HIT' || p.status === 'TP2_HIT').length || 0;
            const losses = positions?.filter(p => p.status === 'SL_HIT').length || 0;

            const positionsByMarket = {
              BTC: positions?.filter(p => p.market === 'BTC' && p.status === 'OPEN').length || 0,
              ETH: positions?.filter(p => p.market === 'ETH' && p.status === 'OPEN').length || 0,
              NASDAQ: positions?.filter(p => p.market === 'NASDAQ' && p.status === 'OPEN').length || 0,
              GOLD: positions?.filter(p => p.market === 'GOLD' && p.status === 'OPEN').length || 0
            };

            return {
              ...profile,
              stats: {
                totalTrades: positions?.length || 0,
                wins,
                losses,
                winrate: positions?.length > 0 ? ((wins / positions.length) * 100).toFixed(1) : 0,
                totalPnL: totalPnL.toFixed(2)
              },
              credits: credits || [],
              positionsByMarket
            };
          })
        );

        setUsers(usersWithStats);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrialRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('free_trial_requests')
        .select('*, user_profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading trial requests:', error);
        setTrialRequests([]);
        return;
      }

      setTrialRequests(requests || []);
    } catch (error) {
      console.error('Error loading trial requests:', error);
      setTrialRequests([]);
    }
  };

  const handleApproveTrial = async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('approve_free_trial', {
        request_id: requestId,
        credits_to_grant: 5
      });

      if (error) throw error;

      if (data && data.success) {
        alert('✅ Test gratuit approuvé');
        loadTrialRequests();
        loadUsers();
      } else {
        alert('❌ ' + (data?.error || 'Erreur'));
      }
    } catch (error) {
      console.error('Error approving trial:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const handleRejectTrial = async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('reject_free_trial', {
        request_id: requestId
      });

      if (error) throw error;

      if (data && data.success) {
        alert('✅ Demande refusée');
        loadTrialRequests();
      } else {
        alert('❌ ' + (data?.error || 'Erreur'));
      }
    } catch (error) {
      console.error('Error rejecting trial:', error);
      alert('❌ Erreur: ' + error.message);
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      const creditsAmount = parseInt(creditForm.credits);

      const { data: existingCredits } = await supabase
        .from('position_credits')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('market', creditForm.market)
        .maybeSingle();

      if (existingCredits) {
        const newTotal = creditForm.action === 'add'
          ? existingCredits.total_credits + creditsAmount
          : creditsAmount;

        await supabase
          .from('position_credits')
          .update({
            total_credits: newTotal
          })
          .eq('id', existingCredits.id);
      } else {
        await supabase
          .from('position_credits')
          .insert({
            user_id: selectedUser.id,
            market: creditForm.market,
            total_credits: creditsAmount,
            used_credits: 0
          });
      }

      const actionText = creditForm.action === 'add' ? 'ajoutés à' : 'définis pour';
      alert(`${creditsAmount} crédits ${creditForm.market} ${actionText} ${selectedUser.email}`);
      setCreditForm({ market: 'BTC', credits: '', action: 'add' });
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Erreur lors de l\'ajout des crédits');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Super Admin Panel</h1>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Utilisateurs</div>
            <div className={styles.statValue}>{users.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Trades Total</div>
            <div className={styles.statValue}>
              {users.reduce((sum, u) => sum + u.stats.totalTrades, 0)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Demandes en attente</div>
            <div className={styles.statValue}>{trialRequests.length}</div>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Utilisateurs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Demandes de Test ({trialRequests.length})
        </button>
      </div>

      {selectedUser && (
        <div className={styles.creditModal}>
          <div className={styles.modalContent}>
            <h3>Gérer les positions de {selectedUser.email}</h3>

            <form onSubmit={handleAddCredits} className={styles.creditForm}>
              <div className={styles.formGroup}>
                <label>Action</label>
                <select
                  value={creditForm.action}
                  onChange={(e) => setCreditForm({ ...creditForm, action: e.target.value })}
                >
                  <option value="add">Ajouter des positions</option>
                  <option value="set">Définir le total de positions</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Marché</label>
                <select
                  value={creditForm.market}
                  onChange={(e) => setCreditForm({ ...creditForm, market: e.target.value })}
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="GOLD">GOLD</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  {creditForm.action === 'add' ? 'Nombre de positions à ajouter' : 'Nouveau total de positions'}
                </label>
                <input
                  type="number"
                  value={creditForm.credits}
                  onChange={(e) => setCreditForm({ ...creditForm, credits: e.target.value })}
                  placeholder="Ex: 25"
                  min="0"
                  required
                />
                <small style={{color: '#64748b', marginTop: '0.5rem', display: 'block'}}>
                  1 position = 1 signal de trading utilisable
                </small>
              </div>

              {selectedUser.credits.find(c => c.market === creditForm.market) && (
                <div className={styles.currentCredits}>
                  <strong>Actuellement:</strong> {selectedUser.credits.find(c => c.market === creditForm.market)?.remaining_credits || 0} positions restantes
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedUser(null)} className={styles.cancelBtn}>
                  Annuler
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {creditForm.action === 'add' ? 'Ajouter' : 'Définir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className={styles.requestsSection}>
          {trialRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <div className={styles.requestsTable}>
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Date de demande</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trialRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.user_profiles?.email || 'Email non disponible'}</td>
                      <td>{new Date(request.created_at).toLocaleString('fr-FR')}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApproveTrial(request.id)}
                          >
                            ✓ Approuver (5 positions)
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRejectTrial(request.id)}
                          >
                            ✗ Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className={styles.usersTable}>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Admin</th>
                <th>Trades</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Winrate</th>
                <th>PnL Total</th>
                <th>Positions Ouvertes</th>
                <th>Crédits Restants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={user.is_super_admin ? styles.adminBadge : styles.userBadge}>
                      {user.is_super_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>{user.stats.totalTrades}</td>
                  <td className={styles.positive}>{user.stats.wins}</td>
                  <td className={styles.negative}>{user.stats.losses}</td>
                  <td>{user.stats.winrate}%</td>
                  <td className={parseFloat(user.stats.totalPnL) >= 0 ? styles.positive : styles.negative}>
                    ${user.stats.totalPnL}
                  </td>
                  <td>
                    <div className={styles.positionsList}>
                      {['BTC', 'ETH', 'NASDAQ', 'GOLD'].map((market) => {
                        const count = user.positionsByMarket[market];
                        if (count > 0) {
                          return (
                            <div key={market} className={styles.positionBadge}>
                              {market}: {count}
                            </div>
                          );
                        }
                        return null;
                      })}
                      {Object.values(user.positionsByMarket).every(v => v === 0) && (
                        <span className={styles.noPositions}>Aucune</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {user.credits.length > 0 ? (
                      <div className={styles.creditsList}>
                        {user.credits.map((credit) => (
                          <div key={credit.id} className={styles.creditBadge}>
                            {credit.market}: {credit.remaining_credits}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noCredits}>Aucun</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setSelectedUser(user)}
                    >
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
