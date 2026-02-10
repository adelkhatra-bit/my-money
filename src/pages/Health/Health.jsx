import React from 'react';
import styles from './Health.module.css';

function Health() {
  const openInNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  const isInIframe = window.self !== window.top;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>✅ SITE OK</h1>
        <div className={styles.info}>
          <p><strong>Status:</strong> Running</p>
          <p><strong>Build:</strong> Success</p>
          <p><strong>React:</strong> Loaded</p>
          <p><strong>Router:</strong> Active</p>
          <p><strong>Mode:</strong> SIMULATION (No secrets required)</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
        </div>

        {isInIframe && (
          <div className={styles.warning}>
            <strong>⚠️ Preview Bolt (iframe) détecté</strong>
            <p>Ouvrez dans un nouvel onglet pour une meilleure expérience</p>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={openInNewTab} className={styles.primaryBtn}>
            ↗️ Ouvrir dans un nouvel onglet
          </button>
        </div>

        <div className={styles.links}>
          <a href="/safeboot">→ SafeBoot</a>
          <a href="/login">→ Login</a>
          <a href="/signup">→ Signup</a>
          <a href="/">→ Dashboard</a>
        </div>
      </div>
    </div>
  );
}

export default Health;
