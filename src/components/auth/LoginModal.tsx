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
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    isLoggedIn,
    login,
    logout,
    addTeamMember,
    deleteTeamMember,
  } = useApp();

  // Unified login form state
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin registration form state
  const [showAdminAddForm, setShowAdminAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('현장운영팀');
  const [newMemberPhone, setNewMemberPhone] = useState('010-');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('member');
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  // Format phone number as user types
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) {
      setPhoneInput(raw);
    } else if (raw.length <= 7) {
      setPhoneInput(`${raw.slice(0, 3)}-${raw.slice(3)}`);
    } else {
      setPhoneInput(`${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`);
    }
  };

  const handleAdminPhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (raw.length <= 3) {
      setNewMemberPhone(raw);
    } else if (raw.length <= 7) {
      setNewMemberPhone(`${raw.slice(0, 3)}-${raw.slice(3)}`);
    } else {
      setNewMemberPhone(`${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`);
    }
  };

  // 1. Unified login submission with strict name matching & phone verification
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = nameInput.trim();
    const cleanInputPhone = phoneInput.replace(/[^0-9]/g, '');

    if (!trimmedName) {
      setErrorMessage('팀원명(한글 이름)을 입력해주세요.');
      return;
    }

    if (!cleanInputPhone) {
      setErrorMessage('휴대폰 번호를 입력해주세요.');
      return;
    }

    // Match entered name with registered team members (Korean names)
    const matchedUser = users.find(
      (u) => u.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    // If team member name is not identical, DENY ACCESS
    if (!matchedUser) {
      setErrorMessage(
        `접속 불허: 등록된 팀원명 중 '${trimmedName}'을(를) 찾을 수 없습니다. 팀원명과 정확히 동일해야 접속이 허가됩니다. 총괄관리자에게 팀원 등록(한글 이름)을 먼저 요청하세요.`
      );
      return;
    }

    // Verify phone number
    const userPhoneDigits = matchedUser.phone.replace(/[^0-9]/g, '');
    if (cleanInputPhone !== userPhoneDigits) {
      setErrorMessage(
        `휴대폰 번호 불일치: '${matchedUser.name}' 팀원으로 등록된 휴대폰 번호와 일치하지 않습니다.`
      );
      return;
    }

    // Both name and phone match -> GRANT ACCESS
    login(matchedUser);
    setSuccessMessage(
      `접속 허가 완료: [${matchedUser.name}] 팀원 확인 완료! 시스템에 접속합니다.`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 900);
  };

  // Quick select helper
  const handleSelectQuickUser = (u: User) => {
    setNameInput(u.name);
    setPhoneInput(u.phone);
    setErrorMessage(null);
  };

  const handleLogoutClick = () => {
    logout();
    setSuccessMessage('정상적으로 로그아웃되었습니다.');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 1200);
  };

  // 2. Admin direct registration handler
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);

    const res = addTeamMember({
      name: newMemberName,
      department: newMemberDept,
      phone: newMemberPhone,
      role: newMemberRole,
    });

    if (!res.success) {
      setAdminFeedback({ type: 'error', text: res.message });
      return;
    }

    setAdminFeedback({
      type: 'success',
      text: res.message,
    });

    // Autofill into login form for instant convenience
    if (res.user) {
      setNameInput(res.user.name);
      setPhoneInput(res.user.phone);
    }

    setNewMemberName('');
    setNewMemberPhone('010-');
    setTimeout(() => {
      setAdminFeedback(null);
    }, 3000);
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
              <h2 className="text-base font-black">현장 업무 로그인</h2>
              <p className="text-xs text-emerald-200/80 break-keep">
                등록된 팀원(한글 이름)과 휴대폰 번호 단일 접속
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
                  {isLoggedIn ? currentUser.name : '미접속 상태'}
                </span>
                {isLoggedIn && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                    {currentUser.role === 'admin'
                      ? '총괄관리자'
                      : currentUser.role === 'leader'
                      ? '팀장'
                      : '팀원'}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block break-keep">
                {isLoggedIn
                  ? `${currentUser.department} · ${currentUser.phone}`
                  : '팀원명과 휴대폰으로 로그인하세요.'}
              </span>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogoutClick}
              className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition active:scale-95 shadow-2xs"
            >
              <LogOut className="h-3 w-3" />
              <span>로그아웃</span>
            </button>
          ) : (
            <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              로그인 필요
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-3.5 py-2.5 text-xs font-bold text-emerald-900 border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="break-keep">{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 border border-rose-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="break-keep">{errorMessage}</span>
            </div>
          )}

          {/* Unified Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>팀원명 (한글 이름)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  *등록 팀원명과 일치 시 접속허가
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
                onChange={(e) => handlePhoneChange(e.target.value)}
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
              <span>접속 확인 및 로그인</span>
            </button>
          </form>

          {/* Quick Select of Registered Team Members */}
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

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u)}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs transition border ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-100/80 text-emerald-900 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${u.avatarColor}`} />
                    <span>{u.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {u.role === 'admin' ? '(총괄)' : u.role === 'leader' ? '(팀장)' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Team Member Direct Registration Card */}
          <div className="rounded-xl border border-emerald-900/15 bg-emerald-50/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdminAddForm(!showAdminAddForm)}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100/50 transition"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-700" />
                <span>총괄관리자: 신규 팀원 직접 등록 (한글 이름)</span>
              </div>
              {showAdminAddForm ? (
                <ChevronUp className="h-4 w-4 text-emerald-700" />
              ) : (
                <ChevronDown className="h-4 w-4 text-emerald-700" />
              )}
            </button>

            {showAdminAddForm && (
              <div className="p-3.5 pt-1 border-t border-emerald-200/60 bg-white space-y-3">
                <p className="text-[11px] text-slate-600 break-keep">
                  총괄관리자가 팀원명(한글 2~10자)을 직접 등록하면, 해당 팀원은 자신의 한글 이름과 휴대폰 번호로 즉시 로그인 접속이 허가됩니다.
                </p>

                {adminFeedback && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-bold ${
                      adminFeedback.type === 'success'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {adminFeedback.text}
                  </div>
                )}

                <form onSubmit={handleAddMemberSubmit} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        팀원명 (한글 필수)
                      </label>
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-emerald-600 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        권한
                      </label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-emerald-600 outline-hidden bg-white"
                      >
                        <option value="member">팀원</option>
                        <option value="leader">팀장</option>
                        <option value="admin">관리자</option>
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
                        placeholder="예: 현장시설팀 (대리)"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-emerald-600 outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        휴대폰 번호
                      </label>
                      <input
                        type="text"
                        value={newMemberPhone}
                        onChange={(e) => handleAdminPhoneChange(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:border-emerald-600 outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>팀원 등록 및 접속 허가</span>
                  </button>
                </form>

                {/* Team members list with delete capability for custom added members */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    등록된 팀원 현황
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs border border-slate-200/60"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${u.avatarColor}`} />
                          <span className="font-bold text-slate-800">{u.name}</span>
                          <span className="text-[11px] text-slate-500">
                            {u.phone} ({u.department})
                          </span>
                        </div>
                        {u.id !== 'u-admin' && (
                          <button
                            type="button"
                            onClick={() => deleteTeamMember(u.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="팀원 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs">
          <span className="text-[11px] text-slate-500">
            총괄관리자가 등록한 한글 이름과 일치 시 즉시 접속
          </span>
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
