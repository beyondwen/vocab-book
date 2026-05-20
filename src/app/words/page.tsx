'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  tags: string | null;
  status: string;
  created_at: string;
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWords();
  }, [page, statusFilter, search]);

  async function fetchWords() {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/words?${params}`);
      const data = await res.json();
      if (data.success) {
        setWords(data.data.words);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    }
  }

  async function deleteWord(id: number) {
    if (!confirm('确定要删除这个单词吗？')) return;

    try {
      const res = await fetch(`/api/words/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchWords();
      }
    } catch (error) {
      console.error('Failed to delete word:', error);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">单词列表</h1>
        <Link
          href="/words/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + 添加单词
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="搜索单词或释义..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部状态</option>
          <option value="new">新单词</option>
          <option value="learning">学习中</option>
          <option value="mastered">已掌握</option>
        </select>
      </div>

      {/* 单词列表 */}
      <div className="grid gap-4">
        {words.map((word) => (
          <div
            key={word.id}
            className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/words/${word.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {word.word}
                  </Link>
                  {word.phonetic && (
                    <span className="text-gray-500 text-sm">{word.phonetic}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[word.status]}`}>
                    {statusLabels[word.status]}
                  </span>
                </div>
                <div className="mt-1 text-gray-700">{word.meaning}</div>
                {word.example && (
                  <div className="mt-2 text-sm text-gray-500 italic">
                    {word.example}
                  </div>
                )}
                {word.tags && (
                  <div className="mt-2 flex gap-2">
                    {JSON.parse(word.tags).map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/words/${word.id}`}
                  className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                >
                  编辑
                </Link>
                <button
                  onClick={() => deleteWord(word.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}

        {words.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无单词，点击上方按钮添加
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
