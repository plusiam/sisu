import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Settings,
  UserPlus,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTeacherStore } from '../stores/teacherStore';
import { useSchoolStore } from '../stores/schoolStore';
import { calculateDashboardStats, type TeacherStatus } from '../lib/dashboardStats';
import { getTeacherRoleLabel } from '../lib/teacherUtils';

// 상태 카드 컴포넌트
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  to?: string;
}

function StatCard({ title, value, subtitle, icon, color, to }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    red: 'from-red-500 to-red-600 shadow-red-500/30',
  };

  const Card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={to ? { scale: 1.02 } : undefined}
      className={`glass-card p-5 ${to ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
        {subtitle && (
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">
        {value}
      </p>
    </motion.div>
  );

  if (to) {
    return <Link to={to}>{Card}</Link>;
  }
  return Card;
}

// 빠른 실행 버튼 컴포넌트
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

function QuickAction({ title, description, icon, to }: QuickActionProps) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800
                   border border-slate-200 dark:border-slate-700
                   hover:border-indigo-300 dark:hover:border-indigo-600
                   hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-slate-800 dark:text-white">{title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400" />
      </motion.div>
    </Link>
  );
}

// 교사 상태 행 컴포넌트
function TeacherStatusRow({ status, index }: { status: TeacherStatus; index: number }) {
  const navigate = useNavigate();

  const statusConfig = {
    under: {
      icon: <TrendingDown className="w-4 h-4" />,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
      label: '부족',
    },
    over: {
      icon: <TrendingUp className="w-4 h-4" />,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      label: '초과',
    },
    normal: {
      icon: <Minus className="w-4 h-4" />,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      label: '정상',
    },
  };

  const config = statusConfig[status.status];
  const diffText = status.difference > 0
    ? `+${status.difference}`
    : status.difference.toString();

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/assignment/teacher/${status.teacher.id}`)}
      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800 dark:text-white">
          {status.teacher.name}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {getTeacherRoleLabel(status.teacher)}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-semibold text-slate-800 dark:text-white">
          {status.totalHours}
        </span>
        <span className="text-slate-500 dark:text-slate-400 text-sm"> / {status.standardHours}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
          {config.icon}
          {diffText}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
          {config.label}
        </span>
      </td>
    </motion.tr>
  );
}

// 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="glass-card p-12 text-center">
      <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
        등록된 교사가 없습니다
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        먼저 교사 정보를 등록하고 시수를 배정해주세요
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/data/teachers"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                   bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          교사 등록하기
        </Link>
        <Link
          to="/settings/general"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                   border border-slate-300 dark:border-slate-600
                   text-slate-700 dark:text-slate-300
                   hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
          학교 설정
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { teachers, assignments } = useTeacherStore();
  const { settings, schoolInfo } = useSchoolStore();

  // 대시보드 통계 계산
  const stats = calculateDashboardStats(teachers, assignments, settings);

  // 교사가 없는 경우 빈 상태 표시
  if (teachers.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            대시보드
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            교사 시수 배정 현황을 한눈에 확인하세요
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  // 시수 조정이 필요한 교사 수
  const needsAdjustment = stats.underHoursCount + stats.overHoursCount;

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            대시보드
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {schoolInfo.schoolName || '학교'} {schoolInfo.year}학년도 시수 현황
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>기준시수:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            담임 {settings.담임기준시수}시간
          </span>
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            전담 {settings.전담기준시수}시간
          </span>
        </div>
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="담임교사"
          value={`${stats.homeroomCount}명`}
          subtitle={`평균 ${stats.homeroomAvgHours}시간`}
          icon={<UserCheck className="w-5 h-5" />}
          color="blue"
          to="/data/teachers"
        />
        <StatCard
          title="전담교사"
          value={`${stats.specialistCount}명`}
          subtitle={`평균 ${stats.specialistAvgHours}시간`}
          icon={<Users className="w-5 h-5" />}
          color="green"
          to="/data/teachers"
        />
        <StatCard
          title="시수 조정 필요"
          value={`${needsAdjustment}명`}
          subtitle={needsAdjustment > 0 ? '클릭하여 확인' : '모두 정상'}
          icon={<AlertCircle className="w-5 h-5" />}
          color={needsAdjustment > 0 ? 'orange' : 'green'}
          to="/assignment/simulator"
        />
        <StatCard
          title="학교 총 시수"
          value={`${stats.totalSchoolHours}시간`}
          subtitle="주당"
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 교사별 시수 현황 테이블 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              교사별 시수 현황
            </h2>
            <Link
              to="/assignment/simulator"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              전체 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      교사
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      시수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      차이
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {stats.teacherStatuses.slice(0, 8).map((status, index) => (
                    <TeacherStatusRow key={status.teacher.id} status={status} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
            {stats.teacherStatuses.length > 8 && (
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-center">
                <Link
                  to="/assignment/simulator"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  +{stats.teacherStatuses.length - 8}명 더 보기
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 빠른 실행 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            빠른 실행
          </h2>
          <div className="space-y-3">
            <QuickAction
              title="교사 관리"
              description="교사 추가, 수정, 삭제"
              icon={<UserPlus className="w-5 h-5" />}
              to="/data/teachers"
            />
            <QuickAction
              title="시수 시뮬레이터"
              description="시수 배정 및 조정"
              icon={<Calculator className="w-5 h-5" />}
              to="/assignment/simulator"
            />
            <QuickAction
              title="학교 설정"
              description="기준 시수 및 학교 정보"
              icon={<Settings className="w-5 h-5" />}
              to="/settings/general"
            />
          </div>

          {/* 시수 요약 */}
          {(stats.totalUnderHours > 0 || stats.totalOverHours > 0) && (
            <div className="glass-card p-4 mt-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                시수 조정 요약
              </h3>
              <div className="space-y-2">
                {stats.totalUnderHours > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">총 부족 시수</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      -{stats.totalUnderHours}시간
                    </span>
                  </div>
                )}
                {stats.totalOverHours > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">총 초과 시수</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      +{stats.totalOverHours}시간
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
