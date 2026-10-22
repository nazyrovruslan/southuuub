// Запросы к API Django. Выполняются только в браузере (из onMounted и обработчиков событий),
// при пререндере сюда никто не заходит. Секретов во фронтенде нет: авторизация — сессия Django (cookie) и CSRF.

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const TIMEOUT_MS = 10_000

/** CSRF-токен для POST: Django кладёт его в <meta name="csrf-token"> (manifest.requires.csrf) или в cookie csrftoken. */
export function csrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
  if (meta) return meta
  return document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] ?? ''
}

export async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  // свой контроллер вместо AbortSignal.any/timeout: их нет в Safari до 17.4
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; ctrl.abort() }, TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  init.signal?.addEventListener('abort', onAbort, { once: true })
  if (init.signal?.aborted) ctrl.abort()
  const signal = ctrl.signal
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (method !== 'GET' && method !== 'HEAD') headers.set('X-CSRFToken', csrfToken())

  try {
    let res: Response
    try {
      res = await fetch(url, { ...init, method, headers, signal, credentials: 'same-origin' })
    } catch (e) {
      if (init.signal?.aborted) throw e
      throw new ApiError(timedOut ? 'Сервер не ответил вовремя' : 'Нет связи с сервером')
    }
    if (!res.ok) throw new ApiError(`Ошибка сервера (${res.status})`, res.status)
    try {
      return (await res.json()) as T
    } catch {
      throw new ApiError('Сервер вернул не JSON', res.status)
    }
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', onAbort)
  }
}

export function withQuery(url: string, params: Record<string, string>): string {
  const u = new URL(url, location.href)
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v)
  return u.toString()
}
