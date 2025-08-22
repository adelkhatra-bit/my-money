import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import Factures from './pages/Factures/Factures';

function Navbar() {
  return (
    <nav style={{ padding: 12, background: '#222' }}>
      <Link to="/" style={{ color: 'white', marginRight: 16 }}>
        Accueil
      </Link>
      <Link to="/login" style={{ color: 'white', marginRight: 16 }}>
        Connexion
      </Link>
      <Link to="/signup" style={{ color: 'white', marginRight: 16 }}>
        Inscription
      </Link>
      <Link to="/factures" style={{ color: 'white' }}>
        Factures
      </Link>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/factures" element={<Factures />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
