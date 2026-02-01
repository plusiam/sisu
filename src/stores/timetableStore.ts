import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TimetableSlot,
  DayOfWeek,
  TeacherTimetable,
  ClassTimetable,
  TimetableStats,
  ConflictCheckResult,
} from '../types/timetable';

interface TimetableStore {
  // 상태
  slots: TimetableSlot[];
  lastSyncTime: number | null;
  isSyncing: boolean;
  isEditing: boolean;

  // 기본 CRUD
  setSlots: (slots: TimetableSlot[]) => void;
  addSlot: (slot: TimetableSlot) => void;
  updateSlot: (id: string, updates: Partial<TimetableSlot>) => void;
  removeSlot: (id: string) => void;
  clearSlots: () => void;

  // 동기화 상태
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  setEditing: (editing: boolean) => void;

  // 조회 헬퍼
  getTeacherTimetable: (teacherId: string) => TeacherTimetable | null;
  getClassTimetable: (grade: number, classNumber: number) => ClassTimetable;
  getSlotAt: (day: DayOfWeek, period: number, grade: number, classNumber: number) => TimetableSlot | undefined;
  getTeacherSlotAt: (teacherId: string, day: DayOfWeek, period: number) => TimetableSlot | undefined;

  // 통계
  getTeacherStats: (teacherId: string) => TimetableStats;
  getTotalStats: () => TimetableStats;

  // 충돌 검사
  checkConflicts: (slot: Omit<TimetableSlot, 'id'>, excludeId?: string) => ConflictCheckResult;

  // 필터링
  filterSlots: (filter: {
    teacherId?: string;
    grade?: number;
    classNumber?: number;
    day?: DayOfWeek;
    subject?: string;
  }) => TimetableSlot[];
}

export const useTimetableStore = create<TimetableStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      slots: [],
      lastSyncTime: null,
      isSyncing: false,
      isEditing: false,

      // 기본 CRUD
      setSlots: (slots) => set({ slots }),

      addSlot: (slot) => set((state) => ({
        slots: [...state.slots, slot],
      })),

      updateSlot: (id, updates) => set((state) => ({
        slots: state.slots.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      })),

      removeSlot: (id) => set((state) => ({
        slots: state.slots.filter((s) => s.id !== id),
      })),

      clearSlots: () => set({ slots: [] }),

      // 동기화 상태
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setEditing: (editing) => set({ isEditing: editing }),

      // 특정 교사의 시간표
      getTeacherTimetable: (teacherId) => {
        const { slots } = get();
        const teacherSlots = slots.filter((s) => s.teacherId === teacherId);

        if (teacherSlots.length === 0) return null;

        return {
          teacherId,
          teacherName: teacherSlots[0]?.teacherName || '',
          slots: teacherSlots,
        };
      },

      // 특정 학급의 시간표
      getClassTimetable: (grade, classNumber) => {
        const { slots } = get();
        return {
          grade,
          classNumber,
          slots: slots.filter(
            (s) => s.grade === grade && s.classNumber === classNumber
          ),
        };
      },

      // 특정 시간대의 수업 (학급 기준)
      getSlotAt: (day, period, grade, classNumber) => {
        const { slots } = get();
        return slots.find(
          (s) =>
            s.day === day &&
            s.period === period &&
            s.grade === grade &&
            s.classNumber === classNumber
        );
      },

      // 특정 시간대에 교사가 배정된 수업
      getTeacherSlotAt: (teacherId, day, period) => {
        const { slots } = get();
        return slots.find(
          (s) =>
            s.teacherId === teacherId &&
            s.day === day &&
            s.period === period
        );
      },

      // 교사별 통계
      getTeacherStats: (teacherId) => {
        const { slots } = get();
        const teacherSlots = slots.filter((s) => s.teacherId === teacherId);

        const byDay: Record<DayOfWeek, number> = {
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0
        };
        const byPeriod: Record<number, number> = {};
        const byGrade: Record<number, number> = {};

        teacherSlots.forEach((slot) => {
          byDay[slot.day]++;
          byPeriod[slot.period] = (byPeriod[slot.period] || 0) + 1;
          byGrade[slot.grade] = (byGrade[slot.grade] || 0) + 1;
        });

        return {
          totalSlots: teacherSlots.length,
          byDay,
          byPeriod,
          byGrade,
        };
      },

      // 전체 통계
      getTotalStats: () => {
        const { slots } = get();

        const byDay: Record<DayOfWeek, number> = {
          mon: 0, tue: 0, wed: 0, thu: 0, fri: 0
        };
        const byPeriod: Record<number, number> = {};
        const byGrade: Record<number, number> = {};

        slots.forEach((slot) => {
          byDay[slot.day]++;
          byPeriod[slot.period] = (byPeriod[slot.period] || 0) + 1;
          byGrade[slot.grade] = (byGrade[slot.grade] || 0) + 1;
        });

        return {
          totalSlots: slots.length,
          byDay,
          byPeriod,
          byGrade,
        };
      },

      // 충돌 검사
      checkConflicts: (newSlot, excludeId) => {
        const { slots } = get();
        const conflicts: ConflictCheckResult['conflicts'] = [];

        // 같은 시간에 같은 학급에 다른 수업이 있는지
        const classConflict = slots.find(
          (s) =>
            s.id !== excludeId &&
            s.day === newSlot.day &&
            s.period === newSlot.period &&
            s.grade === newSlot.grade &&
            s.classNumber === newSlot.classNumber
        );

        if (classConflict) {
          conflicts.push({
            type: 'class',
            message: `${newSlot.grade}학년 ${newSlot.classNumber}반은 이미 ${classConflict.subject} 수업이 배정되어 있습니다.`,
            slots: [classConflict],
          });
        }

        // 같은 시간에 같은 교사가 다른 수업을 하고 있는지
        const teacherConflict = slots.find(
          (s) =>
            s.id !== excludeId &&
            s.teacherId === newSlot.teacherId &&
            s.day === newSlot.day &&
            s.period === newSlot.period
        );

        if (teacherConflict) {
          conflicts.push({
            type: 'teacher',
            message: `${newSlot.teacherName} 선생님은 이미 ${teacherConflict.grade}학년 ${teacherConflict.classNumber}반 수업이 있습니다.`,
            slots: [teacherConflict],
          });
        }

        // 같은 시간에 같은 장소를 사용하는지 (장소가 지정된 경우)
        if (newSlot.room) {
          const roomConflict = slots.find(
            (s) =>
              s.id !== excludeId &&
              s.room === newSlot.room &&
              s.day === newSlot.day &&
              s.period === newSlot.period
          );

          if (roomConflict) {
            conflicts.push({
              type: 'room',
              message: `${newSlot.room}은 이미 ${roomConflict.grade}학년 ${roomConflict.classNumber}반이 사용 중입니다.`,
              slots: [roomConflict],
            });
          }
        }

        return {
          hasConflict: conflicts.length > 0,
          conflicts,
        };
      },

      // 필터링
      filterSlots: (filter) => {
        const { slots } = get();
        return slots.filter((slot) => {
          if (filter.teacherId && slot.teacherId !== filter.teacherId) return false;
          if (filter.grade && slot.grade !== filter.grade) return false;
          if (filter.classNumber && slot.classNumber !== filter.classNumber) return false;
          if (filter.day && slot.day !== filter.day) return false;
          if (filter.subject && slot.subject !== filter.subject) return false;
          return true;
        });
      },
    }),
    {
      name: 'sisu-timetable',
      partialize: (state) => ({
        slots: state.slots,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// ID 생성 헬퍼
export function generateSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
