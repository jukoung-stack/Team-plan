import React, { useState } from 'react';
import {
  Shield,
  Phone,
  Users,
  UserCheck,
  Sparkles,
  Headphones,
  Edit3,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmergencyCenterModal } from '../common/EmergencyCenterModal';

interface AppFooterProps {
  onOpenInvite?: () => void;
  onOpenLogin?: () => void;
  onOpenNewEvent?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  onOpenInvite,
  onOpenLogin,
  onOpenNewEvent,
}) => {
  const { emergencyCenter, currentUser, isLoggedIn } = useApp();
  const isAdmin = currentUser.role === 'admin';
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalEditMode, setEmergencyModalEditMode] = useState(false);

  return (
    <footer className="mt-8 border-t border-emerald-950/10 bg-slate-900 text-slate-400 text-xs pb-24 sm:pb-20 break-keep">
      {/* Top Feature Highlights Bar */}
      <div className="bg-emerald-950/80 border-b border-emerald-900/40 px-4 py-3 text-[11px] text-emerald-200">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">행사 체크 현장 클라우드</span>
            <span className="text-emerald-300/80">실시간 동기화 정상 작동 중</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">📱 iOS & Android 스마트폰 최적화</span>
            <span>🔒 SSL 256-bit 데이터 암호화</span>
            <span>⚡ 1분 현장 증빙 완료</span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Brand & Quick Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm">
                ✓
              </div>
              <span className="text-base font-black text-white tracking-tight">
                행사 체크 <span className="text-xs text-emerald-400 font-semibold font-mono">EventCheck</span>
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
              팀원들이 하나의 행사에 공동으로 참여하여 업무를 배정하고, 체크리스트와 현장 사진·문서를 함께 기록하는 전용 업무관리 솔루션
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-emerald-600/50 shadow-xs active:scale-95"
                title={isLoggedIn ? `현장 업무 로그인: ${currentUser.name}` : '현장 업무 로그인'}
              >
                {isLoggedIn ? (
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Users className="h-3.5 w-3.5" />
                )}
                <span>{isLoggedIn ? currentUser.name : '로그인'}</span>
              </button>
            )}
            {onOpenInvite && (
              <button
                type="button"
                onClick={onOpenInvite}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-slate-700 active:scale-95"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>팀원 초대</span>
              </button>
            )}
            {onOpenNewEvent && (
              <button
                type="button"
                onClick={onOpenNewEvent}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-slate-700 active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>새 행사 등록</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[11px] leading-relaxed">
          {/* Col 1: 현장 긴급 지원 센터 (총괄관리자 별도 입력 & 팀원 실시간 공유) */}
          <div className="space-y-2.5 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-200 block text-xs flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-emerald-400" />
                {emergencyCenter.centerName}
              </span>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyModalEditMode(true);
                    setIsEmergencyModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold hover:bg-amber-400/30 transition active:scale-95"
                  title="총괄관리자 긴급지원센터 정보 입력/수정"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>총괄관리자 입력</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEmergencyModalEditMode(false);
                    setIsEmergencyModalOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold hover:bg-emerald-500/20 transition"
                  title="팀원 열람 및 전화 연결"
                >
                  <span>상세 안내</span>
                </button>
              )}
            </div>

            <p className="text-slate-400 leading-relaxed text-[11px]">
              {emergencyCenter.notice}
            </p>

            <div className="pt-0.5 flex flex-wrap items-center justify-between gap-2">
              <a
                href={`tel:${emergencyCenter.phone}`}
                className="inline-flex items-center gap-2 text-white font-black text-sm hover:text-emerald-300 transition font-mono"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Phone className="h-4 w-4 shrink-0" />
                </div>
                <span>{emergencyCenter.phone}</span>
              </a>

              {emergencyCenter.secondaryPhone && (
                <span className="text-[10px] text-slate-400 font-mono">
                  직통: {emergencyCenter.secondaryPhone}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/90 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                <span className="truncate">{emergencyCenter.location}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>운영: {emergencyCenter.operatingHours}</span>
                <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {isAdmin ? '총괄관리자 관리' : '팀원 실시간 공유'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: 플랫폼 및 보안 사양 */}
          <div className="space-y-2 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <span className="font-extrabold text-slate-200 block text-xs flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-400" />
              시스템 사양 및 보안
            </span>
            <div className="space-y-1 text-slate-400">
              <p>• <strong>지원 환경</strong>: iOS 15.0+ Safari / Android 10+ Chrome / PC Web</p>
              <p>• <strong>사진·문서 첨부</strong>: 원본 자동 압축 및 로컬 캐시 보호</p>
              <p>• <strong>AI 어시스턴트</strong>: Google Gemini 2.5 Flash Enterprise 서버 통신</p>
              <p>• <strong>버전 정보</strong>: v2.4.0 (2026.09 현장 안정화 빌드)</p>
            </div>
          </div>
        </div>

        {/* Security Notice & Copyright */}
        <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 space-y-1.5 leading-normal">
          <p className="text-slate-500">
            ※ 본 어플리케이션 내 등록된 모든 행사 현장 사진, 첨부 계획서, 정산 증빙 자료는 암호화되어 보관되며 행사 주최 측의 승인 없이 외부로 반출되지 않습니다.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-slate-500">
            <span>Copyright © 2026 EventCheck Systems Corp. All rights reserved.</span>
            <span className="font-mono text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
              SERVER REGION: asia-northeast1 (Seoul) · UPTIME: 99.98%
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Center Modal (View for team members / Edit for admin) */}
      <EmergencyCenterModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        initialEditMode={emergencyModalEditMode}
      />
    </footer>
  );
};
