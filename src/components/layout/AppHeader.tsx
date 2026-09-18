import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Smartphone,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  UserCheck,
  Plus,
  LogIn,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeviceSkin, User } from '../../types';

interface AppHeaderProps {
  onOpenNewEvent: () => void;
  onOpenLogin: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenNewEvent, onOpenLogin }) => {
  const {
    currentEvent,
    events,
    setCurrentEventId,
    currentUser,
    users,
    setCurrentUser,
    isLoggedIn,
    login,
    logout,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deviceSkin,
    setDeviceSkin,
  } = useApp();

  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4">
        {/* Left: Event Switcher Dropdown */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100/90 px-2.5 py-1.5 text-left text-xs font-bold text-slate-900 hover:bg-slate-200/70 transition"
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-tight">
                행사 체크
              </span>
              <span className="max-w-[140px] sm:max-w-[200px] truncate font-bold text-slate-800">
                {currentEvent ? currentEvent.title : '행사 선택'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          </button>

          {/* Event Dropdown Menu */}
          {isEventMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsEventMenuOpen(false)}
              />
              <div className="absolute top-12 left-0 z-50 w-64 rounded-2xl bg-white p-2 shadow-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 px-2 py-1 block">
                  진행 중인 행사 목록
                </span>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setCurrentEventId(evt.id);
                        setIsEventMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                        evt.id === currentEvent?.id
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <span className="block truncate font-semibold">{evt.title}</span>
                        <span className="text-[10px] text-slate-400">{evt.date} · {evt.location}</span>
                      </div>
                      {evt.id === currentEvent?.id && (
                        <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEventMenuOpen(false);
                      onOpenNewEvent();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white shadow hover:bg-emerald-600 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>새 행사 등록하기</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Actions: Device Preview Switch, Notifications, User Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Device Skin Selector (iOS, Android, Responsive) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-medium text-slate-600 border border-slate-200/60">
            <button
              onClick={() => setDeviceSkin('responsive')}
              className={`rounded-lg px-2 py-1 transition ${
                deviceSkin === 'responsive'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              전체화면
            </button>
            <button
              onClick={() => setDeviceSkin('ios')}
              className={`rounded-lg px-2 py-1 transition ${
                deviceSkin === 'ios'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              iOS
            </button>
            <button
              onClick={() => setDeviceSkin('android')}
              className={`rounded-lg px-2 py-1 transition ${
                deviceSkin === 'android'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Android
            </button>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              title="알림 센터"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {isNotifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotifOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">푸시 알림</span>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-4">알림이 없습니다.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`cursor-pointer rounded-xl p-2.5 text-xs transition border ${
                            n.read
                              ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                              : 'bg-emerald-50/70 border-emerald-200 text-slate-900 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs">{n.title}</span>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={onOpenLogin}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95 ${
              isLoggedIn
                ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                : 'bg-emerald-700 text-white hover:bg-emerald-600 ring-2 ring-emerald-400/40'
            }`}
            title="현장 업무 로그인"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>로그인</span>
          </button>

          {/* User Switcher (For collaborative testing of PRD team roles) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 pl-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              title="사용자 전환 (협업 시뮬레이션)"
            >
              <span className="hidden sm:inline">
                {isLoggedIn ? currentUser.name : '게스트'}
              </span>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs ${
                  isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
                }`}
              >
                {isLoggedIn ? currentUser.name[0] : '?'}
              </div>
            </button>

            {/* User switch menu */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200">
                  <div className="px-2 py-1.5 mb-1 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      팀원 계정 전환 (현장 동시 체크)
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {isLoggedIn
                        ? `현재 접속: ${currentUser.name} (${currentUser.department})`
                        : '현재 상태: 미로그인 (게스트)'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          login(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2 py-1.5 text-left text-xs transition ${
                          isLoggedIn && u.id === currentUser.id
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md text-white text-[11px] font-bold ${u.avatarColor}`}
                          >
                            {u.name[0]}
                          </div>
                          <div>
                            <span className="block font-medium">{u.name}</span>
                            <span className="text-[10px] text-slate-400">{u.department}</span>
                          </div>
                        </div>
                        {isLoggedIn && u.id === currentUser.id && (
                          <UserCheck className="h-4 w-4 text-emerald-700" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>로그인 화면 열기</span>
                    </button>
                    {isLoggedIn && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 py-1.5 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>로그아웃</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
