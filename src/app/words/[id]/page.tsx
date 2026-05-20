'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAdminHeaders } from '@/lib/admin-client';

interface ReviewHistory {
  id: number;
  word_id: number;
  review_date: string;
  result: boolean;
  next_review_date: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
}

interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  tags: string | null;
  status: string;
  created_at: string;
  reviews: ReviewHistory[];
}

export default function WordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    word: '',
    phonetic: '',
    meaning: '',
    example: '',
    tags: '',
    status: '',
  });

  const wordId = params.id;

  const fetchWord = useCallback(async () => {
    try {
      const res = await fetch(`/api/words/${wordId}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setWord(data.data);
        setForm({
          word: data.data.word,
          phonetic: data.data.phonetic || '',
          meaning: data.data.meaning,
          example: data.data.example || '',
          tags: data.data.tags ? JSON.parse(data.data.tags).join(', ') : '',
          status: data.data.status,
        });
      }
    } catch (error) {
      console.error('Failed to fetch word:', error);
    } finally {
      setLoading(false);
    }
  }, [wordId]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  async function handleSave() {
    try {
      const tags = form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/words/${wordId}`, {
        method: 'PUT',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...form,
          tags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditing(false);
        fetchWord();
      } else {
        alert(data.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save word:', error);
      alert('保存失败');
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这个单词吗？')) return;

    try {
      const res = await fetch(`/api/words/${wordId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/words');
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
  }

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  if (!word) {
    return <div className="text-center text-gray-500">单词不存在</div>;
  }

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    learning: 'bg-yellow-100 text-yellow-800',
    mastered: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    new: '新单词',
    learning: '学习中',
    mastered: '已掌握',
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 返回
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                保存
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* 单词卡片 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单词</label>
              <input
                type="text"
                value={form.word}
                onChange={(e) => setForm({ ...form, word: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">音标</label>
              <input
                type="text"
                value={form.phonetic}
                onChange={(e) => setForm({ ...form, phonetic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">释义</label>
              <textarea
                value={form.meaning}
                onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">例句</label>
              <textarea
                value={form.example}
                onChange={(e) => setForm({ ...form, example: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="用逗号分隔"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="new">新单词</option>
                <option value="learning">学习中</option>
                <option value="mastered">已掌握</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{word.word}</h1>
              {word.phonetic && (
                <p className="text-gray-500 text-lg">{word.phonetic}</p>
              )}
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[word.status]}`}>
                {statusLabels[word.status]}
              </span>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">释义</h3>
              <p className="text-lg text-gray-800">{word.meaning}</p>
            </div>
            {word.example && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">例句</h3>
                <p className="text-gray-700 italic">{word.example}</p>
              </div>
            )}
            {word.tags && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">标签</h3>
                <div className="flex gap-2">
                  {JSON.parse(word.tags).map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 复习历史 */}
      {word.reviews && word.reviews.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">复习历史</h2>
          <div className="space-y-3">
            {word.reviews.map((review, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className={`font-medium ${review.result ? 'text-green-600' : 'text-red-600'}`}>
                    {review.result ? '✓ 记住' : '✗ 忘记'}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    间隔 {review.interval} 天
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(review.review_date).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
