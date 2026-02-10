import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { connectTopstep, disconnectTopstep, getTopstepConnection } from '../../services/topstepAuth';
import styles from './ConnectTopstep.module.css';

export default function ConnectTopstep({ onConnectionChange }) {
  const [showModal, setShowModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    cid: '',
    deviceId: 'trading-platform',
    broker: 'tradovate'
  });

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const connection = await getTopstepConnection(user.id);
    setIsConnected(connection && connection.is_connected);

    if (onConnectionChange) {
      onConnectionChange(connection && connection.is_connected);
    }
  }

  async function handleConnect() {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await connectTopstep(userId, credentials);
      setIsConnected(true);
      setShowModal(false);

      if (onConnectionChange) {
        onConnectionChange(true);
      }

      window.location.reload();
    } catch (err) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!userId) return;

    setLoading(true);

    try {
      await disconnectTopstep(userId);
      setIsConnected(false);

      if (onConnectionChange) {
        onConnectionChange(false);
      }

      window.location.reload();
    } catch (err) {
      setError(err.message || 'Disconnect failed');
    } finally {
      setLoading(false);
    }
  }

  if (isConnected) {
    return (
      <div className={styles.connectedBadge}>
        <span className={styles.statusDot}></span>
        <span>Topstep connecté</span>
        <button
          onClick={handleDisconnect}
          className={styles.disconnectBtn}
          disabled={loading}
        >
          Déconnecter
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={styles.connectBtn}
      >
        <span>🔗</span>
        <span>Connecter Topstep</span>
      </button>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Connecter Topstep (Tradovate)</h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalDescription}>
                Pour activer les données LIVE, connectez votre compte Topstep via Tradovate.
              </p>

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Username Tradovate</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  placeholder="votre_username"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Password Tradovate</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className={styles.formGroup}>
                <label>CID (Client ID)</label>
                <input
                  type="text"
                  value={credentials.cid}
                  onChange={(e) => setCredentials({ ...credentials, cid: e.target.value })}
                  placeholder="Disponible dans votre dashboard Tradovate"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Device ID (optionnel)</label>
                <input
                  type="text"
                  value={credentials.deviceId}
                  onChange={(e) => setCredentials({ ...credentials, deviceId: e.target.value })}
                  placeholder="trading-platform"
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  onClick={() => setShowModal(false)}
                  className={styles.cancelBtn}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConnect}
                  className={styles.submitBtn}
                  disabled={loading || !credentials.username || !credentials.password || !credentials.cid}
                >
                  {loading ? 'Connexion...' : 'Connecter'}
                </button>
              </div>

              <div className={styles.modalHelp}>
                <p>
                  <strong>Où trouver vos credentials ?</strong>
                </p>
                <ul>
                  <li>Username/Password : Vos identifiants Topstep/Tradovate</li>
                  <li>CID : Dashboard Tradovate → Developer → Client ID</li>
                </ul>
                <p>
                  <a href="https://developer.tradovate.com/" target="_blank" rel="noopener noreferrer">
                    Documentation Tradovate →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
