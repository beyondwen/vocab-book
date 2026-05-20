/**
 * SM-2 间隔重复算法实现
 * 基于 SuperMemo 2 算法
 */

export interface SM2Result {
  interval: number;      // 下次复习间隔（天）
  easeFactor: number;    // 难度因子
  repetitions: number;   // 连续成功复习次数
  nextReviewDate: Date;  // 下次复习日期
}

/**
 * 计算下次复习参数
 * @param quality 评分 0-5（0-2=忘记，3-5=记住）
 * @param repetitions 重复次数
 * @param easeFactor 当前难度因子
 * @param interval 当前间隔
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): SM2Result {
  let newInterval: number;
  let newEaseFactor: number;
  let newRepetitions: number;

  if (quality >= 3) {
    // 记住
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 3;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // 忘记
    newRepetitions = 0;
    newInterval = 1;
  }

  // 更新难度因子
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  // 计算下次复习日期
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * 获取今日待复习单词
 */
export function getTodayReviewDate(): string {
  return formatDateInTimeZone(new Date());
}

export function formatDateInTimeZone(date: Date, timeZone = 'Asia/Shanghai'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getDayRange(dateString: string, timeZoneOffsetHours = 8) {
  const utcMillis = Date.parse(`${dateString}T00:00:00.000Z`) - timeZoneOffsetHours * 60 * 60 * 1000;
  const start = new Date(utcMillis);
  const end = new Date(utcMillis + 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * 将质量评分转换为用户友好的标签
 */
export function getQualityLabel(quality: number): string {
  switch (quality) {
    case 0: return '完全忘记';
    case 1: return '几乎忘记';
    case 2: return '模糊记得';
    case 3: return '勉强记住';
    case 4: return '基本记住';
    case 5: return '完全记住';
    default: return '';
  }
}
