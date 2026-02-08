import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './SuperAdmin.module.css';

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditForm, setCreditForm] = useState({
    market: 'BTC',
    credits: ''
  });

  useEffect(() => {
    loadUsers();
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

            return {
              ...profile,
              stats: {
                totalTrades: positions?.length || 0,
                wins,
                losses,
                winrate: positions?.length > 0 ? ((wins / positions.length) * 100).toFixed(1) : 0,
                totalPnL: totalPnL.toFixed(2)
              },
              credits: credits || []
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
        await supabase
          .from('position_credits')
          .update({
            total_credits: existingCredits.total_credits + creditsAmount
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

      alert(`${creditsAmount} crédits ${creditForm.market} ajoutés à ${selectedUser.email}`);
      setCreditForm({ market: 'BTC', credits: '' });
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
        </div>
      </div>

      {selectedUser && (
        <div className={styles.creditModal}>
          <div className={styles.modalContent}>
            <h3>Ajouter des crédits à {selectedUser.email}</h3>

            <form onSubmit={handleAddCredits} className={styles.creditForm}>
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
                <label>Nombre de crédits</label>
                <input
                  type="number"
                  value={creditForm.credits}
                  onChange={(e) => setCreditForm({ ...creditForm, credits: e.target.value })}
                  placeholder="Ex: 25"
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setSelectedUser(null)} className={styles.cancelBtn}>
                  Annuler
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <th>Crédits</th>
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
                  {user.credits.length > 0 ? (
                    <div className={styles.creditsList}>
                      {user.credits.map((credit) => (
                        <div key={credit.id} className={styles.creditBadge}>
                          {credit.market}: {credit.remaining_credits}/{credit.total_credits}
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
                    + Crédits
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdmin;
