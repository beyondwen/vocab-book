import { NextRequest, NextResponse } from 'next/server';
import { dbAll, dbGet } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { formatDateInTimeZone, getDayRange } from '@/lib/sm2';

// GET /api/stats - 获取学习统计
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // 单词状态统计
    const statusStats = await dbAll<{ status: string; count: number }>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM words
      GROUP BY status
    `);

    const totalWords = statusStats.reduce((sum, s) => sum + s.count, 0);
    const statusMap = Object.fromEntries(statusStats.map(s => [s.status, s.count]));

    // 今日学习统计
    const today = formatDateInTimeZone(new Date());
    const todayRange = getDayRange(today);
    const todayStats = await dbGet<{ total: number; correct: number | null; wrong: number | null }>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as wrong
      FROM review_records
      WHERE review_date >= ? AND review_date < ?
    `, [todayRange.start, todayRange.end]) || { total: 0, correct: 0, wrong: 0 };
    const todayCorrect = todayStats.correct || 0;
    const todayWrong = todayStats.wrong || 0;

    // 最近7天学习趋势
    const weekTrend = await dbAll(`
      SELECT 
        DATE(review_date, '+8 hours') as date,
        COUNT(*) as count,
        SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct
      FROM review_records
      WHERE review_date >= DATETIME('now', '-7 days')
      GROUP BY DATE(review_date, '+8 hours')
      ORDER BY date ASC
    `);

    // 连续学习天数
    const streakResult = await dbGet<{ streak: number }>(`
      WITH RECURSIVE dates(d) AS (
        SELECT DATE('now', '+8 hours')
        UNION ALL
        SELECT DATE(d, '-1 day')
        FROM dates
        WHERE EXISTS (
          SELECT 1 FROM review_records 
          WHERE DATE(review_date, '+8 hours') = DATE(d, '-1 day')
        )
      )
      SELECT COUNT(*) - 1 as streak FROM dates
    `) || { streak: 0 };

    // 复习日历热力图数据（最近30天）
    const calendarData = await dbAll(`
      SELECT 
        DATE(review_date, '+8 hours') as date,
        COUNT(*) as count
      FROM review_records
      WHERE review_date >= DATETIME('now', '-30 days')
      GROUP BY DATE(review_date, '+8 hours')
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: totalWords,
          new: statusMap.new || 0,
          learning: statusMap.learning || 0,
          mastered: statusMap.mastered || 0,
          masteredRate: totalWords > 0 ? Math.round((statusMap.mastered || 0) / totalWords * 100) : 0,
        },
        today: {
          reviewed: todayStats.total || 0,
          correct: todayCorrect,
          wrong: todayWrong,
          accuracy: todayStats.total > 0 ? Math.round(todayCorrect / todayStats.total * 100) : 0,
        },
        streak: streakResult.streak || 0,
        weekTrend,
        calendar: calendarData,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '获取统计失败' } },
      { status: 500 }
    );
  }
}
