import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  RefreshCw,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';
import { useTimetableStore, generateSlotId } from '../../stores/timetableStore';
import { useSchoolStore } from '../../stores/schoolStore';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import { DAY_LABELS, type DayOfWeek, type TimetableSlot } from '../../types/timetable';

// 슬롯 편집 모달
interface SlotModalProps {
  isOpen: boolean;
  slot?: TimetableSlot;
  day: DayOfWeek;
  period: number;
  grade: number;
  classNumber: number;
  onSave: (slot: TimetableSlot) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function SlotEditModal({
  isOpen,
  slot,
  day,
  period,
  grade,
  classNumber,
  onSave,
  onDelete,
  onClose,
}: SlotModalProps) {
  const { teachers } = useTeacherStore();
  const { subjects, rooms } = useSchoolStore();
  const { checkConflicts } = useTimetableStore();

  // 전담교사만 필터
  const specialists = teachers.filter((t) => t.type === 'specialist');

  // 폼 상태
  const [teacherId, setTeacherId] = useState(slot?.teacherId || '');
  const [subject, setSubject] = useState(slot?.subject || '');
  const [room, setRoom] = useState(slot?.room || '');
  const [note, setNote] = useState(slot?.note || '');

  // 선택된 교사 정보
  const selectedTeacher = specialists.find((t) => t.id === teacherId);

  // 충돌 검사
  const conflicts = useMemo(() => {
    if (!teacherId || !subject) return null;

    const newSlot = {
      day,
      period,
      grade,
      classNumber,
      teacherId,
      teacherName: selectedTeacher?.name || '',
      subject,
      room,
    };

    return checkConflicts(newSlot, slot?.id);
  }, [teacherId, subject, room, day, period, grade, classNumber, selectedTeacher, slot?.id, checkConflicts]);

  const handleSave = () => {
    if (!teacherId || !subject) return;

    const newSlot: TimetableSlot = {
      id: slot?.id || generateSlotId(),
      day,
      period,
      grade,
      classNumber,
      teacherId,
      teacherName: selectedTeacher?.name || '',
      subject,
      room,
      note,
    };

    onSave(newSlot);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              {slot ? '수업 수정' : '수업 추가'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* 시간 정보 */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {DAY_LABELS[day]}요일 {period}교시 · {grade}학년 {classNumber}반
            </div>
          </div>

          {/* 폼 */}
          <div className="space-y-4">
            {/* 교사 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                담당 교사 *
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                {specialists.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.subjects?.join(', ') || '교과 미지정'})
                  </option>
                ))}
              </select>
            </div>

            {/* 교과 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                교과 *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                {subjects.length > 0 ? (
                  subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))
                ) : (
                  // 기본 교과 목록
                  ['국어', '수학', '사회', '과학', '영어', '도덕', '체육', '음악', '미술', '실과', '안전', '창체'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))
                )}
              </select>
            </div>

            {/* 장소 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                장소 (선택)
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">교실</option>
                {rooms.length > 0 ? (
                  rooms.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))
                ) : (
                  ['과학실', '음악실', '미술실', '영어실', '체육관', '컴퓨터실', '도서실'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))
                )}
              </select>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                메모 (선택)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 격주 수업"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-700 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 충돌 경고 */}
          {conflicts?.hasConflict && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm mb-1">
                <AlertTriangle className="w-4 h-4" />
                충돌 발생
              </div>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                {conflicts.conflicts.map((c, i) => (
                  <li key={i}>• {c.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex items-center justify-between mt-6">
            {slot && onDelete ? (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30
                         rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100
                         dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!teacherId || !subject}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300
                         dark:disabled:bg-slate-600 text-white rounded-lg transition-colors
                         flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {slot ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function TimetableEditor() {
  const { teachers } = useTeacherStore();
  const {
    slots,
    addSlot,
    updateSlot,
    removeSlot,
    isSyncing,
    setSyncing,
  } = useTimetableStore();
  const { periods: periodSettings, schoolInfo } = useSchoolStore();

  // 선택된 학급
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedClass, setSelectedClass] = useState<number>(1);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | undefined>();
  const [modalDay, setModalDay] = useState<DayOfWeek>('mon');
  const [modalPeriod, setModalPeriod] = useState<number>(1);

  // 변경사항 추적
  const [hasChanges, setHasChanges] = useState(false);

  // 학년별 반 수
  const classesByGrade = schoolInfo.classesByGrade;
  const classCount = classesByGrade[selectedGrade as keyof typeof classesByGrade] || 4;

  // 교시 배열
  const periodNumbers = periodSettings.length > 0
    ? periodSettings.map((p) => p.period)
    : [1, 2, 3, 4, 5, 6];

  // 선택된 학급의 시간표
  const classSlots = useMemo(() => {
    return slots.filter(
      (s) => s.grade === selectedGrade && s.classNumber === selectedClass
    );
  }, [slots, selectedGrade, selectedClass]);

  // 슬롯 클릭 핸들러
  const handleSlotClick = useCallback((day: DayOfWeek, period: number, slot?: TimetableSlot) => {
    setModalDay(day);
    setModalPeriod(period);
    setEditingSlot(slot);
    setIsModalOpen(true);
  }, []);

  // 슬롯 저장
  const handleSaveSlot = (newSlot: TimetableSlot) => {
    if (editingSlot) {
      updateSlot(editingSlot.id, newSlot);
    } else {
      addSlot(newSlot);
    }
    setHasChanges(true);
    setIsModalOpen(false);
    setEditingSlot(undefined);
  };

  // 슬롯 삭제
  const handleDeleteSlot = () => {
    if (editingSlot) {
      removeSlot(editingSlot.id);
      setHasChanges(true);
    }
    setIsModalOpen(false);
    setEditingSlot(undefined);
  };

  // 구글 시트에 저장
  const handleSaveToSheet = async () => {
    setSyncing(true);
    try {
      // TODO: 실제 API 호출
      // await api.saveTimetable(slots);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 시뮬레이션
      setHasChanges(false);
      alert('저장되었습니다!');
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 전담교사 목록
  const specialists = teachers.filter((t) => t.type === 'specialist');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            시간표 편집
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            학급별 시간표를 편집하고 저장합니다
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-orange-500 dark:text-orange-400 mr-2">
              • 저장되지 않은 변경사항
            </span>
          )}
          <button
            onClick={handleSaveToSheet}
            disabled={isSyncing || !hasChanges}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300
                     dark:disabled:bg-slate-600 text-white rounded-lg transition-colors
                     flex items-center gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            저장
          </button>
        </div>
      </div>

      {/* 학급 선택 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              학년:
            </span>
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              {[3, 4, 5, 6].map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedGrade(grade);
                    setSelectedClass(1);
                  }}
                  className={`px-4 py-2 text-sm transition-colors ${
                    selectedGrade === grade
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {grade}학년
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              반:
            </span>
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              {Array.from({ length: classCount }, (_, i) => i + 1).map((classNum) => (
                <button
                  key={classNum}
                  onClick={() => setSelectedClass(classNum)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    selectedClass === classNum
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {classNum}반
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            배정된 수업: <span className="font-semibold text-slate-800 dark:text-white">{classSlots.length}시수</span>
          </div>
        </div>
      </div>

      {/* 시간표 그리드 */}
      <motion.div
        key={`${selectedGrade}-${selectedClass}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white">
            {selectedGrade}학년 {selectedClass}반 시간표
          </h3>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            빈 칸을 클릭하여 수업 추가
          </div>
        </div>

        <TimetableGrid
          slots={classSlots}
          periods={periodNumbers}
          showGradeClass={false}
          showTeacher={true}
          onSlotClick={handleSlotClick}
          editable={true}
          highlightEmpty={true}
        />
      </motion.div>

      {/* 전담교사 목록 (참고용) */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
          전담교사 현황
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {specialists.map((teacher) => {
            const teacherSlots = slots.filter((s) => s.teacherId === teacher.id);
            const gradeSlots = teacherSlots.filter(
              (s) => s.grade === selectedGrade
            );

            return (
              <div
                key={teacher.id}
                className={`p-3 rounded-lg border ${
                  gradeSlots.length > 0
                    ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="font-medium text-slate-800 dark:text-white text-sm">
                  {teacher.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {teacher.subjects?.join(', ') || '교과 미지정'}
                </div>
                <div className="mt-1 text-xs">
                  <span className="text-indigo-600 dark:text-indigo-400">
                    총 {teacherSlots.length}시수
                  </span>
                  {gradeSlots.length > 0 && (
                    <span className="text-slate-500 dark:text-slate-400">
                      {' '}· {selectedGrade}학년 {gradeSlots.length}시수
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {specialists.length === 0 && (
            <div className="col-span-full text-center py-6 text-slate-500 dark:text-slate-400">
              등록된 전담교사가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      <SlotEditModal
        isOpen={isModalOpen}
        slot={editingSlot}
        day={modalDay}
        period={modalPeriod}
        grade={selectedGrade}
        classNumber={selectedClass}
        onSave={handleSaveSlot}
        onDelete={editingSlot ? handleDeleteSlot : undefined}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlot(undefined);
        }}
      />
    </div>
  );
}
