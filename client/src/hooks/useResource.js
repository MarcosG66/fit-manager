import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

/**
 * Carrega coleções da API e ignora respostas antigas.
 * Ao trocar o aluno selecionado, uma resposta tardia do aluno anterior
 * não pode substituir os dados da seleção atual.
 */
export function useResource(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;

    if (!path) {
      setData([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api(path);
      if (currentRequest === requestId.current) {
        setData(response.data ?? []);
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setData([]); // Nunca mostrar dados antigos após uma falha de autorização/rede.
        setError(requestError.message);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { data, loading, error, reload, setData };
}
