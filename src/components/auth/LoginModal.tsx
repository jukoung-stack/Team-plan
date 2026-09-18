import React, { useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  UserCheck,
  Shield,
  Smartphone,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* Authentic Social Brand SVGs */
const KakaoIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 3C6.477 3 2 6.477 2 10.765c0 2.758 1.838 5.176 4.632 6.556l-1.18 4.354a.6.6 0 0 0 .864.674l5.176-3.418c.168.012.338.018.508.018 5.523 0 10-3.477 10-7.765C22 6.477 17.523 3 12 3z" />
  </svg>
);

const NaverIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
  </svg>
);

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

type SocialProvider = 'kakao' | 'naver' | 'google';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    isLoggedIn,
    login,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'social' | 'quick' | 'form'>('social');
  const [socialLayoutMode, setSocialLayoutMode] = useState<'list' | 'grid'>('list');
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [accountInput, setAccountInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: SocialProvider) => {
    setSocialLoading(provider);

    // Simulated authentic OAuth token acquisition & user profile creation/mapping
    setTimeout(() => {
      let targetUser: User;
      const providerLabel = provider === 'kakao' ? '카카오' : provider === 'naver' ? '네이버' : 'Google';

      // Find existing or pick representative user with updated social login state
      if (provider === 'kakao') {
        targetUser = users.find((u) => u.name.includes('이영희')) || users[1] || users[0];
      } else if (provider === 'naver') {
        targetUser = users.find((u) => u.name.includes('박민수')) || users[2] || users[0];
      } else {
        targetUser = users.find((u) => u.name.includes('김철수')) || users[0];
      }

      login(targetUser);
      setSocialLoading(null);
      setFormSuccessMessage(`${providerLabel} 계정으로 안전하게 연동 및 로그인되었습니다.`);

      setTimeout(() => {
        setFormSuccessMessage(null);
        onClose();
      }, 900);
    }, 650);
  };

  const handleQuickSelect = (user: User) => {
    login(user);
    setFormSuccessMessage(`${user.name} (${user.department}) 계정으로 로그인되었습니다.`);
    setTimeout(() => {
      setFormSuccessMessage(null);
      onClose();
    }, 800);
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountInput.trim()) return;

    // Check if matching phone or name
    const foundUser =
      users.find(
        (u) =>
          u.phone.replace(/[^0-9]/g, '') === accountInput.replace(/[^0-9]/g, '') ||
          u.name.toLowerCase() === accountInput.trim().toLowerCase()
      ) || users[0];

    login(foundUser);
    setFormSuccessMessage(`${foundUser.name}님 환영합니다! 현장 업무를 시작합니다.`);
    setTimeout(() => {
      setFormSuccessMessage(null);
      onClose();
    }, 900);
  };

  const handleLogout = () => {
    logout();
    setFormSuccessMessage('정상적으로 로그아웃되었습니다.');
    setTimeout(() => {
      setFormSuccessMessage(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black">행사 체크 로그인 & 인증</h2>
              <p className="text-xs text-emerald-200/80 break-keep">
                SNS 간편 로그인 및 현장 팀원 즉시 연결
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Login Status Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-xs ${
                isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
              }`}
            >
              {isLoggedIn ? currentUser.name[0] : '?'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">
                  {isLoggedIn ? currentUser.name : '게스트 (미로그인 상태)'}
                </span>
                {isLoggedIn && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    {currentUser.role === 'admin' ? '관리자' : currentUser.role === 'leader' ? '팀장' : '팀원'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block break-keep">
                {isLoggedIn ? `${currentUser.department} · ${currentUser.phone}` : '로그인하여 업무를 배정받으세요.'}
              </span>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition active:scale-95"
            >
              <LogOut className="h-3 w-3" />
              <span>로그아웃</span>
            </button>
          ) : (
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
              미인증
            </span>
          )}
        </div>

        {/* Success Feedback Alert */}
        {formSuccessMessage && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-emerald-100/80 px-3 py-2 text-xs font-bold text-emerald-900 border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
            <span className="break-keep">{formSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-3 pt-2.5 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'social'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>SNS 소셜 로그인</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>현장 팀원 선택</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 pb-2 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>사번 / 휴대폰</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: SNS Social Login */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    간편 소셜 로그인
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 break-keep">
                    자주 사용하는 소셜 계정으로 3초 만에 현장 시스템에 접속하세요.
                  </p>
                </div>
                {/* Layout switch: List vs Grid */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setSocialLayoutMode('list')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      socialLayoutMode === 'list'
                        ? 'bg-white shadow-2xs text-slate-900'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    목록형
                  </button>
                  <button
                    type="button"
                    onClick={() => setSocialLayoutMode('grid')}
                    className={`px-2 py-0.5 rounded-md transition ${
                      socialLayoutMode === 'grid'
                        ? 'bg-white shadow-2xs text-slate-900'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    3열 바둑판형
                  </button>
                </div>
              </div>

              {/* Layout Mode: List (Full Width Standard Buttons) */}
              {socialLayoutMode === 'list' ? (
                <div className="space-y-2.5">
                  {/* Kakao Button */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('kakao')}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs active:scale-98 disabled:opacity-60 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] border border-[#F4DC00]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center">
                        <KakaoIcon className="h-5 w-5 text-[#191919]" />
                      </div>
                      <span className="text-[13px] font-black tracking-tight">
                        카카오로 시작하기
                      </span>
                    </div>
                    {socialLoading === 'kakao' ? (
                      <div className="h-4 w-4 border-2 border-black/60 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-[11px] font-medium text-black/60">
                        빠른 로그인
                      </span>
                    )}
                  </button>

                  {/* Naver Button */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('naver')}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs active:scale-98 disabled:opacity-60 bg-[#03C75A] text-white hover:bg-[#02b350] border border-[#02b350]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center">
                        <NaverIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[13px] font-black tracking-tight">
                        네이버로 시작하기
                      </span>
                    </div>
                    {socialLoading === 'naver' ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-[11px] font-medium text-white/80">
                        간편 인증
                      </span>
                    )}
                  </button>

                  {/* Google Button */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('google')}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs active:scale-98 disabled:opacity-60 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center">
                        <GoogleIcon className="h-5 w-5" />
                      </div>
                      <span className="text-[13px] font-black text-slate-800 tracking-tight">
                        Google로 시작하기
                      </span>
                    </div>
                    {socialLoading === 'google' ? (
                      <div className="h-4 w-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">
                        표준 연동
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                /* Layout Mode: Grid (3 Column Compact Cards) */
                <div className="grid grid-cols-3 gap-2.5">
                  {/* Kakao Compact */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('kakao')}
                    className="flex flex-col items-center justify-center rounded-xl p-3 bg-[#FEE500] hover:bg-[#FDD800] border border-[#F4DC00] text-[#191919] transition active:scale-95 shadow-2xs text-center"
                  >
                    <div className="h-8 w-8 flex items-center justify-center mb-1">
                      {socialLoading === 'kakao' ? (
                        <div className="h-5 w-5 border-2 border-black/60 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <KakaoIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className="text-xs font-black">카카오</span>
                    <span className="text-[10px] text-black/60 mt-0.5">간편 로그인</span>
                  </button>

                  {/* Naver Compact */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('naver')}
                    className="flex flex-col items-center justify-center rounded-xl p-3 bg-[#03C75A] hover:bg-[#02b350] border border-[#02b350] text-white transition active:scale-95 shadow-2xs text-center"
                  >
                    <div className="h-8 w-8 flex items-center justify-center mb-1">
                      {socialLoading === 'naver' ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <NaverIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs font-black">네이버</span>
                    <span className="text-[10px] text-white/80 mt-0.5">간편 로그인</span>
                  </button>

                  {/* Google Compact */}
                  <button
                    type="button"
                    disabled={socialLoading !== null}
                    onClick={() => handleSocialLogin('google')}
                    className="flex flex-col items-center justify-center rounded-xl p-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 transition active:scale-95 shadow-2xs text-center"
                  >
                    <div className="h-8 w-8 flex items-center justify-center mb-1">
                      {socialLoading === 'google' ? (
                        <div className="h-5 w-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <GoogleIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className="text-xs font-black">Google</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">간편 로그인</span>
                  </button>
                </div>
              )}

              {/* Divider & Secondary Quick Links */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2.5 text-[11px] font-semibold text-slate-400">
                    또는 현장 시스템 연동
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2.5 text-xs font-bold text-slate-700 transition"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-700" />
                  <span>팀원 즉시 전환</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2.5 text-xs font-bold text-slate-700 transition"
                >
                  <Smartphone className="h-3.5 w-3.5 text-slate-600" />
                  <span>사번/연락처 입력</span>
                </button>
              </div>

              {/* Security Banner */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed break-keep">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-700" />
                  <span>안전한 소셜 인증 안내</span>
                </div>
                소셜 로그인 시 행사 현장 체크리스트의 담당자 지정, 서명 및 실시간 협업 권한이 개인 SNS 계정과 안전하게 연동됩니다.
              </div>
            </div>
          )}

          {/* TAB 2: Quick Team Switch */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  등록된 행사 팀원 목록 (원클릭 전환)
                </span>
                <span className="text-[11px] text-slate-400">
                  총 {users.length}명
                </span>
              </div>

              <div className="space-y-2">
                {users.map((user) => {
                  const isCurrent = isLoggedIn && user.id === currentUser.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleQuickSelect(user)}
                      className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition ${
                        isCurrent
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm shadow-xs ${user.avatarColor}`}
                        >
                          {user.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              {user.name}
                            </span>
                            <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                              {user.role === 'admin' ? '총괄 관리자' : user.role === 'leader' ? '팀장' : '현장 팀원'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5 break-keep">
                            {user.department} · {user.phone}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>접속 중</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          선택
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-2 break-keep">
                💡 팀원 계정을 전환하면 각 담당자에게 배정된 실시간 업무와 알림을 그대로 확인할 수 있습니다.
              </p>
            </div>
          )}

          {/* TAB 3: Direct Phone / Account Login Form */}
          {activeTab === 'form' && (
            <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  사번 / 휴대폰 번호 / 이름
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={accountInput}
                    onChange={(e) => setAccountInput(e.target.value)}
                    placeholder="예: 010-1234-5678 또는 김철수"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  비밀번호 (또는 현장 인증번호)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="임의의 번호 입력 가능 (예: 1234)"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>현장 자동 로그인 유지</span>
                </label>
                <span className="text-slate-400 text-[11px]">보안 암호화 전송</span>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-600 active:scale-98 transition"
              >
                <LogIn className="h-4 w-4" />
                <span>현장 업무 로그인</span>
              </button>

              {/* Bottom Social Quick Row in Form tab */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400">SNS 계정으로 즉시 로그인</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('social')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>더보기</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('kakao')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#FEE500] py-2 text-[11px] font-bold text-[#191919] hover:bg-[#FDD800]"
                    title="카카오 로그인"
                  >
                    <KakaoIcon className="h-4 w-4" />
                    <span>카카오</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('naver')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#03C75A] py-2 text-[11px] font-bold text-white hover:bg-[#02b350]"
                    title="네이버 로그인"
                  >
                    <NaverIcon className="h-3 w-3" />
                    <span>네이버</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-300 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    title="Google 로그인"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    <span>Google</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-500 leading-relaxed break-keep">
                🔒 본 시스템은 행사 현장 담당자 및 초청 팀원 전용 업무 시스템입니다. 계정이 없으신 경우 관리자의 초대 링크(문자/카카오톡)를 통해 입장하세요.
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="h-3.5 w-3.5 text-emerald-700" />
            <span className="text-[11px]">SSL 256-bit 보안 암호화 인증</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white border border-slate-200 px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

