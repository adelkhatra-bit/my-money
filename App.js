// src/App.jsx
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Si tes chemins sont différents, adapte-les ici :
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Factures from './pages/Factures/Factures';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import TestAI from './TestAI';

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/inscription" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/factures" element={<Factures />} />
          <Route path="/test" element={<TestAI />} />
          <Route path="*" element={<div>Page introuvable.</div>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
