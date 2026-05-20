'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewWordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
    tags: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/words');
        router.refresh();
      } else {
        alert(data.error?.message || '添加失败');
      }
    } catch (error) {
      console.error('Failed to add word:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">添加新单词</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              单词 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如: ephemeral"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音标
            </label>
            <input
              type="text"
              value={form.phonetic}
              onChange={(e) => setForm({ ...form, phonetic: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如: /ɪˈfemərəl/"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              释义 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.meaning}
              onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如: adj. 短暂的，瞬息的"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              例句
            </label>
            <textarea
              value={form.example}
              onChange={(e) => setForm({ ...form, example: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如: Fame is ephemeral."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="用逗号分隔，例如: GRE, 高级词汇"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '添加中...' : '添加单词'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
