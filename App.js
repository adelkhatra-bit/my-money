// src/App.js
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Navbar from "./publique/src/firebase/components/Navbar";
import Home from "./publique/home/lib/pages/home/Home";
import Login from "./publique/home/lib/pages/login/Login";
import Signup from "./publique/home/lib/pages/signup/Signup";
import TestAI from "./home/lib/login/TestAI";

export default function App() {
  return (
    <div>
      <Navbar />
      <nav style={{ padding: 8 }}>
        <Link to="/">Accueil</Link>{" | "}
        <Link to="/login">Connexion</Link>{" | "}
        <Link to="/signup">Inscription</Link>{" | "}
        <Link to="/test">Test AI</Link>
      </nav>

      <main style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/test" element={<TestAI />} />
        </Routes>
      </main>
    </div>
  );
}