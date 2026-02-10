import React from 'react';
import styles from './Health.module.css';

function Health() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>✅ SITE OK</h1>
        <div className={styles.info}>
          <p><strong>Status:</strong> Running</p>
          <p><strong>Build:</strong> Success</p>
          <p><strong>React:</strong> Loaded</p>
          <p><strong>Router:</strong> Active</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        </div>
        <div className={styles.links}>
          <a href="/login">→ Login</a>
          <a href="/signup">→ Signup</a>
          <a href="/">→ Dashboard</a>
        </div>
      </div>
    </div>
  );
}

export default Health;
