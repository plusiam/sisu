import type { Teacher, TeacherAssignment } from '../types/teacher';
import type { StandardHours } from '../types/school';
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

/**
 * 대시보드 통계 계산
 */
export function calculateDashboardStats(
  teachers: Teacher[],
  assignments: TeacherAssignment[],
  standardHours: StandardHours
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

  // 각 교사별 계산
  teachers.forEach(teacher => {
    const assignment = assignments.find(a => a.teacherId === teacher.id);
    const standard = teacher.type === 'homeroom'
      ? standardHours.homeroom
      : standardHours.specialist;

    let totalHours = 0;

    if (assignment) {
      const stats = calculateStats(assignment.hours);
      totalHours = stats.totalHours;
      assignedCount++;
    }

    const difference = totalHours - standard;
    let status: 'over' | 'normal' | 'under' = 'normal';

    if (difference > 0) {
      status = 'over';
      overHoursCount++;
      totalOverHours += difference;
    } else if (difference < 0) {
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
