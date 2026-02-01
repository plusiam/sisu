import type { Teacher } from '../types/teacher';

/**
 * 교사의 역할 라벨을 반환합니다 (담임 1-2, 전담 국어 등)
 */
export function getTeacherRoleLabel(teacher: Teacher): string {
  if (teacher.type === 'homeroom') {
    if (teacher.grade && teacher.classNumber) {
      return `담임 ${teacher.grade}-${teacher.classNumber}`;
    }
    return '담임';
  } else {
    if (teacher.subjects && teacher.subjects.length > 0) {
      return `전담 ${teacher.subjects.join(', ')}`;
    }
    return '전담';
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
