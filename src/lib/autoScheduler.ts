/**
 * 시간표 자동배정 알고리즘
 *
 * 기본 전략:
 * 1. 각 전담교사의 담당 학년/교과를 파악
 * 2. 각 학급에 필요한 전담 시수 계산
 * 3. 충돌 없이 배정 가능한 슬롯 찾기
 * 4. 교사별 시수 균형 맞추기
 */

import type { Teacher } from '../types/teacher';
import type {
  TimetableSlot,
  DayOfWeek,
  AutoScheduleResult,
  ScheduleConstraints,
} from '../types/timetable';
import type { SubjectInfo, SchoolSheetInfo, SheetSettings } from '../types/sheets';
import { generateSlotId } from '../stores/timetableStore';

// 요일 순서
const DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

// 배정 요청 (어떤 교사가 어떤 학년에 몇 시수 배정해야 하는지)
interface AssignmentRequest {
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: number;
  hoursNeeded: number;  // 주당 필요 시수
  defaultRoom?: string;
}

/**
 * 자동배정 실행
 */
export function runAutoSchedule(
  teachers: Teacher[],
  existingSlots: TimetableSlot[],
  subjects: SubjectInfo[],
  schoolInfo: SchoolSheetInfo,
  _settings: SheetSettings,  // 향후 확장용
  constraints?: Partial<ScheduleConstraints>
): AutoScheduleResult {
  // 전담교사만 필터
  const specialists = teachers.filter((t) => t.type === 'specialist');

  if (specialists.length === 0) {
    return {
      success: false,
      slots: [],
      unassigned: [],
      message: '등록된 전담교사가 없습니다.',
    };
  }

  // 기본 제약조건
  const defaultConstraints: ScheduleConstraints = {
    teacherUnavailable: [],
    maxConsecutive: 4,
    maxPerDay: 6,
    subjectRoomRequirements: [],
    ...constraints,
  };

  // 배정 요청 목록 생성
  const requests = generateAssignmentRequests(specialists, subjects, schoolInfo);

  if (requests.length === 0) {
    return {
      success: true,
      slots: [],
      unassigned: [],
      message: '배정할 수업이 없습니다.',
    };
  }

  // 기존 슬롯 복사 (수정하지 않음)
  const newSlots: TimetableSlot[] = [];
  const unassigned: AutoScheduleResult['unassigned'] = [];

  // 사용 중인 슬롯 추적 (충돌 방지)
  const occupiedSlots = new Set<string>();  // "day-period-grade-class"
  const teacherSchedule = new Map<string, Set<string>>();  // teacherId -> Set<"day-period">

  // 기존 슬롯 등록
  existingSlots.forEach((slot) => {
    const key = `${slot.day}-${slot.period}-${slot.grade}-${slot.classNumber}`;
    occupiedSlots.add(key);

    const teacherKey = `${slot.day}-${slot.period}`;
    if (!teacherSchedule.has(slot.teacherId)) {
      teacherSchedule.set(slot.teacherId, new Set());
    }
    teacherSchedule.get(slot.teacherId)!.add(teacherKey);
  });

  // 배정 요청 정렬 (시수가 많은 것부터)
  const sortedRequests = [...requests].sort((a, b) => b.hoursNeeded - a.hoursNeeded);

  // 각 요청에 대해 슬롯 배정
  for (const request of sortedRequests) {
    const classCount = schoolInfo.classesByGrade[request.grade as keyof typeof schoolInfo.classesByGrade] || 0;

    if (classCount === 0) continue;

    // 각 반에 대해 배정
    for (let classNum = 1; classNum <= classCount; classNum++) {
      let hoursAssigned = 0;

      // 필요한 시수만큼 슬롯 찾기
      for (let attempt = 0; attempt < request.hoursNeeded; attempt++) {
        const slot = findAvailableSlot(
          request,
          classNum,
          occupiedSlots,
          teacherSchedule,
          defaultConstraints,
          newSlots,
          existingSlots
        );

        if (slot) {
          // 슬롯 등록
          newSlots.push(slot);

          const key = `${slot.day}-${slot.period}-${slot.grade}-${slot.classNumber}`;
          occupiedSlots.add(key);

          const teacherKey = `${slot.day}-${slot.period}`;
          if (!teacherSchedule.has(slot.teacherId)) {
            teacherSchedule.set(slot.teacherId, new Set());
          }
          teacherSchedule.get(slot.teacherId)!.add(teacherKey);

          hoursAssigned++;
        }
      }

      // 미배정 시수 기록
      if (hoursAssigned < request.hoursNeeded) {
        unassigned.push({
          teacherId: request.teacherId,
          subject: request.subject,
          grade: request.grade,
          classNumber: classNum,
          reason: `${request.hoursNeeded - hoursAssigned}시수 미배정 (충돌 또는 빈 슬롯 부족)`,
        });
      }
    }
  }

  const totalAssigned = newSlots.length;
  const totalUnassigned = unassigned.reduce((sum, u) => {
    const match = u.reason.match(/(\d+)시수/);
    return sum + (match ? parseInt(match[1]) : 0);
  }, 0);

  return {
    success: unassigned.length === 0,
    slots: newSlots,
    unassigned,
    message: `${totalAssigned}시수 배정 완료${totalUnassigned > 0 ? `, ${totalUnassigned}시수 미배정` : ''}`,
  };
}

/**
 * 배정 요청 목록 생성
 */
function generateAssignmentRequests(
  specialists: Teacher[],
  subjects: SubjectInfo[],
  _schoolInfo: SchoolSheetInfo  // 향후 확장용
): AssignmentRequest[] {
  const requests: AssignmentRequest[] = [];

  for (const teacher of specialists) {
    // 담당 학년
    const grades = teacher.grades?.length ? teacher.grades :
      teacher.grade ? [teacher.grade] : [];

    // 담당 교과
    const teacherSubjects = teacher.subjects || [];

    for (const grade of grades) {
      for (const subjectName of teacherSubjects) {
        // 교과 정보에서 해당 학년 시수 찾기
        const subjectInfo = subjects.find((s) => s.name === subjectName);
        const hoursNeeded = subjectInfo?.hoursByGrade[grade as keyof typeof subjectInfo.hoursByGrade] || 1;

        if (hoursNeeded > 0) {
          requests.push({
            teacherId: teacher.id,
            teacherName: teacher.name,
            subject: subjectName,
            grade,
            hoursNeeded,
            defaultRoom: subjectInfo?.defaultRoom,
          });
        }
      }
    }
  }

  return requests;
}

/**
 * 사용 가능한 슬롯 찾기
 */
function findAvailableSlot(
  request: AssignmentRequest,
  classNumber: number,
  occupiedSlots: Set<string>,
  teacherSchedule: Map<string, Set<string>>,
  constraints: ScheduleConstraints,
  newSlots: TimetableSlot[],
  existingSlots: TimetableSlot[]
): TimetableSlot | null {
  // 교사의 현재 일별 시수 계산
  const teacherDayCount = new Map<DayOfWeek, number>();
  const teacherSlots = [...existingSlots, ...newSlots].filter(
    (s) => s.teacherId === request.teacherId
  );

  teacherSlots.forEach((s) => {
    teacherDayCount.set(s.day, (teacherDayCount.get(s.day) || 0) + 1);
  });

  // 요일/교시 순회하며 빈 슬롯 찾기
  // 시수가 적은 요일부터 (균형 배정)
  const sortedDays = [...DAYS].sort((a, b) => {
    return (teacherDayCount.get(a) || 0) - (teacherDayCount.get(b) || 0);
  });

  for (const day of sortedDays) {
    // 하루 최대 시수 체크
    if ((teacherDayCount.get(day) || 0) >= constraints.maxPerDay) {
      continue;
    }

    // 교사 불가 시간 체크
    const isUnavailable = constraints.teacherUnavailable.some(
      (u) => u.teacherId === request.teacherId && u.day === day
    );
    if (isUnavailable) continue;

    for (let period = 1; period <= 6; period++) {
      // 학급 슬롯 사용 여부
      const slotKey = `${day}-${period}-${request.grade}-${classNumber}`;
      if (occupiedSlots.has(slotKey)) continue;

      // 교사 동시간대 사용 여부
      const teacherKey = `${day}-${period}`;
      if (teacherSchedule.get(request.teacherId)?.has(teacherKey)) continue;

      // 연속 수업 체크 (선택적)
      const consecutiveOk = checkConsecutive(
        request.teacherId,
        day,
        period,
        teacherSlots,
        newSlots,
        constraints.maxConsecutive
      );
      if (!consecutiveOk) continue;

      // 슬롯 생성
      return {
        id: generateSlotId(),
        day,
        period,
        grade: request.grade,
        classNumber,
        teacherId: request.teacherId,
        teacherName: request.teacherName,
        subject: request.subject,
        room: request.defaultRoom || '',
      };
    }
  }

  return null;
}

/**
 * 연속 수업 체크
 */
function checkConsecutive(
  teacherId: string,
  day: DayOfWeek,
  period: number,
  existingSlots: TimetableSlot[],
  newSlots: TimetableSlot[],
  maxConsecutive: number
): boolean {
  const allSlots = [...existingSlots, ...newSlots].filter(
    (s) => s.teacherId === teacherId && s.day === day
  );

  const periods = allSlots.map((s) => s.period);
  periods.push(period);
  periods.sort((a, b) => a - b);

  // 연속 교시 계산
  let consecutive = 1;
  let maxFound = 1;

  for (let i = 1; i < periods.length; i++) {
    if (periods[i] === periods[i - 1] + 1) {
      consecutive++;
      maxFound = Math.max(maxFound, consecutive);
    } else {
      consecutive = 1;
    }
  }

  return maxFound <= maxConsecutive;
}

/**
 * 시간표 검증
 */
export function validateTimetable(
  slots: TimetableSlot[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 중복 검사: 같은 학급 같은 시간
  const classSlotMap = new Map<string, TimetableSlot>();

  for (const slot of slots) {
    const key = `${slot.day}-${slot.period}-${slot.grade}-${slot.classNumber}`;

    if (classSlotMap.has(key)) {
      const existing = classSlotMap.get(key)!;
      errors.push(
        `${slot.grade}학년 ${slot.classNumber}반 ${slot.day} ${slot.period}교시: ` +
        `${existing.subject}와 ${slot.subject} 중복`
      );
    } else {
      classSlotMap.set(key, slot);
    }
  }

  // 중복 검사: 같은 교사 같은 시간
  const teacherSlotMap = new Map<string, TimetableSlot>();

  for (const slot of slots) {
    const key = `${slot.teacherId}-${slot.day}-${slot.period}`;

    if (teacherSlotMap.has(key)) {
      const existing = teacherSlotMap.get(key)!;
      errors.push(
        `${slot.teacherName} 선생님 ${slot.day} ${slot.period}교시: ` +
        `${existing.grade}-${existing.classNumber}과 ${slot.grade}-${slot.classNumber} 중복`
      );
    } else {
      teacherSlotMap.set(key, slot);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 교사별 시수 통계
 */
export function getTeacherHoursSummary(
  slots: TimetableSlot[],
  teachers: Teacher[]
): {
  teacherId: string;
  teacherName: string;
  totalHours: number;
  byDay: Record<DayOfWeek, number>;
  byGrade: Record<number, number>;
}[] {
  const specialists = teachers.filter((t) => t.type === 'specialist');

  return specialists.map((teacher) => {
    const teacherSlots = slots.filter((s) => s.teacherId === teacher.id);

    const byDay: Record<DayOfWeek, number> = {
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0,
    };
    const byGrade: Record<number, number> = {};

    teacherSlots.forEach((slot) => {
      byDay[slot.day]++;
      byGrade[slot.grade] = (byGrade[slot.grade] || 0) + 1;
    });

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      totalHours: teacherSlots.length,
      byDay,
      byGrade,
    };
  });
}
