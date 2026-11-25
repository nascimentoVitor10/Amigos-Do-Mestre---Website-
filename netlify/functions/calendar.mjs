/**
 * Lê apenas eventos PUBLICAMENTE VISÍVEIS de uma agenda do Google Calendar.
 * Variáveis em Netlify > Environment variables (escopo Functions):
 * GOOGLE_CALENDAR_ID e GOOGLE_CALENDAR_API_KEY.
 * Não é necessário OAuth para agendas públicas.
 */
const json = (payload, status = 200, ttl = 300) => new Response(JSON.stringify(payload), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
    'X-Content-Type-Options': 'nosniff'
  }
});

export default async function handler(request) {
  if (request.method !== 'GET') return json({ error: 'Método não permitido' }, 405, 0);
  const id = process.env.GOOGLE_CALENDAR_ID;
  const key = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!id || !key) return json({ configured: false, events: [] }, 200, 60);
  const url = new URL(request.url);
  const month = url.searchParams.get('month');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) return json({ error: 'Mês inválido' }, 400, 0);
  const [year, m] = month.split('-').map(Number);
  if (year < 2020 || year > 2100) return json({ error: 'Ano fora do intervalo' }, 400, 0);
  const nextMonth = m === 12 ? `${year + 1}-01` : `${year}-${String(m + 1).padStart(2, '0')}`;
  const endpoint = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`);
  endpoint.searchParams.set('key', key);
  endpoint.searchParams.set('timeMin', `${month}-01T00:00:00-03:00`);
  endpoint.searchParams.set('timeMax', `${nextMonth}-01T00:00:00-03:00`);
  endpoint.searchParams.set('timeZone', 'America/Sao_Paulo');
  endpoint.searchParams.set('singleEvents', 'true');
  endpoint.searchParams.set('orderBy', 'startTime');
  endpoint.searchParams.set('maxResults', '250');
  endpoint.searchParams.set('fields', 'nextPageToken,items(id,status,summary,description,start,htmlLink,visibility)');
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) {
      console.error('Google Calendar status:', response.status);
      return json({ configured: true, error: 'Não foi possível consultar a agenda.', events: [] }, 502, 30);
    }
    const data = await response.json();
    // Alguns eventos iniciados no último dia do mês anterior podem cruzar a virada;
    // o calendário só mostra a data de início no próprio mês.
    const events = (data.items || []).filter(e => e.status !== 'cancelled' && e.visibility !== 'private')
      .map(e => {
        const start = e.start?.dateTime || e.start?.date;
        const date = e.start?.date || new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date(start));
        return {
          date,
          title: String(e.summary || 'Atividade da associação').slice(0, 150),
          description: String(e.description || '').replace(/<[^>]*>/g, '').slice(0, 1000),
          type: 'Eventos e ações ambientais',
          startTime: e.start?.dateTime ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(start)) : '',
          link: String(e.htmlLink || '')
        };
      }).filter(e => e.date.startsWith(month));
    return json({ configured: true, source: 'google', events }, 200, 300);
  } catch (error) {
    console.error('Google Calendar request failed:', error?.message);
    return json({ configured: true, error: 'Agenda temporariamente indisponível.', events: [] }, 502, 30);
  }
}
