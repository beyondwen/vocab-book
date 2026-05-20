'use client';

import { FormEvent, useState } from 'react';
import { setStoredAdminToken } from '@/lib/admin-client';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || '登录失败');
        return;
      }

      setStoredAdminToken('');
      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get('next') || '/';
      window.location.href = next.startsWith('/') ? next : '/';
    } catch (err) {
      console.error('Login failed:', err);
      setError('登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border shadow-sm rounded-xl p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">登录单词本</h1>
          <p className="mt-1 text-sm text-gray-500">输入管理令牌后继续访问。</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            管理令牌
          </label>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="VOCAB_BOOK_ADMIN_TOKEN"
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}
