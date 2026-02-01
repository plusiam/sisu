/**
 * 입력 검증 유틸리티
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 교사 이름 검증
 * - 빈 문자열 불가
 * - 공백만 있는 경우 불가
 * - 2~20자 이내
 */
export function validateTeacherName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: '이름을 입력해주세요' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: '이름은 2자 이상이어야 합니다' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: '이름은 20자 이내여야 합니다' };
  }

  return { isValid: true };
}

/**
 * 시수 값 검증
 * - 0 이상 40 이하
 * - 정수만 허용
 */
export function validateHoursValue(value: number): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: '유효한 숫자를 입력해주세요' };
  }

  if (!Number.isInteger(value)) {
    return { isValid: false, error: '정수만 입력 가능합니다' };
  }

  if (value < 0) {
    return { isValid: false, error: '0 이상의 값을 입력해주세요' };
  }

  if (value > 40) {
    return { isValid: false, error: '40 이하의 값을 입력해주세요' };
  }

  return { isValid: true };
}

/**
 * 학년 검증
 * - 1~6 사이
 */
export function validateGrade(grade: number | undefined): ValidationResult {
  if (grade === undefined) {
    return { isValid: true }; // 선택사항
  }

  if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
    return { isValid: false, error: '학년은 1~6 사이여야 합니다' };
  }

  return { isValid: true };
}

/**
 * 반 번호 검증
 * - 1~20 사이
 */
export function validateClassNumber(classNumber: number | undefined): ValidationResult {
  if (classNumber === undefined) {
    return { isValid: true }; // 선택사항
  }

  if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > 20) {
    return { isValid: false, error: '반 번호는 1~20 사이여야 합니다' };
  }

  return { isValid: true };
}

/**
 * Google Sheets Web App URL 검증
 */
export function validateWebAppUrl(url: string): ValidationResult {
  const trimmed = url.trim();

  if (!trimmed) {
    return { isValid: false, error: 'URL을 입력해주세요' };
  }

  try {
    const parsed = new URL(trimmed);

    // Google Apps Script Web App URL 형식 확인
    if (!parsed.hostname.includes('script.google.com') &&
        !parsed.hostname.includes('script.googleusercontent.com')) {
      return { isValid: false, error: 'Google Apps Script URL이 아닙니다' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: '유효한 URL 형식이 아닙니다' };
  }
}
