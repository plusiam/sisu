import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Teacher, TeacherAssignment, SyncStatus, GoogleSheetsConfig } from '../types/teacher';
import type { HoursInput } from '../types/simulator';
import { GoogleSheetsAPI } from '../lib/googleSheetsApi';

interface TeacherStore {
  // State
  teachers: Teacher[];
  assignments: TeacherAssignment[];
  selectedTeacherId: string | null;
  syncStatus: SyncStatus;
  googleSheetsConfig: GoogleSheetsConfig;

  // Teacher CRUD
  addTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  selectTeacher: (id: string | null) => void;

  // Assignment management
  updateAssignment: (teacherId: string, hours: HoursInput, notes?: string) => void;
  getAssignment: (teacherId: string) => TeacherAssignment | undefined;

  // Google Sheets sync
  updateGoogleSheetsConfig: (config: Partial<GoogleSheetsConfig>) => void;
  syncWithGoogleSheets: (direction?: 'push' | 'pull') => Promise<void>;
  syncPush: () => Promise<void>;
  syncPull: () => Promise<void>;

  // Utilities
  clearAllData: () => void;
}

export const useTeacherStore = create<TeacherStore>()(
  persist(
    (set, get) => ({
      teachers: [],
      assignments: [],
      selectedTeacherId: null,
      syncStatus: {
        lastSyncTime: null,
        status: 'never',
        pendingChanges: 0,
      },
      googleSheetsConfig: {
        spreadsheetId: '',
        webAppUrl: '',
        enabled: false,
        autoSync: false,
      },

      addTeacher: (teacherData) => {
        const newTeacher: Teacher = {
          ...teacherData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          teachers: [...state.teachers, newTeacher],
          syncStatus: {
            ...state.syncStatus,
            status: 'pending',
            pendingChanges: state.syncStatus.pendingChanges + 1
          }
        }));
      },

      updateTeacher: (id, updates) => {
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
          syncStatus: {
            ...state.syncStatus,
            status: 'pending',
            pendingChanges: state.syncStatus.pendingChanges + 1
          }
        }));
      },

      deleteTeacher: (id) => {
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
          assignments: state.assignments.filter((a) => a.teacherId !== id),
          selectedTeacherId: state.selectedTeacherId === id ? null : state.selectedTeacherId,
          syncStatus: {
            ...state.syncStatus,
            status: 'pending',
            pendingChanges: state.syncStatus.pendingChanges + 1
          }
        }));
      },

      selectTeacher: (id) => set({ selectedTeacherId: id }),

      updateAssignment: (teacherId, hours, notes) => {
        set((state) => {
          const existingIndex = state.assignments.findIndex((a) => a.teacherId === teacherId);
          const newAssignment: TeacherAssignment = {
            teacherId,
            hours,
            notes,
            lastModified: Date.now(),
          };

          if (existingIndex >= 0) {
            const newAssignments = [...state.assignments];
            newAssignments[existingIndex] = newAssignment;
            return {
              assignments: newAssignments,
              syncStatus: {
                ...state.syncStatus,
                status: 'pending',
                pendingChanges: state.syncStatus.pendingChanges + 1
              }
            };
          } else {
            return {
              assignments: [...state.assignments, newAssignment],
              syncStatus: {
                ...state.syncStatus,
                status: 'pending',
                pendingChanges: state.syncStatus.pendingChanges + 1
              }
            };
          }
        });
      },

      getAssignment: (teacherId) => {
        return get().assignments.find((a) => a.teacherId === teacherId);
      },

      updateGoogleSheetsConfig: (config) => {
        set((state) => ({
          googleSheetsConfig: { ...state.googleSheetsConfig, ...config },
        }));
      },

      syncPush: async () => {
        const state = get();
        const { googleSheetsConfig, teachers, assignments } = state;

        if (!googleSheetsConfig.enabled || !googleSheetsConfig.webAppUrl) {
          throw new Error('Google Sheets가 설정되지 않았습니다');
        }

        set({
          syncStatus: {
            ...state.syncStatus,
            status: 'pending',
          },
        });

        try {
          const api = new GoogleSheetsAPI(googleSheetsConfig.webAppUrl);
          await api.saveData(teachers, assignments);

          set({
            syncStatus: {
              lastSyncTime: Date.now(),
              status: 'synced',
              errorMessage: undefined,
              pendingChanges: 0,
            },
          });
        } catch (error) {
          set({
            syncStatus: {
              ...state.syncStatus,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : '동기화 실패',
            },
          });
          throw error;
        }
      },

      syncPull: async () => {
        const state = get();
        const { googleSheetsConfig } = state;

        if (!googleSheetsConfig.enabled || !googleSheetsConfig.webAppUrl) {
          throw new Error('Google Sheets가 설정되지 않았습니다');
        }

        set({
          syncStatus: {
            ...state.syncStatus,
            status: 'pending',
          },
        });

        try {
          const api = new GoogleSheetsAPI(googleSheetsConfig.webAppUrl);
          const data = await api.fetchData();
          const { teachers, assignments } = GoogleSheetsAPI.parseSheetData(data);

          set({
            teachers,
            assignments,
            syncStatus: {
              lastSyncTime: Date.now(),
              status: 'synced',
              errorMessage: undefined,
              pendingChanges: 0,
            },
          });
        } catch (error) {
          set({
            syncStatus: {
              ...state.syncStatus,
              status: 'error',
              errorMessage: error instanceof Error ? error.message : '동기화 실패',
            },
          });
          throw error;
        }
      },

      syncWithGoogleSheets: async (direction = 'push') => {
        const state = get();
        if (direction === 'push') {
          await state.syncPush();
        } else {
          await state.syncPull();
        }
      },

      clearAllData: () => {
        set({
          teachers: [],
          assignments: [],
          selectedTeacherId: null,
          syncStatus: { lastSyncTime: null, status: 'never', pendingChanges: 0 },
        });
      },
    }),
    {
      name: 'sisu-teacher-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
