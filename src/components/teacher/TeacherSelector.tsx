import { useTeacherStore } from '../../stores/teacherStore';

interface TeacherSelectorProps {
  value: string | null;
  onChange: (teacherId: string | null) => void;
  className?: string;
}

export default function TeacherSelector({ value, onChange, className = '' }: TeacherSelectorProps) {
  const { teachers } = useTeacherStore();

  const getTeacherLabel = (teacher: typeof teachers[0]) => {
    const parts = [teacher.name];

    if (teacher.type === 'homeroom') {
      if (teacher.grade && teacher.classNumber) {
        parts.push(`${teacher.grade}-${teacher.classNumber}`);
      } else {
        parts.push('담임');
      }
    } else {
      if (teacher.subjects && teacher.subjects.length > 0) {
        parts.push(`전담 ${teacher.subjects.join(', ')}`);
      } else {
        parts.push('전담');
      }
    }

    return parts.join(' - ');
  };

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
          {getTeacherLabel(teacher)}
        </option>
      ))}
    </select>
  );
}
