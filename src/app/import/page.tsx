'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    // 读取文件预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const words = parseCSV(text);
      setPreview(words.slice(0, 5)); // 只预览前5个
    };
    reader.readAsText(selectedFile);
  }

  function parseCSV(text: string): any[] {
    const lines = text.split('\n').filter(line => line.trim());
    const words = [];

    for (const line of lines) {
      // 支持多种分隔符: 逗号、制表符、分号
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length >= 2) {
        words.push({
          word: parts[0],
          meaning: parts[1],
          phonetic: parts[2] || null,
          example: parts[3] || null,
        });
      }
    }

    return words;
  }

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const words = parseCSV(text);

        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ words }),
        });

        const data = await res.json();
        if (data.success) {
          setResult(data.data);
        } else {
          alert(data.error?.message || '导入失败');
        }
        setLoading(false);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Failed to import:', error);
      alert('导入失败');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">批量导入</h1>

      {/* 格式说明 */}
      <div className="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">支持的格式</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• CSV 或 TXT 文件</li>
          <li>• 每行一个单词</li>
          <li>• 格式: 单词,释义[,音标,例句]</li>
          <li>• 分隔符支持: 逗号、制表符、分号</li>
        </ul>
        <div className="mt-3 p-3 bg-white rounded text-sm font-mono text-gray-600">
          ephemeral,短暂的,/ɪˈfemərəl/,Fame is ephemeral.<br/>
          ubiquitous,无处不在的<br/>
          serendipity,意外发现的好运
        </div>
      </div>

      {/* 文件上传 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择文件
        </label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* 预览 */}
      {preview.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">预览（前5个）</h3>
          <div className="space-y-2">
            {preview.map((word, index) => (
              <div key={index} className="flex gap-4 text-sm">
                <span className="font-medium">{word.word}</span>
                <span className="text-gray-500">{word.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 导入按钮 */}
      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '导入中...' : '开始导入'}
      </button>

      {/* 结果 */}
      {result && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">导入结果</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{result.success}</div>
              <div className="text-sm text-gray-500">成功</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{result.duplicates}</div>
              <div className="text-sm text-gray-500">重复</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{result.failed}</div>
              <div className="text-sm text-gray-500">失败</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-700">
              {result.errors.map((err: string, i: number) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/words')}
            className="mt-4 w-full py-2 border rounded-lg hover:bg-gray-50"
          >
            查看单词列表
          </button>
        </div>
      )}
    </div>
  );
}
