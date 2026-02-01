// 학교 기본 정보
export interface SchoolInfo {
  name: string;                    // 학교명
  year: number;                    // 학년도
  semester: 1 | 2;                 // 학기
}

// 기준 시수 설정
export interface StandardHours {
  homeroom: number;                // 담임교사 기준 시수 (예: 22)
  specialist: number;              // 전담교사 기준 시수 (예: 20)
}

// 학교 설정 전체
export interface SchoolSettings {
  info: SchoolInfo;
  standardHours: StandardHours;
  updatedAt: number;
}

// 기본값
export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  info: {
    name: '',
    year: new Date().getFullYear(),
    semester: 1,
  },
  standardHours: {
    homeroom: 22,      // 담임 기준 22시간
    specialist: 20,    // 전담 기준 20시간
  },
  updatedAt: Date.now(),
};
