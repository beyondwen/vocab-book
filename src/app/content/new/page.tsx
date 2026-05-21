'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, Plus, Search, X } from 'lucide-react';
import { getAdminHeaders } from '@/lib/admin-client';
import { type ContentFormat } from '@/app/components/ContentBody';

interface WordOption {
  id: number;
  word: string;
  meaning: string;
  status: string;
}

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [wordSearch, setWordSearch] = useState('');
  const [wordOptions, setWordOptions] = useState<WordOption[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordOption[]>([]);
  const [form, setForm] = useState({
    body: '',
    format: 'plain' as ContentFormat,
    source: '',
    note: '',
    note_format: 'markdown' as ContentFormat,
    tags: '',
  });

  useEffect(() => {
    async function fetchWords() {
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (wordSearch) params.set('search', wordSearch);
        const res = await fetch(`/api/words?${params}`, { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.success) {
          setWordOptions(data.data.words);
        }
      } catch (error) {
        console.error('Failed to fetch words:', error);
      }
    }

    fetchWords();
  }, [wordSearch]);

  function addWord(word: WordOption) {
    if (selectedWords.some((item) => item.id === word.id)) return;
    setSelectedWords([...selectedWords, word]);
  }

  function removeWord(id: number) {
    setSelectedWords(selectedWords.filter((word) => word.id !== id));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...form,
          tags: form.tags,
          word_ids: selectedWords.map((word) => word.id),
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/content/${data.data.id}`);
        router.refresh();
      } else {
        alert(data.error?.message || '添加失败');
      }
    } catch (error) {
      console.error('Failed to create content:', error);
      alert('添加失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">添加内容</h1>
        <p className="mt-1 text-sm text-gray-500">粘贴一句话或一段摘录，再选择相关单词。</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              内容正文 <span className="text-red-500">*</span>
            </label>
            <div className="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
              {[
                { value: 'plain' as ContentFormat, label: '纯文本' },
                { value: 'markdown' as ContentFormat, label: 'Markdown' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, format: option.value })}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    form.format === option.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <textarea
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              required
              rows={8}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder={form.format === 'markdown' ? '支持标题、列表、引用、表格和代码块' : '粘贴句子、段落或摘录'}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">来源</label>
              <input
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="书名、文章、视频或网址"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">标签</label>
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="用逗号分隔"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">备注</label>
            <div className="mb-2 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm">
              {[
                { value: 'plain' as ContentFormat, label: '纯文本' },
                { value: 'markdown' as ContentFormat, label: 'Markdown' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, note_format: option.value })}
                  className={`rounded-md px-3 py-1.5 font-medium transition ${
                    form.note_format === option.value
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <textarea
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder={form.note_format === 'markdown' ? '支持 Markdown 备注，例如错误分析、表格、引用' : '记录为什么收藏这段内容'}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存内容'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-200 px-6 py-3 font-semibold transition hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <LinkIcon size={18} />
            关联单词
          </div>

          {selectedWords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedWords.map((word) => (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => removeWord(word.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                >
                  {word.word}
                  <X size={14} />
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={wordSearch}
              onChange={(event) => setWordSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="搜索已有单词"
            />
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto">
            {wordOptions.map((word) => (
              <button
                key={word.id}
                type="button"
                onClick={() => addWord(word)}
                className="flex w-full items-start gap-2 rounded-lg border border-gray-100 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <Plus className="mt-0.5 text-indigo-500" size={16} />
                <span className="min-w-0">
                  <span className="block font-medium text-gray-900">{word.word}</span>
                  <span className="line-clamp-2 text-xs leading-5 text-gray-500">{word.meaning}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </form>
    </div>
  );
}
