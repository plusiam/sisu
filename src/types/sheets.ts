/**
 * Google Sheets 데이터 타입 정의
 * 시트 구조와 1:1 매핑
 */

// 교시 정보 (수업 시간)
export interface PeriodInfo {
  period: number;       // 교시 (1-6)
  startTime: string;    // 시작시간 "9:00"
  endTime: string;      // 종료시간 "9:40"
}

// 학교 설정
export interface SheetSettings {
  기본시수: number;       // 기본 수업 시수 (예: 22)
  수석감면율: number;     // 수석교사 감면율 % (예: 50)
  시수편차허용: number;   // 허용 편차 시수 (예: 2)
  담임기준시수: number;   // 담임교사 기준시수 (기본시수와 다를 수 있음)
  전담기준시수: number;   // 전담교사 기준시수 (기본시수와 다를 수 있음)
}

// 장소/교실 정보
export interface RoomInfo {
  id: string;           // R001, R002...
  name: string;         // 장소명: 음악실, 강당...
  type: '특별실' | '공용' | string;
  capacity: number;     // 수용학급
  subject: string;      // 사용교과
  note?: string;        // 비고
}

// 교과 정보 (학년별 시수)
export interface SubjectInfo {
  id: string;           // SUB001, SUB002...
  name: string;         // 교과명: 영어, 체육...
  hoursByGrade: {       // 학년별 주당 시수
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  defaultRoom?: string; // 기본장소
  note?: string;        // 비고
}

// 학교 정보
export interface SchoolSheetInfo {
  schoolName: string;   // 학교명
  year: number;         // 학년도
  classesByGrade: {     // 학년별 학급수
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
}

// 전체 시트 데이터
export interface AllSheetData {
  settings: SheetSettings;
  schoolInfo: SchoolSheetInfo;
  periods: PeriodInfo[];
  rooms: RoomInfo[];
  subjects: SubjectInfo[];
}

// API 응답 타입
export interface SheetDataResponse {
  success: boolean;
  data?: AllSheetData;
  error?: string;
  timestamp: string;
}
