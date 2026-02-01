import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AllSheetData,
  SheetSettings,
  SchoolSheetInfo,
  SubjectInfo,
  RoomInfo,
  PeriodInfo
} from '../types/sheets';

// 기본값
const DEFAULT_SETTINGS: SheetSettings = {
  기본시수: 22,
  수석감면율: 50,
  시수편차허용: 2,
  담임기준시수: 22,
  전담기준시수: 22
};

const DEFAULT_SCHOOL_INFO: SchoolSheetInfo = {
  schoolName: '',
  year: new Date().getFullYear(),
  classesByGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
};

const DEFAULT_PERIODS: PeriodInfo[] = [
  { period: 1, startTime: '09:00', endTime: '09:40' },
  { period: 2, startTime: '09:50', endTime: '10:30' },
  { period: 3, startTime: '10:50', endTime: '11:30' },
  { period: 4, startTime: '11:40', endTime: '12:20' },
  { period: 5, startTime: '13:20', endTime: '14:00' },
  { period: 6, startTime: '14:10', endTime: '14:50' }
];

interface SchoolStore {
  // 시트 데이터
  settings: SheetSettings;
  schoolInfo: SchoolSheetInfo;
  subjects: SubjectInfo[];
  rooms: RoomInfo[];
  periods: PeriodInfo[];

  // 동기화 상태
  lastSyncTime: number | null;
  isSyncing: boolean;

  // 액션
  setAllData: (data: AllSheetData) => void;
  setSettings: (settings: SheetSettings) => void;
  setSchoolInfo: (info: SchoolSheetInfo) => void;
  setSubjects: (subjects: SubjectInfo[]) => void;
  setRooms: (rooms: RoomInfo[]) => void;
  setPeriods: (periods: PeriodInfo[]) => void;
  setSyncing: (syncing: boolean) => void;
  resetAll: () => void;

  // 헬퍼
  getStandardHours: (type: 'homeroom' | 'specialist', isMasterTeacher?: boolean) => number;
  getTotalClasses: () => number;
  getSubjectHours: (subjectName: string, grade: number) => number;
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set, get) => ({
      // 초기값
      settings: DEFAULT_SETTINGS,
      schoolInfo: DEFAULT_SCHOOL_INFO,
      subjects: [],
      rooms: [],
      periods: DEFAULT_PERIODS,
      lastSyncTime: null,
      isSyncing: false,

      // 전체 데이터 설정 (동기화 시)
      setAllData: (data) => {
        set({
          settings: data.settings,
          schoolInfo: data.schoolInfo,
          subjects: data.subjects,
          rooms: data.rooms,
          periods: data.periods.length > 0 ? data.periods : DEFAULT_PERIODS,
          lastSyncTime: Date.now(),
        });
      },

      setSettings: (settings) => set({ settings }),
      setSchoolInfo: (info) => set({ schoolInfo: info }),
      setSubjects: (subjects) => set({ subjects }),
      setRooms: (rooms) => set({ rooms }),
      setPeriods: (periods) => set({ periods }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),

      resetAll: () => set({
        settings: DEFAULT_SETTINGS,
        schoolInfo: DEFAULT_SCHOOL_INFO,
        subjects: [],
        rooms: [],
        periods: DEFAULT_PERIODS,
        lastSyncTime: null,
      }),

      // 기준 시수 계산 (수석교사 감면 적용)
      getStandardHours: (type, isMasterTeacher = false) => {
        const { settings } = get();
        const baseHours = type === 'homeroom'
          ? settings.담임기준시수 || settings.기본시수
          : settings.전담기준시수 || settings.기본시수;

        if (isMasterTeacher && settings.수석감면율 > 0) {
          return Math.round(baseHours * (1 - settings.수석감면율 / 100));
        }

        return baseHours;
      },

      // 전체 학급수
      getTotalClasses: () => {
        const { schoolInfo } = get();
        return Object.values(schoolInfo.classesByGrade).reduce((sum, n) => sum + n, 0);
      },

      // 특정 교과의 학년별 시수
      getSubjectHours: (subjectName, grade) => {
        const { subjects } = get();
        const subject = subjects.find(s => s.name === subjectName);
        if (!subject) return 0;
        return subject.hoursByGrade[grade as keyof typeof subject.hoursByGrade] || 0;
      },
    }),
    {
      name: 'sisu-school-store',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted, version) => {
        // 버전 마이그레이션
        if (version < 2) {
          return {
            settings: DEFAULT_SETTINGS,
            schoolInfo: DEFAULT_SCHOOL_INFO,
            subjects: [],
            rooms: [],
            periods: DEFAULT_PERIODS,
            lastSyncTime: null,
            isSyncing: false,
          };
        }
        return persisted as SchoolStore;
      },
    }
  )
);
