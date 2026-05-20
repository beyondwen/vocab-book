import { NextRequest, NextResponse } from 'next/server';
import db, { Word, ReviewRecord } from '@/lib/db';
import { calculateSM2, getTodayReviewDate } from '@/lib/sm2';

// GET /api/review - 获取今日待复习单词
export async function GET(request: NextRequest) {
  try {
    const today = getTodayReviewDate();

    // 查询今日待复习的单词
    const wordsToReview = db.prepare(`
      SELECT DISTINCT w.* 
      FROM words w
      LEFT JOIN review_records r ON w.id = r.word_id
      WHERE 
        w.status = 'new' 
        OR (r.next_review_date <= ? AND r.id = (
          SELECT id FROM review_records 
          WHERE word_id = w.id 
          ORDER BY review_date DESC 
          LIMIT 1
        ))
      ORDER BY 
        CASE WHEN w.status = 'new' THEN 0 ELSE 1 END,
        r.next_review_date ASC
      LIMIT 20
    `).all(today) as Word[];

    return NextResponse.json({
      success: true,
      data: {
        words: wordsToReview,
        count: wordsToReview.length,
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
    const body = await request.json();
    const { word_id, quality } = body; // quality: 0-5

    if (!word_id || quality === undefined || quality < 0 || quality > 5) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '参数错误' } },
        { status: 400 }
      );
    }

    // 获取单词当前状态
    const word = db.prepare('SELECT * FROM words WHERE id = ?').get(word_id) as Word | undefined;
    if (!word) {
      return NextResponse.json(
        { success: false, error: { code: 'WORD_NOT_FOUND', message: '单词不存在' } },
        { status: 404 }
      );
    }

    // 获取上次复习记录
    const lastReview = db.prepare(
      'SELECT * FROM review_records WHERE word_id = ? ORDER BY review_date DESC LIMIT 1'
    ).get(word_id) as ReviewRecord | undefined;

    const repetitions = lastReview ? (lastReview.result ? 1 : 0) : 0;
    const easeFactor = lastReview ? lastReview.ease_factor : 2.5;
    const interval = lastReview ? lastReview.interval : 1;

    // 计算下次复习参数
    const result = calculateSM2(quality, repetitions, easeFactor, interval);

    // 插入复习记录
    db.prepare(
      `INSERT INTO review_records (word_id, review_date, result, next_review_date, interval, ease_factor) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      word_id,
      new Date().toISOString(),
      quality >= 3 ? 1 : 0,
      result.nextReviewDate.toISOString(),
      result.interval,
      result.easeFactor
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

    db.prepare('UPDATE words SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, word_id);

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
