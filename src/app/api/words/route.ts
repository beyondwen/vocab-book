import { NextRequest, NextResponse } from 'next/server';
import db, { Word } from '@/lib/db';

// GET /api/words - 查询单词列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const wordbookId = searchParams.get('wordbook_id');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM words WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (wordbookId) {
      query += ' AND wordbook_id = ?';
      params.push(parseInt(wordbookId));
    }

    if (search) {
      query += ' AND (word LIKE ? OR meaning LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 获取总数
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const { total } = db.prepare(countQuery).get(...params) as any;

    // 分页查询
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const words = db.prepare(query).all(...params) as Word[];

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
    const existing = db.prepare('SELECT id FROM words WHERE word = ?').get(word);
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_WORD', message: '单词已存在' } },
        { status: 409 }
      );
    }

    // 插入新单词
    const tagsJson = tags ? JSON.stringify(tags) : null;
    const result = db.prepare(
      'INSERT INTO words (word, phonetic, meaning, example, tags, wordbook_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(word, phonetic || null, meaning, example || null, tagsJson, wordbook_id || null);

    // 更新单词本计数
    if (wordbook_id) {
      db.prepare('UPDATE wordbooks SET word_count = word_count + 1 WHERE id = ?').run(wordbook_id);
    }

    const newWord = db.prepare('SELECT * FROM words WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ success: true, data: newWord }, { status: 201 });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '添加单词失败' } },
      { status: 500 }
    );
  }
}
