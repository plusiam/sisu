import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Clock, TrendingUp, Calendar, PieChart } from 'lucide-react';
import { calculateStats, validateHours } from '../../lib/simulatorCalculations';
import { useTeacherStore } from '../../stores/teacherStore';
import type { HoursInput } from '../../types/simulator';

export default function TeacherHoursDetail() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { teachers, getAssignment, updateAssignment } = useTeacherStore();

  const teacher = teachers.find(t => t.id === teacherId);
  const assignment = teacher ? getAssignment(teacher.id) : undefined;

  const [input, setInput] = useState<HoursInput>({
    basicTeaching: 0,
    adminWork: 0,
    training: 0,
    consulting: 0,
    other: 0,
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (assignment) {
      setInput(assignment.hours);
      setNotes(assignment.notes || '');
    }
  }, [assignment]);

  const stats = useMemo(() => calculateStats(input), [input]);

  if (!teacher) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">교사를 찾을 수 없습니다</p>
      </div>
    );
  }

  const handleInputChange = (field: keyof HoursInput, value: string) => {
    const numValue = validateHours(Number(value) || 0);
    setInput(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSave = () => {
    updateAssignment(teacher.id, input, notes);
    navigate('/data/teachers');
  };

  const getTeacherLabel = () => {
    if (teacher.type === 'homeroom') {
      if (teacher.grade && teacher.classNumber) {
        return `담임 ${teacher.grade}-${teacher.classNumber}`;
      }
      return '담임';
    } else {
      if (teacher.subjects && teacher.subjects.length > 0) {
        return `전담 ${teacher.subjects.join(', ')}`;
      }
      return '전담';
    }
  };

  const statusColor = {
    safe: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    over: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <button
          onClick={() => navigate('/data/teachers')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400
                   hover:text-slate-800 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {teacher.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {getTeacherLabel()}
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
          주간 시수 입력
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'basicTeaching', label: '기본 수업', color: 'indigo' },
            { key: 'adminWork', label: '행정 업무', color: 'blue' },
            { key: 'training', label: '교사 연수', color: 'purple' },
            { key: 'consulting', label: '교육 컨설팅', color: 'pink' },
            { key: 'other', label: '기타 업무', color: 'slate' },
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {label}
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={input[key as keyof HoursInput]}
                onChange={(e) => handleInputChange(key as keyof HoursInput, e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border-2 border-${color}-200
                          dark:border-${color}-800 bg-white dark:bg-slate-800
                          text-slate-800 dark:text-white font-medium text-lg
                          focus:outline-none focus:ring-2 focus:ring-${color}-500 transition-all`}
              />
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            메모
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600
                     bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="추가 메모를 입력하세요..."
          />
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700
                     text-white font-medium flex items-center justify-center gap-2
                     transition-colors"
          >
            <Save className="w-5 h-5" />
            저장
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              주간 총 시수
            </h3>
          </div>
          <p className={`text-3xl font-bold ${statusColor[stats.compliance.status]}`}>
            {stats.totalHours}시간
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {stats.compliance.message}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              일일 평균
            </h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {stats.dailyAverage}시간
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            주 5일 기준
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              월간 환산
            </h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {stats.monthlyTotal}시간
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            4주 기준
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <PieChart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              법정 기준 대비
            </h3>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">
            {stats.compliance.percentage.toFixed(0)}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            법정 기준 20시간
          </p>
        </motion.div>
      </div>

      {/* Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
          업무 분포
        </h3>
        <div className="space-y-3">
          {[
            { label: '수업', value: stats.distribution.teaching, color: 'bg-indigo-500' },
            { label: '행정', value: stats.distribution.admin, color: 'bg-blue-500' },
            { label: '연수/컨설팅', value: stats.distribution.training, color: 'bg-purple-500' },
            { label: '기타', value: stats.distribution.other, color: 'bg-slate-500' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <span className="font-medium text-slate-800 dark:text-white">{value}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full ${color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
