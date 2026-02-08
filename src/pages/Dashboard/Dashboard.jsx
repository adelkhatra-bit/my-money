import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [credits, setCredits] = useState({ btc: 0, eth: 0, nasdaq: 0, gold: 0 });
  const [hasWelcomeBonus, setHasWelcomeBonus] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data: allCredits } = await supabase
          .from('position_credits')
          .select('*')
          .eq('user_id', profile.id);

        if (allCredits) {
          const creditsMap = {
            btc: 0,
            eth: 0,
            nasdaq: 0,
            gold: 0
          };

          allCredits.forEach(credit => {
            const market = credit.market.toLowerCase();
            creditsMap[market] = credit.remaining_credits || 0;
          });

          setCredits(creditsMap);

          const hasCredits = allCredits.some(c => c.total_credits > 0);
          setHasWelcomeBonus(hasCredits);
        }

        const { data: request } = await supabase
          .from('free_trial_requests')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        setPendingRequest(request);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestWelcomeBonus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Veuillez vous connecter');
        return;
      }

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
        .from('free_trial_requests')
        .insert({
          user_id: profile.id,
          status: 'pending'
        });

      if (error) throw error;

      alert('Demande envoyée ! Un super admin va valider votre cadeau de bienvenue.');
      loadUserData();
    } catch (error) {
      console.error('Error requesting bonus:', error);
      alert('Erreur lors de la demande: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  const totalCredits = credits.btc + credits.eth + credits.nasdaq + credits.gold;
  const needsCredits = totalCredits === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Tableau de Bord</h1>
        <p>Gérez vos crédits et commencez à trader</p>
      </div>

      <div className={styles.creditsSection}>
        <h2>Vos Crédits de Trading</h2>

        {needsCredits && !pendingRequest && (
          <div className={styles.welcomeCard}>
            <div className={styles.giftIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="8" width="18" height="13" rx="2"/>
                <path d="M12 8v13"/>
                <path d="M3 8h18"/>
                <path d="M12 3a3 3 0 0 1 3 3H9a3 3 0 0 1 3-3z"/>
              </svg>
            </div>
            <h3>Cadeau de Bienvenue</h3>
            <p>Recevez vos premiers crédits gratuits pour commencer à trader !</p>
            <button className={styles.welcomeButton} onClick={requestWelcomeBonus}>
              Demander Mon Cadeau
            </button>
          </div>
        )}

        {pendingRequest && pendingRequest.status === 'pending' && (
          <div className={styles.pendingCard}>
            <div className={styles.clockIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3>Demande en Attente</h3>
            <p>Votre demande de cadeau de bienvenue est en cours de validation par un super admin.</p>
          </div>
        )}

        {needsCredits && !pendingRequest && (
          <div className={styles.warningCard}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <strong>Crédits épuisés</strong>
              <p>Rechargez votre compte pour continuer à trader</p>
            </div>
          </div>
        )}

        <div className={styles.creditsGrid}>
          <div className={styles.creditCard}>
            <div className={styles.creditHeader}>
              <div className={styles.cryptoIcon} style={{background: 'linear-gradient(135deg, #f7931a 0%, #f7931a 100%)'}}>
                <span>₿</span>
              </div>
              <h3>Bitcoin</h3>
            </div>
            <div className={styles.creditAmount}>
              <span className={styles.amount}>{credits.btc}</span>
              <span className={styles.label}>crédits</span>
            </div>
          </div>

          <div className={styles.creditCard}>
            <div className={styles.creditHeader}>
              <div className={styles.cryptoIcon} style={{background: 'linear-gradient(135deg, #627eea 0%, #627eea 100%)'}}>
                <span>Ξ</span>
              </div>
              <h3>Ethereum</h3>
            </div>
            <div className={styles.creditAmount}>
              <span className={styles.amount}>{credits.eth}</span>
              <span className={styles.label}>crédits</span>
            </div>
          </div>

          <div className={styles.creditCard}>
            <div className={styles.creditHeader}>
              <div className={styles.cryptoIcon} style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'}}>
                <span>N</span>
              </div>
              <h3>NASDAQ</h3>
            </div>
            <div className={styles.creditAmount}>
              <span className={styles.amount}>{credits.nasdaq}</span>
              <span className={styles.label}>crédits</span>
            </div>
          </div>

          <div className={styles.creditCard}>
            <div className={styles.creditHeader}>
              <div className={styles.cryptoIcon} style={{background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'}}>
                <span>Au</span>
              </div>
              <h3>Gold</h3>
            </div>
            <div className={styles.creditAmount}>
              <span className={styles.amount}>{credits.gold}</span>
              <span className={styles.label}>crédits</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <h2>Actions Rapides</h2>
        <div className={styles.actionsGrid}>
          <a href="/trading" className={styles.actionCard}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM11 7h2v10h-2V7zm4 3h2v7h-2v-7zm-8 2h2v5H7v-5z"/>
            </svg>
            <h3>Commencer à trader</h3>
            <p>Accéder à la plateforme de trading</p>
          </a>

          <a href="/accounts" className={styles.actionCard}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <h3>Gérer mes comptes</h3>
            <p>Configurer vos comptes de trading</p>
          </a>

          <a href="/referral" className={styles.actionCard}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3>Parrainer des amis</h3>
            <p>Gagnez des crédits bonus</p>
          </a>

          {needsCredits && (
            <div className={styles.actionCard} style={{cursor: 'default', opacity: 0.8}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              <h3>Recharger des crédits</h3>
              <p>Packs de trading disponibles prochainement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
