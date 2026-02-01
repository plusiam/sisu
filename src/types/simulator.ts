// 입력 데이터 구조
export interface HoursInput {
  basicTeaching: number; // 기본 수업 시수
  adminWork: number; // 행정 업무
  training: number; // 교사 연수
  consulting: number; // 교육 컨설팅
  other: number; // 기타 업무
}

// 업무 분포 (퍼센트)
export interface HoursDistribution {
  teaching: number;
  admin: number;
  training: number;
  other: number;
}

// 법정 기준 준수 상태
export interface ComplianceStatus {
  status: 'safe' | 'warning' | 'over';
  message: string;
  percentage: number; // 기준 대비 퍼센트
}

// 계산된 통계
export interface CalculatedStats {
  totalHours: number;
  dailyAverage: number;
  monthlyTotal: number;
  distribution: HoursDistribution;
  compliance: ComplianceStatus;
}
