import React, { useState } from 'react';
import {
  Users,
  Share2,
  FolderOpen,
  FileText,
  Bell,
  Shield,
  Smartphone,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Check,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MoreViewProps {
  onOpenTeamInvite: () => void;
  onOpenNewEvent: () => void;
  onOpenLogin?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  onOpenTeamInvite,
  onOpenNewEvent,
  onOpenLogin,
}) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    isLoggedIn,
    templates,
    attachments,
    deviceSkin,
    setDeviceSkin,
    resetToSampleData,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'menu' | 'permissions' | 'templates' | 'notifications'>('menu');

  // Push notification toggle states (PRD 18)
  const [notifSettings, setNotifSettings] = useState({
    assigned: true,
    deadline: true,
    delayed: true,
    completed: true,
  });

  const photoCount = attachments.filter((a) => a.fileType === 'image').length;
  const docCount = attachments.filter((a) => a.fileType === 'doc').length;

  return (
    <div className="space-y-4 pb-24 pt-2">
      {/* User Profile Card */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white font-bold text-lg ${
                isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
              }`}
            >
              {isLoggedIn ? currentUser.name[0] : '?'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  {isLoggedIn ? currentUser.name : '게스트 (미로그인)'}
                </h2>
                {isLoggedIn && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {currentUser.role === 'admin' ? '관리자' : currentUser.role === 'leader' ? '팀장' : '팀원'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLoggedIn ? currentUser.department : '로그인하여 업무를 배정받으세요.'}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {isLoggedIn ? currentUser.phone : ''}
              </p>
            </div>
          </div>

          {onOpenLogin && (
            <button
              type="button"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>로그인</span>
            </button>
          )}
        </div>

        {/* Team Account Quick Switch */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 block">
              등록 팀원 목록 (총괄관리자 및 현장팀원)
            </span>
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
              >
                <span>이름/휴대폰 로그인</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setCurrentUser(u)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                  u.id === currentUser.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${u.avatarColor}`} />
                <span>{u.name}</span>
                <span className="text-[10px] text-slate-400">({u.role === 'admin' ? '총괄' : u.role === 'leader' ? '팀장' : '팀원'})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Settings Menu */}
      <div className="rounded-2xl bg-white shadow-xs border border-emerald-900/10 overflow-hidden divide-y divide-slate-100">
        {/* 1. Team Management & Invite (PRD 15) */}
        <div
          onClick={onOpenTeamInvite}
          className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                팀원 관리 및 초대 (PRD 15)
              </span>
              <span className="text-xs text-slate-400">
                초대 코드 발급, 카카오톡/문자 링크 공유
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>

        {/* 2. Materials Vault (PRD 12) */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                자료 보관함 (PRD 12)
              </span>
              <span className="text-xs text-slate-400">
                사진 {photoCount}장 · 문서 {docCount}개 아카이빙
              </span>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {photoCount + docCount}개
          </span>
        </div>

        {/* 3. Event Templates (PRD 19) */}
        <div
          onClick={() => setActiveSection(activeSection === 'templates' ? 'menu' : 'templates')}
          className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                행사 표준 템플릿 (PRD 19)
              </span>
              <span className="text-xs text-slate-400">
                농산물 판촉, 문화축제, 체육대회 3종
              </span>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition ${activeSection === 'templates' ? 'rotate-90' : ''}`} />
        </div>

        {/* 4. Role Permissions Matrix (PRD 23) */}
        <div
          onClick={() => setActiveSection(activeSection === 'permissions' ? 'menu' : 'permissions')}
          className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                권한 기준표 (PRD 23)
              </span>
              <span className="text-xs text-slate-400">
                관리자, 팀장, 팀원 기능별 접근 권한 확인
              </span>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition ${activeSection === 'permissions' ? 'rotate-90' : ''}`} />
        </div>

        {/* 5. Push Notifications Settings (PRD 18) */}
        <div
          onClick={() => setActiveSection(activeSection === 'notifications' ? 'menu' : 'notifications')}
          className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                푸시 알림 설정 (PRD 18)
              </span>
              <span className="text-xs text-slate-400">
                업무 배정, 마감 임박, 지연, 팀원 완료 알림
              </span>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition ${activeSection === 'notifications' ? 'rotate-90' : ''}`} />
        </div>

        {/* 6. Device Theme Frame Preset */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 block">
                지원 플랫폼 UI 모드 (PRD 1, 24)
              </span>
              <span className="text-xs text-slate-400">
                iOS 스타일, Android 스타일, 데스크톱 반응형
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              type="button"
              onClick={() => setDeviceSkin('responsive')}
              className={`rounded-xl border p-2 text-xs font-bold transition ${
                deviceSkin === 'responsive'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              반응형 기본
            </button>
            <button
              type="button"
              onClick={() => setDeviceSkin('ios')}
              className={`rounded-xl border p-2 text-xs font-bold transition ${
                deviceSkin === 'ios'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              iOS 프레임
            </button>
            <button
              type="button"
              onClick={() => setDeviceSkin('android')}
              className={`rounded-xl border p-2 text-xs font-bold transition ${
                deviceSkin === 'android'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Android 프레임
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Sub-Section: PRD 23 권한 기준표 */}
      {activeSection === 'permissions' && (
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10 text-xs">
          <h3 className="font-bold text-sm text-slate-900 mb-2">
            권한 상세 기준표 (PRD 23)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2">기능</th>
                  <th className="py-2 text-center">관리자</th>
                  <th className="py-2 text-center">팀장</th>
                  <th className="py-2 text-center">팀원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {[
                  { fn: '행사 생성', admin: '○', leader: '○', member: '△' },
                  { fn: '행사 수정', admin: '○', leader: '○', member: '△' },
                  { fn: '팀원 초대', admin: '○', leader: '○', member: '×' },
                  { fn: '업무 생성', admin: '○', leader: '○', member: '△' },
                  { fn: '담당자 지정', admin: '○', leader: '○', member: '×' },
                  { fn: '업무 완료', admin: '○', leader: '○', member: '○' },
                  { fn: '작업내용 입력', admin: '○', leader: '○', member: '○' },
                  { fn: '사진 첨부', admin: '○', leader: '○', member: '○' },
                  { fn: '문서 첨부', admin: '○', leader: '○', member: '○' },
                  { fn: '전체 현황 확인', admin: '○', leader: '○', member: '○' },
                  { fn: '행사 삭제', admin: '○', leader: '×', member: '×' },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-2 font-medium">{row.fn}</td>
                    <td className="py-2 text-center font-bold text-emerald-800">{row.admin}</td>
                    <td className="py-2 text-center font-bold text-emerald-600">{row.leader}</td>
                    <td className="py-2 text-center font-bold text-slate-600">{row.member}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded Sub-Section: PRD 19 행사 템플릿 */}
      {activeSection === 'templates' && (
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              행사 표준 템플릿 목록 (PRD 19)
            </h3>
            <button
              type="button"
              onClick={onOpenNewEvent}
              className="text-emerald-700 font-bold hover:underline"
            >
              + 템플릿으로 행사 만들기
            </button>
          </div>

          <div className="space-y-2.5">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-sm">{tmpl.name}</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {tmpl.category}
                  </span>
                </div>
                <p className="text-slate-500 mb-2">{tmpl.description}</p>
                <div className="flex flex-wrap gap-1">
                  {tmpl.tasks.slice(0, 6).map((t, idx) => (
                    <span key={idx} className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600">
                      {t.category}: {t.title}
                    </span>
                  ))}
                  {tmpl.tasks.length > 6 && (
                    <span className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-400">
                      +{tmpl.tasks.length - 6}개
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Sub-Section: PRD 18 푸시 알림 설정 */}
      {activeSection === 'notifications' && (
        <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10 text-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-900">
            푸시 알림 수신 설정 (PRD 18)
          </h3>
          <div className="space-y-3">
            {[
              {
                id: 'assigned',
                title: '업무 배정 알림',
                desc: '📋 새로운 업무가 배정되었을 때 알림을 받습니다.',
              },
              {
                id: 'deadline',
                title: '마감 임박 알림',
                desc: '🔔 마감이 1일 이내로 다가온 업무를 안내합니다.',
              },
              {
                id: 'delayed',
                title: '지연 알림',
                desc: '⚠️ 마감일을 초과한 미완료 업무 발생 시 알립니다.',
              },
              {
                id: 'completed',
                title: '팀원 업무 완료 알림',
                desc: '✓ 같은 행사 팀원이 작업을 완료하고 증빙을 남길 때 수신합니다.',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{item.title}</span>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifSettings[item.id as keyof typeof notifSettings]}
                  onChange={(e) =>
                    setNotifSettings((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Data Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (confirm('샘플 데이터(PRD 예시 기준)로 모든 데이터를 초기화하시겠습니까?')) {
              resetToSampleData();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition py-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>기본 PRD 샘플 데이터로 복원</span>
        </button>
      </div>
    </div>
  );
};
