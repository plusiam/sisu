import type { Teacher, TeacherAssignment } from '../types/teacher';
import type { SheetSettings } from '../types/sheets';
import { calculateStats } from './simulatorCalculations';

export interface TeacherStatus {
  teacher: Teacher;
  totalHours: number;
  standardHours: number;
  difference: number;          // 양수: 초과, 음수: 부족
  status: 'over' | 'normal' | 'under';
}

export interface DashboardStats {
  // 교사 수
  totalTeachers: number;
  homeroomCount: number;
  specialistCount: number;

  // 시수 현황
  totalSchoolHours: number;      // 학교 전체 시수
  homeroomTotalHours: number;    // 담임 총 시수
  specialistTotalHours: number;  // 전담 총 시수

  // 평균
  homeroomAvgHours: number;
  specialistAvgHours: number;

  // 과부족
  underHoursCount: number;       // 시수 부족 교사 수
  overHoursCount: number;        // 시수 초과 교사 수
  totalUnderHours: number;       // 총 부족 시수
  totalOverHours: number;        // 총 초과 시수

  // 배정률
  assignedCount: number;         // 시수 배정된 교사 수
  assignmentRate: number;        // 배정률 (%)

  // 교사별 상세
  teacherStatuses: TeacherStatus[];
}

// 기준 시수를 가져오는 헬퍼 (수석교사 감면 적용)
function getStandardHours(
  settings: SheetSettings,
  teacherType: 'homeroom' | 'specialist',
  isMasterTeacher: boolean = false
): number {
  const baseHours = teacherType === 'homeroom'
    ? (settings.담임기준시수 || settings.기본시수)
    : (settings.전담기준시수 || settings.기본시수);

  if (isMasterTeacher && settings.수석감면율 > 0) {
    return Math.round(baseHours * (1 - settings.수석감면율 / 100));
  }

  return baseHours;
}

/**
 * 대시보드 통계 계산
 */
export function calculateDashboardStats(
  teachers: Teacher[],
  assignments: TeacherAssignment[],
  settings: SheetSettings
): DashboardStats {
  const teacherStatuses: TeacherStatus[] = [];

  let homeroomTotalHours = 0;
  let specialistTotalHours = 0;
  let underHoursCount = 0;
  let overHoursCount = 0;
  let totalUnderHours = 0;
  let totalOverHours = 0;
  let assignedCount = 0;

  // 담임/전담 분류
  const homeroomTeachers = teachers.filter(t => t.type === 'homeroom');
  const specialistTeachers = teachers.filter(t => t.type === 'specialist');

  // 시수 편차 허용값
  const tolerance = settings.시수편차허용 || 0;

  // 각 교사별 계산
  teachers.forEach(teacher => {
    const assignment = assignments.find(a => a.teacherId === teacher.id);

    // 수석교사 여부 판단 (이름에 '수석' 포함 여부로 간단히 판단)
    const isMasterTeacher = teacher.name.includes('수석');
    const standard = getStandardHours(settings, teacher.type, isMasterTeacher);

    let totalHours = 0;

    if (assignment) {
      const stats = calculateStats(assignment.hours);
      totalHours = stats.totalHours;
      assignedCount++;
    }

    const difference = totalHours - standard;
    let status: 'over' | 'normal' | 'under' = 'normal';

    // 편차 허용 범위 적용
    if (difference > tolerance) {
      status = 'over';
      overHoursCount++;
      totalOverHours += difference;
    } else if (difference < -tolerance) {
      status = 'under';
      underHoursCount++;
      totalUnderHours += Math.abs(difference);
    }

    if (teacher.type === 'homeroom') {
      homeroomTotalHours += totalHours;
    } else {
      specialistTotalHours += totalHours;
    }

    teacherStatuses.push({
      teacher,
      totalHours,
      standardHours: standard,
      difference,
      status,
    });
  });

  // 정렬: 부족 → 초과 → 정상 순서
  teacherStatuses.sort((a, b) => {
    const statusOrder = { under: 0, over: 1, normal: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return Math.abs(b.difference) - Math.abs(a.difference);
  });

  const totalSchoolHours = homeroomTotalHours + specialistTotalHours;
  const assignmentRate = teachers.length > 0
    ? Math.round((assignedCount / teachers.length) * 100)
    : 0;

  return {
    totalTeachers: teachers.length,
    homeroomCount: homeroomTeachers.length,
    specialistCount: specialistTeachers.length,

    totalSchoolHours,
    homeroomTotalHours,
    specialistTotalHours,

    homeroomAvgHours: homeroomTeachers.length > 0
      ? Math.round((homeroomTotalHours / homeroomTeachers.length) * 10) / 10
      : 0,
    specialistAvgHours: specialistTeachers.length > 0
      ? Math.round((specialistTotalHours / specialistTeachers.length) * 10) / 10
      : 0,

    underHoursCount,
    overHoursCount,
    totalUnderHours,
    totalOverHours,

    assignedCount,
    assignmentRate,

    teacherStatuses,
  };
}
