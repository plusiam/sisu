import type { Teacher, TeacherAssignment } from '../types/teacher';
import type { HoursInput } from '../types/simulator';
import type {
  AllSheetData,
  SheetSettings,
  SchoolSheetInfo,
  SubjectInfo,
  RoomInfo,
  PeriodInfo
} from '../types/sheets';
import type { TimetableSlot, TimetableRowData } from '../types/timetable';

// 교사 동기화 데이터 타입
interface SyncTeacherData {
  id: string;
  name: string;
  type: string;
  grade?: number;
  grades?: number[];
  classNumber?: number;
  subjects?: string[];
  customSubject?: string;
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

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 전체 데이터 응답 타입
interface AllDataResponse {
  settings: SheetSettings;
  schoolInfo: SchoolSheetInfo;
  subjects: SubjectInfo[];
  rooms: RoomInfo[];
  periods: PeriodInfo[];
  teachers: SyncTeacherData[];
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
  timeout = 30000
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
function validateTeacherData(data: unknown): data is SyncTeacherData[] {
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
   * 전체 시트 데이터 가져오기 (설정, 학교정보, 교과, 장소, 교시, 교사)
   */
  async fetchAllData(): Promise<AllSheetData> {
    try {
      const response = await fetchWithTimeout(
        `${this.webAppUrl}?action=all`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<AllDataResponse> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      const data = result.data!;

      return {
        settings: data.settings,
        schoolInfo: data.schoolInfo,
        subjects: data.subjects,
        rooms: data.rooms,
        periods: data.periods,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 교사 데이터만 가져오기 (기존 호환)
   */
  async fetchData(): Promise<SyncTeacherData[]> {
    try {
      const response = await fetchWithTimeout(
        `${this.webAppUrl}?action=teachers`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ teachers: SyncTeacherData[] }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      const teachers = result.data?.teachers || [];

      if (!validateTeacherData(teachers)) {
        throw new ApiError('서버 응답 형식이 올바르지 않습니다', 'VALIDATION');
      }

      return teachers;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 설정 데이터만 가져오기
   */
  async fetchSettings(): Promise<SheetSettings> {
    try {
      const response = await fetchWithTimeout(
        `${this.webAppUrl}?action=settings`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ settings: SheetSettings }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      return result.data!.settings;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 학교 정보만 가져오기
   */
  async fetchSchoolInfo(): Promise<SchoolSheetInfo> {
    try {
      const response = await fetchWithTimeout(
        `${this.webAppUrl}?action=schoolInfo`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ schoolInfo: SchoolSheetInfo }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      return result.data!.schoolInfo;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 교사 데이터 저장
   */
  async saveData(
    teachers: Teacher[],
    assignments: TeacherAssignment[]
  ): Promise<void> {
    try {
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
          grades: teacher.grades,
          classNumber: teacher.classNumber,
          subjects: teacher.subjects,
          customSubject: teacher.customSubject,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'teachers',
            teachers: syncData,
          }),
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ count: number }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 시간표 데이터 가져오기
   */
  async fetchTimetable(): Promise<TimetableSlot[]> {
    try {
      const response = await fetchWithTimeout(
        `${this.webAppUrl}?action=timetable`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ timetable: TimetableRowData[] }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }

      // TimetableRowData를 TimetableSlot으로 변환
      return (result.data?.timetable || []).map(row => ({
        id: row.id,
        day: row.day as TimetableSlot['day'],
        period: row.period,
        grade: row.grade,
        classNumber: row.classNumber,
        teacherId: row.teacherId,
        teacherName: row.teacherName,
        subject: row.subject,
        room: row.room,
        note: row.note,
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 시간표 데이터 저장
   */
  async saveTimetable(slots: TimetableSlot[]): Promise<void> {
    try {
      const response = await fetchWithTimeout(
        this.webAppUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'timetable',
            timetable: slots,
          }),
        },
        this.timeout
      );

      if (!response.ok) {
        throw this.handleHttpError(response);
      }

      const result: ApiResponse<{ count: number }> = await response.json();

      if (!result.success) {
        throw new ApiError(result.error || '서버 응답 오류', 'SERVER');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.fetchSettings();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * HTTP 에러 처리
   */
  private handleHttpError(response: Response): ApiError {
    if (response.status === 401 || response.status === 403) {
      return new ApiError('접근 권한이 없습니다. URL을 확인해주세요.', 'SERVER');
    }
    if (response.status >= 500) {
      return new ApiError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', 'SERVER');
    }
    return new ApiError(`HTTP ${response.status}: ${response.statusText}`, 'SERVER');
  }

  /**
   * 일반 에러 처리
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new ApiError('네트워크 연결을 확인해주세요', 'NETWORK', error);
    }

    return new ApiError(
      error instanceof Error ? error.message : '알 수 없는 오류',
      'UNKNOWN',
      error instanceof Error ? error : undefined
    );
  }

  /**
   * 교사 시트 데이터를 로컬 형식으로 변환
   */
  static parseTeacherData(data: SyncTeacherData[]): {
    teachers: Teacher[];
    assignments: TeacherAssignment[];
  } {
    const teachers: Teacher[] = [];
    const assignments: TeacherAssignment[] = [];

    data.forEach(item => {
      teachers.push({
        id: item.id,
        name: item.name,
        type: item.type as 'homeroom' | 'specialist',
        grade: item.grade,
        grades: item.grades,
        classNumber: item.classNumber,
        subjects: item.subjects,
        customSubject: item.customSubject,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });

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

  // 기존 호환을 위한 별칭
  static parseSheetData = GoogleSheetsAPI.parseTeacherData;
}
