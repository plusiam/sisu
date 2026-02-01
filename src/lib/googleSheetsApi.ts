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

export class GoogleSheetsAPI {
  private webAppUrl: string;

  constructor(webAppUrl: string) {
    this.webAppUrl = webAppUrl;
  }

  /**
   * Sheets에서 데이터 가져오기
   */
  async fetchData(): Promise<SyncTeacherData[]> {
    try {
      const response = await fetch(this.webAppUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<SyncTeacherData[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from server');
      }

      return result.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`데이터 가져오기 실패: ${error.message}`);
      }
      throw new Error('데이터 가져오기 실패: 알 수 없는 오류');
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

      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teachers: syncData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{ count: number }> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown error from server');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`데이터 저장 실패: ${error.message}`);
      }
      throw new Error('데이터 저장 실패: 알 수 없는 오류');
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
