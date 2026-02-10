import React from 'react';

function App() {
  return (
    <div style={{
      background: '#1a1a2e',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <h1>🚀 Serveur actif sur http://localhost:3000</h1>
      <p>Si vous voyez ce message, React fonctionne correctement.</p>
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(0, 255, 136, 0.1)',
        borderRadius: '12px',
        border: '2px solid rgba(0, 255, 136, 0.3)'
      }}>
        <h2>✅ Intégration ANTØ Sandbox</h2>
        <p>Les boutons de preuve sont disponibles sur la page Trading.</p>
        <ul style={{ textAlign: 'left', marginTop: '15px' }}>
          <li>📋 Copier preuve ANTO / ANTO_NASDAQ - 1m</li>
          <li>📋 Copier preuve ANTO / ANTO_NASDAQ - 5m</li>
          <li>📋 Copier Gate Proof ANTO_NASDAQ</li>
        </ul>
      </div>
      <div style={{ marginTop: '30px' }}>
        <a href="/login" style={{
          padding: '12px 24px',
          background: '#00ff88',
          color: '#000',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          display: 'inline-block'
        }}>
          Aller à la connexion
        </a>
      </div>
    </div>
  );
}

export default App;
