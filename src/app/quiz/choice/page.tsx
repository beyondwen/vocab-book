'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";

interface Word {
  id: number;
  word: string;
  meaning: string;
}

export default function ChoiceQuizPage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchWords();
  }, []);

  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      generateOptions();
    }
  }, [currentIndex, words]);

  async function fetchWords() {
    try {
      const res = await fetch('/api/words?limit=20&status=learning');
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

  function generateOptions() {
    const currentWord = words[currentIndex];
    const otherWords = words.filter((_, i) => i !== currentIndex);
    const wrongOptions = otherWords
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);

    const allOptions = [...wrongOptions, currentWord.meaning].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setSelected(null);
  }

  function handleSelect(option: string) {
    if (selected) return; // 已选择

    setSelected(option);
    const isCorrect = option === words[currentIndex].meaning;
    if (isCorrect) {
      setCorrect(correct + 1);
    }

    // 1.5秒后进入下一题
    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
      }
    }, 1500);
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
              generateOptions();
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
      <div className="text-center mb-8">
        <p className="text-gray-500 mb-2">请选择正确的释义</p>
        <h2 className="text-3xl font-bold text-gray-900">{currentWord.word}</h2>
      </div>

      {/* 选项 */}
      <div className="space-y-4">
        {options.map((option, index) => {
          let bgColor = 'bg-white hover:bg-gray-50';
          if (selected) {
            if (option === currentWord.meaning) {
              bgColor = 'bg-green-100 border-green-500';
            } else if (option === selected && option !== currentWord.meaning) {
              bgColor = 'bg-red-100 border-red-500';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={!!selected}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${bgColor}`}
            >
              <span className="font-medium text-gray-700">
                {String.fromCharCode(65 + index)}. {option}
              </span>
            </button>
          );
        })}
      </div>

      {/* 得分 */}
      <div className="mt-8 text-center text-gray-500">
        当前得分: {correct} / {currentIndex + (selected ? 1 : 0)}
      </div>
    </div>
  );
}
