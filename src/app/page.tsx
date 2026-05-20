'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchReviewCount();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }

  async function fetchReviewCount() {
    try {
      const res = await fetch('/api/review');
      const data = await res.json();
      if (data.success) {
        setReviewCount(data.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch review count:', error);
    }
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">欢迎回来 👋</h1>
        <p className="text-indigo-100 text-lg">
          今日待复习: <span className="font-bold text-white">{reviewCount}</span> 个单词
        </p>
        {reviewCount > 0 && (
          <Link
            href="/review"
            className="inline-block mt-4 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            开始复习 →
          </Link>
        )}
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">总单词数</div>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.total}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">学习中</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.overview.learning}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">已掌握</div>
            <div className="text-3xl font-bold text-green-600">{stats.overview.mastered}</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="text-sm text-gray-500 mb-1">连续学习</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.streak} 天</div>
          </div>
        </div>
      )}

      {/* 今日学习情况 */}
      {stats && stats.today.reviewed > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">📈 今日学习</h2>
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

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/words/new"
          className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">➕</div>
          <div className="font-semibold">添加单词</div>
          <div className="text-sm text-gray-500">手动录入新单词</div>
        </Link>
        <Link
          href="/quiz"
          className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">✍️</div>
          <div className="font-semibold">开始测试</div>
          <div className="text-sm text-gray-500">检验学习成果</div>
        </Link>
        <Link
          href="/import"
          className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="text-2xl mb-2">📥</div>
          <div className="font-semibold">批量导入</div>
          <div className="text-sm text-gray-500">从文件导入单词</div>
        </Link>
      </div>
    </div>
  );
}
