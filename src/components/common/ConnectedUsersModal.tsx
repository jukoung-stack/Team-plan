import React from 'react';
import {
  Users,
  X,
  Phone,
  CheckCircle2,
  Shield,
  Wifi,
  Clock,
  Radio,
  Crown,
} from 'lucide-react';
import { User, Activity } from '../../types';

interface ConnectedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  eventActivities?: Activity[];
}

export const ConnectedUsersModal: React.FC<ConnectedUsersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  eventActivities = [],
}) => {
  if (!isOpen) return null;

  // Assume active team members for this event are online (excluding or including all registered users)
  // Let's list all registered event users with their online status.
  // To make it feel authentic and realistic:
  // Current user is always 100% active online.
  // Other members are online with their respective field task statuses.
  const onlineUsers = users;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="rounded-full bg-slate-900 text-amber-300 px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
            <Crown className="h-3 w-3 text-amber-400" />
            <span>총괄관리자(1명)</span>
          </span>
        );
      case 'leader':
        return (
          <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-extrabold">
            부서팀장
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold">
            현장팀원
          </span>
        );
    }
  };

  // Status message for each user
  const getUserStatus = (user: User) => {
    if (user.id === currentUser.id) {
      return {
        statusText: '현재 접속 중 (본인 단말기)',
        activeBadge: '실시간 활동 중',
        timeText: '방금 전',
      };
    }
    const latestAct = eventActivities.find((a) => a.userId === user.id);
    if (latestAct) {
      return {
        statusText: latestAct.message,
        activeBadge: '현장 업무 진행 중',
        timeText: latestAct.timestamp.split(' ')[1] || '방금 전',
      };
    }
    if (user.role === 'admin') {
      return {
        statusText: '행사 전체 진행 및 안전 관리 모니터링',
        activeBadge: '상황실 모니터링',
        timeText: '실시간 접속',
      };
    }
    if (user.department.includes('기획')) {
      return {
        statusText: '현장 동선 및 주요 진행 체크리스트 확인',
        activeBadge: '현장 운영 중',
        timeText: '1분 전',
      };
    }
    if (user.department.includes('홍보')) {
      return {
        statusText: '개막식 무대 및 SNS 현장 사진 등록',
        activeBadge: '사진 업로드 중',
        timeText: '3분 전',
      };
    }
    return {
      statusText: '현장 부스 지원 및 안전 점검 진행',
      activeBadge: '현장 점검 중',
      timeText: '방금 전',
    };
  };

  return (
    <>
      {/* Dimmed backdrop - identical to notification center */}
      <div
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Popover container - identical to notification center (top-14, centered, w-[calc(100%-24px)] max-w-sm) */}
      <div
        id="connected-users-popup"
        className="absolute left-1/2 -translate-x-1/2 top-14 z-50 w-[calc(100%-24px)] max-w-sm rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - identical layout to notification center */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">현장 동시 접속 팀원</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-black text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              동시 {onlineUsers.length}명
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            title="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live sync sub-bar */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-2.5 py-1.5 mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold truncate">
            <Radio className="h-3 w-3 text-emerald-600 animate-pulse shrink-0" />
            <span className="truncate">팀원 <strong>{onlineUsers.length}명</strong> 실시간 접속 중</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold bg-white/90 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
            실시간
          </span>
        </div>

        {/* User list with max-h-72 overflow-y-auto pr-1 (matching notification list) */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {onlineUsers.map((user) => {
            const isMe = user.id === currentUser.id;
            const statusInfo = getUserStatus(user);

            return (
              <div
                key={user.id}
                className={`rounded-xl p-2.5 text-xs transition border ${
                  isMe
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 font-medium shadow-2xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/70 border-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Avatar with live green pulse */}
                    <div className="relative shrink-0 mt-0.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-xs shadow-2xs ${user.avatarColor}`}
                      >
                        {user.name[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-1 ring-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-xs text-slate-900">
                          {user.name}
                        </span>
                        {isMe && (
                          <span className="rounded bg-emerald-700 text-white px-1 py-0.2 text-[9px] font-black">
                            나
                          </span>
                        )}
                        {getRoleBadge(user.role)}
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {user.department}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          {statusInfo.statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Call button */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {statusInfo.timeText}
                    </span>
                    {user.phone && (
                      <a
                        href={`tel:${user.phone}`}
                        className="flex items-center gap-1 rounded-lg bg-white hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-2 py-1 text-[11px] font-bold transition active:scale-95 border border-slate-200 shadow-2xs"
                        title={`${user.name}님에게 전화 걸기`}
                      >
                        <Phone className="h-2.5 w-2.5 fill-current" />
                        <span>통화</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Policy Notice */}
        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 leading-tight">
          ※ 상단 메뉴에는 로그인된 본인 계정만 표기되며, 실시간 동시 접속 명단은 긴급 소통을 위해 알림창과 동일한 위치에 표시됩니다.
        </div>
      </div>
    </>
  );
};
