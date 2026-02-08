import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './Profil.module.css';

export default function Profil() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [superAdminCode, setSuperAdminCode] = useState('');
  const [showSuperAdminInput, setShowSuperAdminInput] = useState(false);
  const [credits, setCredits] = useState([]);
  const [requestingTrial, setRequestingTrial] = useState(false);
  const [trialMessage, setTrialMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        const { data: creditsData } = await supabase
          .from('position_credits')
          .select('*')
          .eq('user_id', profileData.id);

        setCredits(creditsData || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminAccess = async () => {
    try {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'super_admin_code')
        .maybeSingle();

      const correctCode = settings?.setting_value?.code || '2709';

      if (superAdminCode === correctCode) {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
          .from('user_profiles')
          .update({ is_super_admin: true })
          .eq('user_id', user.id);

        alert('Accès Super Admin accordé !');
        navigate('/admin');
      } else {
        alert('Code incorrect');
      }
    } catch (error) {
      console.error('Error validating super admin code:', error);
    }
  };

  const requestFreeTrial = async () => {
    setRequestingTrial(true);
    setTrialMessage('');

    try {
      const { data, error } = await supabase.rpc('request_free_trial');

      if (error) {
        console.error('Error requesting trial:', error);
        setTrialMessage('❌ Erreur: ' + error.message);
        return;
      }

      if (data && data.success) {
        setTrialMessage('✅ ' + data.message + ' En attente d\'approbation par l\'administrateur.');
        setTimeout(() => {
          loadProfile();
        }, 2000);
      } else if (data && data.error) {
        setTrialMessage('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Error requesting trial:', error);
      setTrialMessage('❌ Erreur lors de la demande');
    } finally {
      setRequestingTrial(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!profile) {
    return <div className={styles.error}>Profil introuvable</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mon Profil</h1>
        {!profile.is_super_admin && (
          <button
            className={styles.secretBtn}
            onClick={() => setShowSuperAdminInput(!showSuperAdminInput)}
          >
            🔐
          </button>
        )}
      </div>

      {showSuperAdminInput && (
        <div className={styles.superAdminSection}>
          <h3>Accès Super Admin</h3>
          <div className={styles.codeInput}>
            <input
              type="password"
              value={superAdminCode}
              onChange={(e) => setSuperAdminCode(e.target.value)}
              placeholder="Code d'accès"
            />
            <button onClick={handleSuperAdminAccess} className={styles.validateBtn}>
              Valider
            </button>
          </div>
        </div>
      )}

      <div className={styles.infoSection}>
        <h3>Informations</h3>
        <div className={styles.infoCard}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{profile.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Statut:</span>
            <span className={styles.value}>
              {profile.is_super_admin ? '👑 Super Admin' : '👤 Utilisateur'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Compte créé:</span>
            <span className={styles.value}>
              {new Date(profile.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.creditsSection}>
        <div className={styles.creditsHeader}>
          <h3>Mes Crédits</h3>
          {!profile.has_used_trial && (
            <button
              onClick={requestFreeTrial}
              disabled={requestingTrial}
              className={styles.giftBtn}
            >
              {requestingTrial ? '⏳ Envoi...' : '🎁 Demander Mon Cadeau (5 positions)'}
            </button>
          )}
        </div>

        {trialMessage && (
          <div className={`${styles.message} ${trialMessage.startsWith('✅') ? styles.success : styles.error}`}>
            {trialMessage}
          </div>
        )}

        {credits.length > 0 ? (
          <div className={styles.creditsGrid}>
            {credits.map((credit) => (
              <div key={credit.id} className={styles.creditCard}>
                <div className={styles.marketIcon}>
                  {credit.market === 'BTC' ? '₿' : credit.market === 'NASDAQ' ? '📈' : '🥇'}
                </div>
                <div className={styles.marketName}>{credit.market}</div>
                <div className={styles.creditAmount}>
                  <span className={styles.remaining}>{credit.remaining_credits}</span>
                  <span className={styles.separator}>/</span>
                  <span className={styles.total}>{credit.total_credits}</span>
                </div>
                <div className={styles.creditLabel}>positions restantes</div>
                {credit.bonus_credits > 0 && (
                  <div className={styles.bonusBadge}>
                    +{credit.bonus_credits} bonus
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noCredits}>
            <p>Aucun crédit disponible</p>
            {profile.has_used_trial ? (
              <p className={styles.hint}>Utilisez le système de parrainage pour gagner des positions gratuites !</p>
            ) : (
              <p className={styles.hint}>Demandez votre cadeau de bienvenue pour commencer !</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.actionsSection}>
        <button onClick={() => navigate('/accounts')} className={styles.actionBtn}>
          Gérer mes comptes
        </button>
        <button onClick={() => navigate('/referral')} className={styles.actionBtn}>
          Programme de parrainage
        </button>
        {profile.is_super_admin && (
          <button onClick={() => navigate('/admin')} className={styles.adminBtn}>
            Super Admin Panel
          </button>
        )}
      </div>
    </div>
  );
}
