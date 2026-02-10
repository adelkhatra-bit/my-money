import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

let supabase = null;
let Dashboard, TradingDashboard, Login, Signup, AccountManagement, Referral, SuperAdmin, Profil, LegalDisclaimer, Navbar, ErrorBoundary;

try {
  const supabaseModule = require('./lib/supabaseClient');
  supabase = supabaseModule.supabase;
  Dashboard = require('./pages/Dashboard/Dashboard').default;
  TradingDashboard = require('./pages/TradingDashboard/TradingDashboard').default;
  Login = require('./pages/Auth/Login').default;
  Signup = require('./pages/Auth/Signup').default;
  AccountManagement = require('./pages/AccountManagement/AccountManagement').default;
  Referral = require('./pages/Referral/Referral').default;
  SuperAdmin = require('./pages/SuperAdmin/SuperAdmin').default;
  Profil = require('./pages/Profil/Profil').default;
  LegalDisclaimer = require('./components/LegalDisclaimer/LegalDisclaimer').default;
  Navbar = require('./components/Navbar/Navbar').default;
  ErrorBoundary = require('./components/ErrorBoundary/ErrorBoundary').default;
} catch (error) {
  console.error('Erreur lors du chargement des modules:', error);
}

import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setInitError('Impossible de charger Supabase');
      setLoading(false);
      return;
    }

    checkUser();

    localStorage.setItem('disclaimer_accepted', 'true');

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          (async () => {
            setUser(session?.user || null);
            if (session?.user) {
              await checkSuperAdmin(session.user.id);
            }
          })();
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('Erreur onAuthStateChange:', error);
      setInitError(error.message);
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    try {
      console.log('✅ Connexion à Supabase...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      console.log('✅ Session OK');
      setUser(session?.user || null);
      if (session?.user) {
        await checkSuperAdmin(session.user.id);
      }
    } catch (error) {
      console.error('❌ Erreur checkUser:', error);
      setInitError(error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const checkSuperAdmin = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_super_admin')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erreur super admin check:', error);
        setIsSuperAdmin(false);
        return;
      }

      setIsSuperAdmin(profile?.is_super_admin === true);
    } catch (error) {
      console.error('Erreur checkSuperAdmin:', error);
      setIsSuperAdmin(false);
    }
  };

  const acceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  if (initError) {
    return (
      <div className="loading-screen">
        <h1 style={{ color: '#ff1744', marginBottom: '20px' }}>⚠️ Erreur d'initialisation</h1>
        <p style={{ marginBottom: '20px' }}>{initError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#00ff88',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Recharger la page
        </button>
        <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
          Si le problème persiste, videz le cache: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
        <p style={{ marginTop: '10px', fontSize: '12px', opacity: 0.6 }}>
          Connexion à Supabase...
        </p>
      </div>
    );
  }

  if (showDisclaimer && LegalDisclaimer) {
    return <LegalDisclaimer onAccept={acceptDisclaimer} />;
  }

  if (!Dashboard || !TradingDashboard || !Login || !Signup) {
    return (
      <div className="loading-screen">
        <h1 style={{ color: '#ff1744' }}>❌ Erreur de chargement des composants</h1>
        <button onClick={() => window.location.reload()} style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#00ff88',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Recharger
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user && Navbar && <Navbar isSuperAdmin={isSuperAdmin} />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <Signup />}
        />
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/trading"
          element={user ? (ErrorBoundary ? <ErrorBoundary><TradingDashboard /></ErrorBoundary> : <TradingDashboard />) : <Navigate to="/login" />}
        />
        <Route
          path="/accounts"
          element={user ? <AccountManagement /> : <Navigate to="/login" />}
        />
        <Route
          path="/referral"
          element={user ? <Referral /> : <Navigate to="/login" />}
        />
        <Route
          path="/profil"
          element={user ? <Profil /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user && isSuperAdmin && SuperAdmin ? <SuperAdmin /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
