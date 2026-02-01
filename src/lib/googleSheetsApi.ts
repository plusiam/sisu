import type { Teacher, TeacherAssignment } from '../types/teacher';
import type { HoursInput } from '../types/simulator';

interface SyncTeacherData {
  id: string;
  name: string;
  type: string;
  grade?: number;
  classNumber?: number;
  subjects?: string[];
  basicTeaching: number;
  adminWork: number;
  training: number;
  consulting: number;
  other: number;
  notes?: string;
  lastModified: number;
  createdAt: number;
  updatedAt: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 에러 타입 정의
export class ApiError extends Error {
  code: 'NETWORK' | 'TIMEOUT' | 'SERVER' | 'VALIDATION' | 'UNKNOWN';
  originalError?: Error;

  constructor(
    message: string,
    code: 'NETWORK' | 'TIMEOUT' | 'SERVER' | 'VALIDATION' | 'UNKNOWN',
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.originalError = originalError;
  }
}

// 타임아웃이 있는 fetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = 30000 // 기본 30초
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('요청 시간이 초과되었습니다', 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 응답 데이터 검증
function validateResponseData(data: unknown): data is SyncTeacherData[] {
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.name === 'string'
  );
}

export class GoogleSheetsAPI {
  private webAppUrl: string;
  private timeout: number;

  constructor(webAppUrl: string, timeout = 30000) {
    this.webAppUrl = webAppUrl;
    this.timeout = timeout;
  }

  /**
   * Sheets에서 데이터 가져오기
   */
  async fetchData(): Promise<SyncTeacherData[]> {
    try {
      const response = await fetchWithTimeout(
        this.webAppUrl,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        this.timeout
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new ApiError('접근 권한이 없습니다. URL을 확인해주세요.', 'SERVER');
        }
        if (response.status >= 500) {
          throw new ApiError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', 'SERVER');
        }
        throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, 'SERVER');
      }

      const result: ApiResponse<SyncTeacherData[]> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      // 응답 데이터 검증
      if (result.data && !validateResponseData(result.data)) {
        throw new ApiError('서버 응답 형식이 올바르지 않습니다', 'VALIDATION');
      }

      return result.data || [];
    } catch (error) {
      // 이미 ApiError인 경우 그대로 전달
      if (error instanceof ApiError) {
        throw error;
      }

      // 네트워크 오류
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          '네트워크 연결을 확인해주세요',
          'NETWORK',
          error
        );
      }

      // 기타 오류
      throw new ApiError(
        error instanceof Error ? error.message : '알 수 없는 오류',
        'UNKNOWN',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Sheets에 데이터 저장
   */
  async saveData(
    teachers: Teacher[],
    assignments: TeacherAssignment[]
  ): Promise<void> {
    try {
      // 교사 정보와 시수 배정 병합
      const syncData: SyncTeacherData[] = teachers.map(teacher => {
        const assignment = assignments.find(a => a.teacherId === teacher.id);
        const hours: HoursInput = assignment?.hours || {
          basicTeaching: 0,
          adminWork: 0,
          training: 0,
          consulting: 0,
          other: 0,
        };

        return {
          id: teacher.id,
          name: teacher.name,
          type: teacher.type,
          grade: teacher.grade,
          classNumber: teacher.classNumber,
          subjects: teacher.subjects,
          basicTeaching: hours.basicTeaching,
          adminWork: hours.adminWork,
          training: hours.training,
          consulting: hours.consulting,
          other: hours.other,
          notes: assignment?.notes,
          lastModified: assignment?.lastModified || teacher.updatedAt,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        };
      });

      const response = await fetchWithTimeout(
        this.webAppUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teachers: syncData }),
        },
        this.timeout
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new ApiError('접근 권한이 없습니다. URL을 확인해주세요.', 'SERVER');
        }
        if (response.status >= 500) {
          throw new ApiError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', 'SERVER');
        }
        throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, 'SERVER');
      }

      const result: ApiResponse<{ count: number }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('네트워크 연결을 확인해주세요', 'NETWORK', error);
      }

      throw new ApiError(
        error instanceof Error ? error.message : '알 수 없는 오류',
        'UNKNOWN',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchData();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Sheets 데이터를 로컬 형식으로 변환
   */
  static parseSheetData(data: SyncTeacherData[]): {
    teachers: Teacher[];
    assignments: TeacherAssignment[];
  } {
    const teachers: Teacher[] = [];
    const assignments: TeacherAssignment[] = [];

    data.forEach(item => {
      // 교사 정보
      teachers.push({
        id: item.id,
        name: item.name,
        type: item.type as 'homeroom' | 'specialist',
        grade: item.grade,
        classNumber: item.classNumber,
        subjects: item.subjects,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

      // 시수 배정 (0이 아닌 경우만)
      const hasHours =
        item.basicTeaching > 0 ||
        item.adminWork > 0 ||
        item.training > 0 ||
        item.consulting > 0 ||
        item.other > 0;

      if (hasHours) {
        assignments.push({
          teacherId: item.id,
          hours: {
            basicTeaching: item.basicTeaching,
            adminWork: item.adminWork,
            training: item.training,
            consulting: item.consulting,
            other: item.other,
          },
          notes: item.notes,
          lastModified: item.lastModified,
        });
      }
    });

    return { teachers, assignments };
  }
}
