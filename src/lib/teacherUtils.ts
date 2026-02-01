import type { Teacher } from '../types/teacher';

/**
 * 학년 배열을 간략하게 표시 (예: [3,4,5,6] → "3-6학년", [1,3,5] → "1,3,5학년")
 */
function formatGrades(grades: number[]): string {
  if (grades.length === 0) return '';
  if (grades.length === 1) return `${grades[0]}학년`;

  const sorted = [...grades].sort((a, b) => a - b);

  // 연속된 숫자인지 확인
  const isConsecutive = sorted.every((g, i) => i === 0 || g === sorted[i - 1] + 1);

  if (isConsecutive && sorted.length >= 2) {
    return `${sorted[0]}-${sorted[sorted.length - 1]}학년`;
  }

  return `${sorted.join(',')}학년`;
}

/**
 * 교과 목록을 포맷팅 (기본 교과 + 기타 교과)
 */
function formatSubjects(subjects?: string[], customSubject?: string): string {
  const allSubjects: string[] = [];

  if (subjects && subjects.length > 0) {
    allSubjects.push(...subjects);
  }

  if (customSubject) {
    allSubjects.push(customSubject);
  }

  return allSubjects.join(', ');
}

/**
 * 교사의 역할 라벨을 반환합니다 (담임 1-2, 전담 3-6학년 도덕 등)
 */
export function getTeacherRoleLabel(teacher: Teacher): string {
  if (teacher.type === 'homeroom') {
    if (teacher.grade && teacher.classNumber) {
      return `담임 ${teacher.grade}-${teacher.classNumber}`;
    }
    if (teacher.grade) {
      return `담임 ${teacher.grade}학년`;
    }
    return '담임';
  } else {
    // 전담교사
    const parts: string[] = ['전담'];

    // 학년 정보 (grades 우선, 없으면 grade 사용)
    const grades = teacher.grades && teacher.grades.length > 0
      ? teacher.grades
      : teacher.grade
        ? [teacher.grade]
        : [];

    if (grades.length > 0) {
      parts.push(formatGrades(grades));
    }

    // 교과 정보
    const subjectStr = formatSubjects(teacher.subjects, teacher.customSubject);
    if (subjectStr) {
      parts.push(subjectStr);
    }

    return parts.join(' ');
  }
}

/**
 * 교사의 전체 라벨을 반환합니다 (이름 - 역할)
 */
export function getTeacherFullLabel(teacher: Teacher): string {
  const roleLabel = getTeacherRoleLabel(teacher);
  return `${teacher.name} - ${roleLabel}`;
}

/**
 * 교사 타입의 한글 라벨
 */
export function getTeacherTypeLabel(type: Teacher['type']): string {
  return type === 'homeroom' ? '담임' : '전담';
}

/**
 * 교사의 담당 학년들을 반환 (grades 우선, 없으면 grade 사용)
 */
export function getTeacherGrades(teacher: Teacher): number[] {
  if (teacher.grades && teacher.grades.length > 0) {
    return teacher.grades;
  }
  if (teacher.grade) {
    return [teacher.grade];
  }
  return [];
}

/**
 * 교사의 모든 담당 교과를 반환 (기본 교과 + 기타 교과)
 */
export function getTeacherSubjects(teacher: Teacher): string[] {
  const subjects: string[] = [];

  if (teacher.subjects) {
    subjects.push(...teacher.subjects);
  }

  if (teacher.customSubject) {
    subjects.push(teacher.customSubject);
  }

  return subjects;
}
