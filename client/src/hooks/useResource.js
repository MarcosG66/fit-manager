import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

/**
 * Carrega uma coleção da API e oferece uma função de atualização.
 * Exemplo: useResource('/alunos') retorna os alunos, loading, error e reload.
 */
export function useResource(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    // Quando o caminho é nulo, a busca deve ser ignorada.
    // Exemplo: ainda não foi selecionado um aluno para consultar suas fichas.
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api(path);
      setData(response.data ?? []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  // A lista é buscada quando a página aparece ou o endereço consultado muda.
  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
