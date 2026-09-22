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
  LogOut,
  Home,
  Users,
  Shield,
  Phone,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DeviceSkin, User } from '../../types';
import { ConnectedUsersModal } from '../common/ConnectedUsersModal';

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
    setActiveTab,
    eventActivities,
  } = useApp();

  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isConnectedUsersModalOpen, setIsConnectedUsersModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md relative">
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

          {/* 실시간 동시 접속 인원 버튼 (누르면 누가 접속했는지 팝업 오픈) */}
          <button
            type="button"
            onClick={() => {
              setIsConnectedUsersModalOpen(!isConnectedUsersModalOpen);
              setIsNotifOpen(false);
              setIsUserMenuOpen(false);
              setIsEventMenuOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 px-2 sm:px-2.5 py-1.5 text-xs font-bold transition shadow-2xs active:scale-95"
            title="현장 동시 접속 팀원 현황 (실시간 팝업)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Users className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">동시 접속</span>
            <span className="font-extrabold text-emerald-900">{users.length}명</span>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsConnectedUsersModalOpen(false);
              setIsUserMenuOpen(false);
              setIsEventMenuOpen(false);
            }}
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

          {/* 현장업무 로그인 버튼 (미로그인 시 '로그인', 로그인 시 현재 로그인한 성명 표기) */}
          <button
            type="button"
            onClick={onOpenLogin}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95 ${
              isLoggedIn
                ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                : 'bg-emerald-700 text-white hover:bg-emerald-600 ring-2 ring-emerald-400/40'
            }`}
            title={isLoggedIn ? `현장 업무 로그인: ${currentUser.name}` : '현장 업무 로그인'}
          >
            {isLoggedIn ? (
              <UserCheck className="h-3.5 w-3.5 text-emerald-200" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            <span className="max-w-[80px] sm:max-w-[120px] truncate">
              {isLoggedIn ? currentUser.name : '로그인'}
            </span>
          </button>

          {/* 접속자 정보 (계정 전환 불가, 로그인한 본인 접속자만 표기) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 pl-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              title="로그인 접속자 정보"
            >
              <div className="flex flex-col text-right hidden sm:flex leading-tight pr-0.5">
                <span className="text-[9px] text-emerald-700 font-extrabold">
                  {currentUser.role === 'admin' ? '총괄관리자' : currentUser.role === 'leader' ? '팀장' : '팀원'}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {isLoggedIn ? currentUser.name : '게스트'}
                </span>
              </div>
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs shadow-xs ${
                  isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
                }`}
              >
                {isLoggedIn ? currentUser.name[0] : '?'}
              </div>
            </button>

            {/* User info popover (계정 전환 기능 제거, 본인 접속자 정보 및 로그아웃 전용) */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold text-base shadow-xs ${
                        isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
                      }`}
                    >
                      {isLoggedIn ? currentUser.name[0] : '?'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 truncate">
                          {isLoggedIn ? currentUser.name : '게스트'}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 shrink-0">
                          {currentUser.role === 'admin' ? '총괄관리자' : currentUser.role === 'leader' ? '팀장' : '팀원'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {currentUser.department}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {currentUser.phone}
                      </p>
                    </div>
                  </div>

                  {/* Security Notice: No account switching */}
                  <div className="my-2.5 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100 leading-relaxed">
                    <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      로그인 접속자 고정 안내
                    </span>
                    현재 접속자({currentUser.name})만 표기되며, 보안을 위해 상단에서의 임의 계정 전환은 제한됩니다.
                  </div>

                  {/* Button to open concurrent connections modal */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsConnectedUsersModalOpen(true);
                    }}
                    className="w-full mb-2 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 py-2 text-xs font-bold transition border border-emerald-200/70"
                  >
                    <Users className="h-3.5 w-3.5 text-emerald-700" />
                    <span>동시 접속 인원 및 명단 확인 ({users.length}명)</span>
                  </button>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('home');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 text-xs font-semibold transition"
                    >
                      <Home className="h-3.5 w-3.5" />
                      <span>홈으로 이동</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-1.5 text-xs font-bold transition"
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-600" />
                      <span>총괄관리자(1인) 및 팀원 지정</span>
                    </button>
                    {isLoggedIn ? (
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenLogin();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-600 py-1.5 text-xs font-bold transition"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>로그인</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Center Popover (화면 중앙 정렬: 안드로이드 및 모바일 화면 잘림 방지) */}
      {isNotifOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs"
            onClick={() => setIsNotifOpen(false)}
          />
          <div
            id="notification-center-popup"
            className="absolute left-1/2 -translate-x-1/2 top-14 z-50 w-[calc(100%-24px)] max-w-sm rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">현장 알림 센터</span>
                {unreadNotificationCount > 0 && (
                  <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                    미열람 {unreadNotificationCount}건
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">수신된 알림이 없습니다.</p>
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

      {/* 실시간 동시 접속 인원 및 명단 모달 (Android/iOS/PC 최적화 중앙 팝업) */}
      <ConnectedUsersModal
        isOpen={isConnectedUsersModalOpen}
        onClose={() => setIsConnectedUsersModalOpen(false)}
        currentUser={currentUser}
        users={users}
        eventActivities={eventActivities}
      />
    </header>
  );
};
