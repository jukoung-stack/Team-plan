import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Phone,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Check,
  Edit3,
  X,
  Shield,
  Copy,
  Users,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmergencySupportCenter } from '../../types';

interface EmergencyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditMode?: boolean;
}

export const EmergencyCenterModal: React.FC<EmergencyCenterModalProps> = ({
  isOpen,
  onClose,
  initialEditMode = false,
}) => {
  const { emergencyCenter, updateEmergencyCenter, currentUser, setCurrentUser, users } = useApp();
  const isAdmin = currentUser.role === 'admin';

  const [isEditing, setIsEditing] = useState(initialEditMode && isAdmin);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState<EmergencySupportCenter>(emergencyCenter);

  useEffect(() => {
    if (isOpen) {
      setFormData(emergencyCenter);
      setIsEditing(initialEditMode && isAdmin);
      setSaveSuccess(false);
    }
  }, [isOpen, emergencyCenter, initialEditMode, isAdmin]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmergencyCenter(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 1000);
  };

  const handleSwitchToAdmin = () => {
    const adminUser = users.find((u) => u.role === 'admin') || users.find((u) => u.id === 'u-admin');
    if (adminUser) {
      setCurrentUser(adminUser);
      setIsEditing(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-emerald-950/10 animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>현장 긴급 지원센터</span>
                  {isAdmin ? (
                    <span className="rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-400/40">
                      총괄관리자 모드
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/40">
                      팀원 열람 모드
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-emerald-200/80">
                  {isAdmin
                    ? '총괄관리자가 입력한 정보는 모든 팀원에게 즉시 공유됩니다.'
                    : '행사 현장 긴급 연락망 및 상황실 실시간 정보'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              title="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {saveSuccess && (
            <div className="rounded-2xl bg-emerald-50 p-3.5 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2 animate-in fade-in">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 stroke-[3]" />
              <span className="font-bold">
                현장 긴급지원센터 정보가 성공적으로 저장되었으며 팀원에게 공유되었습니다.
              </span>
            </div>
          )}

          {isEditing && isAdmin ? (
            /* Admin Editing Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="rounded-2xl bg-amber-50/80 p-3 text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
                <Shield className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">총괄관리자 전용 입력 필드</span>
                  <span className="text-[11px] text-amber-800">
                    전화번호, 현장 상황실 위치, 운영시간, 긴급 지침을 입력하면 앱 풋터 및 메인 화면을 통해 모든 팀원에게 실시간으로 표출됩니다.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">
                    지원센터 / 상황실 명칭 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.centerName}
                    onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 현장 긴급 지원센터 (본부 종합상황실)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    대표 긴급 전화번호 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 041-537-3748"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">비상 직통 / 휴대폰</label>
                  <input
                    type="tel"
                    value={formData.secondaryPhone || ''}
                    onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 010-1234-5678 (상황실장 직통)"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">
                    현장 상황실 / 지원 부스 위치 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 시민광장 본부석 종합상황실 A구역"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    총괄 책임자 / 담당자 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 총괄관리자 (행사총괄국)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    운영 시간 안내 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="예: 행사 기간 상시 운영 (08:00 ~ 22:00)"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">
                    현장 긴급 지원 안내 및 지침 사항
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notice}
                    onChange={(e) => setFormData({ ...formData, notice: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none leading-relaxed"
                    placeholder="행사 진행 중 긴급 안전사고, 의료지원 요청, 전력/음향 장애 및 현장 네트워크 오류 시 전담 지원센터로 즉시 연락 바랍니다."
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md transition active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  <span>정보 저장 및 팀원에게 공개</span>
                </button>
              </div>
            </form>
          ) : (
            /* Team Member & Admin View Mode */
            <div className="space-y-4">
              {/* Primary Call Box */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-4 text-white shadow-md border border-emerald-800/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    대표 긴급 핫라인
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                    24H 긴급 연결
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <a
                      href={`tel:${emergencyCenter.phone}`}
                      className="text-2xl font-black font-mono tracking-tight text-white hover:text-emerald-300 transition"
                    >
                      {emergencyCenter.phone}
                    </a>
                    <span className="block text-[11px] text-slate-300 mt-0.5">
                      {emergencyCenter.centerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(emergencyCenter.phone, 'phone')}
                      className="flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs text-emerald-200 transition"
                      title="전화번호 복사"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedField === 'phone' ? '복사됨' : '복사'}</span>
                    </button>
                    <a
                      href={`tel:${emergencyCenter.phone}`}
                      className="flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-xs font-black shadow-md transition active:scale-95"
                    >
                      <Phone className="h-3.5 w-3.5 fill-current" />
                      <span>전화 걸기</span>
                    </a>
                  </div>
                </div>

                {emergencyCenter.secondaryPhone && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-800/40 flex items-center justify-between text-xs">
                    <span className="text-slate-300 text-[11px]">비상 직통 번호:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${emergencyCenter.secondaryPhone}`}
                        className="font-mono font-bold text-emerald-200 hover:underline"
                      >
                        {emergencyCenter.secondaryPhone}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(emergencyCenter.secondaryPhone!, 'secPhone')}
                        className="text-slate-400 hover:text-white"
                        title="복사"
                      >
                        {copiedField === 'secPhone' ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Location */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold flex items-center gap-1.5 text-[11px]">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      상황실 / 부스 위치
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(emergencyCenter.location, 'location')}
                      className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                    >
                      {copiedField === 'location' ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedField === 'location' ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <p className="font-bold text-slate-800 text-xs leading-snug">
                    {emergencyCenter.location}
                  </p>
                </div>

                {/* Operating Hours */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    운영 시간
                  </span>
                  <p className="font-bold text-slate-800 text-xs leading-snug">
                    {emergencyCenter.operatingHours}
                  </p>
                </div>

                {/* Manager */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-slate-500">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    총괄 책임자
                  </span>
                  <p className="font-bold text-slate-800 text-xs leading-snug">
                    {emergencyCenter.managerName}
                  </p>
                </div>

                {/* System Synchronized Status */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Shield className="h-3.5 w-3.5 text-emerald-600" />
                    팀원 동기화 상태
                  </span>
                  <p className="font-semibold text-emerald-800 text-xs flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    실시간 전원 열람 가능
                  </p>
                </div>
              </div>

              {/* Emergency Notice / Guideline */}
              <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/80 space-y-1 text-xs">
                <span className="font-bold flex items-center gap-1.5 text-[11px] text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  현장 긴급 지침 및 공지사항
                </span>
                <p className="text-amber-950 text-xs leading-relaxed break-keep">
                  {emergencyCenter.notice}
                </p>
              </div>

              {/* Updater & Role Controls */}
              <div className="rounded-2xl bg-slate-100/80 p-3 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200">
                <div>
                  <span>최종 입력: </span>
                  <strong className="text-slate-700">{emergencyCenter.updatedBy}</strong>
                  <span className="text-slate-400"> ({emergencyCenter.updatedAt})</span>
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(emergencyCenter);
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-slate-900 text-white hover:bg-emerald-800 px-3 py-1.5 text-xs font-bold transition active:scale-95 shrink-0"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>총괄관리자 정보 수정</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSwitchToAdmin}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
                    title="총괄관리자로 전환하여 긴급지원센터 정보를 입력하거나 수정합니다."
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>총괄관리자 전환 후 수정</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>모든 행사 요원과 자원봉사자에게 동일하게 제공됩니다.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-1.5 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
