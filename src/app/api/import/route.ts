import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbRun } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

interface ImportWord {
  word?: string;
  phonetic?: string | null;
  meaning?: string;
  example?: string | null;
  tags?: string[];
}

// POST /api/import - 批量导入单词
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { words, wordbook_id } = body;

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请提供要导入的单词' } },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    for (const item of words as ImportWord[]) {
      try {
        const { word, phonetic, meaning, example, tags } = item;

        if (!word || !meaning) {
          results.failed++;
          results.errors.push(`缺少必填字段: ${word || '未知'}`);
          continue;
        }

        // 检查重复
        const existing = await dbGet<{ id: number }>('SELECT id FROM words WHERE word = ?', [word]);
        if (existing) {
          results.duplicates++;
          continue;
        }

        const tagsJson = tags ? JSON.stringify(tags) : null;
        await dbRun(
          'INSERT INTO words (word, phonetic, meaning, example, tags, wordbook_id) VALUES (?, ?, ?, ?, ?, ?)',
          [word, phonetic || null, meaning, example || null, tagsJson, wordbook_id || null]
        );
        results.success++;
      } catch {
        results.failed++;
        results.errors.push(`导入失败: ${item.word || '未知'}`);
      }
    }

    // 更新单词本计数
    if (wordbook_id && results.success > 0) {
      await dbRun('UPDATE wordbooks SET word_count = word_count + ? WHERE id = ?', [results.success, wordbook_id]);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error importing words:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '导入失败' } },
      { status: 500 }
    );
  }
}
