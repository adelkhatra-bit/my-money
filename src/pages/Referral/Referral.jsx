import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import styles from './Referral.module.css';

const Referral = () => {
  const [profileId, setProfileId] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({ total: 0, validated: 0, bonusEarned: 0 });
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

      if (!profile) {
        setLoading(false);
        return;
      }

      setProfileId(profile.id);
      setReferralCode(profile.id.substring(0, 8).toUpperCase());

      const { data: myReferrals } = await supabase
        .from('referrals')
        .select(`
          *,
          referred:referred_id (
            email
          )
        `)
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      setReferrals(myReferrals || []);

      const validated = myReferrals?.filter(r => r.status === 'validated').length || 0;
      const bonusEarned = validated * 5;

      setStats({
        total: myReferrals?.length || 0,
        validated,
        bonusEarned
      });
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnPlatform = (platform) => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
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

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

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
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Filleuls</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statValue}>{stats.validated}</div>
          <div className={styles.statLabel}>Validés</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎁</div>
          <div className={styles.statValue}>{stats.bonusEarned}</div>
          <div className={styles.statLabel}>Positions gagnées</div>
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
        <p className={styles.referralCode}>Code: <strong>{referralCode}</strong></p>
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
                    <td>{ref.referred?.email || 'Non disponible'}</td>
                    <td>
                      <span className={`${styles.status} ${styles[ref.status]}`}>
                        {ref.status === 'validated' ? '✓ Validé' :
                         ref.status === 'rejected' ? '✗ Rejeté' : '⏳ En attente'}
                      </span>
                    </td>
                    <td>{new Date(ref.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {ref.bonus_granted ? (
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
