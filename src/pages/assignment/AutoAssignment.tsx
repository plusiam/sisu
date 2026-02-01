import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wand2,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Undo,
  Info,
} from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';
import { useTimetableStore } from '../../stores/timetableStore';
import { useSchoolStore } from '../../stores/schoolStore';
import {
  runAutoSchedule,
  validateTimetable,
  getTeacherHoursSummary,
} from '../../lib/autoScheduler';
import type { TimetableSlot, AutoScheduleResult } from '../../types/timetable';

export default function AutoAssignment() {
  const { teachers } = useTeacherStore();
  const { slots, setSlots, clearSlots } = useTimetableStore();
  const { subjects, schoolInfo, settings } = useSchoolStore();

  // 상태
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AutoScheduleResult | null>(null);
  const [previewSlots, setPreviewSlots] = useState<TimetableSlot[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // 옵션
  const [clearExisting, setClearExisting] = useState(false);
  const [maxConsecutive, setMaxConsecutive] = useState(4);
  const [maxPerDay, setMaxPerDay] = useState(6);

  // 전담교사
  const specialists = teachers.filter((t) => t.type === 'specialist');

  // 현재 시간표 검증
  const validation = useMemo(() => validateTimetable(slots), [slots]);

  // 교사별 시수 요약
  const hoursSummary = useMemo(
    () => getTeacherHoursSummary(showPreview ? previewSlots : slots, teachers),
    [showPreview, previewSlots, slots, teachers]
  );

  // 자동배정 실행
  const handleRunAutoSchedule = () => {
    setIsRunning(true);
    setResult(null);

    // 약간의 딜레이로 UI 업데이트
    setTimeout(() => {
      try {
        const existingSlots = clearExisting ? [] : slots;

        const scheduleResult = runAutoSchedule(
          teachers,
          existingSlots,
          subjects,
          schoolInfo,
          settings,
          {
            maxConsecutive,
            maxPerDay,
          }
        );

        setResult(scheduleResult);

        if (scheduleResult.slots.length > 0) {
          const combined = clearExisting
            ? scheduleResult.slots
            : [...slots, ...scheduleResult.slots];
          setPreviewSlots(combined);
          setShowPreview(true);
        }
      } catch (error) {
        setResult({
          success: false,
          slots: [],
          unassigned: [],
          message: '자동배정 중 오류가 발생했습니다.',
        });
      } finally {
        setIsRunning(false);
      }
    }, 500);
  };

  // 미리보기 적용
  const handleApplyPreview = () => {
    setSlots(previewSlots);
    setShowPreview(false);
    setResult(null);
  };

  // 미리보기 취소
  const handleCancelPreview = () => {
    setPreviewSlots([]);
    setShowPreview(false);
    setResult(null);
  };

  // 전체 초기화
  const handleClearAll = () => {
    if (confirm('모든 시간표를 삭제하시겠습니까?')) {
      clearSlots();
      setResult(null);
      setShowPreview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          자동 배정
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          AI가 최적의 시간표를 자동으로 배정합니다
        </p>
      </div>

      {/* 알림 */}
      {specialists.length === 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">전담교사를 먼저 등록해주세요</span>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
            교사 관리에서 전담교사와 담당 교과/학년을 설정해야 자동배정이 가능합니다.
          </p>
        </div>
      )}

      {/* 현재 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">전담교사</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {specialists.length}명
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">현재 배정</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {showPreview ? previewSlots.length : slots.length}시수
            {showPreview && (
              <span className="text-sm font-normal text-indigo-500 ml-2">(미리보기)</span>
            )}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">검증 상태</div>
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">정상</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-600 dark:text-red-400">
                  {validation.errors.length}개 오류
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 옵션 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-indigo-500" />
          배정 옵션
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <div className="font-medium text-slate-800 dark:text-white text-sm">
                기존 시간표 삭제
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                새로 배정 시 기존 데이터 초기화
              </div>
            </div>
          </label>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-medium text-slate-800 dark:text-white text-sm mb-1">
              최대 연속 시수
            </div>
            <select
              value={maxConsecutive}
              onChange={(e) => setMaxConsecutive(Number(e.target.value))}
              className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}시수</option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="font-medium text-slate-800 dark:text-white text-sm mb-1">
              일일 최대 시수
            </div>
            <select
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(Number(e.target.value))}
              className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600
                       bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {[4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}시수</option>
              ))}
            </select>
          </div>
        </div>

        {/* 실행 버튼 */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleRunAutoSchedule}
            disabled={isRunning || specialists.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300
                     dark:disabled:bg-slate-600 text-white rounded-lg transition-colors
                     flex items-center gap-2 font-medium"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                배정 중...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                자동배정 실행
              </>
            )}
          </button>

          <button
            onClick={handleClearAll}
            disabled={slots.length === 0}
            className="px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50
                     dark:hover:bg-red-900/20 rounded-lg transition-colors
                     flex items-center gap-2 disabled:opacity-50"
          >
            <Undo className="w-4 h-4" />
            전체 초기화
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-4 border-l-4 ${
            result.success
              ? 'border-emerald-500'
              : result.unassigned.length > 0
                ? 'border-yellow-500'
                : 'border-red-500'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : result.unassigned.length > 0 ? (
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <span className="font-semibold text-slate-800 dark:text-white">
              {result.message}
            </span>
          </div>

          {/* 미배정 목록 */}
          {result.unassigned.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                미배정 항목:
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 max-h-40 overflow-y-auto">
                {result.unassigned.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    {item.grade}학년 {item.classNumber}반 {item.subject} - {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 미리보기 버튼 */}
          {showPreview && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleApplyPreview}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white
                         rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                적용하기
              </button>
              <button
                onClick={handleCancelPreview}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100
                         dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 교사별 시수 현황 */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
          교사별 배정 현황
          {showPreview && (
            <span className="text-sm font-normal text-indigo-500 ml-2">(미리보기)</span>
          )}
        </h3>

        {hoursSummary.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-600 dark:text-slate-400">
                    교사
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    총 시수
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    월
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    화
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    수
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    목
                  </th>
                  <th className="px-3 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                    금
                  </th>
                </tr>
              </thead>
              <tbody>
                {hoursSummary.map((summary) => (
                  <tr
                    key={summary.teacherId}
                    className="border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-white">
                      {summary.teacherName}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {summary.totalHours}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                      {summary.byDay.mon || '-'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                      {summary.byDay.tue || '-'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                      {summary.byDay.wed || '-'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                      {summary.byDay.thu || '-'}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400">
                      {summary.byDay.fri || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            전담교사가 등록되지 않았습니다
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="glass-card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">자동배정 알고리즘 안내</p>
            <ul className="text-blue-600 dark:text-blue-400 space-y-1">
              <li>• 전담교사의 담당 학년/교과를 기준으로 배정합니다</li>
              <li>• 교사별 요일 균형을 고려하여 배정합니다</li>
              <li>• 동시간대 교사/학급 충돌을 자동으로 피합니다</li>
              <li>• 배정 후 시간표 편집에서 수동 조정이 가능합니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
