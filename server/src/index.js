import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { pool } from './config/db.js';
import { errorHandler, HttpError } from './utils/http.js';
import authRoutes from './routes/auth.js';
import alunosRoutes from './routes/alunos.js';
import fichasRoutes from './routes/fichas.js';
import catalogoRoutes from './routes/catalogo.js';
import cargasRoutes from './routes/cargas.js';
import avaliacoesRoutes from './routes/avaliacoes.js';
import usuariosRoutes from './routes/usuarios.js';
import vinculosRoutes from './routes/vinculos.js';

const EM_PRODUCAO = process.env.NODE_ENV === 'production';
const PORTA = Number(process.env.PORT || 3001);

/** Confere se as chaves obrigatórias estão presentes antes de iniciar a API. */
function validarConfiguracoes() {
  const chaveJWT = process.env.JWT_SECRET;
  const chaveRecuperacao = process.env.RESET_SECRET;

  if (!chaveJWT || chaveJWT.length < 32 || !chaveRecuperacao || chaveRecuperacao.length < 32) {
    console.error('Configure JWT_SECRET e RESET_SECRET com pelo menos 32 caracteres em server/.env');
    process.exit(1);
  }
}

validarConfiguracoes();

const app = express();
app.disable('x-powered-by');

// O Render opera atrás de proxy. Essa configuração permite detectar HTTPS corretamente.
if (EM_PRODUCAO) app.set('trust proxy', 1);

app.use(helmet());

// Desenvolvimento: React/Vite (5173) e Express (3001) usam portas diferentes.
// Produção: o Express entrega também o React, então ambos usam o mesmo domínio.
if (!EM_PRODUCAO) {
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
}

app.use(express.json({ limit: '80kb' }));
app.use(cookieParser());

/**
 * Bloqueia origens inesperadas em operações que modificam dados.
 * Exige JSON nos corpos de POST/PUT/PATCH (exceto logout).
 */
app.use('/api', (req, res, next) => {
  const metodosDeLeitura = ['GET', 'HEAD', 'OPTIONS'];
  if (metodosDeLeitura.includes(req.method)) return next();

  const origemRequisicao = req.get('origin');
  const origemPermitida = process.env.CLIENT_ORIGIN || (
    EM_PRODUCAO
      ? `${req.protocol}://${req.get('host')}`
      : 'http://localhost:5173'
  );

  if (origemRequisicao && origemRequisicao !== origemPermitida) {
    return next(new HttpError(403, 'Origem não autorizada.'));
  }

  const precisaDeJSON = ['POST', 'PUT', 'PATCH'].includes(req.method)
    && req.path !== '/auth/logout';

  if (precisaDeJSON && !req.is('application/json')) {
    return next(new HttpError(415, 'Envie o corpo como application/json.'));
  }

  return next();
});

// Teste de saúde útil para verificar se a aplicação alcança o banco MySQL.
app.get('/api/health', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch (error) {
    next(error);
  }
});

// Cada arquivo de rota é responsável por um conjunto de operações REST.
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/fichas', fichasRoutes);
app.use('/api', catalogoRoutes);
app.use('/api/cargas', cargasRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/vinculos', vinculosRoutes);

if (EM_PRODUCAO) {
  // Em hospedagem, o Express também entrega os arquivos gerados pelo Vite.
  const pastaBuild = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../client/dist',
  );

  if (!fs.existsSync(path.join(pastaBuild, 'index.html'))) {
    console.error('Build do React ausente: execute npm run build --prefix client');
    process.exit(1);
  }

  app.use(express.static(pastaBuild, { index: false }));

  // React Router precisa receber index.html também nas URLs internas.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(pastaBuild, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use(errorHandler);

app.listen(PORTA, () => {
  console.log(`FitManager API: http://localhost:${PORTA}/api/health`);
});
