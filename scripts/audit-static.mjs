import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, relative, extname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
let checkedJs = 0;
let checkedImports = 0;

function walk(folder) {
  return readdirSync(folder).flatMap(name => {
    const file = join(folder, name);
    if (name === 'node_modules' || name === 'dist' || name === '.git') return [];
    return statSync(file).isDirectory() ? walk(file) : [file];
  });
}

for (const relativeFolder of ['server/src', 'server/scripts', 'server/tests', 'client/src', 'scripts']) {
  for (const filename of walk(join(root, relativeFolder))) {
    const extension = extname(filename);
    if (!['.js', '.jsx', '.mjs'].includes(extension)) continue;
    const code = readFileSync(filename, 'utf8');
    if (extension !== '.jsx') {
      try { execFileSync(process.execPath, ['--check', filename], { stdio: 'pipe' }); }
      catch (error) { findings.push(`Sintaxe inválida: ${relative(root, filename)}: ${error.stderr}`); }
      checkedJs += 1;
    }

    const imports = code.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g);
    for (const [, importPath] of imports) {
      checkedImports += 1;
      const absolute = resolve(dirname(filename), importPath);
      if (!existsSync(absolute) && !existsSync(`${absolute}.js`) && !existsSync(`${absolute}.jsx`) && !existsSync(`${absolute}.mjs`)) {
        findings.push(`Import ausente: ${relative(root, filename)} → ${importPath}`);
      }
    }
  }
}

const login = readFileSync(join(root, 'client/src/pages/LoginPage.jsx'), 'utf8');
if (login.includes('role-select') || login.includes('Perfil de acesso')) {
  findings.push('A tela de login ainda exibe seletor de perfil sem função.');
}
const schema = readFileSync(join(root, 'server/sql/schema.sql'), 'utf8');
const tables = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/gi)].map(item => item[1]);
if (tables.length !== 11 || new Set(tables).size !== 11) {
  findings.push(`Esquema esperado: 11 tabelas distintas; obtidas: ${tables.length}.`);
}
const privateFiles = [
  'server/.env',
  'client/.env',
  'CONTAS_LOCAIS.txt',
];

const trackedFiles = execFileSync(
  'git',
  ['ls-files', '--cached', '--full-name'],
  { cwd: root, encoding: 'utf8' }
)
  .split(/\r?\n/)
  .filter(Boolean);

for (const privateFile of privateFiles) {
  if (trackedFiles.includes(privateFile)) {
    findings.push(
      `Arquivo privado versionado no Git: ${privateFile}`
    );
  }
}
if (findings.length) {
  console.error('AUDITORIA ESTÁTICA FALHOU:');
  findings.forEach(item => console.error('-', item));
  process.exitCode = 1;
} else {
  console.log(`OK: ${checkedJs} arquivos JS/MJS, ${checkedImports} imports locais e ${tables.length} tabelas.`);
  console.log('OK: sem credenciais locais nem seletor de perfil fictício no login.');
  console.log('Nota: o build JSX e testes MySQL exigem dependências instaladas e banco ativo.');
}
