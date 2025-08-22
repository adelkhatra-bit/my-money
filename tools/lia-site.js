// tools/lia-site.js
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const { execSync, spawnSync } = require("child_process");
const simpleGit = require("simple-git");

function readSpec(specPath) {
  const full = path.resolve(specPath || "site.yaml");
  if (!fs.existsSync(full)) throw new Error(Spec introuvable: ${full});
  const txt = fs.readFileSync(full, "utf8");
  try {
    return /\.json$/i.test(full) ? JSON.parse(txt) : yaml.load(txt);
  } catch (e) {
    throw new Error("Spec invalide (YAML/JSON)");
  }
}

function pascalCase(s) {
  return String(s).replace(/[-_\s]+/g, " ").replace(/\b\w/g, m => m.toUpperCase()).replace(/\s+/g, "");
}

function ensureDir(p) { fse.mkdirpSync(p); }
function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
  console.log("✓", path.relative(process.cwd(), p));
}

function addRouteToApp(appFile, routePath, pageName) {
  let src = fs.readFileSync(appFile, "utf8");
  const importLine = import ${pageName} from "./pages/${pageName}/${pageName}";;
  if (!src.includes(importLine)) src = importLine + "\n" + src;
  const routeLine = `          <Route path="${routePath}" element={<${pageName} />} />`;
  if (!src.includes(routeLine)) src = src.replace(/<Routes>\s*/m, m => m + routeLine + "\n");
  fs.writeFileSync(appFile, src, "utf8");
}

function createPage(name, route) {
  const Page = pascalCase(name);
  const dir = path.resolve("src/pages", Page);
  const jsxPath = path.join(dir, ${Page}.jsx);
  const cssPath = path.join(dir, ${Page}.module.css);
  const jsx = `
import React from "react";
import styles from "./${Page}.module.css";
export default function ${Page}() {
  return (
    <div className={styles.wrapper}>
      <h1>${Page}</h1>
      <p>Page générée par Lia.</p>
    </div>
  );
}`.trim();
  const css = .wrapper{max-width:960px;margin:24px auto;padding:16px};
  writeFile(jsxPath, jsx);
  writeFile(cssPath, css);
  const appFile = fs.existsSync("src/App.jsx") ? "src/App.jsx" : "src/App.js";
  addRouteToApp(appFile, route, Page);
}

async function main() {
  const specPath = process.argv[2] || "site.yaml";
  const spec = readSpec(specPath);

  const git = simpleGit();
  const isRepo = fs.existsSync(".git");
  let checkpoint = false;

  try {
    if (isRepo) {
      await git.add(".");
      await git.commit("checkpoint: before lia-site", { "--allow-empty": null });
      checkpoint = true;
    }

    (spec.pages || []).forEach(p => {
      const route = p.route || /${p.name.toLowerCase()};
      createPage(p.name, route);
    });

    (spec.components || []).forEach(c => {
      const C = pascalCase(c.name);
      const dir = path.resolve("src/components", C);
      const jsxPath = path.join(dir, ${C}.jsx);
      const cssPath = path.join(dir, ${C}.module.css);
      const jsx = `
import React from "react";
import styles from "./${C}.module.css";
export default function ${C}({ children }) {
  return <div className={styles.box}>{children || "${C}"}</div>;
}`.trim();
      const css = .box{padding:12px;border:1px solid #ddd;border-radius:6px};
      writeFile(jsxPath, jsx);
      writeFile(cssPath, css);
    });

    try { execSync("npx prettier --write .", { stdio: "inherit", shell: true }); } catch {}

    const guard = spawnSync("npm", ["run", "lia:guard"], { stdio: "inherit", shell: true });
    if (guard.status !== 0) throw new Error("Tests/Lint KO — rollback");

    if (isRepo) {
      await git.add(".");
      await git.commit("feat(lia): génération depuis spec");
    }
    console.log("✅ Génération OK");
    process.exit(0);
  } catch (e) {
    console.error("❌", e.message || e);
    if (checkpoint) {
      try { await git.reset(["--hard", "HEAD~1"]); console.error("↩️  Rollback appliqué."); } catch {}
    }
    process.exit(1);
  }
}
main();