import { useState, useEffect } from 'react';
import { Moon, Sun, User, School } from 'lucide-react';
import { motion } from 'framer-motion';
import Navigation from './Navigation';
import { menuItems } from '../../lib/menuConfig';

export default function Header() {
  const [isDark, setIsDark] = useState(false);

  // 다크모드 토글
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 시스템 다크모드 감지
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeMediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    return () => darkModeMediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                시수배정
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                전담교사 시간표 관리
              </p>
            </div>
          </div>

          {/* 메인 네비게이션 */}
          <Navigation items={menuItems} />

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center gap-2">
            {/* 다크모드 토글 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="테마 변경"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>

            {/* 사용자 메뉴 */}
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium hidden sm:block">관리자</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
