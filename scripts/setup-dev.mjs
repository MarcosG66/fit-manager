import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const makeSecret = () => randomBytes(48).toString('hex');
const makePassword = () => randomBytes(12).toString('base64url');
if (!existsSync('server/.env')) {
  let env = readFileSync('server/.env.example', 'utf8');
  env = env.replace('COLOQUE_AQUI_UM_SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES', makeSecret()).replace('COLOQUE_AQUI_OUTRO_SEGREDO_ALEATORIO_COM_PELO_MENOS_32_CARACTERES', makeSecret());
  const passwords = { aluno: makePassword(), instrutor: makePassword(), admin: makePassword() };
  env = env.replace(/^SEED_STUDENT_PASSWORD=$/m, `SEED_STUDENT_PASSWORD=${passwords.aluno}`).replace(/^SEED_INSTRUCTOR_PASSWORD=$/m, `SEED_INSTRUCTOR_PASSWORD=${passwords.instrutor}`).replace(/^SEED_ADMIN_PASSWORD=$/m, `SEED_ADMIN_PASSWORD=${passwords.admin}`);
  env = env.replace(/^ADMIN_SIGNUP_CODE=$/m, `ADMIN_SIGNUP_CODE=${makeSecret()}`);
  writeFileSync('server/.env', env, { mode: 0o600 });
  const adminCode = env.match(/^ADMIN_SIGNUP_CODE=(.+)$/m)?.[1];
  writeFileSync('CONTAS_LOCAIS.txt', `Código para cadastro administrativo: ${adminCode}\n\nCredenciais aleatorias criadas pelo setup local. NAO compartilhe nem publique este arquivo.\nAluno: ana@email.com | ${passwords.aluno}\nInstrutor: carlos@academia.com | ${passwords.instrutor}\nAdmin: admin@academia.com | ${passwords.admin}\n`, { mode: 0o600 });
  console.log('Criados server/.env e CONTAS_LOCAIS.txt com segredos e senhas aleatórios.');
}
else {
  let oldConfig = readFileSync('server/.env', 'utf8');
  const adminEntry = oldConfig.match(/^ADMIN_SIGNUP_CODE=(.*)$/m);
  if (!adminEntry || !adminEntry[1].trim()) {
    const newCode = makeSecret();
    oldConfig = adminEntry
      ? oldConfig.replace(/^ADMIN_SIGNUP_CODE=[^\r\n]*$/m, `ADMIN_SIGNUP_CODE=${newCode}`)
      : `${oldConfig.trimEnd()}\nADMIN_SIGNUP_CODE=${newCode}\n`;
    writeFileSync('server/.env', oldConfig, { mode: 0o600 });
    const previousCredentials = existsSync('CONTAS_LOCAIS.txt')
      ? readFileSync('CONTAS_LOCAIS.txt', 'utf8') : '';
    writeFileSync('CONTAS_LOCAIS.txt',
      `${previousCredentials}\nCódigo de cadastro administrativo: ${newCode}\n`, { mode: 0o600 });
    console.log('Adicionado ADMIN_SIGNUP_CODE ao .env existente (sem alterar as outras configurações).');
  } else {
    console.log('server/.env já existe; segredos preservados.');
  }
}
if (!existsSync('client/.env')) {
  writeFileSync('client/.env', readFileSync('client/.env.example', 'utf8'), { mode: 0o600 });
  console.log('Criado client/.env.');
}
console.log('Próximos passos: docker compose up -d --wait; npm install; npm run install:all; npm run db:init; npm run dev');
