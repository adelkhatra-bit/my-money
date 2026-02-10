import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import Dashboard from './pages/Dashboard/Dashboard';
import TradingDashboard from './pages/TradingDashboard/TradingDashboard';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import AccountManagement from './pages/AccountManagement/AccountManagement';
import Referral from './pages/Referral/Referral';
import SuperAdmin from './pages/SuperAdmin/SuperAdmin';
import Profil from './pages/Profil/Profil';
import LegalDisclaimer from './components/LegalDisclaimer/LegalDisclaimer';
import Navbar from './components/Navbar/Navbar';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkUser();

    localStorage.setItem('disclaimer_accepted', 'true');

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
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase error:', error);
      }
      setUser(session?.user || null);
      if (session?.user) {
        await checkSuperAdmin(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSuperAdmin = async (userId) => {
    try {
      console.log('Checking super admin for user:', userId);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_super_admin')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Super admin check result:', { profile, error });

      if (error) {
        console.error('Error in super admin check:', error);
        setIsSuperAdmin(false);
        return;
      }

      const isSA = profile?.is_super_admin === true;
      console.log('Setting isSuperAdmin to:', isSA);
      setIsSuperAdmin(isSA);
    } catch (error) {
      console.error('Error checking super admin:', error);
      setIsSuperAdmin(false);
    }
  };

  const acceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  if (showDisclaimer) {
    return <LegalDisclaimer onAccept={acceptDisclaimer} />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        {user && <Navbar isSuperAdmin={isSuperAdmin} />}
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
          element={user ? <TradingDashboard /> : <Navigate to="/login" />}
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
          element={user && isSuperAdmin ? <SuperAdmin /> : <Navigate to="/" />}
        />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
