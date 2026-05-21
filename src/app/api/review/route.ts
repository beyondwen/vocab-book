import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet, dbRun, Word, ReviewRecord } from '@/lib/db';
import { calculateSM2, getTodayReviewDate } from '@/lib/sm2';
import { requireAdmin } from '@/lib/admin-auth';

// GET /api/review - 获取今日待复习单词
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const today = getTodayReviewDate();

    // 查询今日待复习的单词
    const wordsToReview = await dbAll<Word>(`
      SELECT DISTINCT w.* 
      FROM words w
      LEFT JOIN review_records r ON w.id = r.word_id
      WHERE 
        w.status = 'new' 
        OR (DATE(r.next_review_date) <= ? AND r.id = (
          SELECT id FROM review_records 
          WHERE word_id = w.id 
          ORDER BY review_date DESC 
          LIMIT 1
        ))
      ORDER BY 
        CASE WHEN w.status = 'new' THEN 0 ELSE 1 END,
        r.next_review_date ASC
      LIMIT 20
    `, [today]);

    const wordsWithContents = await Promise.all(
      wordsToReview.map(async (word) => {
        const contents = await dbAll(
          `SELECT ci.*
           FROM content_word_links cwl
           JOIN content_items ci ON ci.id = cwl.content_id
           WHERE cwl.word_id = ?
           ORDER BY cwl.created_at DESC
           LIMIT 2`,
          [word.id],
        );
        return { ...word, contents };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        words: wordsWithContents,
        count: wordsWithContents.length,
      },
    });
  } catch (error) {
    console.error('Error fetching review words:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取复习单词失败' } },
      { status: 500 }
    );
  }
}

// POST /api/review - 提交复习结果
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const body = await request.json();
    const { word_id, quality } = body; // quality: 0-5

    if (!word_id || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误' } },
        { status: 400 }
      );
    }

    // 获取单词当前状态
    const word = await dbGet<Word>('SELECT * FROM words WHERE id = ?', [word_id]);
    if (!word) {
      return NextResponse.json(
        { success: false, error: { code: 'WORD_NOT_FOUND', message: '单词不存在' } },
        { status: 404 }
      );
    }

    // 获取上次复习记录
    const lastReview = await dbGet<ReviewRecord>(
      'SELECT * FROM review_records WHERE word_id = ? ORDER BY review_date DESC LIMIT 1',
      [word_id]
    );

    const repetitions = lastReview ? lastReview.repetitions : 0;
    const easeFactor = lastReview ? lastReview.ease_factor : 2.5;
    const interval = lastReview ? lastReview.interval : 1;

    // 计算下次复习参数
    const result = calculateSM2(quality, repetitions, easeFactor, interval);

    // 插入复习记录
    await dbRun(
      `INSERT INTO review_records (word_id, review_date, result, next_review_date, interval, ease_factor, repetitions)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        word_id,
        new Date().toISOString(),
        quality >= 3 ? 1 : 0,
        result.nextReviewDate.toISOString(),
        result.interval,
        result.easeFactor,
        result.repetitions,
      ]
    );

    // 更新单词状态
    let newStatus = word.status;
    if (quality >= 3) {
      if (word.status === 'new') {
        newStatus = 'learning';
      } else if (result.interval >= 30) {
        newStatus = 'mastered';
      }
    } else {
      if (word.status === 'mastered') {
        newStatus = 'learning';
      }
    }

    await dbRun('UPDATE words SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, word_id]);

    return NextResponse.json({
      success: true,
      data: {
        next_review_date: result.nextReviewDate.toISOString(),
        interval: result.interval,
        new_status: newStatus,
      },
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '提交复习结果失败' } },
      { status: 500 }
    );
  }
}
