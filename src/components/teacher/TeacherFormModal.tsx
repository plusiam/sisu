import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Save } from 'lucide-react';
import type { Teacher } from '../../types/teacher';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher;
  mode: 'add' | 'edit';
  onSubmit: (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SUBJECTS = ['국어', '수학', '사회', '과학', '영어', '체육', '음악', '미술', '실과', '도덕'];

export default function TeacherFormModal({ isOpen, onClose, teacher, mode, onSubmit }: TeacherFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'homeroom' as 'homeroom' | 'specialist',
    grade: undefined as number | undefined,
    classNumber: undefined as number | undefined,
    subjects: [] as string[],
  });

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        type: teacher.type,
        grade: teacher.grade,
        classNumber: teacher.classNumber,
        subjects: teacher.subjects || [],
      });
    } else {
      setFormData({
        name: '',
        type: 'homeroom',
        grade: undefined,
        classNumber: undefined,
        subjects: [],
      });
    }
  }, [teacher, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-md p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {mode === 'add' ? '교사 추가' : '교사 정보 수정'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="홍길동"
              />
            </div>

            {/* 유형 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                유형 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="homeroom"
                    checked={formData.type === 'homeroom'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      type: e.target.value as 'homeroom' | 'specialist',
                      subjects: e.target.value === 'homeroom' ? [] : prev.subjects
                    }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">담임</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="specialist"
                    checked={formData.type === 'specialist'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      type: e.target.value as 'homeroom' | 'specialist',
                      grade: undefined,
                      classNumber: undefined
                    }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">전담</span>
                </label>
              </div>
            </div>

            {/* 담당 학년 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                담당 학년
              </label>
              <select
                value={formData.grade || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">선택 안 함</option>
                {[1, 2, 3, 4, 5, 6].map(grade => (
                  <option key={grade} value={grade}>{grade}학년</option>
                ))}
              </select>
            </div>

            {/* 반 번호 (담임만) */}
            {formData.type === 'homeroom' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  반 번호
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.classNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, classNumber: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                           bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="1"
                />
              </div>
            )}

            {/* 담당 교과 (전담만) */}
            {formData.type === 'specialist' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  담당 교과
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map(subject => (
                    <label
                      key={subject}
                      className="flex items-center gap-2 cursor-pointer p-2 rounded-lg
                               hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700
                         transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700
                         text-white font-medium flex items-center justify-center gap-2
                         transition-colors"
              >
                <Save className="w-4 h-4" />
                {mode === 'add' ? '추가' : '저장'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
