import { request, withQuery } from './api'

/**
 * Ответ API билетов: GET <ticketsApiUrl>?event=<ticketsEventId>
 * { "tickets": [{ "id": "standard", "title": "Стандарт", "price": 150000, "currency": "RUB",
 *                 "description": "…", "url": "https://lk.southhub.ru/…", "available": true }] }
 */
export type Ticket = {
  id: string | number
  title: string
  price: number
  currency?: string
  description?: string
  url: string
  available?: boolean
}

export async function fetchTickets(apiUrl: string, eventId: string, signal?: AbortSignal): Promise<Ticket[]> {
  const data = await request<{ tickets?: unknown }>(withQuery(apiUrl, { event: eventId }), { signal })
  if (!Array.isArray(data.tickets)) return []
  // неполные записи не показываем, чтобы одна битая строка в API не ломала виджет
  return (data.tickets as Ticket[]).filter((t) => t && t.title && typeof t.price === 'number' && t.url)
}
