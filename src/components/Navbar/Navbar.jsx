import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { VERSION, BUILD_HASH } from '../../version';
import styles from './Navbar.module.css';

const Navbar = ({ isSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  console.log('Navbar received isSuperAdmin:', isSuperAdmin);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <Link to="/" className={styles.brandLink}>
          <svg className={styles.brandIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm16 16V5H5v14h14zM11 7h2v10h-2V7zm4 3h2v7h-2v-7zm-8 2h2v5H7v-5z"/>
          </svg>
          <span>AI Trading Platform</span>
          <span className={styles.version}>v{VERSION}+{BUILD_HASH}</span>
        </Link>
      </div>

      <div className={styles.links}>
        <Link
          to="/"
          className={`${styles.navButton} ${location.pathname === '/' ? styles.active : ''}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link
          to="/trading"
          className={`${styles.navButton} ${styles.tradingButton} ${location.pathname === '/trading' ? styles.active : ''}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Trading</span>
        </Link>
        <Link
          to="/accounts"
          className={`${styles.navButton} ${location.pathname === '/accounts' ? styles.active : ''}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>Mes Comptes</span>
        </Link>
        <Link
          to="/referral"
          className={`${styles.navButton} ${location.pathname === '/referral' ? styles.active : ''}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Parrainage</span>
        </Link>
        <Link
          to="/profil"
          className={`${styles.navButton} ${location.pathname === '/profil' ? styles.active : ''}`}
        >
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profil</span>
        </Link>
        {isSuperAdmin && (
          <Link
            to="/admin"
            className={`${styles.navButton} ${styles.adminButton} ${location.pathname === '/admin' ? styles.active : ''}`}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>Super Admin</span>
          </Link>
        )}
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Déconnexion</span>
      </button>
    </nav>
  );
};

export default Navbar;
