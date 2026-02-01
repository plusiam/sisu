import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SchoolSettings, SchoolInfo, StandardHours } from '../types/school';
import { DEFAULT_SCHOOL_SETTINGS } from '../types/school';

interface SchoolStore {
  settings: SchoolSettings;

  // 학교 정보 업데이트
  updateSchoolInfo: (info: Partial<SchoolInfo>) => void;

  // 기준 시수 업데이트
  updateStandardHours: (hours: Partial<StandardHours>) => void;

  // 전체 설정 초기화
  resetSettings: () => void;
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SCHOOL_SETTINGS,

      updateSchoolInfo: (info) => {
        set((state) => ({
          settings: {
            ...state.settings,
            info: { ...state.settings.info, ...info },
            updatedAt: Date.now(),
          },
        }));
      },

      updateStandardHours: (hours) => {
        set((state) => ({
          settings: {
            ...state.settings,
            standardHours: { ...state.settings.standardHours, ...hours },
            updatedAt: Date.now(),
          },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SCHOOL_SETTINGS });
      },
    }),
    {
      name: 'sisu-school-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
