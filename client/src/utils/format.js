export const diaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const brDate = (value) => value ? new Date(String(value).replace(' ', 'T').slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
export const decimals = (value, digits = 1) => Number(value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const firstName = (name = '') => name.trim().split(/\s+/)[0];


/** O dia de treino segue o fuso da academia, não o computador do aluno. */
export function weekdayInAcademyTimezone(date = new Date()) {
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: import.meta.env.VITE_APP_TIMEZONE || 'America/Fortaleza',
    weekday: 'short',
  }).format(date);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekdayName];
}
