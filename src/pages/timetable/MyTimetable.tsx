import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  RefreshCw,
  Download,
  BarChart3,
} from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';
import { useTimetableStore } from '../../stores/timetableStore';
import { useSchoolStore } from '../../stores/schoolStore';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import { DAY_LABELS, DAYS_ORDER } from '../../types/timetable';

export default function MyTimetable() {
  const { teachers } = useTeacherStore();
  const { slots, getTeacherStats } = useTimetableStore();
  const { periods: periodSettings } = useSchoolStore();

  // 현재 선택된 교사 (첫 번째 전담교사를 기본값으로)
  const specialists = teachers.filter((t) => t.type === 'specialist');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    specialists[0]?.id || ''
  );

  // 선택된 교사 정보
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // 해당 교사의 시간표
  const teacherSlots = useMemo(() => {
    return slots.filter((s) => s.teacherId === selectedTeacherId);
  }, [slots, selectedTeacherId]);

  // 교시 배열 (1~6)
  const periodNumbers = periodSettings.length > 0
    ? periodSettings.map((p) => p.period)
    : [1, 2, 3, 4, 5, 6];

  // 통계
  const stats = selectedTeacherId ? getTeacherStats(selectedTeacherId) : null;

  // 요일별 시수 계산
  const dailyHours = useMemo(() => {
    return DAYS_ORDER.map((day) => ({
      day,
      label: DAY_LABELS[day],
      count: teacherSlots.filter((s) => s.day === day).length,
    }));
  }, [teacherSlots]);

  if (specialists.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            내 시간표
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            교과전담 교사의 주간 시간표를 확인합니다
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            등록된 전담교사가 없습니다
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            먼저 교사 관리에서 전담교사를 등록해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            내 시간표
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            교과전담 교사의 주간 시간표를 확인합니다
          </p>
        </div>

        {/* 교사 선택 */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {specialists.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.subjects?.join(', ') || '교과 미지정'})
              </option>
            ))}
          </select>

          <button
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* 교사 정보 카드 */}
      {selectedTeacher && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30
                            flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-white">
                  {selectedTeacher.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedTeacher.grades?.length
                    ? `${selectedTeacher.grades.join(', ')}학년`
                    : selectedTeacher.grade
                      ? `${selectedTeacher.grade}학년`
                      : '학년 미지정'}
                  {' · '}
                  {selectedTeacher.subjects?.join(', ') || '교과 미지정'}
                </p>
              </div>
            </div>

            {/* 요약 통계 */}
            <div className="flex items-center gap-6 ml-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.totalSlots || 0}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">주당 시수</div>
              </div>

              {dailyHours.map(({ day, label, count }) => (
                <div key={day} className="text-center hidden sm:block">
                  <div className={`text-lg font-semibold ${
                    count > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-300 dark:text-slate-600'
                  }`}>
                    {count}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 시간표 그리드 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            주간 시간표
          </h3>

          <button
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline
                     flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            내보내기
          </button>
        </div>

        {teacherSlots.length > 0 ? (
          <TimetableGrid
            slots={teacherSlots}
            periods={periodNumbers}
            showGradeClass={true}
            showTeacher={false}
          />
        ) : (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">
              배정된 시간표가 없습니다
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              시간표 편집에서 수업을 배정해주세요
            </p>
          </div>
        )}
      </motion.div>

      {/* 교시별 상세 (모바일용) */}
      {teacherSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 lg:hidden"
        >
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            수업 목록
          </h3>

          <div className="space-y-2">
            {DAYS_ORDER.map((day) => {
              const daySlots = teacherSlots
                .filter((s) => s.day === day)
                .sort((a, b) => a.period - b.period);

              if (daySlots.length === 0) return null;

              return (
                <div key={day} className="border-b border-slate-100 dark:border-slate-700 pb-2">
                  <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {DAY_LABELS[day]}요일
                  </div>
                  <div className="space-y-1">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between text-sm
                                 bg-slate-50 dark:bg-slate-800/50 rounded px-2 py-1"
                      >
                        <span className="text-slate-500 dark:text-slate-400">
                          {slot.period}교시
                        </span>
                        <span className="font-medium text-slate-800 dark:text-white">
                          {slot.grade}-{slot.classNumber} {slot.subject}
                        </span>
                        {slot.room && (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">
                            {slot.room}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
