'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search } from 'lucide-react';
import { getAdminHeaders } from '@/lib/admin-client';

interface ContentItem {
  id: number;
  body: string;
  format: 'plain' | 'markdown';
  source: string | null;
  note: string | null;
  tags: string | null;
  word_count: number;
  created_at: string;
}

function parseTags(tags: string | null) {
  if (!tags) return [];
  try {
    return JSON.parse(tags) as string[];
  } catch {
    return [];
  }
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/content?${params}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setContents(data.data.contents);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">内容库</h1>
          <p className="mt-1 text-sm text-gray-500">保存句子、摘录和短内容，再关联到单词。</p>
        </div>
        <Link
          href="/content/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus size={18} />
          添加内容
        </Link>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="搜索正文、来源或备注"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            加载中...
          </div>
        ) : contents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white py-12 text-center text-gray-500">
            暂无内容
          </div>
        ) : (
          contents.map((item) => (
            <Link
              key={item.id}
              href={`/content/${item.id}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm leading-6 text-gray-900">{item.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {item.source && <span>来源：{item.source}</span>}
                    {item.format === 'markdown' && <span>Markdown</span>}
                    <span>{item.word_count} 个关联单词</span>
                    <span>{new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  {parseTags(item.tags).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {parseTags(item.tags).map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
