'use client';

import { useEffect, useState } from 'react';

interface ApiKey {
  id: number;
  name: string | null;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/settings/api-keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || null }),
      });

      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.key);
        setNewKeyName('');
        fetchKeys();
      } else {
        alert(data.error?.message || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey(id: number) {
    if (!confirm('确定要删除这个 API Key 吗？')) return;

    try {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  }

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">API Key 管理</h1>

      {/* 说明 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">使用说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• API Key 用于第三方应用调用</li>
          <li>• 最多可创建 5 个 Key</li>
          <li>• 请求时通过 Header 传递: <code className="bg-blue-100 px-1">Authorization: Bearer YOUR_KEY</code></li>
        </ul>
        <div className="mt-3 p-3 bg-white rounded text-sm font-mono text-gray-600">
          POST /api/v1/words<br/>
          Headers: Authorization: Bearer vb_xxx...<br/>
          Body: {`{ "word": "hello", "meaning": "你好" }`}
        </div>
      </div>

      {/* 创建新 Key */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">创建新 Key</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="备注名（可选）"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={createKey}
            disabled={creating || keys.length >= 5}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
        {keys.length >= 5 && (
          <p className="mt-2 text-sm text-red-500">已达最大数量限制</p>
        )}
      </div>

      {/* 新创建的 Key */}
      {newKey && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">✓ 创建成功</h3>
          <p className="text-sm text-green-700 mb-3">
            请立即复制保存，关闭后将无法再次查看！
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              readOnly
              className="flex-1 px-4 py-2 bg-white border rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              复制
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-green-600 hover:underline"
          >
            我已保存，关闭提示
          </button>
        </div>
      )}

      {/* Key 列表 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">已创建的 Key</h2>
        {keys.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无 API Key</p>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{key.name || '未命名 Key'}</div>
                  <div className="text-sm text-gray-500">
                    创建于 {new Date(key.created_at).toLocaleDateString('zh-CN')}
                    {key.last_used_at && (
                      <span> · 最后使用 {new Date(key.last_used_at).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
