import React, { useState } from 'react';
import {
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  FileText,
  Users,
  Smartphone,
  Info,
  ChevronRight,
  ExternalLink,
  X,
  Sparkles,
  Lock,
  Headphones
} from 'lucide-react';

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
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'manual' | null>(null);

  return (
    <>
      <footer className="mt-8 border-t border-emerald-950/10 bg-slate-900 text-slate-400 text-xs pb-24 sm:pb-20">
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
                  className="rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-emerald-600/50 shadow-xs"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>로그인 (카카오·네이버·구글)</span>
                </button>
              )}
              {onOpenInvite && (
                <button
                  type="button"
                  onClick={onOpenInvite}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-slate-700"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  <span>팀원 초대</span>
                </button>
              )}
              {onOpenNewEvent && (
                <button
                  type="button"
                  onClick={onOpenNewEvent}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 transition text-[11px] flex items-center gap-1.5 border border-slate-700"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>새 행사 등록</span>
                </button>
              )}
            </div>
          </div>

          {/* 3-Column Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-[11px] leading-relaxed">
            {/* Col 1: 현장 긴급 지원 센터 */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-200 block text-xs flex items-center gap-1.5">
                <Headphones className="h-4 w-4 text-emerald-400" />
                현장 긴급 지원센터
              </span>
              <p className="text-slate-400">
                행사 당일 긴급 오류나 현장 네트워크 문의 시 전담 헬프데스크가 즉시 지원합니다.
              </p>
              <div className="space-y-1 pt-1 font-mono">
                <div className="flex items-center gap-1.5 text-white font-bold">
                  <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>1588-3829 (내선 1번: 행사지원)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>help@eventcheck.kr</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400/90 block">
                운영 시간: 평일 09:00~18:00 / 행사 당일 07:00~22:00
              </span>
            </div>

            {/* Col 2: 바로가기 및 고객안내 */}
            <div className="space-y-2">
              <span className="font-extrabold text-slate-200 block text-xs flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                고객 지원 및 정책
              </span>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicy('manual')}
                    className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1 text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                    <span>행사 현장 1분 액션 가이드</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicy('terms')}
                    className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1 text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                    <span>서비스 이용약관</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActivePolicy('privacy')}
                    className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1 text-left"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                    <span className="font-bold text-slate-200">개인정보처리방침 (현장자료 취급)</span>
                  </button>
                </li>
                <li>
                  <a
                    href="#manual"
                    onClick={(e) => {
                      e.preventDefault();
                      setActivePolicy('manual');
                    }}
                    className="text-slate-300 hover:text-emerald-400 transition flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                    <span>오프라인 환경 저장 및 동기화 원리</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: 플랫폼 및 보안 사양 */}
            <div className="space-y-2">
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

          {/* Business Entity Info & Copyright */}
          <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 space-y-1.5 leading-normal">
            <p>
              (주)행사체크 시스템즈 | 대표이사: 김철수 | 사업자등록번호: 312-85-12345 | 통신판매업신고: 제2026-충남아산-0412호
            </p>
            <p>
              본사 주소: 충청남도 아산시 온양온천로 100 아산스마트행사지원센터 302호 | 개인정보보호책임자: 이영희 (privacy@eventcheck.kr)
            </p>
            <p className="text-slate-600">
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
      </footer>

      {/* Policy / Terms Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-700" />
                <h3 className="font-black text-sm text-slate-900">
                  {activePolicy === 'terms'
                    ? '행사 체크 서비스 이용약관'
                    : activePolicy === 'privacy'
                    ? '개인정보 및 현장 증빙자료 처리방침'
                    : '현장 1분 액션 가이드 & 매뉴얼'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-600 leading-relaxed pr-1">
              {activePolicy === 'terms' && (
                <>
                  <p className="font-bold text-slate-800">제1조 (목적)</p>
                  <p>
                    본 약관은 (주)행사체크 시스템즈(이하 "회사")가 제공하는 "행사 체크" 어플리케이션 및 제반 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                  <p className="font-bold text-slate-800">제2조 (행사 자료의 소유권 및 보관)</p>
                  <p>
                    1. 회원이 행사 업무 수행 중 등록한 사진, 문서, 작업 로그, 결과보고서 등 모든 현장 증빙자료의 저작권 및 소유권은 해당 행사를 주최한 팀 및 회원에게 귀속됩니다.
                  </p>
                  <p>
                    2. 회사는 회원의 요청이 있거나 행사 종료 후 지정된 보존 기간(기본 3년) 동안 클라우드 상에 안전하게 암호화 보관합니다.
                  </p>
                  <p className="font-bold text-slate-800">제3조 (오프라인 현장 지원)</p>
                  <p>
                    행사장 전파 장애나 지하 시설 등으로 일시적 통신 단절 시에도 로컬 임시 저장을 지원하며, 네트워크 재연결 시 자동으로 중앙 동기화됩니다.
                  </p>
                </>
              )}

              {activePolicy === 'privacy' && (
                <>
                  <p className="font-bold text-slate-800">1. 수집하는 개인정보 항목</p>
                  <p>
                    • 필수항목: 이름, 소속 부서, 연락처(휴대폰 번호), 직책 및 권한(관리자/팀장/팀원)<br />
                    • 행사 업무 기록: 담당 업무명, 체크 일시, 현장 증빙 사진(위치 메타데이터 포함 가능), 첨부 문서
                  </p>
                  <p className="font-bold text-slate-800">2. 개인정보 및 현장 자료의 이용 목적</p>
                  <p>
                    행사 공동 업무 분담 및 실시간 진척도 확인, 현장 증빙 자료 보관, 행사 결과보고서 자동 생성(AI 보조) 및 사후 감사 자료 증빙 목적으로만 이용됩니다.
                  </p>
                  <p className="font-bold text-slate-800">3. 제3자 제공 및 위탁</p>
                  <p>
                    회원의 동의 없이 외부 기관에 개인정보를 제공하지 않으며, AI 초안 생성 기능 시 개인 식별 정보는 마스킹 처리되어 안전하게 전송됩니다.
                  </p>
                </>
              )}

              {activePolicy === 'manual' && (
                <>
                  <p className="font-bold text-slate-800">⚡ 1분 현장 완결 워크플로우</p>
                  <p>
                    1. <strong>업무 확인</strong>: 홈 화면이나 '내 업무' 탭에서 나에게 배정된 당일 마감 업무를 터치합니다.<br />
                    2. <strong>카메라 즉시 촬영</strong>: [사진 촬영] 버튼을 눌러 현장 상황(현수막 부착, 전기 점검 등)을 즉시 셔터로 담습니다.<br />
                    3. <strong>한 줄 메모</strong>: "점검 완료, 이상 없음" 등 간단한 수행 결과를 남깁니다.<br />
                    4. <strong>[1분 현장 완료 체크 & 저장]</strong>: 버튼을 한 번만 누르면 업무 완료 상태, 증빙 사진, 작업 로그가 동시에 저장되고 팀원들에게 알림이 전송됩니다.
                  </p>
                  <p className="font-bold text-slate-800">💡 팀원 계정 전환 테스트</p>
                  <p>
                    화면 상단 우측 프로필 아이콘이나 하단 푸터의 [로그인 / 계정 전환]을 누르면 김철수 팀장, 이영희 담당자 등의 계정으로 즉시 전환하여 권한별 기능을 테스트할 수 있습니다.
                  </p>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="rounded-xl bg-slate-900 text-white px-4 py-2 font-bold text-xs hover:bg-slate-800 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
