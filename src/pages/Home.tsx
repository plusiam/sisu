import { motion } from 'framer-motion';
import {
  BarChart3,
  Users,
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';

// 상태 카드 컴포넌트
interface StatusCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  progress?: number;
}

function StatusCard({ title, value, subtitle, icon, color, progress }: StatusCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
          {subtitle}
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">
        {value}
      </p>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
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
        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer"
      >
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
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

// 알림 아이템 컴포넌트
interface AlertItemProps {
  type: 'warning' | 'info' | 'success';
  message: string;
  time: string;
}

function AlertItem({ type, message, time }: AlertItemProps) {
  const typeClasses = {
    warning: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  };

  const icons = {
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Clock className="w-4 h-4" />,
    success: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${typeClasses[type]}`}>
      {icons[type]}
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        <span className="text-xs opacity-70">{time}</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          대시보드
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          전담교사 시수 배정 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="배정 진행률"
          value="85%"
          subtitle="이번 학기"
          icon={<BarChart3 className="w-5 h-5" />}
          color="blue"
          progress={85}
        />
        <StatusCard
          title="배정 완료"
          value="12/14명"
          subtitle="전담교사"
          icon={<Users className="w-5 h-5" />}
          color="green"
          progress={85}
        />
        <StatusCard
          title="충돌 알림"
          value="2건"
          subtitle="해결 필요"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        />
        <StatusCard
          title="총 수업시수"
          value="280시간"
          subtitle="주당"
          icon={<Calendar className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* 메인 콘텐츠 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 빠른 실행 */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            🚀 빠른 실행
          </h2>
          <div className="space-y-3">
            <QuickAction
              title="자동 배정 실행"
              description="AI가 최적의 시간표를 만들어요"
              icon={<Zap className="w-5 h-5" />}
              to="/assignment/auto"
            />
            <QuickAction
              title="충돌 검사"
              description="배정 오류를 찾아 해결해요"
              icon={<AlertTriangle className="w-5 h-5" />}
              to="/assignment/conflict"
            />
            <QuickAction
              title="결과 내보내기"
              description="엑셀, PDF로 저장해요"
              icon={<BarChart3 className="w-5 h-5" />}
              to="/results/export"
            />
          </div>
        </div>

        {/* 알림 */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            📋 알림
          </h2>
          <div className="glass-card p-6 space-y-3">
            <AlertItem
              type="warning"
              message="3학년 체육 장소 미배정 (2건)"
              time="방금 전"
            />
            <AlertItem
              type="warning"
              message="김○○ 선생님 시수 부족 (1시간)"
              time="10분 전"
            />
            <AlertItem
              type="info"
              message="음악실 월요일 3교시 중복 예약"
              time="1시간 전"
            />
            <AlertItem
              type="success"
              message="4학년 영어 배정 완료"
              time="오늘 09:15"
            />
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          📈 최근 활동
        </h2>
        <div className="space-y-4">
          {[
            { action: '수동조정 저장', detail: '3-1반 영어 시간 변경', time: '10:30' },
            { action: '자동배정 실행', detail: '5학년 전체 교과', time: '09:15' },
            { action: '데이터 수정', detail: '교사 정보 업데이트', time: '어제' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <div>
                <span className="font-medium text-slate-800 dark:text-white">
                  {item.action}
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">
                  - {item.detail}
                </span>
              </div>
              <span className="text-sm text-slate-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
