import { ZodError } from 'zod';

/** Representa erros que devem chegar ao cliente com um status HTTP específico. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/** Encaminha erros de funções async ao middleware central do Express. */
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/** Valida dados recebidos pelo Express usando um schema do Zod. */
export function validate(schema, data) {
  return schema.parse(data);
}

/** Valida IDs numéricos em parâmetros de rota, como /alunos/:id. */
export function id(value) {
  const parsedId = Number(value);

  if (!Number.isSafeInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, 'Identificador inválido.');
  }

  return parsedId;
}

/** Mantém as respostas de erro da API com um padrão consistente. */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ZodError) {
    const validationIssues = error.issues.map(issue => {
      return `${issue.path.join('.')}: ${issue.message}`;
    });
    return res.status(400).json({
      error: 'Dados inválidos.',
      detalhes: validationIssues,
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Já existe um registro com esse valor.' });
  }

  if (['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'].includes(error.code)) {
    return res.status(409).json({
      error: 'Este registro está sendo utilizado e não pode ser excluído.',
    });
  }

  // Se o MySQL estiver desligado, o cliente recebe um erro operacional claro
  // em vez de confundir a falha de infraestrutura com credenciais inválidas.
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN',
       'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'].includes(error.code)) {
    console.error('[DB] Conexão indisponível:', error.code);
    return res.status(503).json({
      error: 'Banco de dados indisponível. Confira a conexão e tente novamente.',
    });
  }

  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }

  // Detalhes internos ficam nos logs, nunca no corpo da resposta ao usuário.
  console.error('[API]', error);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}
