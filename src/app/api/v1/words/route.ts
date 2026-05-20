import { NextRequest, NextResponse } from 'next/server';
import db, { Word } from '@/lib/db';
import crypto from 'crypto';

// API Key 验证中间件
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');

  let key = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    key = authHeader.substring(7);
  } else if (apiKey) {
    key = apiKey;
  }

  if (!key) {
    return null;
  }

  // 计算 key 的 hash
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  // 查询数据库
  const apiKeyRecord = db.prepare(
    'SELECT * FROM api_keys WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)'
  ).get(keyHash) as any;

  if (apiKeyRecord) {
    // 更新最后使用时间
    db.prepare('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(apiKeyRecord.id);
  }

  return apiKeyRecord;
}

// GET /api/v1/words - 查询单词
export async function GET(request: NextRequest) {
  try {
    const apiKey = await validateApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '无效的 API Key' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');

    let query = 'SELECT id, word, phonetic, meaning, example, tags, status, created_at FROM words WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (word LIKE ? OR meaning LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const countQuery = query.replace('SELECT id, word, phonetic, meaning, example, tags, status, created_at', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params) as any;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const words = db.prepare(query).all(...params);

    return NextResponse.json({
      success: true,
      data: {
        words,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}

// POST /api/v1/words - 添加单词
export async function POST(request: NextRequest) {
  try {
    const apiKey = await validateApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: '无效的 API Key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { word, phonetic, meaning, example, tags } = body;

    if (!word || !meaning) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '单词和释义为必填项' } },
        { status: 400 }
      );
    }

    // 检查重复
    const existing = db.prepare('SELECT id FROM words WHERE word = ?').get(word);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_WORD', message: '单词已存在' } },
        { status: 409 }
      );
    }

    const tagsJson = tags ? JSON.stringify(tags) : null;
    const result = db.prepare(
      'INSERT INTO words (word, phonetic, meaning, example, tags) VALUES (?, ?, ?, ?, ?)'
    ).run(word, phonetic || null, meaning, example || null, tagsJson);

    const newWord = db.prepare('SELECT id, word, created_at FROM words WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ success: true, data: newWord }, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
