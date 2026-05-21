import { NextRequest, NextResponse } from 'next/server';
import { ContentItem, dbAll, dbGet, dbRun, Word } from '@/lib/db';
import { requireApiKey } from '@/lib/api-key-auth';
import { normalizeContentId } from '@/lib/content-utils.js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authError = await requireApiKey(request);
    if (authError) return authError;

    const { id } = await params;
    const contentId = normalizeContentId(id);
    const content = await dbGet<ContentItem>('SELECT * FROM content_items WHERE id = ?', [contentId]);
    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'CONTENT_NOT_FOUND', message: '内容不存在' } },
        { status: 404 },
      );
    }

    const words = await dbAll<Pick<Word, 'id' | 'word' | 'meaning' | 'status'>>(
      `SELECT w.id, w.word, w.meaning, w.status
       FROM content_word_links cwl
       JOIN words w ON w.id = cwl.word_id
       WHERE cwl.content_id = ?
       ORDER BY w.word ASC`,
      [contentId],
    );

    return NextResponse.json({ success: true, data: { ...content, words } });
  } catch (error) {
    if (error instanceof Error && error.message === '内容 ID 无效') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 },
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authError = await requireApiKey(request);
    if (authError) return authError;

    const { id } = await params;
    const contentId = normalizeContentId(id);
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
    if (error instanceof Error && error.message === '内容 ID 无效') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 },
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 },
    );
  }
}
