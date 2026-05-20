import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/stats - 获取学习统计
export async function GET(request: NextRequest) {
  try {
    // 单词状态统计
    const statusStats = db.prepare(`
      SELECT 
        status,
        COUNT(*) as count
      FROM words
      GROUP BY status
    `).all() as { status: string; count: number }[];

    const totalWords = statusStats.reduce((sum, s) => sum + s.count, 0);
    const statusMap = Object.fromEntries(statusStats.map(s => [s.status, s.count]));

    // 今日学习统计
    const today = new Date().toISOString().split('T')[0];
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as wrong
      FROM review_records
      WHERE DATE(review_date) = ?
    `).get(today) as { total: number; correct: number; wrong: number };

    // 最近7天学习趋势
    const weekTrend = db.prepare(`
      SELECT 
        DATE(review_date) as date,
        COUNT(*) as count,
        SUM(CASE WHEN result = 1 THEN 1 ELSE 0 END) as correct
      FROM review_records
      WHERE review_date >= DATE('now', '-7 days')
      GROUP BY DATE(review_date)
      ORDER BY date ASC
    `).all();

    // 连续学习天数
    const streakResult = db.prepare(`
      WITH RECURSIVE dates(d) AS (
        SELECT DATE('now')
        UNION ALL
        SELECT DATE(d, '-1 day')
        FROM dates
        WHERE EXISTS (
          SELECT 1 FROM review_records 
          WHERE DATE(review_date) = DATE(d, '-1 day')
        )
      )
      SELECT COUNT(*) - 1 as streak FROM dates
    `).get() as { streak: number };

    // 复习日历热力图数据（最近30天）
    const calendarData = db.prepare(`
      SELECT 
        DATE(review_date) as date,
        COUNT(*) as count
      FROM review_records
      WHERE review_date >= DATE('now', '-30 days')
      GROUP BY DATE(review_date)
    `).all();

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
          correct: todayStats.correct || 0,
          wrong: todayStats.wrong || 0,
          accuracy: todayStats.total > 0 ? Math.round(todayStats.correct / todayStats.total * 100) : 0,
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
