'use client';

import { useEffect, useState } from 'react';
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
  weekTrend: { date: string; count: number; correct: number }[];
  calendar: { date: string; count: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats', { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-gray-500">暂无数据</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">学习统计</h1>

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.overview.total}</div>
          <div className="text-sm text-gray-500">总单词数</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.overview.new}</div>
          <div className="text-sm text-gray-500">新单词</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.overview.learning}</div>
          <div className="text-sm text-gray-500">学习中</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-600">{stats.overview.mastered}</div>
          <div className="text-sm text-gray-500">已掌握</div>
        </div>
      </div>

      {/* 掌握率 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">掌握率</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-8">
            <div
              className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white font-medium"
              style={{ width: `${stats.overview.masteredRate}%` }}
            >
              {stats.overview.masteredRate}%
            </div>
          </div>
        </div>
      </div>

      {/* 今日学习 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">📈 今日学习</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.today.reviewed}</div>
            <div className="text-sm text-gray-500">已复习</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.today.correct}</div>
            <div className="text-sm text-gray-500">正确</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{stats.today.wrong}</div>
            <div className="text-sm text-gray-500">错误</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">{stats.today.accuracy}%</div>
            <div className="text-sm text-gray-500">正确率</div>
          </div>
        </div>
      </div>

      {/* 连续学习 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">🔥 连续学习</h2>
        <div className="text-center">
          <div className="text-5xl font-bold text-orange-500">{stats.streak}</div>
          <div className="text-gray-500">天</div>
        </div>
      </div>

      {/* 最近7天趋势 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">📊 最近7天</h2>
        <div className="flex items-end justify-between h-40 gap-2">
          {stats.weekTrend.length > 0 ? (
            stats.weekTrend.map((day, index) => {
              const height = Math.max(20, (day.count / 20) * 100);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{day.count}</div>
                  <div
                    className="w-full bg-indigo-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-gray-400">
                    {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'narrow' })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center text-gray-400">暂无数据</div>
          )}
        </div>
      </div>

      {/* 复习日历 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">📅 复习日历（最近30天）</h2>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - 29 + i);
            const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
            const record = stats.calendar.find(c => c.date === dateStr);
            const count = record?.count || 0;

            let bgColor = 'bg-gray-100';
            if (count > 0) bgColor = 'bg-green-200';
            if (count > 5) bgColor = 'bg-green-400';
            if (count > 10) bgColor = 'bg-green-600';

            return (
              <div
                key={i}
                className={`aspect-square rounded ${bgColor} flex items-center justify-center text-xs`}
                title={`${dateStr}: ${count} 个`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>少</span>
          <div className="w-4 h-4 bg-gray-100 rounded" />
          <div className="w-4 h-4 bg-green-200 rounded" />
          <div className="w-4 h-4 bg-green-400 rounded" />
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
