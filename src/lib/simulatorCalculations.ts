import type {
  HoursInput,
  CalculatedStats,
  HoursDistribution,
  ComplianceStatus,
} from '../types/simulator';

// 법정 기준 상수
const LEGAL_LIMIT = 20; // 법정 기준 시수 (주당)
const WARNING_THRESHOLD = 24; // 주의 임계값

/**
 * 주간 총 시수 계산
 */
function calculateWeeklyTotal(input: HoursInput): number {
  return (
    input.basicTeaching +
    input.adminWork +
    input.training +
    input.consulting +
    input.other
  );
}

/**
 * 일일 평균 계산 (주 5일 기준)
 */
function calculateDailyAverage(weeklyTotal: number): number {
  return Number((weeklyTotal / 5).toFixed(1));
}

/**
 * 월간 환산 (4주 기준)
 */
function calculateMonthlyTotal(weeklyTotal: number): number {
  return weeklyTotal * 4;
}

/**
 * 법정 기준 비교
 */
function getComplianceStatus(totalHours: number): ComplianceStatus {
  if (totalHours <= LEGAL_LIMIT) {
    return {
      status: 'safe',
      message: '법정 기준 이내입니다',
      percentage: (totalHours / LEGAL_LIMIT) * 100,
    };
  } else if (totalHours <= WARNING_THRESHOLD) {
    return {
      status: 'warning',
      message: '시수가 다소 많습니다',
      percentage: (totalHours / LEGAL_LIMIT) * 100,
    };
  } else {
    return {
      status: 'over',
      message: '과도한 업무량입니다',
      percentage: (totalHours / LEGAL_LIMIT) * 100,
    };
  }
}

/**
 * 업무 분포 계산 (퍼센트)
 */
function calculateDistribution(
  input: HoursInput,
  total: number
): HoursDistribution {
  if (total === 0) {
    return {
      teaching: 0,
      admin: 0,
      training: 0,
      other: 0,
    };
  }

  return {
    teaching: Number(((input.basicTeaching / total) * 100).toFixed(1)),
    admin: Number(((input.adminWork / total) * 100).toFixed(1)),
    training: Number((((input.training + input.consulting) / total) * 100).toFixed(1)),
    other: Number(((input.other / total) * 100).toFixed(1)),
  };
}

/**
 * 통합 계산 함수
 */
export function calculateStats(input: HoursInput): CalculatedStats {
  const totalHours = calculateWeeklyTotal(input);
  const dailyAverage = calculateDailyAverage(totalHours);
  const monthlyTotal = calculateMonthlyTotal(totalHours);
  const distribution = calculateDistribution(input, totalHours);
  const compliance = getComplianceStatus(totalHours);

  return {
    totalHours,
    dailyAverage,
    monthlyTotal,
    distribution,
    compliance,
  };
}

/**
 * 입력값 유효성 검증
 */
export function validateHours(value: number, min = 0, max = 40): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}
