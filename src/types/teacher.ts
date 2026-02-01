import type { HoursInput } from './simulator';

// 교사 기본 정보
export interface Teacher {
  id: string;                      // UUID
  name: string;                    // 이름
  type: 'homeroom' | 'specialist'; // 담임 | 전담
  grade?: number;                  // 담당 학년 (담임용, 1-6)
  grades?: number[];               // 담당 학년들 (전담용, 여러 학년 가능)
  classNumber?: number;            // 반 번호 (담임용)
  subjects?: string[];             // 담당 교과 ["국어", "수학"]
  customSubject?: string;          // 기타 교과 (직접 입력)
  createdAt: number;
  updatedAt: number;
}

// 교사별 시수 배정
export interface TeacherAssignment {
  teacherId: string;
  hours: HoursInput;  // 기존 타입 재사용
  notes?: string;
  lastModified: number;
}

// Google Sheets 동기화 상태
export interface SyncStatus {
  lastSyncTime: number | null;
  status: 'synced' | 'pending' | 'error' | 'never';
  errorMessage?: string;
  pendingChanges: number;
}

// Google Sheets 설정
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  webAppUrl: string;
  enabled: boolean;
  autoSync: boolean;
}
