import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, SqlParam, Word, WordWithContentCount } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/words - 查询单词列表
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const wordbookId = searchParams.get('wordbook_id');
    const search = searchParams.get('search');

    let whereSql = 'WHERE 1=1';
    const params: SqlParam[] = [];

    if (status) {
      whereSql += ' AND w.status = ?';
      params.push(status);
    }

    if (wordbookId) {
      whereSql += ' AND w.wordbook_id = ?';
      params.push(parseInt(wordbookId));
    }

    if (search) {
      whereSql += ' AND (w.word LIKE ? OR w.meaning LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 获取总数
    const { total } = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total FROM words w ${whereSql}`,
      params,
    ) || { total: 0 };

    // 分页查询
    const words = await dbAll<WordWithContentCount>(
      `SELECT w.*, COUNT(cwl.content_id) as content_count
       FROM words w
       LEFT JOIN content_word_links cwl ON cwl.word_id = w.id
       ${whereSql}
       GROUP BY w.id
       ORDER BY w.created_at DESC, w.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    return NextResponse.json({
      success: true,
      data: {
        words,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取单词失败' } },
      { status: 500 }
    );
  }
}

// POST /api/words - 添加单词
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { word, phonetic, meaning, example, tags, wordbook_id } = body;

    // 验证必填字段
    if (!word || !meaning) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '单词和释义为必填项' } },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await dbGet<{ id: number }>('SELECT id FROM words WHERE word = ?', [word]);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_WORD', message: '单词已存在' } },
        { status: 409 }
      );
    }

    // 插入新单词
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const result = await dbRun(
      'INSERT INTO words (word, phonetic, meaning, example, tags, wordbook_id) VALUES (?, ?, ?, ?, ?, ?)',
      [word, phonetic || null, meaning, example || null, tagsJson, wordbook_id || null]
    );

    // 更新单词本计数
    if (wordbook_id) {
      await dbRun('UPDATE wordbooks SET word_count = word_count + 1 WHERE id = ?', [wordbook_id]);
    }

    const newWord = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [result.lastInsertRowid || null]);

    return NextResponse.json({ success: true, data: newWord }, { status: 201 });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '添加单词失败' } },
      { status: 500 }
    );
  }
}
