'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Link as LinkIcon, Plus, Search, Trash2, X } from 'lucide-react';
import { getAdminHeaders } from '@/lib/admin-client';
import ContentBody, { type ContentFormat } from '@/app/components/ContentBody';

interface WordOption {
  id: number;
  word: string;
  meaning: string;
  status: string;
}

interface ContentDetail {
  id: number;
  body: string;
  format: ContentFormat;
  source: string | null;
  note: string | null;
  note_format: ContentFormat;
  tags: string | null;
  created_at: string;
  updated_at: string;
  words: WordOption[];
}

function tagsToInput(tags: string | null) {
  if (!tags) return '';
  try {
    return (JSON.parse(tags) as string[]).join(', ');
  } catch {
    return '';
  }
}

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id;
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setContent(data.data);
        setSelectedWords(data.data.words || []);
        setForm({
          body: data.data.body,
          format: data.data.format || 'plain',
          source: data.data.source || '',
          note: data.data.note || '',
          note_format: data.data.note_format || 'plain',
          tags: tagsToInput(data.data.tags),
        });
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

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

    if (editing) {
      fetchWords();
    }
  }, [editing, wordSearch]);

  function addWord(word: WordOption) {
    if (selectedWords.some((item) => item.id === word.id)) return;
    setSelectedWords([...selectedWords, word]);
  }

  function removeWord(id: number) {
    setSelectedWords(selectedWords.filter((word) => word.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'PUT',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ...form,
          word_ids: selectedWords.map((word) => word.id),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditing(false);
        fetchContent();
      } else {
        alert(data.error?.message || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这条内容吗？关联单词不会被删除。')) return;

    try {
      const res = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/content');
      } else {
        alert(data.error?.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('删除失败');
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">加载中...</div>;
  }

  if (!content) {
    return <div className="py-12 text-center text-gray-500">内容不存在</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button onClick={() => router.back()} className="text-left text-sm text-gray-500 hover:text-gray-800">
          返回
        </button>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  fetchContent();
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                删除
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">内容正文</label>
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
                  rows={9}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">来源</label>
                  <input
                    value={form.source}
                    onChange={(event) => setForm({ ...form, source: event.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">标签</label>
                  <input
                    value={form.tags}
                    onChange={(event) => setForm({ ...form, tags: event.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                />
              </div>
            </div>
          ) : (
            <article className="space-y-5">
              <ContentBody
                body={content.body}
                format={content.format}
                className={content.format === 'markdown' ? 'text-base' : 'text-lg leading-8 text-gray-950'}
              />
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                <span>{content.format === 'markdown' ? 'Markdown' : '纯文本'}</span>
                {content.source && <span>来源：{content.source}</span>}
                <span>创建：{new Date(content.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {content.note && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <ContentBody
                    body={content.note}
                    format={content.note_format || 'plain'}
                    className="text-sm leading-6 text-gray-700"
                  />
                </div>
              )}
              {tagsToInput(content.tags) && (
                <div className="flex flex-wrap gap-2">
                  {tagsToInput(content.tags).split(', ').map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          )}
        </section>

        <aside className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <LinkIcon size={18} />
            关联单词
          </div>

          <div className="space-y-2">
            {selectedWords.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                暂无关联单词
              </div>
            ) : (
              selectedWords.map((word) => (
                <div key={word.id} className="flex items-start justify-between gap-2 rounded-lg bg-gray-50 p-3">
                  <Link href={`/words/${word.id}`} className="min-w-0">
                    <span className="block font-medium text-gray-900 hover:text-indigo-600">{word.word}</span>
                    <span className="line-clamp-2 text-xs leading-5 text-gray-500">{word.meaning}</span>
                  </Link>
                  {editing && (
                    <button type="button" onClick={() => removeWord(word.id)} className="text-gray-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {editing && (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={wordSearch}
                  onChange={(event) => setWordSearch(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="搜索已有单词"
                />
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto">
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
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
