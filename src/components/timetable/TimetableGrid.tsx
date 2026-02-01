import { motion } from 'framer-motion';
import type { TimetableSlot, DayOfWeek } from '../../types/timetable';
import { DAY_LABELS, DAYS_ORDER } from '../../types/timetable';

interface TimetableGridProps {
  slots: TimetableSlot[];
  periods: number[];  // [1, 2, 3, 4, 5, 6]
  showGradeClass?: boolean;  // 학년-반 표시 여부 (개인 시간표에서는 true)
  showTeacher?: boolean;     // 교사명 표시 여부 (학급 시간표에서는 true)
  onSlotClick?: (day: DayOfWeek, period: number, slot?: TimetableSlot) => void;
  editable?: boolean;
  highlightEmpty?: boolean;
}

// 교과별 색상
const SUBJECT_COLORS: Record<string, string> = {
  국어: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',
  수학: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
  사회: 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700',
  과학: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700',
  영어: 'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700',
  도덕: 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700',
  체육: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700',
  음악: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700',
  미술: 'bg-cyan-100 dark:bg-cyan-900/40 border-cyan-300 dark:border-cyan-700',
  실과: 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700',
  안전: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700',
  창체: 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700',
  통합: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600';
}

export default function TimetableGrid({
  slots,
  periods,
  showGradeClass = false,
  showTeacher = false,
  onSlotClick,
  editable = false,
  highlightEmpty = false,
}: TimetableGridProps) {
  // 특정 요일/교시의 수업 찾기
  const getSlot = (day: DayOfWeek, period: number): TimetableSlot | undefined => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="w-16 p-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              교시
            </th>
            {DAYS_ORDER.map((day) => (
              <th
                key={day}
                className="p-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period}>
              <td className="p-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                {period}
              </td>
              {DAYS_ORDER.map((day) => {
                const slot = getSlot(day, period);
                const isClickable = editable || onSlotClick;

                return (
                  <td
                    key={`${day}-${period}`}
                    className={`border border-slate-200 dark:border-slate-700 p-0 ${
                      isClickable ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onSlotClick?.(day, period, slot)}
                  >
                    {slot ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-2 h-full min-h-[70px] border-l-4 ${getSubjectColor(slot.subject)} ${
                          isClickable ? 'hover:brightness-95 transition-all' : ''
                        }`}
                      >
                        <div className="font-medium text-slate-800 dark:text-white text-sm">
                          {slot.subject}
                        </div>
                        {showGradeClass && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {slot.grade}-{slot.classNumber}
                          </div>
                        )}
                        {showTeacher && (
                          <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {slot.teacherName}
                          </div>
                        )}
                        {slot.room && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            📍 {slot.room}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div
                        className={`p-2 h-full min-h-[70px] ${
                          highlightEmpty
                            ? 'bg-slate-50 dark:bg-slate-800/30'
                            : ''
                        } ${
                          isClickable
                            ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors'
                            : ''
                        }`}
                      >
                        {editable && (
                          <div className="text-xs text-slate-400 dark:text-slate-600 text-center">
                            +
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
