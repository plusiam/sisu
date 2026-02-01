/**
 * 시간표 관련 타입 정의
 */

// 요일
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
};

export const DAYS_ORDER: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

// 시간표 한 칸 (수업 배정)
export interface TimetableSlot {
  id: string;                  // 고유 ID
  day: DayOfWeek;             // 요일
  period: number;             // 교시 (1-6)
  grade: number;              // 학년 (1-6)
  classNumber: number;        // 반
  teacherId: string;          // 교사 ID
  teacherName: string;        // 교사 이름 (조회 편의용)
  subject: string;            // 교과명
  room?: string;              // 장소 (선택)
  note?: string;              // 메모
}

// 학급 시간표 (특정 학년-반의 주간 시간표)
export interface ClassTimetable {
  grade: number;
  classNumber: number;
  slots: TimetableSlot[];
}

// 교사 시간표 (특정 교사의 주간 시간표)
export interface TeacherTimetable {
  teacherId: string;
  teacherName: string;
  slots: TimetableSlot[];
}

// 시간표 필터 옵션
export interface TimetableFilter {
  teacherId?: string;
  grade?: number;
  classNumber?: number;
  day?: DayOfWeek;
  subject?: string;
}

// 시간표 통계
export interface TimetableStats {
  totalSlots: number;           // 총 배정된 시수
  byDay: Record<DayOfWeek, number>;  // 요일별 시수
  byPeriod: Record<number, number>;  // 교시별 시수
  byGrade: Record<number, number>;   // 학년별 시수
}

// 자동배정용 제약조건
export interface ScheduleConstraints {
  // 교사별 불가능한 시간대
  teacherUnavailable: {
    teacherId: string;
    day: DayOfWeek;
    period: number;
  }[];

  // 연속 수업 제한 (같은 교사가 연속으로 가르칠 수 있는 최대 시수)
  maxConsecutive: number;

  // 하루 최대 수업 시수
  maxPerDay: number;

  // 특정 교과는 특정 장소에서만
  subjectRoomRequirements: {
    subject: string;
    room: string;
  }[];
}

// 자동배정 결과
export interface AutoScheduleResult {
  success: boolean;
  slots: TimetableSlot[];
  unassigned: {
    teacherId: string;
    subject: string;
    grade: number;
    classNumber: number;
    reason: string;
  }[];
  message: string;
}

// 시간표 충돌 체크 결과
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: {
    type: 'teacher' | 'room' | 'class';
    message: string;
    slots: TimetableSlot[];
  }[];
}

// Google Sheets에서 가져오는 시간표 행 데이터
export interface TimetableRowData {
  id: string;
  day: string;
  period: number;
  grade: number;
  classNumber: number;
  teacherId: string;
  teacherName: string;
  subject: string;
  room: string;
  note: string;
}
