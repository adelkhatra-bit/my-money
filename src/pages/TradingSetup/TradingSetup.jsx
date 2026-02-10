import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TradingViewSetup from '../../components/TradingViewSetup/TradingViewSetup';
import styles from './TradingSetup.module.css';

export default function TradingSetup() {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);

  const webhookUrl = process.env.REACT_APP_SUPABASE_URL
    ? `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/tradingview-webhook`
    : 'https://alsftpbjneityeyzwyzz.supabase.co/functions/v1/tradingview-webhook';

  if (showSetup) {
    return <TradingViewSetup webhookUrl={webhookUrl} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Comment veux-tu trader ?</h1>
        <p className={styles.subtitle}>Choisis ta méthode pour commencer</p>
      </div>

      <div className={styles.options}>
        <div className={styles.optionCard} onClick={() => setShowSetup(true)}>
          <div className={styles.badge}>Recommandé</div>
          <div className={styles.icon}>📊</div>
          <h2>Utiliser TradingView</h2>
          <p>Configure des alertes TradingView et laisse le bot trader pour toi</p>
          <ul className={styles.features}>
            <li>✅ Configuration simple en 3 étapes</li>
            <li>✅ Alertes automatiques</li>
            <li>✅ Graphiques professionnels</li>
            <li>✅ Aucune API complexe</li>
          </ul>
          <button className={styles.primaryBtn}>
            Configurer TradingView →
          </button>
        </div>

        <div className={styles.optionCard} data-disabled="true">
          <div className={styles.comingSoon}>Bientôt disponible</div>
          <div className={styles.icon}>🔗</div>
          <h2>Connexion Broker</h2>
          <p>Connecte directement ton broker (Tradovate, Topstep...)</p>
          <ul className={styles.features}>
            <li>⏳ Trading automatique complet</li>
            <li>⏳ Exécution ultra-rapide</li>
            <li>⏳ Données temps réel</li>
            <li>⏳ API avancée</li>
          </ul>
          <button className={styles.disabledBtn} disabled>
            Bientôt disponible
          </button>
        </div>
      </div>

      <div className={styles.help}>
        <h3>Pourquoi TradingView ?</h3>
        <div className={styles.helpGrid}>
          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>🚀</div>
            <h4>Simplicité</h4>
            <p>Pas besoin de Client ID, API Key ou credentials complexes</p>
          </div>
          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>🔒</div>
            <h4>Sécurité</h4>
            <p>Aucun accès direct à ton compte broker</p>
          </div>
          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>⚡</div>
            <h4>Flexibilité</h4>
            <p>Configure tes propres indicateurs et stratégies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
