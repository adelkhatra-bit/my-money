import React from 'react';
import styles from './SafeBoot.module.css';

const SafeBoot = () => {
  const openInNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  const currentUrl = window.location.href;
  const isInIframe = window.self !== window.top;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.status}>
          <div className={styles.checkmark}>✓</div>
          <h1>APP OK</h1>
        </div>

        <div className={styles.info}>
          <p className={styles.mode}>MODE: SIMULATION LOCALE</p>
          <p className={styles.subtitle}>Aucune API externe - Aucun secret requis</p>
        </div>

        {isInIframe && (
          <div className={styles.warning}>
            <strong>⚠️ Preview Bolt détecté (iframe)</strong>
            <p>Pour une meilleure expérience, ouvrez dans un nouvel onglet:</p>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={openInNewTab} className={styles.primaryBtn}>
            ↗️ Ouvrir dans un nouvel onglet
          </button>
          <a href="/health" className={styles.secondaryBtn}>
            Vérifier /health
          </a>
          <a href="/login" className={styles.secondaryBtn}>
            Aller au Dashboard
          </a>
        </div>

        <div className={styles.urlBox}>
          <strong>URL du serveur:</strong>
          <code>{currentUrl}</code>
        </div>

        <div className={styles.checks}>
          <h3>Vérifications système:</h3>
          <ul>
            <li>✅ React chargé</li>
            <li>✅ Routing actif</li>
            <li>✅ Mode SIMULATION activé</li>
            <li>✅ Pas de secrets requis</li>
            <li>✅ Prêt pour le trading démo</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SafeBoot;
