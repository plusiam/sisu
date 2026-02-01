import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';

export default function SyncStatusIndicator() {
  const { syncStatus } = useTeacherStore();

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  const statusConfig = {
    synced: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      label: '동기화됨',
    },
    pending: {
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      label: '동기화 중',
    },
    error: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      label: '동기화 실패',
    },
    never: {
      icon: AlertCircle,
      color: 'text-slate-500 dark:text-slate-400',
      bgColor: 'bg-slate-50 dark:bg-slate-900/20',
      label: '미동기화',
    },
  };

  const config = statusConfig[syncStatus.status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        {syncStatus.status === 'synced' && syncStatus.lastSyncTime && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatTime(syncStatus.lastSyncTime)}
          </span>
        )}
        {syncStatus.status === 'pending' && syncStatus.pendingChanges > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            변경사항 {syncStatus.pendingChanges}개
          </span>
        )}
        {syncStatus.status === 'error' && syncStatus.errorMessage && (
          <span className="text-xs text-red-500 dark:text-red-400">
            {syncStatus.errorMessage}
          </span>
        )}
      </div>
    </div>
  );
}
