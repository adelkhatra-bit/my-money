// server.js
const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const path = require("path");

const app = express();
app.use(express.json());

// Autoriser l'appli React (3000)
app.use(cors({ origin: "http://localhost:3000" }));

// Simple auth par TOKEN (facultatif) => mets LIA_TOKEN=xxxxx dans .env
const REQUIRED_TOKEN = process.env.LIA_TOKEN || "";
app.use((req, res, next) => {
  if (!REQUIRED_TOKEN) return next();
  const token = req.header("x-lia-token");
  if (token === REQUIRED_TOKEN) return next();
  return res.status(401).json({ ok: false, message: "TOKEN manquant ou invalide" });
});

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { shell: true, stdio: "pipe", ...opts });
    let out = "", err = "";
    p.stdout.on("data", d => (out += d.toString()));
    p.stderr.on("data", d => (err += d.toString()));
    p.on("close", code => resolve({ code, out, err }));
  });
}

app.post("/run", async (req, res) => {
  const { command = "" } = req.body;
  const [verb, ...rest] = command.trim().split(/\s+/);

  try {
    switch (verb) {
      case "fix": {
        const l = await run("npx", ["eslint", ".", "--ext", ".js,.jsx", "--fix"]);
        const p = await run("npx", ["prettier", "--write", "."]);
        return res.json({ ok: true, message: ESLint:\n${l.out || l.err}\nPrettier:\n${p.out || p.err} });
      }
      case "test": {
        const j = await run("npx", ["jest", "--passWithNoTests", "--json", "--outputFile=.lia-jest.json"]);
        try {
          const results = require(path.resolve(".lia-jest.json"));
          if (results.numFailedTests > 0) {
            const first = results.testResults.find(t => t.status === "failed");
            if (first && first.name) exec(code "${first.name}");
            return res.json({ ok: false, message: Tests échoués: ${results.numFailedTests}. Fichier ouvert. });
          }
          return res.json({ ok: true, message: "✅ Tous les tests passent." });
        } catch (e) {
          return res.json({ ok: j.code === 0, message: j.out || j.err });
        }
      }
      case "dev": {
        await run("npx", ["kill-port", "3000"]);
        exec("npm start");
        const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
        exec(${opener} http://localhost:3000);
        return res.json({ ok: true, message: "Dev relancé sur http://localhost:3000" });
      }
      case "open": {
        const file = rest.join(" ") || "src/App.jsx";
        exec(code "${file}");
        return res.json({ ok: true, message: Ouverture de ${file} });
      }
      case "gen:page": {
        const name = rest.join(" ");
        const r = await run("npx", ["plop", "page", "--", name=${name}]);
        return res.json({ ok: r.code === 0, message: r.out || r.err });
      }
      case "gen:component": {
        const name = rest.join(" ");
        const r = await run("npx", ["plop", "component", "--", name=${name}]);
        return res.json({ ok: r.code === 0, message: r.out || r.err });
      }
      case "guard": {
        const f = await run("npx", ["eslint", ".", "--ext", ".js,.jsx", "--fix"]);
        const j = await run("npx", ["jest", "--passWithNoTests", "--json", "--outputFile=.lia-jest.json"]);
        try {
          const results = require(path.resolve(".lia-jest.json"));
          if (results.numFailedTests > 0) {
            const first = results.testResults.find(t => t.status === "failed");
            if (first && first.name) exec(code "${first.name}");
            return res.json({ ok: false, message: ESLint ok. Tests KO (${results.numFailedTests}). Fichier ouvert. });
          }
          return res.json({ ok: true, message: "✅ Lint + tests OK." });
        } catch {
          return res.json({ ok: j.code === 0, message: f.out + "\n" + (j.out || j.err) });
        }
      }
      default:
        return res.json({ ok: false, message: Commande inconnue: ${command} });
    }
  } catch (e) {
    return res.json({ ok: false, message: String(e) });
  }
});

app.listen(5000, () => console.log("✅ Lia en écoute sur http://localhost:5000"));