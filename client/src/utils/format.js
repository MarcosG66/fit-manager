export const diaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const brDate = (value) => value ? new Date(String(value).replace(' ', 'T').slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
export const decimals = (value, digits = 1) => Number(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const firstName = (name = '') => name.trim().split(/\s+/)[0];
