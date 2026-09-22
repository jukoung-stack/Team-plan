import React, { useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  UserCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Users,
  Shield,
  UserPlus,
  Crown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'login' | 'assign_admin' | 'add_member';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    isLoggedIn,
    login,
    logout,
    assignAdmin,
    addTeamMember,
    deleteTeamMember,
  } = useApp();

  // Tab State: 'login' | 'assign_admin' | 'add_member'
  const [activeTab, setActiveTab] = useState<ModalTab>('login');

  // Unified Login form state
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Assignment form state (1명 지정)
  const [adminAssignMode, setAdminAssignMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string>('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminDept, setNewAdminDept] = useState('행사총괄운영국');
  const [newAdminPhone, setNewAdminPhone] = useState('010-');
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; text: string; user?: User } | null>(null);

  // Team Member Direct Input form state (팀원 입력)
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('현장운영팀');
  const [newMemberPhone, setNewMemberPhone] = useState('010-');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'leader'>('member');
  const [memberFeedback, setMemberFeedback] = useState<{ type: 'success' | 'error'; text: string; user?: User } | null>(null);

  if (!isOpen) return null;

  // 현재 단독 총괄관리자 (1명 보장)
  const currentAdmin = users.find((u) => u.role === 'admin') || users[0];
  const regularTeamMembers = users.filter((u) => u.role !== 'admin');

  // Format phone number
  const formatPhone = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
  };

  // 1. Login submission with strict name and phone matching
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = nameInput.trim();
    const cleanInputPhone = phoneInput.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      setErrorMessage('성명(한글 이름)을 입력해주세요.');
      return;
    }

    if (!cleanInputPhone) {
      setErrorMessage('휴대폰 번호를 입력해주세요.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (!matchedUser) {
      setErrorMessage(
        `접속 불허: 등록된 명단 중 '${trimmedName}'을(를) 찾을 수 없습니다. 총괄관리자 지정 또는 팀원 입력을 통해 먼저 명단에 등록해주세요.`
      );
      return;
    }

    const userPhoneDigits = matchedUser.phone.replace(/[^0-9]/g, '');
    if (cleanInputPhone !== userPhoneDigits) {
      setErrorMessage(
        `휴대폰 번호 불일치: '${matchedUser.name}' 님으로 등록된 번호(${matchedUser.phone})와 일치하지 않습니다.`
      );
      return;
    }

    // Grant access
    login(matchedUser);
    setSuccessMessage(
      `접속 허가 완료: [${matchedUser.name}] ${matchedUser.role === 'admin' ? '👑 총괄관리자' : '팀원'} 확인 완료! 시스템에 접속합니다.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 900);
  };

  // 2. Assign Admin (총괄관리자 1명 지정)
  const handleAssignAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);

    if (adminAssignMode === 'existing') {
      if (!selectedExistingUserId) {
        setAdminFeedback({ type: 'error', text: '총괄관리자로 지정할 팀원을 선택해주세요.' });
        return;
      }
      const res = assignAdmin({ userId: selectedExistingUserId });
      if (!res.success) {
        setAdminFeedback({ type: 'error', text: res.message });
        return;
      }
      setAdminFeedback({ type: 'success', text: res.message, user: res.admin });
      if (res.admin) {
        setNameInput(res.admin.name);
        setPhoneInput(res.admin.phone);
      }
    } else {
      const res = assignAdmin({
        name: newAdminName,
        phone: newAdminPhone,
        department: newAdminDept,
      });
      if (!res.success) {
        setAdminFeedback({ type: 'error', text: res.message });
        return;
      }
      setAdminFeedback({ type: 'success', text: res.message, user: res.admin });
      if (res.admin) {
        setNameInput(res.admin.name);
        setPhoneInput(res.admin.phone);
      }
      setNewAdminName('');
      setNewAdminPhone('010-');
    }
  };

  // 3. Team Member Input Submit (팀원 입력 및 지정)
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFeedback(null);

    const res = addTeamMember({
      name: newMemberName,
      department: newMemberDept,
      phone: newMemberPhone,
      role: newMemberRole,
    });

    if (!res.success) {
      setMemberFeedback({ type: 'error', text: res.message });
      return;
    }

    setMemberFeedback({
      type: 'success',
      text: res.message,
      user: res.user,
    });

    if (res.user) {
      setNameInput(res.user.name);
      setPhoneInput(res.user.phone);
    }

    setNewMemberName('');
    setNewMemberPhone('010-');
  };

  // Quick select helper
  const handleSelectQuickUser = (u: User) => {
    setNameInput(u.name);
    setPhoneInput(u.phone);
    setErrorMessage(null);
  };

  const handleInstantLogin = (u: User) => {
    login(u);
    setSuccessMessage(`[${u.name}] 님으로 로그인되었습니다.`);
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 700);
  };

  const handleLogoutClick = () => {
    logout();
    setSuccessMessage('정상적으로 로그아웃되었습니다.');
    setTimeout(() => setSuccessMessage(null), 1200);
  };

  const handleDeleteMember = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    const res = deleteTeamMember(user.id);
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => setSuccessMessage(null), 2500);
      if (nameInput.trim() === user.name.trim()) {
        setNameInput('');
        setPhoneInput('');
      }
    } else {
      setErrorMessage(res.message);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300 shadow-inner">
              <Crown className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">현장 업무 로그인 & 인원 지정</h2>
                <span className="rounded-full bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  총괄 1인 원칙
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 break-keep">
                총괄관리자(1명) 지정 후 팀원 입력을 통해 팀원을 지정할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Login Status Strip */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs shrink-0 ${
                isLoggedIn ? currentUser.avatarColor : 'bg-slate-400'
              }`}
            >
              {isLoggedIn ? currentUser.name[0] : '?'}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">
                  {isLoggedIn ? currentUser.name : '미접속 상태 (게스트)'}
                </span>
                {isLoggedIn && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 shrink-0">
                    {currentUser.role === 'admin'
                      ? '👑 총괄관리자'
                      : currentUser.role === 'leader'
                      ? '팀장'
                      : '팀원'}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 truncate block">
                {isLoggedIn
                  ? `${currentUser.department} · ${currentUser.phone}`
                  : '등록된 이름과 휴대폰 번호로 로그인하세요.'}
              </span>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogoutClick}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition active:scale-95 shadow-2xs shrink-0"
            >
              <LogOut className="h-3 w-3" />
              <span>로그아웃</span>
            </button>
          ) : (
            <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
              로그인 필요
            </span>
          )}
        </div>

        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-100/80 p-1 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'login'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LogIn className="h-3.5 w-3.5 text-emerald-700" />
            <span>현장 로그인</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('assign_admin');
              setAdminFeedback(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'assign_admin'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span className="truncate">총괄관리자 지정</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('add_member');
              setMemberFeedback(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
              activeTab === 'add_member'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-600" />
            <span className="truncate">팀원 입력</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Global Alert Messages */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-3.5 py-2.5 text-xs font-bold text-emerald-900 border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="break-keep">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 border border-rose-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="break-keep">{errorMessage}</span>
            </div>
          )}

          {/* ================= TAB 1: 현장 로그인 ================= */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {/* Single Admin Info Highlight Box */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm shadow-xs shrink-0">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                        현재 총괄관리자 (단독 1명)
                      </span>
                    </div>
                    <p className="text-xs font-black text-slate-900 mt-0.5 truncate">
                      {currentAdmin.name}{' '}
                      <span className="text-[11px] font-normal text-slate-600">
                        ({currentAdmin.department} · {currentAdmin.phone})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleInstantLogin(currentAdmin)}
                    className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1.5 text-xs font-bold transition shadow-2xs"
                    title="지정된 총괄관리자 계정으로 즉시 로그인"
                  >
                    총괄 로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assign_admin')}
                    className="rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 px-2 py-1.5 text-xs font-bold transition"
                    title="총괄관리자를 다른 팀원으로 변경 또는 새로 지정"
                  >
                    관리자 변경
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                      <span>성명 (한글 이름)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      *지정된 총괄관리자 또는 입력된 팀원
                    </span>
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="예: 김철수, 총괄관리자 (한글)"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden font-medium placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-700" />
                    <span>휴대폰 번호</span>
                  </label>
                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                    placeholder="예: 010-1234-5678"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden font-medium placeholder:text-slate-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition active:scale-98"
                >
                  <LogIn className="h-4 w-4" />
                  <span>현장 접속 확인 및 로그인</span>
                </button>
              </form>

              {/* Quick Select of All Registered Members */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>등록된 팀원 명단 (클릭 시 자동 입력)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">총 {users.length}명</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => {
                    const isSelected =
                      nameInput.trim() === u.name.trim() &&
                      phoneInput.replace(/[^0-9]/g, '') === u.phone.replace(/[^0-9]/g, '');
                    const isAdmin = u.role === 'admin';

                    return (
                      <div
                        key={u.id}
                        className={`inline-flex items-center rounded-lg border text-xs transition ${
                          isAdmin
                            ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold'
                            : isSelected
                            ? 'border-emerald-600 bg-emerald-100/80 text-emerald-900 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectQuickUser(u)}
                          className="flex items-center gap-1.5 py-1 pl-2 pr-1.5 hover:opacity-85 transition"
                          title="클릭 시 로그인 입력창에 자동 입력"
                        >
                          {isAdmin ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 ${u.avatarColor}`}
                            >
                              {u.name[0]}
                            </span>
                          )}
                          <span>{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {isAdmin ? '(총괄)' : u.role === 'leader' ? '(팀장)' : ''}
                          </span>
                        </button>

                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMember(e, u)}
                            className="mr-1 rounded-md p-0.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                            title={`${u.name} 팀원 삭제`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Workflow shortcut helper banner */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">인원 관리 필요 시:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('assign_admin')}
                      className="text-amber-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>총괄관리자 지정</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('add_member')}
                      className="text-emerald-800 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>팀원 입력</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: 총괄관리자 지정 (1명 단독) ================= */}
          {activeTab === 'assign_admin' && (
            <div className="space-y-4">
              {/* Notice Banner: Exactly 1 Admin */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 text-xs text-amber-900 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span>총괄관리자 1인 지정 원칙 안내</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  행사 운영 시스템의 보안과 책임성을 위해 <strong>총괄관리자는 오직 1명</strong>만 지정할 수 있습니다.
                  새로운 총괄관리자를 지정하면, 기존 총괄관리자는 일반 팀원으로 자동 전환됩니다.
                </p>
              </div>

              {/* Current Active Admin Display */}
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  현재 지정된 총괄관리자
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-amber-400 font-bold text-sm shadow-xs">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">{currentAdmin.name}</span>
                        <span className="rounded bg-amber-100 text-amber-800 font-bold text-[10px] px-1.5 py-0.2">
                          단독 총괄관리자
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {currentAdmin.department} · {currentAdmin.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInstantLogin(currentAdmin)}
                    className="rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 shadow-xs transition"
                  >
                    이 계정으로 로그인
                  </button>
                </div>
              </div>

              {/* Admin feedback banner */}
              {adminFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-bold border flex flex-col gap-2 ${
                    adminFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {adminFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{adminFeedback.text}</span>
                  </div>

                  {adminFeedback.type === 'success' && adminFeedback.user && (
                    <div className="flex gap-2 pt-1 border-t border-emerald-200">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin(adminFeedback.user!)}
                        className="flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>[{adminFeedback.user.name}] 총괄관리자로 로그인</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('add_member')}
                        className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <span>팀원 입력하러 가기</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode Toggle: Existing Member Promotion vs New Member Input */}
              <div className="space-y-3 pt-1">
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAdminAssignMode('existing')}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      adminAssignMode === 'existing'
                        ? 'bg-white text-amber-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    기존 팀원에서 총괄관리자 지정
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminAssignMode('new')}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      adminAssignMode === 'new'
                        ? 'bg-white text-amber-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    새로운 총괄관리자 직접 입력
                  </button>
                </div>

                <form onSubmit={handleAssignAdminSubmit} className="space-y-3">
                  {adminAssignMode === 'existing' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        총괄관리자로 승격할 팀원 선택
                      </label>
                      <select
                        value={selectedExistingUserId}
                        onChange={(e) => setSelectedExistingUserId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs bg-white outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
                        required
                      >
                        <option value="">팀원을 선택하세요...</option>
                        {regularTeamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.department} · {m.phone}) - {m.role === 'leader' ? '팀장' : '팀원'}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        선택한 팀원이 총괄관리자로 임명되며, 이전 관리자는 일반 팀원으로 변경됩니다.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            총괄관리자 성명 (한글 2~10자)
                          </label>
                          <input
                            type="text"
                            value={newAdminName}
                            onChange={(e) => setNewAdminName(e.target.value)}
                            placeholder="예: 홍길동"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 outline-hidden font-medium"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            소속 부서 / 직책
                          </label>
                          <input
                            type="text"
                            value={newAdminDept}
                            onChange={(e) => setNewAdminDept(e.target.value)}
                            placeholder="예: 행사총괄운영국 (국장)"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 outline-hidden font-medium"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          휴대폰 번호 (로그인 접속용)
                        </label>
                        <input
                          type="text"
                          value={newAdminPhone}
                          onChange={(e) => setNewAdminPhone(formatPhone(e.target.value))}
                          placeholder="010-1234-5678"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 outline-hidden font-medium"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Crown className="h-4 w-4" />
                    <span>총괄관리자(1명) 지정 완료</span>
                  </button>
                </form>
              </div>

              {/* Next step prompt */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  총괄관리자가 지정된 후 팀원을 추가하시겠습니까?
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('add_member')}
                  className="rounded-lg bg-slate-900 text-white px-2.5 py-1 text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <span>팀원 입력하기</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 3: 팀원 입력 및 지정 ================= */}
          {activeTab === 'add_member' && (
            <div className="space-y-4">
              {/* Authorized by Admin Banner */}
              <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="font-bold text-blue-950 block">
                      총괄관리자 <strong>[{currentAdmin.name}]</strong> 지정 완료
                    </span>
                    <span className="text-[11px] text-blue-700">
                      총괄관리자의 승인 하에 현장 팀원을 입력하여 명단에 지정합니다.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('assign_admin')}
                  className="text-[11px] font-bold text-blue-800 hover:underline shrink-0"
                >
                  총괄 변경
                </button>
              </div>

              {/* Member Feedback */}
              {memberFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs font-bold border flex flex-col gap-2 ${
                    memberFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {memberFeedback.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{memberFeedback.text}</span>
                  </div>

                  {memberFeedback.type === 'success' && memberFeedback.user && (
                    <div className="flex gap-2 pt-1 border-t border-emerald-200">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin(memberFeedback.user!)}
                        className="flex-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white py-1.5 text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>[{memberFeedback.user.name}] 님으로 즉시 로그인</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Team Member Direct Input Form */}
              <form onSubmit={handleAddMemberSubmit} className="space-y-3 rounded-xl border border-slate-200 p-3.5 bg-white shadow-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5 text-emerald-700" />
                    <span>신규 팀원 정보 입력</span>
                  </span>
                  <span className="text-[10px] text-slate-400">*총괄관리자는 1명이므로 팀원/팀장만 지정 가능</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      팀원명 (한글 필수)
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="예: 김민수"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-600 outline-hidden font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      역할 (직책)
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value as 'member' | 'leader')}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-600 outline-hidden bg-white font-medium"
                    >
                      <option value="member">현장 팀원</option>
                      <option value="leader">분야 팀장</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      소속 부서 / 직책
                    </label>
                    <input
                      type="text"
                      value={newMemberDept}
                      onChange={(e) => setNewMemberDept(e.target.value)}
                      placeholder="예: 현장운영팀 (주임)"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-600 outline-hidden font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      휴대폰 번호 (로그인용)
                    </label>
                    <input
                      type="text"
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(formatPhone(e.target.value))}
                      placeholder="010-0000-0000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-600 outline-hidden font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-600 transition"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>팀원 입력 및 지정 완료</span>
                </button>
              </form>

              {/* Registered Team Members List */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>등록된 현장 팀원 명단 ({regularTeamMembers.length}명)</span>
                  <span className="text-[10px] text-slate-400">총괄관리자 제외 명단</span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {regularTeamMembers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs border border-slate-200/70 hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-bold text-white shrink-0 ${u.avatarColor}`}
                        >
                          {u.name[0]}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 mr-1.5">{u.name}</span>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded font-semibold mr-1.5">
                            {u.role === 'leader' ? '팀장' : '팀원'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {u.department} · {u.phone}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleInstantLogin(u)}
                          className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        >
                          로그인
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteMember(e, u)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title={`${u.name} 팀원 삭제`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 sm:px-5 py-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>총괄관리자 1명 단독 지정 시스템 적용 중</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
