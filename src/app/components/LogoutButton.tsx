'use client';

import { useState } from 'react';
import { clearStoredAdminToken } from '@/lib/admin-client';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearStoredAdminToken();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 transition-colors"
    >
      退出
    </button>
  );
}
