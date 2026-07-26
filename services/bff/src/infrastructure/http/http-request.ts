import { UpstreamServiceError } from '../../application/errors.js';

export interface HttpRequestOptions {
  method?: string;
  userId?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function doFetch(baseUrl: string, path: string, options: HttpRequestOptions): Promise<Response> {
  const url = buildUrl(baseUrl, path, options.query);
  const headers: Record<string, string> = {};
  if (options.userId) headers['X-User-Id'] = options.userId;

  let body: string | null = null;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(url, { method: options.method ?? 'GET', headers, body });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new UpstreamServiceError(response.status, text || `request to ${url} failed with status ${response.status}`);
  }
  return response;
}

/** For calls expected to return a JSON body. */
export async function httpRequestJson<T>(baseUrl: string, path: string, options: HttpRequestOptions = {}): Promise<T> {
  const response = await doFetch(baseUrl, path, options);
  return response.json();
}

/** For calls expected to return 204/no body (e.g. DELETE, "fire" endpoints). */
export async function httpRequestVoid(baseUrl: string, path: string, options: HttpRequestOptions = {}): Promise<void> {
  await doFetch(baseUrl, path, options);
}
