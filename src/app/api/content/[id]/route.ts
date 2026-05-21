import { NextRequest, NextResponse } from 'next/server';
import { ContentItem, dbAll, dbGet, dbRun, Word } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { normalizeContentBody, normalizeWordIds, parseTags } from '@/lib/content-utils.js';

async function fetchContentWithWords(id: number) {
  const content = await dbGet<ContentItem>('SELECT * FROM content_items WHERE id = ?', [id]);
  if (!content) {
    return undefined;
  }

  const words = await dbAll<Pick<Word, 'id' | 'word' | 'meaning' | 'status'>>(
    `SELECT w.id, w.word, w.meaning, w.status
     FROM content_word_links cwl
     JOIN words w ON w.id = cwl.word_id
     WHERE cwl.content_id = ?
     ORDER BY w.word ASC`,
    [id],
  );

  return { ...content, words };
}

async function validateWordIds(wordIds: number[]) {
  if (wordIds.length === 0) {
    return true;
  }

  const placeholders = wordIds.map(() => '?').join(',');
  const rows = await dbAll<{ id: number }>(
    `SELECT id FROM words WHERE id IN (${placeholders})`,
    wordIds,
  );
  return rows.length === wordIds.length;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const contentId = Number(id);
    const content = await fetchContentWithWords(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'CONTENT_NOT_FOUND', message: '内容不存在' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取内容失败' } },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const contentId = Number(id);
    const existing = await dbGet<ContentItem>('SELECT * FROM content_items WHERE id = ?', [contentId]);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONTENT_NOT_FOUND', message: '内容不存在' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const nextBody = body.body !== undefined ? normalizeContentBody(body.body) : existing.body;
    const nextTags = body.tags !== undefined ? parseTags(body.tags) : null;
    const nextWordIds = body.word_ids !== undefined ? normalizeWordIds(body.word_ids) : null;

    if (nextWordIds && !(await validateWordIds(nextWordIds))) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '关联单词不存在' } },
        { status: 400 },
      );
    }

    await dbRun(
      `UPDATE content_items SET
        body = ?,
        source = ?,
        note = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        nextBody,
        body.source !== undefined ? String(body.source).trim() || null : existing.source,
        body.note !== undefined ? String(body.note).trim() || null : existing.note,
        nextTags ? (nextTags.length > 0 ? JSON.stringify(nextTags) : null) : existing.tags,
        contentId,
      ],
    );

    if (nextWordIds) {
      await dbRun('DELETE FROM content_word_links WHERE content_id = ?', [contentId]);
      for (const wordId of nextWordIds) {
        await dbRun(
          'INSERT OR IGNORE INTO content_word_links (content_id, word_id) VALUES (?, ?)',
          [contentId, wordId],
        );
      }
    }

    const updatedContent = await fetchContentWithWords(contentId);
    return NextResponse.json({ success: true, data: updatedContent });
  } catch (error) {
    if (error instanceof Error && error.message === '内容正文不能为空') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 },
      );
    }

    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '更新内容失败' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const contentId = Number(id);
    const existing = await dbGet<ContentItem>('SELECT * FROM content_items WHERE id = ?', [contentId]);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'CONTENT_NOT_FOUND', message: '内容不存在' } },
        { status: 404 },
      );
    }

    await dbRun('DELETE FROM content_items WHERE id = ?', [contentId]);
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '删除内容失败' } },
      { status: 500 },
    );
  }
}
