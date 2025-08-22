const { spawn, execSync } = require("child_process");
const path = require("path");

function sh(c, a = []) {
  return new Promise((resolve) => {
    const p = spawn(c, a, { shell: true, stdio: "inherit" });
    p.on("close", (code) => resolve(code));
  });
}

(async () => {
  const lint = await sh("npx", ["eslint", ".", "--ext", ".js,.jsx", "--fix"]);
  if (lint !== 0) process.exit(1);

  const j = spawn("npx", ["jest", "--passWithNoTests", "--json", "--outputFile=.lia-jest.json"], { shell: true, stdio: "inherit" });
  j.on("close", (code) => {
    try {
      const results = require(path.resolve(".lia-jest.json"));
      if (results.numFailedTests > 0) {
        const first = results.testResults.find(t => t.status === "failed");
        if (first && first.name) execSync(code "${first.name}", { stdio: "ignore", shell: true });
        console.error(Tests KO (${results.numFailedTests}). Fichier ouvert dans VS Code.);
        process.exit(1);
      }
      console.log("✅ Lint + tests OK");
      process.exit(0);
    } catch {
      process.exit(code);
    }
  });
})();