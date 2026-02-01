import { useTeacherStore } from '../../stores/teacherStore';
import { getTeacherFullLabel } from '../../lib/teacherUtils';

interface TeacherSelectorProps {
  value: string | null;
  onChange: (teacherId: string | null) => void;
  className?: string;
}

export default function TeacherSelector({ value, onChange, className = '' }: TeacherSelectorProps) {
  const { teachers } = useTeacherStore();

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                 bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
    >
      <option value="">전체</option>
      {teachers.map(teacher => (
        <option key={teacher.id} value={teacher.id}>
          {getTeacherFullLabel(teacher)}
        </option>
      ))}
    </select>
  );
}
