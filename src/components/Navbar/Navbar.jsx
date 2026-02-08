import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import styles from './Navbar.module.css';

const Navbar = ({ isSuperAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <Link to="/">AI Trading Platform</Link>
      </div>

      <div className={styles.links}>
        <Link
          to="/"
          className={location.pathname === '/' ? styles.active : ''}
        >
          Dashboard
        </Link>
        <Link
          to="/accounts"
          className={location.pathname === '/accounts' ? styles.active : ''}
        >
          Mes Comptes
        </Link>
        {isSuperAdmin && (
          <Link
            to="/admin"
            className={location.pathname === '/admin' ? styles.active : ''}
          >
            Super Admin
          </Link>
        )}
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        Déconnexion
      </button>
    </nav>
  );
};

export default Navbar;
