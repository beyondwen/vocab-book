import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

// API Key 验证
async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');

  let key = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    key = authHeader.substring(7);
  } else if (apiKey) {
    key = apiKey;
  }

  if (!key) return null;

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const record = db.prepare(
    'SELECT * FROM api_keys WHERE key_hash = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)'
  ).get(keyHash) as any;

  if (record) {
    db.prepare('UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(record.id);
  }

  return record;
}

// POST /api/v1/words/batch - 批量添加
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
    const { words } = body;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请提供要添加的单词' } },
        { status: 400 }
      );
    }

    if (words.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '单次最多添加100个单词' } },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    const insertStmt = db.prepare(
      'INSERT INTO words (word, phonetic, meaning, example, tags) VALUES (?, ?, ?, ?, ?)'
    );
    const checkDuplicate = db.prepare('SELECT id FROM words WHERE word = ?');

    const insertMany = db.transaction((items: any[]) => {
      for (const item of items) {
        try {
          const { word, phonetic, meaning, example, tags } = item;

          if (!word || !meaning) {
            results.failed++;
            results.errors.push(`缺少必填字段: ${word || '未知'}`);
            continue;
          }

          const existing = checkDuplicate.get(word);
          if (existing) {
            results.duplicates++;
            continue;
          }

          const tagsJson = tags ? JSON.stringify(tags) : null;
          insertStmt.run(word, phonetic || null, meaning, example || null, tagsJson);
          results.success++;
        } catch {
          results.failed++;
          results.errors.push(`导入失败: ${item.word || '未知'}`);
        }
      }
    });

    insertMany(words);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 }
    );
  }
}
