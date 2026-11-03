/** Dia civil da academia; independe do fuso horário do MySQL remoto. */
export function todayInAcademyTimezone(date = new Date()) {
  const timezone = process.env.APP_TIMEZONE || 'America/Fortaleza';
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
