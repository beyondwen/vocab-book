import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, Word } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/words/[id] - 获取单词详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const word = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [id]);

    if (!word) {
      return NextResponse.json(
        { success: false, error: { code: 'WORD_NOT_FOUND', message: '单词不存在' } },
        { status: 404 }
      );
    }

    // 获取复习记录
    const reviews = await dbAll(
      'SELECT * FROM review_records WHERE word_id = ? ORDER BY review_date DESC LIMIT 10',
      [id]
    );

    return NextResponse.json({
      success: true,
      data: { ...word, reviews },
    });
  } catch (error) {
    console.error('Error fetching word:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取单词失败' } },
      { status: 500 }
    );
  }
}

// PUT /api/words/[id] - 更新单词
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { word, phonetic, meaning, example, tags, status, wordbook_id } = body;

    // 检查单词是否存在
    const existing = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'WORD_NOT_FOUND', message: '单词不存在' } },
        { status: 404 }
      );
    }

    // 如果更新单词，检查是否重复
    if (word && word !== existing.word) {
      const duplicate = await dbGet<{ id: number }>('SELECT id FROM words WHERE word = ? AND id != ?', [word, id]);
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_WORD', message: '单词已存在' } },
          { status: 409 }
        );
      }
    }

    const tagsJson = tags ? JSON.stringify(tags) : existing.tags;

    await dbRun(
      `UPDATE words SET 
        word = COALESCE(?, word),
        phonetic = COALESCE(?, phonetic),
        meaning = COALESCE(?, meaning),
        example = COALESCE(?, example),
        tags = COALESCE(?, tags),
        status = COALESCE(?, status),
        wordbook_id = COALESCE(?, wordbook_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        word || null,
        phonetic !== undefined ? phonetic : null,
        meaning || null,
        example !== undefined ? example : null,
        tagsJson,
        status || null,
        wordbook_id !== undefined ? wordbook_id : null,
        id,
      ]
    );

    const updatedWord = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [id]);

    return NextResponse.json({ success: true, data: updatedWord });
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '更新单词失败' } },
      { status: 500 }
    );
  }
}

// DELETE /api/words/[id] - 删除单词
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 检查单词是否存在
    const existing = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'WORD_NOT_FOUND', message: '单词不存在' } },
        { status: 404 }
      );
    }

    // 删除单词（级联删除复习记录）
    await dbRun('DELETE FROM words WHERE id = ?', [id]);

    // 更新单词本计数
    if (existing.wordbook_id) {
      await dbRun('UPDATE wordbooks SET word_count = word_count - 1 WHERE id = ?', [existing.wordbook_id]);
    }

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除单词失败' } },
      { status: 500 }
    );
  }
}
