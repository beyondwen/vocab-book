export const ADMIN_TOKEN_STORAGE_KEY = 'vocab_book_admin_token';

export function getStoredAdminToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
}

export function setStoredAdminToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedToken = token.trim();
  if (normalizedToken) {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, normalizedToken);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }
}

export function getAdminHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAdminToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    'X-Admin-Token': token,
  };
}

export function clearStoredAdminToken() {
  setStoredAdminToken('');
}
