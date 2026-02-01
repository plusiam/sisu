import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Save } from 'lucide-react';
import type { Teacher } from '../../types/teacher';
import { validateTeacherName, validateGrade, validateClassNumber } from '../../lib/validation';
import { toast } from '../../stores/toastStore';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher;
  mode: 'add' | 'edit';
  onSubmit: (teacherData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const SUBJECTS = ['국어', '수학', '사회', '과학', '영어', '체육', '음악', '미술', '실과', '도덕'];
const GRADES = [1, 2, 3, 4, 5, 6];

export default function TeacherFormModal({ isOpen, onClose, teacher, mode, onSubmit }: TeacherFormModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'homeroom' as 'homeroom' | 'specialist',
    grade: undefined as number | undefined,
    grades: [] as number[],
    classNumber: undefined as number | undefined,
    subjects: [] as string[],
    customSubject: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        type: teacher.type,
        grade: teacher.grade,
        grades: teacher.grades || (teacher.grade ? [teacher.grade] : []),
        classNumber: teacher.classNumber,
        subjects: teacher.subjects || [],
        customSubject: teacher.customSubject || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'homeroom',
        grade: undefined,
        grades: [],
        classNumber: undefined,
        subjects: [],
        customSubject: '',
      });
    }
  }, [teacher, isOpen]);

  // 모달 열릴 때 첫 입력에 포커스
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 포커스 트랩
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 검증
    const newErrors: Record<string, string> = {};

    const nameValidation = validateTeacherName(formData.name);
    if (!nameValidation.isValid) {
      newErrors.name = nameValidation.error!;
    }

    if (formData.type === 'homeroom') {
      const gradeValidation = validateGrade(formData.grade);
      if (!gradeValidation.isValid) {
        newErrors.grade = gradeValidation.error!;
      }
      const classValidation = validateClassNumber(formData.classNumber);
      if (!classValidation.isValid) {
        newErrors.classNumber = classValidation.error!;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('입력 내용을 확인해주세요');
      return;
    }

    // 검증 통과 - 제출
    setErrors({});

    const submitData: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      type: formData.type,
    };

    if (formData.type === 'homeroom') {
      submitData.grade = formData.grade;
      submitData.classNumber = formData.classNumber;
    } else {
      // 전담교사
      submitData.grades = formData.grades;
      submitData.subjects = formData.subjects;
      if (formData.customSubject.trim()) {
        submitData.customSubject = formData.customSubject.trim();
      }
    }

    onSubmit(submitData);
    toast.success(mode === 'add' ? '교사가 추가되었습니다' : '교사 정보가 수정되었습니다');
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

  const toggleGrade = (grade: number) => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.includes(grade)
        ? prev.grades.filter(g => g !== grade)
        : [...prev.grades, grade].sort((a, b) => a - b)
    }));
  };

  const selectAllGrades = () => {
    setFormData(prev => ({
      ...prev,
      grades: prev.grades.length === GRADES.length ? [] : [...GRADES]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-form-title"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 id="teacher-form-title" className="text-xl font-bold text-slate-800 dark:text-white">
                {mode === 'add' ? '교사 추가' : '교사 정보 수정'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-slate-500" aria-hidden="true" />
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
                ref={nameInputRef}
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-800
                         text-slate-800 dark:text-white focus:outline-none focus:ring-2
                         ${errors.name
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'
                         }`}
                placeholder="홍길동"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                  {errors.name}
                </p>
              )}
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
                      subjects: [],
                      grades: [],
                      customSubject: '',
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
                      classNumber: undefined,
                    }))}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">전담</span>
                </label>
              </div>
            </div>

            {/* 담임교사: 담당 학년 (단일 선택) */}
            {formData.type === 'homeroom' && (
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
                  {GRADES.map(grade => (
                    <option key={grade} value={grade}>{grade}학년</option>
                  ))}
                </select>
              </div>
            )}

            {/* 담임교사: 반 번호 */}
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

            {/* 전담교사: 담당 학년 (복수 선택) */}
            {formData.type === 'specialist' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    담당 학년 <span className="text-slate-500 text-xs">(복수 선택 가능)</span>
                  </label>
                  <button
                    type="button"
                    onClick={selectAllGrades}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {formData.grades.length === GRADES.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GRADES.map(grade => (
                    <label
                      key={grade}
                      className={`flex items-center justify-center w-16 py-2 rounded-lg cursor-pointer
                                border transition-colors
                                ${formData.grades.includes(grade)
                                  ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                                }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.grades.includes(grade)}
                        onChange={() => toggleGrade(grade)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{grade}학년</span>
                    </label>
                  ))}
                </div>
                {formData.grades.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    선택: {formData.grades.map(g => `${g}학년`).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* 전담교사: 담당 교과 */}
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

            {/* 전담교사: 기타 교과 */}
            {formData.type === 'specialist' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  기타 교과 <span className="text-slate-500 text-xs">(직접 입력)</span>
                </label>
                <input
                  type="text"
                  value={formData.customSubject}
                  onChange={(e) => setFormData(prev => ({ ...prev, customSubject: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                           bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 안전, 창체, 컴퓨터"
                />
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
