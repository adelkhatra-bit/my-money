import React, { useState } from "react";
import { liaRun } from "../../lib/liaApi";
import "./TestAI.css";

export default function TestAI() {
  const [prompt, setPrompt] = useState("");
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  const pushLog = (msg) => setLogs((l) => [msg, ...l].slice(0, 50));

  async function run(cmd) {
    try {
      setBusy(true);
      pushLog(▶ ${cmd});
      const r = await liaRun(cmd);
      pushLog((r.ok ? "✅ " : "❌ ") + (r.message || JSON.stringify(r)));
    } catch (e) {
      pushLog("❌ " + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h1>Test IAx</h1>

      <div className="row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='ex: gen:page TableauBord'
        />
        <button disabled={busy || !prompt.trim()} onClick={() => run(prompt.trim())}>
          Lancer
        </button>
      </div>

      <div className="row" style={{ gap: 8, marginTop: 12 }}>
        <button disabled={busy} onClick={() => run("guard")}>Guard (lint+tests)</button>
        <button disabled={busy} onClick={() => run("fix")}>Fix (eslint+prettier)</button>
        <button disabled={busy} onClick={() => run("dev")}>Relancer Dev</button>
        <button disabled={busy} onClick={() => run("open src/App.jsx")}>Ouvrir App.jsx</button>
      </div>

      <h3 style={{ marginTop: 16 }}>Logs</h3>
      <ul className="logs">
        {logs.map((l, i) => <li key={i}>{l}</li>)}
      </ul>

      <p className="hint">
        Idées : <code>gen:page Profil</code>, <code>gen:component Card</code>, <code>open src/pages/Factures/Factures.jsx</code>
      </p>
    </div>
  );
}