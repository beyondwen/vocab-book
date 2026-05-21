'use client';

import { useEffect, useState } from 'react';
import { getAdminHeaders } from '@/lib/admin-client';

interface ApiKey {
  id: number;
  name: string | null;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const baseUrl = 'https://vocab-book.beyondlenovo.workers.dev';

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/words',
    title: '查询单词',
    description: '按分页读取单词，也可以用 search 搜索英文或释义。',
    params: 'page、limit、search',
  },
  {
    method: 'POST',
    path: '/api/v1/words',
    title: '添加单词',
    description: '添加一个新单词。word 和 meaning 必填，其余字段可选。',
    params: 'word、meaning、phonetic、example、tags',
  },
  {
    method: 'POST',
    path: '/api/v1/words/batch',
    title: '批量添加',
    description: '一次最多导入 100 个单词，重复项会跳过并计入 duplicates。',
    params: 'words[]',
  },
  {
    method: 'GET',
    path: '/api/v1/content',
    title: '查询内容',
    description: '按分页读取句子和摘录，也可以用 search 搜索正文、来源或备注。',
    params: 'page、limit、search',
  },
  {
    method: 'POST',
    path: '/api/v1/content',
    title: '添加内容',
    description: '添加一条句子或短内容，可选择纯文本或 Markdown，并关联已有单词。',
    params: 'body、format、source、note、note_format、tags、word_ids',
  },
  {
    method: 'POST',
    path: '/api/v1/content/batch',
    title: '批量添加内容',
    description: '一次最多导入 100 条内容，逐条返回成功和失败统计。',
    params: 'contents[]',
  },
  {
    method: 'DELETE',
    path: '/api/v1/content/:id',
    title: '删除内容',
    description: '删除一条内容和它的单词关联，不删除单词本身。',
    params: 'id',
  },
];

const fieldRows = [
  ['word', 'string', '是', '英文单词或短语，例如 ephemeral'],
  ['meaning', 'string', '是', '中文释义，例如 短暂的'],
  ['phonetic', 'string', '否', '音标，例如 /ɪˈfemərəl/'],
  ['example', 'string', '否', '例句，例如 Fame is ephemeral.'],
  ['tags', 'string[]', '否', '标签数组，例如 ["GRE", "阅读"]'],
];

const contentFieldRows = [
  ['body', 'string', '是', '句子、段落或摘录正文'],
  ['format', '"plain" | "markdown"', '否', '正文格式，默认 plain；markdown 会安全渲染标题、列表、引用、表格和代码块'],
  ['source', 'string', '否', '来源，例如书名、文章、视频或网址'],
  ['note', 'string', '否', '备注，例如收藏原因或用法说明'],
  ['note_format', '"plain" | "markdown"', '否', '备注格式，默认 plain；传错会返回 VALIDATION_ERROR'],
  ['tags', 'string[] 或 string', '否', '标签数组，或用逗号分隔的字符串'],
  ['word_ids', 'number[]', '否', '要关联的已有单词 ID 数组'],
];

const errorRows = [
  ['UNAUTHORIZED', 'API Key 缺失、错误或已过期'],
  ['VALIDATION_ERROR', '请求体缺少必填字段，或批量数量超过 100'],
  ['DUPLICATE_WORD', '添加的单词已经存在'],
  ['INTERNAL_ERROR', '服务端处理失败'],
];

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch('/api/settings/api-keys', { headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    setCreating(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: newKeyName || null }),
      });

      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.key);
        setNewKeyName('');
        fetchKeys();
      } else {
        alert(data.error?.message || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  }

  async function deleteKey(id: number) {
    if (!confirm('确定要删除这个 API Key 吗？')) return;

    try {
      const res = await fetch(`/api/settings/api-keys?id=${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });

      const data = await res.json();
      if (data.success) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  }

  const authExample = `Authorization: Bearer vb_xxx...
X-API-Key: vb_xxx...`;
  const createExample = `curl -X POST ${baseUrl}/api/v1/words \\
  -H "Authorization: Bearer vb_xxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "word": "ephemeral",
    "meaning": "短暂的",
    "phonetic": "/ɪˈfemərəl/",
    "example": "Fame is ephemeral.",
    "tags": ["GRE", "阅读"]
  }'`;
  const queryExample = `curl "${baseUrl}/api/v1/words?page=1&limit=20&search=ephemeral" \\
  -H "Authorization: Bearer vb_xxx..."`;
  const batchExample = `curl -X POST ${baseUrl}/api/v1/words/batch \\
  -H "Authorization: Bearer vb_xxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "words": [
      { "word": "ubiquitous", "meaning": "无处不在的" },
      { "word": "serendipity", "meaning": "意外发现的好运" }
    ]
  }'`;
  const createContentExample = `curl -X POST ${baseUrl}/api/v1/content \\
  -H "Authorization: Bearer vb_xxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "body": "Fame is ephemeral.",
    "format": "markdown",
    "source": "reading note",
    "note": "## 错误分析\\n\\n- ephemeral: 短暂的\\n- usable in writing",
    "note_format": "markdown",
    "tags": ["阅读", "例句"],
    "word_ids": [1]
  }'`;
  const queryContentExample = `curl "${baseUrl}/api/v1/content?page=1&limit=20&search=ephemeral" \\
  -H "Authorization: Bearer vb_xxx..."`;
  const batchContentExample = `curl -X POST ${baseUrl}/api/v1/content/batch \\
  -H "Authorization: Bearer vb_xxx..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [
      { "body": "Fame is ephemeral.", "tags": ["阅读"] },
      { "body": "Serendipity often rewards curiosity.", "note": "### 备注\\n\\n可以用于写作。", "note_format": "markdown", "source": "note" }
    ]
  }'`;
  const deleteContentExample = `curl -X DELETE ${baseUrl}/api/v1/content/1 \\
  -H "Authorization: Bearer vb_xxx..."`;
  const responseExample = `{
  "success": true,
  "data": {
    "id": 1,
    "word": "ephemeral",
    "created_at": "2026-05-20 13:37:31"
  }
}`;

  if (loading) {
    return <div className="text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">第三方 API</h1>
          <p className="text-gray-500 mt-1">把外部工具、浏览器插件或自动化脚本接入这个单词本。</p>
        </div>
        <div className="text-sm text-gray-500">
          Base URL: <code className="px-2 py-1 bg-gray-100 rounded">{baseUrl}</code>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {endpoints.map((endpoint) => (
          <div key={endpoint.path + endpoint.method} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {endpoint.method}
              </span>
              <code className="text-sm text-gray-700">{endpoint.path}</code>
            </div>
            <h2 className="font-semibold text-gray-900">{endpoint.title}</h2>
            <p className="mt-2 text-sm text-gray-500 leading-6">{endpoint.description}</p>
            <div className="mt-3 text-xs text-gray-400">参数：{endpoint.params}</div>
          </div>
        ))}
      </div>

      {/* 创建新 Key */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">创建新 Key</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="备注名（可选）"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={createKey}
            disabled={creating || keys.length >= 5}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? '创建中...' : '创建'}
          </button>
        </div>
        {keys.length >= 5 && (
          <p className="mt-2 text-sm text-red-500">已达最大数量限制</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="bg-white rounded-xl p-6 shadow-sm border space-y-5">
          <div>
            <h2 className="text-lg font-semibold">认证方式</h2>
            <p className="text-sm text-gray-500 mt-1">
              第三方 API 只接受 API Key，不使用网页登录 Cookie。两种 Header 写法任选其一。
            </p>
          </div>
          <CodeBlock code={authExample} onCopy={copyToClipboard} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="font-medium text-gray-900">Key 前缀</div>
              <div className="text-gray-500 mt-1">vb_</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <div className="font-medium text-gray-900">数量限制</div>
              <div className="text-gray-500 mt-1">最多 5 个</div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">单词字段</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">字段</th>
                  <th className="py-2 pr-4">类型</th>
                  <th className="py-2 pr-4">必填</th>
                  <th className="py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                {fieldRows.map(([field, type, required, description]) => (
                  <tr key={field} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-mono text-gray-900">{field}</td>
                    <td className="py-3 pr-4 text-gray-600">{type}</td>
                    <td className="py-3 pr-4 text-gray-600">{required}</td>
                    <td className="py-3 text-gray-500">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">内容字段</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">字段</th>
                <th className="py-2 pr-4">类型</th>
                <th className="py-2 pr-4">必填</th>
                <th className="py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              {contentFieldRows.map(([field, type, required, description]) => (
                <tr key={field} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-mono text-gray-900">{field}</td>
                  <td className="py-3 pr-4 text-gray-600">{type}</td>
                  <td className="py-3 pr-4 text-gray-600">{required}</td>
                  <td className="py-3 text-gray-500">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border space-y-5">
        <h2 className="text-lg font-semibold">调用示例</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <ExampleCard title="添加单词" code={createExample} onCopy={copyToClipboard} />
          <ExampleCard title="查询单词" code={queryExample} onCopy={copyToClipboard} />
          <ExampleCard title="批量添加" code={batchExample} onCopy={copyToClipboard} />
          <ExampleCard title="添加内容" code={createContentExample} onCopy={copyToClipboard} />
          <ExampleCard title="查询内容" code={queryContentExample} onCopy={copyToClipboard} />
          <ExampleCard title="批量添加内容" code={batchContentExample} onCopy={copyToClipboard} />
          <ExampleCard title="删除内容" code={deleteContentExample} onCopy={copyToClipboard} />
          <ExampleCard title="成功响应" code={responseExample} onCopy={copyToClipboard} />
        </div>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">返回格式与错误码</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="font-medium text-gray-900 mb-2">统一返回</div>
            <div className="text-sm text-gray-500 leading-6">
              成功时返回 <code>success: true</code> 和 <code>data</code>；失败时返回 <code>success: false</code> 和 <code>error.code</code>、<code>error.message</code>。
            </div>
          </div>
          <div className="space-y-2">
            {errorRows.map(([code, message]) => (
              <div key={code} className="flex gap-3 text-sm">
                <code className="w-36 shrink-0 px-2 py-1 bg-red-50 text-red-700 rounded">{code}</code>
                <span className="text-gray-500 py-1">{message}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 新创建的 Key */}
      {newKey && (
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">✓ 创建成功</h3>
          <p className="text-sm text-green-700 mb-3">
            请立即复制保存，关闭后将无法再次查看！
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKey}
              readOnly
              className="flex-1 px-4 py-2 bg-white border rounded-lg font-mono text-sm"
            />
            <button
              onClick={() => copyToClipboard(newKey)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              复制
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-green-600 hover:underline"
          >
            我已保存，关闭提示
          </button>
        </div>
      )}

      {/* Key 列表 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">已创建的 Key</h2>
        {keys.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无 API Key</p>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{key.name || '未命名 Key'}</div>
                  <div className="text-sm text-gray-500">
                    创建于 {new Date(key.created_at).toLocaleDateString('zh-CN')}
                    {key.last_used_at && (
                      <span> · 最后使用 {new Date(key.last_used_at).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExampleCard({
  title,
  code,
  onCopy,
}: {
  title: string;
  code: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => onCopy(code)}
          className="px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
        >
          复制
        </button>
      </div>
      <CodeBlock code={code} onCopy={onCopy} hideCopy />
    </div>
  );
}

function CodeBlock({
  code,
  onCopy,
  hideCopy = false,
}: {
  code: string;
  onCopy: (text: string) => void;
  hideCopy?: boolean;
}) {
  return (
    <div className="relative">
      {!hideCopy && (
        <button
          type="button"
          onClick={() => onCopy(code)}
          className="absolute right-3 top-3 px-2 py-1 text-xs bg-white text-gray-600 border rounded hover:bg-gray-50"
        >
          复制
        </button>
      )}
      <pre className="overflow-x-auto bg-gray-950 text-gray-100 text-sm leading-6 p-4 rounded-lg">
        <code>{code}</code>
      </pre>
    </div>
  );
}
