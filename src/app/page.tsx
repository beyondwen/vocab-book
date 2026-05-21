'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Import, Plus, RotateCcw, Target } from 'lucide-react';
import { getAdminHeaders } from '@/lib/admin-client';

interface Stats {
  overview: {
    total: number;
    new: number;
    learning: number;
    mastered: number;
    masteredRate: number;
  };
  today: {
    reviewed: number;
    correct: number;
    wrong: number;
    accuracy: number;
  };
  streak: number;
}

interface RecentContent {
  id: number;
  body: string;
  format: 'plain' | 'markdown';
  source: string | null;
  word_count: number;
  created_at: string;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentContents, setRecentContents] = useState<RecentContent[]>([]);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [statsRes, reviewRes, contentRes] = await Promise.all([
          fetch('/api/stats', { headers: getAdminHeaders() }),
          fetch('/api/review', { headers: getAdminHeaders() }),
          fetch('/api/content?limit=3', { headers: getAdminHeaders() }),
        ]);
        const [statsData, reviewData, contentData] = await Promise.all([
          statsRes.json(),
          reviewRes.json(),
          contentRes.json(),
        ]);

        if (statsData.success) {
          setStats(statsData.data);
        }

        if (reviewData.success) {
          setReviewCount(reviewData.data.count);
        }

        if (contentData.success) {
          setRecentContents(contentData.data.contents);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      }
    }

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-indigo-600">今日学习</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950">待复习 {reviewCount} 个单词</h1>
              <p className="mt-2 text-sm text-gray-500">先完成复习，再补充新单词和真实语境。</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <RotateCcw size={28} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <RotateCcw size={18} />
              开始复习
            </Link>
            <Link
              href="/content/new"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <FileText size={18} />
              添加内容
            </Link>
            <Link
              href="/words/new"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <Plus size={18} />
              添加单词
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-950">快速入口</h2>
          <div className="mt-4 grid gap-3">
            {[
              { href: '/words', label: '管理单词', icon: BookOpen },
              { href: '/content', label: '查看内容库', icon: FileText },
              { href: '/quiz', label: '开始测试', icon: Target },
              { href: '/import', label: '批量导入', icon: Import },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 text-sm font-medium text-gray-800 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <Icon className="text-indigo-600" size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">总单词数</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.total}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">学习中</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.overview.learning}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">已掌握</div>
            <div className="text-3xl font-bold text-green-600">{stats.overview.mastered}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">连续学习</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.streak} 天</div>
          </div>
        </div>
      )}

      {/* 今日学习情况 */}
      {stats && stats.today.reviewed > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">今日复习结果</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.today.reviewed}</div>
              <div className="text-sm text-gray-500">已复习</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.today.correct}</div>
              <div className="text-sm text-gray-500">正确</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.today.accuracy}%</div>
              <div className="text-sm text-gray-500">正确率</div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-950">最近内容</h2>
          <Link href="/content" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            查看全部
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {recentContents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
              还没有保存内容
            </div>
          ) : (
            recentContents.map((item) => (
              <Link
                key={item.id}
                href={`/content/${item.id}`}
                className="rounded-lg border border-gray-100 p-4 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                <p className="line-clamp-2 text-sm leading-6 text-gray-900">{item.body}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  {item.source && <span>{item.source}</span>}
                  {item.format === 'markdown' && <span>Markdown</span>}
                  <span>{item.word_count} 个关联单词</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
