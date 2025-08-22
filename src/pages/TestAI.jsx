import React, { useState } from "react";
import "./TestAI.css";

export default function TestAI() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState([]);

  const runCheck = () => {
    if (!prompt.trim()) return;
    setLogs((l) => [Commande reçue: ${prompt}, ...l]);
    setPrompt("");
  };

  return (
    <div className="card">
      <h1>Test IAx</h1>
      <p>Entre une instruction pour tester le flux “Lia”.</p>

      <div className="row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ex: gen:page TableauBord"
        />
        <button onClick={runCheck}>Lancer</button>
      </div>

      <h3>Logs</h3>
      <ul className="logs">
        {logs.map((l, i) => <li key={i}>{l}</li>)}
      </ul>

      <p className="hint">
        Idées: <code>dev</code>, <code>fix</code>, <code>test</code>, <code>guard</code>, <code>open src/App.jsx</code>, <code>gen:page TableauBord</code>
      </p>
    </div>
  );
}