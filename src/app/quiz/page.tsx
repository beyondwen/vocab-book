'use client';

import Link from 'next/link';

export default function QuizPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">选择测试模式</h1>

      <div className="grid gap-6">
        <Link
          href="/quiz/choice"
          className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <h2 className="text-lg font-semibold">选择题</h2>
              <p className="text-gray-500">看英文选择正确释义</p>
            </div>
          </div>
        </Link>

        <Link
          href="/quiz/spelling"
          className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">✍️</div>
            <div>
              <h2 className="text-lg font-semibold">拼写测试</h2>
              <p className="text-gray-500">看中文输入英文拼写</p>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl p-6 shadow-sm border opacity-50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔊</div>
            <div>
              <h2 className="text-lg font-semibold">听力测试</h2>
              <p className="text-gray-500">听发音选单词（即将上线）</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
