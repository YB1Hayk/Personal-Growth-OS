// Единая точка настройки адреса API. Переопределяется через apps/web/.env:
// VITE_API_URL=http://127.0.0.1:3002
export const API_URL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || 'http://127.0.0.1:3001';


export async function checkedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await globalThis.fetch(input, init);
  if (!response.ok) {
    const body = await response.clone().json().catch(() => null);
    const message = typeof body?.error === 'string' ? body.error
      : body?.error?.message || body?.message || `Ошибка запроса (${response.status})`;
    globalThis.alert(message);
    throw new Error(message);
  }
  return response;
}
