import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './Referral.module.css';

const Referral = () => {
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const { data: refData } = await supabase
        .from('referral_system')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (refData) {
        setReferralData(refData);

        const { data: refLinks } = await supabase
          .from('referral_links')
          .select(`
            *,
            referred_user:referred_user_id (
              email
            )
          `)
          .eq('referrer_id', profile.id)
          .order('created_at', { ascending: false });

        setReferrals(refLinks || []);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!referralData) return;

    const referralUrl = `${window.location.origin}/signup?ref=${referralData.referral_code}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    if (!referralData) return;

    const referralUrl = `${window.location.origin}/signup?ref=${referralData.referral_code}`;
    const message = encodeURIComponent('Rejoins-moi sur cette plateforme de trading IA ! Reçois 3 positions offertes à l\'inscription 🚀');

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${message}%20${encodeURIComponent(referralUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${message}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement...</div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erreur lors du chargement des données de parrainage</div>
      </div>
    );
  }

  const referralUrl = `${window.location.origin}/signup?ref=${referralData.referral_code}`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Programme de Parrainage</h1>
        <p className={styles.subtitle}>
          Gagne des positions gratuites en invitant tes amis
        </p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statValue}>{referralData.referrals_count}</div>
          <div className={styles.statLabel}>Filleuls</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎁</div>
          <div className={styles.statValue}>{referralData.bonus_credits_earned}</div>
          <div className={styles.statLabel}>Positions gagnées</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statValue}>
            {referralData.referrals_count > 0
              ? `${((referrals.filter(r => r.status === 'VALIDATED').length / referralData.referrals_count) * 100).toFixed(0)}%`
              : '0%'}
          </div>
          <div className={styles.statLabel}>Taux de validation</div>
        </div>
      </div>

      <div className={styles.rewardInfo}>
        <h3>Comment ça marche ?</h3>
        <div className={styles.rewardGrid}>
          <div className={styles.rewardCard}>
            <div className={styles.rewardIcon}>🎯</div>
            <h4>Pour toi</h4>
            <p>+5 positions par filleul validé</p>
          </div>
          <div className={styles.rewardCard}>
            <div className={styles.rewardIcon}>🎁</div>
            <h4>Pour ton filleul</h4>
            <p>+3 positions à l'inscription</p>
          </div>
          <div className={styles.rewardCard}>
            <div className={styles.rewardIcon}>⚡</div>
            <h4>Limite</h4>
            <p>Max 50 positions bonus/mois</p>
          </div>
        </div>
      </div>

      <div className={styles.linkSection}>
        <h3>Ton lien de parrainage</h3>
        <div className={styles.linkBox}>
          <input
            type="text"
            value={referralUrl}
            readOnly
            className={styles.linkInput}
          />
          <button onClick={copyReferralLink} className={styles.copyBtn}>
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>
        </div>
      </div>

      <div className={styles.shareSection}>
        <h3>Partager sur</h3>
        <div className={styles.shareGrid}>
          <button onClick={() => shareOnPlatform('whatsapp')} className={styles.shareBtn}>
            <span className={styles.shareIcon}>💬</span>
            WhatsApp
          </button>
          <button onClick={() => shareOnPlatform('telegram')} className={styles.shareBtn}>
            <span className={styles.shareIcon}>✈️</span>
            Telegram
          </button>
          <button onClick={() => shareOnPlatform('twitter')} className={styles.shareBtn}>
            <span className={styles.shareIcon}>🐦</span>
            Twitter
          </button>
          <button onClick={() => shareOnPlatform('facebook')} className={styles.shareBtn}>
            <span className={styles.shareIcon}>📘</span>
            Facebook
          </button>
          <button onClick={() => shareOnPlatform('linkedin')} className={styles.shareBtn}>
            <span className={styles.shareIcon}>💼</span>
            LinkedIn
          </button>
        </div>
      </div>

      {referrals.length > 0 && (
        <div className={styles.referralsSection}>
          <h3>Mes filleuls</h3>
          <div className={styles.referralsTable}>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref) => (
                  <tr key={ref.id}>
                    <td>{ref.referred_user?.email || 'Non disponible'}</td>
                    <td>
                      <span className={`${styles.status} ${styles[ref.status.toLowerCase()]}`}>
                        {ref.status === 'VALIDATED' ? '✓ Validé' :
                         ref.status === 'CREDITED' ? '✓ Crédité' : '⏳ En attente'}
                      </span>
                    </td>
                    <td>{new Date(ref.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {ref.bonus_credited ? (
                        <span className={styles.credited}>+5 positions</span>
                      ) : (
                        <span className={styles.pending}>En attente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referral;
