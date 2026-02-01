import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';
import { useTimetableStore } from '../../stores/timetableStore';
import { useSchoolStore } from '../../stores/schoolStore';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import { getTeacherRoleLabel } from '../../lib/teacherUtils';

type ViewMode = 'byTeacher' | 'byClass' | 'bySubject';

export default function AllTimetables() {
  const { teachers } = useTeacherStore();
  const { slots, getTeacherStats } = useTimetableStore();
  const { periods: periodSettings, schoolInfo } = useSchoolStore();

  // 뷰 모드
  const [viewMode, setViewMode] = useState<ViewMode>('byTeacher');

  // 필터
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');

  // 확장된 교사 (아코디언)
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  // 전담교사 목록
  const specialists = teachers.filter((t) => t.type === 'specialist');

  // 모든 교과 목록
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    slots.forEach((s) => subjects.add(s.subject));
    return Array.from(subjects).sort();
  }, [slots]);

  // 교시 배열
  const periodNumbers = periodSettings.length > 0
    ? periodSettings.map((p) => p.period)
    : [1, 2, 3, 4, 5, 6];

  // 학년별 반 수
  const classesByGrade = schoolInfo.classesByGrade;

  // 필터링된 슬롯
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) return false;
      if (selectedSubject !== 'all' && s.subject !== selectedSubject) return false;
      return true;
    });
  }, [slots, selectedGrade, selectedSubject]);

  // 아코디언 토글
  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers((prev) => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  // 모두 펼치기/접기
  const toggleAll = () => {
    if (expandedTeachers.size === specialists.length) {
      setExpandedTeachers(new Set());
    } else {
      setExpandedTeachers(new Set(specialists.map((t) => t.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            전체 시간표
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {schoolInfo.schoolName || '학교'} 교과전담 시간표 현황
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                     hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
                     text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            전체 내보내기
          </button>
        </div>
      </div>

      {/* 필터 및 뷰 모드 */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 뷰 모드 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">보기:</span>
            <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
              {[
                { value: 'byTeacher', label: '교사별' },
                { value: 'byClass', label: '학급별' },
                { value: 'bySubject', label: '교과별' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setViewMode(value as ViewMode)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    viewMode === value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 학년 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">학년:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="all">전체</option>
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </div>

          {/* 교과 필터 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">교과:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              <option value="all">전체</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 모두 펼치기/접기 */}
          {viewMode === 'byTeacher' && (
            <button
              onClick={toggleAll}
              className="ml-auto text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {expandedTeachers.size === specialists.length ? '모두 접기' : '모두 펼치기'}
            </button>
          )}
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {specialists.length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">전담교사</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {filteredSlots.length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">배정 시수</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {allSubjects.length}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">교과 수</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {Object.values(classesByGrade).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">총 학급</div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {viewMode === 'byTeacher' && (
        <div className="space-y-4">
          {specialists.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                등록된 전담교사가 없습니다
              </p>
            </div>
          ) : (
            specialists.map((teacher) => {
              const teacherSlots = filteredSlots.filter(
                (s) => s.teacherId === teacher.id
              );
              const stats = getTeacherStats(teacher.id);
              const isExpanded = expandedTeachers.has(teacher.id);

              return (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  {/* 교사 헤더 (클릭하여 펼치기/접기) */}
                  <button
                    onClick={() => toggleTeacher(teacher.id)}
                    className="w-full p-4 flex items-center justify-between
                             hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30
                                    flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium">
                        {teacher.name[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {teacher.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {getTeacherRoleLabel(teacher)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-lg font-semibold text-slate-800 dark:text-white">
                          {stats.totalSlots}시수
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {teacherSlots.length > 0
                            ? `${new Set(teacherSlots.map((s) => s.grade)).size}개 학년`
                            : '미배정'}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* 시간표 (펼쳐진 경우) */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 dark:border-slate-700 p-4"
                    >
                      {teacherSlots.length > 0 ? (
                        <TimetableGrid
                          slots={teacherSlots}
                          periods={periodNumbers}
                          showGradeClass={true}
                          showTeacher={false}
                        />
                      ) : (
                        <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          배정된 시간표가 없습니다
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'byClass' && (
        <div className="space-y-6">
          {[3, 4, 5, 6].map((grade) => {
            const gradeClasses = classesByGrade[grade as keyof typeof classesByGrade] || 0;
            if (gradeClasses === 0) return null;

            return (
              <div key={grade}>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
                  {grade}학년
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: gradeClasses }, (_, i) => i + 1).map((classNum) => {
                    const classSlots = filteredSlots.filter(
                      (s) => s.grade === grade && s.classNumber === classNum
                    );

                    return (
                      <div key={`${grade}-${classNum}`} className="glass-card p-4">
                        <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
                          {grade}학년 {classNum}반
                          <span className="ml-2 text-sm text-slate-500">
                            ({classSlots.length}시수)
                          </span>
                        </h4>
                        {classSlots.length > 0 ? (
                          <TimetableGrid
                            slots={classSlots}
                            periods={periodNumbers}
                            showGradeClass={false}
                            showTeacher={true}
                          />
                        ) : (
                          <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                            배정된 전담 수업 없음
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'bySubject' && (
        <div className="space-y-4">
          {allSubjects.map((subject) => {
            const subjectSlots = filteredSlots.filter((s) => s.subject === subject);
            const teachers = [...new Set(subjectSlots.map((s) => s.teacherName))];

            return (
              <div key={subject} className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {subject}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      담당: {teachers.join(', ') || '미배정'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                      {subjectSlots.length}시수
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Set(subjectSlots.map((s) => `${s.grade}-${s.classNumber}`)).size}개 학급
                    </div>
                  </div>
                </div>

                {/* 학년별 배정 현황 */}
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((grade) => {
                    const gradeSlots = subjectSlots.filter((s) => s.grade === grade);
                    return (
                      <div
                        key={grade}
                        className={`text-center p-2 rounded ${
                          gradeSlots.length > 0
                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                            : 'bg-slate-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {grade}학년
                        </div>
                        <div className={`font-semibold ${
                          gradeSlots.length > 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}>
                          {gradeSlots.length}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {allSubjects.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                배정된 시간표가 없습니다
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
