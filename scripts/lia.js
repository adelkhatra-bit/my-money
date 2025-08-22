#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');

function sh(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

const cmd = process.argv[2];
const rest = process.argv.slice(3);

switch (cmd) {
  case 'fix': {
    sh('npx prettier -w "src/*/.{js,jsx,css,json,md}"');
    sh('npx eslint --ext .js,.jsx src --fix || true');
    break;
  }
  case 'guard': {
    sh('npm run test -- --watchAll');
    break;
  }
  case 'gen:page': {
    const name = rest[0];
    if (!name) { console.log('Usage: npm run lia:gen:page -- NomDePage'); process.exit(1); }
    sh(npx plop page -- --name "${name}");
    break;
  }
  case 'gen:component': {
    const name = rest[0];
    if (!name) { console.log('Usage: npm run lia:gen:component -- NomDuComposant'); process.exit(1); }
    sh(npx plop component -- --name "${name}");
    break;
  }
  case 'open': {
    const file = rest[0] || 'src/App.jsx';
    const opener =
      process.platform === 'win32' ? 'start ""' :
      process.platform === 'darwin' ? 'open' : 'xdg-open';
    sh(${opener} "${file}");
    break;
  }
  case 'doctor': {
    const checks = ['src','src/pages','src/components','public','plop-templates'];
    console.log('— LIA DOCTOR —');
    checks.forEach(p => console.log(fs.existsSync(p) ? ✅ ${p} : ❌ Manquant: ${p}));
    if (fs.existsSync('publique')) console.log('⚠️ Dossier "publique" détecté: supprime-le pour éviter les conflits.');
    break;
  }
  default: {
    console.log('Usage: node scripts/lia.js <fix|guard|gen:page|gen:component|open|doctor>');
  }
}
