import { NextRequest, NextResponse } from 'next/server';
import { ContentItem, ContentItemWithWordCount, dbAll, dbGet, dbRun, SqlParam, Word } from '@/lib/db';
import { requireApiKey } from '@/lib/api-key-auth';
import { normalizeContentPayload } from '@/lib/content-utils.js';

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

export async function GET(request: NextRequest) {
  try {
    const authError = await requireApiKey(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100);
    const search = searchParams.get('search')?.trim();

    const where: string[] = [];
    const params: SqlParam[] = [];
    if (search) {
      where.push('(ci.body LIKE ? OR ci.source LIKE ? OR ci.note LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) as total FROM content_items ci ${whereSql}`,
      params,
    ) || { total: 0 };

    const contents = await dbAll<ContentItemWithWordCount>(
      `SELECT ci.*, COUNT(cwl.word_id) as word_count
       FROM content_items ci
       LEFT JOIN content_word_links cwl ON cwl.content_id = ci.id
       ${whereSql}
       GROUP BY ci.id
       ORDER BY ci.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    return NextResponse.json({
      success: true,
      data: {
        contents,
        pagination: {
          page,
          limit,
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / limit),
        },
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireApiKey(request);
    if (authError) return authError;

    const payload = normalizeContentPayload(await request.json());

    if (!(await validateWordIds(payload.wordIds))) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '关联单词不存在' } },
        { status: 400 },
      );
    }

    const result = await dbRun(
      'INSERT INTO content_items (body, source, note, tags) VALUES (?, ?, ?, ?)',
      [
        payload.body,
        payload.source,
        payload.note,
        payload.tags.length > 0 ? JSON.stringify(payload.tags) : null,
      ],
    );

    const contentId = result.lastInsertRowid;
    if (!contentId) {
      throw new Error('Failed to create content');
    }

    for (const wordId of payload.wordIds) {
      await dbRun(
        'INSERT OR IGNORE INTO content_word_links (content_id, word_id) VALUES (?, ?)',
        [contentId, wordId],
      );
    }

    const content = await fetchContentWithWords(contentId);
    return NextResponse.json({ success: true, data: content }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === '内容正文不能为空') {
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
