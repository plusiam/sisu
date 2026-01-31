import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { MenuItem } from '../../types/menu';

interface NavigationProps {
  items: MenuItem[];
}

interface DropdownProps {
  item: MenuItem;
  isActive: boolean;
}

// 드롭다운 메뉴 컴포넌트
function Dropdown({ item, isActive }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 현재 경로가 하위 메뉴에 포함되어 있는지 확인
  const isChildActive = item.children?.some(child =>
    child.path && location.pathname.startsWith(child.path)
  );

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'menu-item flex items-center gap-1',
          (isActive || isChildActive) && 'menu-item-active'
        )}
      >
        {item.label}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="dropdown-menu"
          >
            {item.children?.map((child) => {
              // 구분선 처리
              if (child.label === '---') {
                return (
                  <div
                    key={child.id}
                    className="my-2 border-t border-slate-200 dark:border-slate-700"
                  />
                );
              }

              const isChildItemActive = child.path && location.pathname === child.path;

              return (
                <Link
                  key={child.id}
                  to={child.path || '#'}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'dropdown-item',
                    isChildItemActive && 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 메인 네비게이션 컴포넌트
export default function Navigation({ items }: NavigationProps) {
  const location = useLocation();

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const isActive = item.path === location.pathname;

        // 하위 메뉴가 있는 경우
        if (item.children && item.children.length > 0) {
          return <Dropdown key={item.id} item={item} isActive={isActive} />;
        }

        // 단일 메뉴 아이템
        return (
          <Link
            key={item.id}
            to={item.path || '#'}
            className={cn('menu-item', isActive && 'menu-item-active')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
