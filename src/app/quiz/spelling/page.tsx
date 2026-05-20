'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminHeaders } from '@/lib/admin-client';

interface Word {
  id: number;
  word: string;
  meaning: string;
}

export default function SpellingQuizPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await fetch('/api/words?limit=20&status=learning', { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.success) {
          setWords(data.data.words);
          if (data.data.words.length === 0) {
            setCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch words:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWords();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (result) return; // 已提交

    const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();
    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setCorrect(correct + 1);
    }

    // 2秒后进入下一题
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setInput('');
        setResult(null);
      } else {
        setCompleted(true);
      }
    }, 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (completed) {
    const total = words.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">
          {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
        </div>
        <h2 className="text-2xl font-bold mb-2">测试完成！</h2>
        <div className="text-4xl font-bold text-indigo-600 mb-2">{accuracy}%</div>
        <p className="text-gray-500 mb-6">
          答对 {correct} / {total} 题
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            返回首页
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setCorrect(0);
              setCompleted(false);
              setInput('');
              setResult(null);
            }}
            className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
          >
            再来一次
          </button>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold mb-2">暂无可测试的单词</h2>
        <p className="text-gray-500 mb-6">请先添加一些单词</p>
        <Link
          href="/words/new"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
        >
          添加单词
        </Link>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度 */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>进度</span>
          <span>{currentIndex + 1} / {words.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 题目 */}
      <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8 text-center">
        <p className="text-gray-500 mb-2">请拼写这个单词</p>
        <h2 className="text-2xl font-bold text-gray-900">{currentWord.meaning}</h2>
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!!result}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none text-center ${
              result === 'correct'
                ? 'border-green-500 bg-green-50'
                : result === 'wrong'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-indigo-500'
            }`}
            placeholder="输入英文单词..."
            autoComplete="off"
          />
        </div>

        {result && (
          <div className={`text-center p-4 rounded-lg ${
            result === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {result === 'correct' ? (
              <span className="font-medium">✓ 正确！</span>
            ) : (
              <span className="font-medium">
                ✗ 正确答案是: <strong>{currentWord.word}</strong>
              </span>
            )}
          </div>
        )}

        {!result && (
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            确认
          </button>
        )}
      </form>

      {/* 得分 */}
      <div className="mt-8 text-center text-gray-500">
        当前得分: {correct} / {currentIndex}
      </div>
    </div>
  );
}
