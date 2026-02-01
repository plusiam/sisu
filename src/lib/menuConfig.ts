import type { MenuItem } from '../types/menu';

export const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    path: '/',
  },
  {
    id: 'data',
    label: '데이터',
    children: [
      { id: 'school', label: '학교정보', path: '/data/school' },
      { id: 'subjects', label: '교과정보', path: '/data/subjects' },
      { id: 'teachers', label: '교사정보', path: '/data/teachers' },
      { id: 'rooms', label: '장소정보', path: '/data/rooms' },
      { id: 'divider1', label: '---', path: '' },
      { id: 'import', label: '가져오기/내보내기', path: '/data/import-export' },
    ],
  },
  {
    id: 'timetable',
    label: '시간표',
    children: [
      { id: 'class-timetable', label: '학급 시간표', path: '/timetable/class' },
      { id: 'jeondam-slots', label: '전담교시 설정', path: '/timetable/slots' },
      { id: 'template', label: '시간표 템플릿', path: '/timetable/template' },
    ],
  },
  {
    id: 'assignment',
    label: '배정',
    children: [
      { id: 'auto', label: '자동 배정', path: '/assignment/auto' },
      { id: 'manual', label: '수동 조정', path: '/assignment/manual' },
      { id: 'conflict', label: '충돌 검사', path: '/assignment/conflict' },
      { id: 'simulator', label: '시수 시뮬레이터', path: '/assignment/simulator' },
    ],
  },
  {
    id: 'results',
    label: '결과',
    children: [
      { id: 'teacher-view', label: '교사별 시간표', path: '/results/teacher' },
      { id: 'class-view', label: '학급별 시간표', path: '/results/class' },
      { id: 'room-view', label: '장소별 현황', path: '/results/room' },
      { id: 'stats', label: '통계 대시보드', path: '/results/stats' },
      { id: 'divider2', label: '---', path: '' },
      { id: 'export', label: '인쇄/내보내기', path: '/results/export' },
    ],
  },
  {
    id: 'settings',
    label: '설정',
    children: [
      { id: 'general', label: '기본 설정', path: '/settings/general' },
      { id: 'rules', label: '시수 규칙', path: '/settings/rules' },
      { id: 'theme', label: '테마', path: '/settings/theme' },
      { id: 'divider3', label: '---', path: '' },
      { id: 'help', label: '도움말', path: '/settings/help' },
    ],
  },
];
