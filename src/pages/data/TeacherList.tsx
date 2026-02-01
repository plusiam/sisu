import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Settings, Edit, Trash2, Clock, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeacherStore } from '../../stores/teacherStore';
import { calculateStats } from '../../lib/simulatorCalculations';
import TeacherFormModal from '../../components/teacher/TeacherFormModal';
import GoogleSheetsSettingsModal from '../../components/teacher/GoogleSheetsSettingsModal';
import SyncStatusIndicator from '../../components/teacher/SyncStatusIndicator';
import type { Teacher } from '../../types/teacher';

export default function TeacherList() {
  const navigate = useNavigate();
  const { teachers, assignments, addTeacher, updateTeacher, deleteTeacher, syncPush, syncPull, googleSheetsConfig } = useTeacherStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | undefined>();
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [syncing, setSyncing] = useState(false);

  const handleAddClick = () => {
    setEditingTeacher(undefined);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteTeacher(id);
    }
  };

  const handleSubmit = (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modalMode === 'add') {
      addTeacher(teacherData);
    } else if (editingTeacher) {
      updateTeacher(editingTeacher.id, teacherData);
    }
  };

  const handleSyncPush = async () => {
    if (!googleSheetsConfig.enabled) {
      alert('먼저 Google Sheets를 설정해주세요');
      setIsSettingsOpen(true);
      return;
    }

    setSyncing(true);
    try {
      await syncPush();
      alert('동기화 완료!');
    } catch (error) {
      alert(error instanceof Error ? error.message : '동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    if (!googleSheetsConfig.enabled) {
      alert('먼저 Google Sheets를 설정해주세요');
      setIsSettingsOpen(true);
      return;
    }

    if (!confirm('Sheets의 데이터로 덮어쓰시겠습니까? 로컬 변경사항은 손실됩니다.')) {
      return;
    }

    setSyncing(true);
    try {
      await syncPull();
      alert('동기화 완료!');
    } catch (error) {
      alert(error instanceof Error ? error.message : '동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  const getTeacherHours = (teacherId: string) => {
    const assignment = assignments.find(a => a.teacherId === teacherId);
    if (!assignment) return 0;
    const stats = calculateStats(assignment.hours);
    return stats.totalHours;
  };

  const getTeacherLabel = (teacher: Teacher) => {
    if (teacher.type === 'homeroom') {
      if (teacher.grade && teacher.classNumber) {
        return `담임 ${teacher.grade}-${teacher.classNumber}`;
      }
      return '담임';
    } else {
      if (teacher.subjects && teacher.subjects.length > 0) {
        return `전담 ${teacher.subjects.join(', ')}`;
      }
      return '전담';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          교사 정보
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          교사 목록을 관리하고 시수를 배정하세요
        </p>
      </div>

      {/* Actions */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                     transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            교사 추가
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     border border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300
                     hover:bg-slate-100 dark:hover:bg-slate-700
                     transition-colors"
          >
            <Settings className="w-4 h-4" />
            Sheets 설정
          </button>
          <button
            onClick={handleSyncPush}
            disabled={syncing || !googleSheetsConfig.enabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     border border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300
                     hover:bg-slate-100 dark:hover:bg-slate-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <Upload className="w-4 h-4" />
            업로드
          </button>
          <button
            onClick={handleSyncPull}
            disabled={syncing || !googleSheetsConfig.enabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg
                     border border-slate-300 dark:border-slate-600
                     text-slate-700 dark:text-slate-300
                     hover:bg-slate-100 dark:hover:bg-slate-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <Download className="w-4 h-4" />
            다운로드
          </button>
          <div className="ml-auto">
            <SyncStatusIndicator />
          </div>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      {teachers.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            등록된 교사가 없습니다
          </p>
          <button
            onClick={handleAddClick}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700
                     text-white font-medium transition-colors"
          >
            첫 교사 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher, index) => {
            const hours = getTeacherHours(teacher.id);
            const label = getTeacherLabel(teacher);

            return (
              <motion.div
                key={teacher.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-5 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/assignment/teacher/${teacher.id}`)}
              >
                {/* Teacher Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                    {teacher.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                </div>

                {/* Hours */}
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {hours}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">시간</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(teacher);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2
                             rounded-lg border border-slate-300 dark:border-slate-600
                             text-slate-700 dark:text-slate-300
                             hover:bg-slate-100 dark:hover:bg-slate-700
                             transition-colors text-sm"
                  >
                    <Edit className="w-3 h-3" />
                    수정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(teacher.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2
                             rounded-lg border border-red-300 dark:border-red-600
                             text-red-600 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/20
                             transition-colors text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <TeacherFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={editingTeacher}
        mode={modalMode}
        onSubmit={handleSubmit}
      />

      {/* Settings Modal */}
      <GoogleSheetsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
