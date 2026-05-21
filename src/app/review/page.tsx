'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminHeaders } from '@/lib/admin-client';
import ContentBody from '@/app/components/ContentBody';

interface Word {
  id: number;
  word: string;
  phonetic: string | null;
  meaning: string;
  example: string | null;
  contents?: {
    id: number;
    body: string;
    format: 'plain' | 'markdown';
    note: string | null;
    note_format: 'plain' | 'markdown';
    source: string | null;
  }[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function fetchReviewWords() {
      try {
        const res = await fetch('/api/review', { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.success) {
          setWords(data.data.words);
          if (data.data.words.length === 0) {
            setCompleted(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch review words:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviewWords();
  }, []);

  async function handleReview(quality: number) {
    const word = words[currentIndex];

    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          word_id: word.id,
          quality,
        }),
      });

      // 下一个单词
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        setCompleted(true);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">复习完成！</h2>
        <p className="text-gray-500 mb-6">
          {words.length > 0
            ? `本次复习了 ${words.length} 个单词`
            : '今日暂无需要复习的单词'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
          >
            返回首页
          </button>
          <button
            onClick={() => router.push('/stats')}
            className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
          >
            查看统计
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度条 */}
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

      {/* 单词卡片 */}
      <div className="bg-white rounded-2xl shadow-lg border p-8 mb-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentWord.word}
          </h2>
          {currentWord.phonetic && (
            <p className="text-gray-500 text-lg">{currentWord.phonetic}</p>
          )}

          {showAnswer ? (
            <div className="mt-6 pt-6 border-t">
              <p className="text-xl text-gray-800 mb-4">
                {currentWord.meaning}
              </p>
              {currentWord.example && (
                <p className="text-gray-500 italic">
                  {currentWord.example}
                </p>
              )}
              {currentWord.contents && currentWord.contents.length > 0 && (
                <div className="mt-5 space-y-3 text-left">
                  <h3 className="text-sm font-semibold text-gray-500">相关语境</h3>
                  {currentWord.contents.map((content) => (
                    <div key={content.id} className="rounded-lg bg-gray-50 p-4">
                      <ContentBody body={content.body} format={content.format} className="text-sm leading-6 text-gray-700" />
                      {content.note && (
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          <div className="mb-2 text-xs font-semibold text-gray-500">分析</div>
                          <ContentBody
                            body={content.note}
                            format={content.note_format || 'plain'}
                            className="text-sm leading-6 text-gray-700"
                          />
                        </div>
                      )}
                      {content.source && (
                        <div className="mt-2 text-xs text-gray-400">来源：{content.source}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-8 px-8 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors"
            >
              显示答案
            </button>
          )}
        </div>
      </div>

      {/* 评分按钮 */}
      {showAnswer && (
        <div className="space-y-4">
          <p className="text-center text-gray-500 text-sm">
            你对这个单词的熟悉程度：
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleReview(1)}
              className="py-3 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              😰 完全忘记
            </button>
            <button
              onClick={() => handleReview(3)}
              className="py-3 rounded-lg font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
            >
              🤔 模糊记得
            </button>
            <button
              onClick={() => handleReview(5)}
              className="py-3 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              😊 完全记住
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
