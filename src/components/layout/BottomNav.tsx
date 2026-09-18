import React from 'react';
import {
  Home,
  CheckSquare,
  Camera,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks, attachments, currentUser, unreadNotificationCount } = useApp();

  // Count my pending tasks
  const myPendingTasksCount = tasks.filter(
    (t) =>
      t.status !== 'done' &&
      t.assignees.some((a) => a.userId === currentUser.id && !a.isCompleted)
  ).length;

  const totalPhotosCount = attachments.filter((a) => a.fileType === 'image').length;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'home',
      label: '홈',
      icon: <Home className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
    },
    {
      id: 'events',
      label: '행사',
      icon: <CheckSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
    },
    {
      id: 'photos',
      label: '1분 사진첩',
      icon: <Camera className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
      badge: totalPhotosCount > 0 ? totalPhotosCount : undefined,
    },
    {
      id: 'schedule',
      label: '일정',
      icon: <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
    },
    {
      id: 'my_tasks',
      label: '내 업무',
      icon: <User className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
      badge: myPendingTasksCount > 0 ? myPendingTasksCount : undefined,
    },
    {
      id: 'more',
      label: '더보기',
      icon: <MoreHorizontal className="h-4.5 w-4.5 sm:h-5 sm:w-5" />,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around px-1 py-1 sm:max-w-xl sm:px-2 sm:py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 transition ${
                isActive
                  ? 'text-emerald-700 font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className={`absolute -top-1 -right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-xs ${
                    tab.id === 'photos' ? 'bg-emerald-600' : 'bg-rose-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] sm:text-[11px] tracking-tight whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-emerald-700" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
