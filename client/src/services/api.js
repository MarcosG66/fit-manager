// Durante o desenvolvimento, o Vite encaminha /api para o Express.
// Em produção, o Express fornece React e a API no mesmo domínio.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Centraliza as requisições do React para a API REST.
 * O cookie httpOnly contendo o JWT é enviado automaticamente pelo navegador.
 * `body` recebe um objeto JavaScript, que será convertido para JSON.
 */
export async function api(path, { method = 'GET', body, ...options } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...options,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar à API. Confira se o servidor está ligado.',
      0,
    );
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      responseData.error || `Erro HTTP ${response.status}`,
      response.status,
      responseData.detalhes,
    );
  }

  return responseData;
}

/** Monta parâmetros de consulta, ignorando valores vazios. */
export function qs(parameters) {
  const queryParams = new URLSearchParams();

  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.set(key, value);
    }
  });

  return queryParams.toString() ? `?${queryParams}` : '';
}
