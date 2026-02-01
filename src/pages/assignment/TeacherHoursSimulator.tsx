import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, BarChart3, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateStats, validateHours } from '../../lib/simulatorCalculations';
import type { HoursInput } from '../../types/simulator';
import { cn } from '../../lib/utils';

const DEFAULT_INPUT: HoursInput = {
  basicTeaching: 12,
  adminWork: 4,
  training: 2,
  consulting: 2,
  other: 0,
};

export default function TeacherHoursSimulator() {
  const [input, setInput] = useState<HoursInput>(DEFAULT_INPUT);

  // useMemo로 계산 결과 최적화
  const stats = useMemo(() => calculateStats(input), [input]);

  // 입력 핸들러
  function handleInputChange(field: keyof HoursInput, value: string) {
    const numValue = validateHours(Number(value) || 0);
    setInput((prev) => ({ ...prev, [field]: numValue }));
  }

  // 초기화 핸들러
  function handleReset() {
    setInput(DEFAULT_INPUT);
  }

  // 법정 기준 아이콘 및 색상
  const complianceIcon = {
    safe: <CheckCircle2 className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    over: <AlertTriangle className="w-6 h-6" />,
  };

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          시수 시뮬레이터
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          수석교사 주간 시수를 계산하고 법정 기준과 비교하세요
        </p>
      </div>

      {/* 입력 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          주간 시수 입력
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 기본 수업 시수 */}
          <div>
            <label
              htmlFor="basicTeaching"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              기본 수업 시수
            </label>
            <input
              id="basicTeaching"
              type="number"
              min="0"
              max="40"
              value={input.basicTeaching}
              onChange={(e) => handleInputChange('basicTeaching', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="기본 수업 시수"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              주당 0-40시간
            </span>
          </div>

          {/* 행정 업무 */}
          <div>
            <label
              htmlFor="adminWork"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              행정 업무
            </label>
            <input
              id="adminWork"
              type="number"
              min="0"
              max="40"
              value={input.adminWork}
              onChange={(e) => handleInputChange('adminWork', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="행정 업무 시간"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              주당 0-40시간
            </span>
          </div>

          {/* 교사 연수 */}
          <div>
            <label
              htmlFor="training"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              교사 연수
            </label>
            <input
              id="training"
              type="number"
              min="0"
              max="40"
              value={input.training}
              onChange={(e) => handleInputChange('training', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="교사 연수 시간"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              주당 0-40시간
            </span>
          </div>

          {/* 교육 컨설팅 */}
          <div>
            <label
              htmlFor="consulting"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              교육 컨설팅
            </label>
            <input
              id="consulting"
              type="number"
              min="0"
              max="40"
              value={input.consulting}
              onChange={(e) => handleInputChange('consulting', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="교육 컨설팅 시간"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              주당 0-40시간
            </span>
          </div>

          {/* 기타 업무 */}
          <div>
            <label
              htmlFor="other"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              기타 업무
            </label>
            <input
              id="other"
              type="number"
              min="0"
              max="40"
              value={input.other}
              onChange={(e) => handleInputChange('other', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              aria-label="기타 업무 시간"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              주당 0-40시간
            </span>
          </div>

          {/* 초기화 버튼 */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="btn-secondary w-full"
            >
              초기화
            </button>
          </div>
        </div>
      </motion.div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 시수 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                총 시수
              </span>
              <div className="text-blue-500">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {stats.totalHours}시간
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              주당 시수
            </div>
          </div>
        </motion.div>

        {/* 주당 평균 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                일일 평균
              </span>
              <div className="text-green-500">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {stats.dailyAverage}시간
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              1일 평균 (주 5일)
            </div>
          </div>
        </motion.div>

        {/* 월간 환산 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                월간 환산
              </span>
              <div className="text-purple-500">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {stats.monthlyTotal}시간
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              월간 총 시수 (4주)
            </div>
          </div>
        </motion.div>

        {/* 법정 기준 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 relative overflow-hidden"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br',
              stats.compliance.status === 'safe' && 'from-green-500/10 to-green-600/10',
              stats.compliance.status === 'warning' && 'from-orange-500/10 to-orange-600/10',
              stats.compliance.status === 'over' && 'from-red-500/10 to-red-600/10'
            )}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                법정 기준 대비
              </span>
              <div
                className={cn(
                  stats.compliance.status === 'safe' && 'text-green-500',
                  stats.compliance.status === 'warning' && 'text-orange-500',
                  stats.compliance.status === 'over' && 'text-red-500'
                )}
              >
                {complianceIcon[stats.compliance.status]}
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
              {stats.compliance.status === 'safe' && '적정'}
              {stats.compliance.status === 'warning' && '주의'}
              {stats.compliance.status === 'over' && '초과'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {stats.compliance.message}
            </div>
            {/* 진행률 바 */}
            <div className="mt-3 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.compliance.percentage, 100)}%` }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  stats.compliance.status === 'safe' && 'bg-green-500',
                  stats.compliance.status === 'warning' && 'bg-orange-500',
                  stats.compliance.status === 'over' && 'bg-red-500'
                )}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 업무 분포 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          업무 분포
        </h2>
        <div className="space-y-4">
          {/* 수업 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                수업
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {stats.distribution.teaching}%
              </span>
            </div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.distribution.teaching}%` }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              />
            </div>
          </div>

          {/* 행정 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                행정
              </span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {stats.distribution.admin}%
              </span>
            </div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.distribution.admin}%` }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              />
            </div>
          </div>

          {/* 연수 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                연수 및 컨설팅
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {stats.distribution.training}%
              </span>
            </div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.distribution.training}%` }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              />
            </div>
          </div>

          {/* 기타 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                기타
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {stats.distribution.other}%
              </span>
            </div>
            <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.distribution.other}%` }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
