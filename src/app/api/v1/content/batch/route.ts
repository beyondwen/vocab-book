import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';
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

export async function POST(request: NextRequest) {
  try {
    const authError = await requireApiKey(request);
    if (authError) return authError;

    const body = await request.json();
    const { contents } = body;

    if (!Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请提供要添加的内容' } },
        { status: 400 },
      );
    }

    if (contents.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '单次最多添加100条内容' } },
        { status: 400 },
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      ids: [] as number[],
    };

    for (const [index, item] of contents.entries()) {
      try {
        const payload = normalizeContentPayload(item);
        if (!(await validateWordIds(payload.wordIds))) {
          results.failed++;
          results.errors.push(`第 ${index + 1} 条内容关联单词不存在`);
          continue;
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

        results.success++;
        results.ids.push(contentId);
      } catch (error) {
        results.failed++;
        const message = error instanceof Error ? error.message : '导入失败';
        results.errors.push(`第 ${index + 1} 条内容失败: ${message}`);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '服务器错误' } },
      { status: 500 },
    );
  }
}
