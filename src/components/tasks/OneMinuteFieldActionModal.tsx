import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Camera,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  Database,
  FileSpreadsheet,
  FileText,
  FileCode,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface OneMinuteFieldActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  initialTaskId?: string;
}

const FIELD_LOG_PRESETS = [
  '🎙️ 현장 음향 및 조명 리허설 점검 이상무',
  '🚧 관람객 안전 통제 펜스 및 유도선 설치 완료',
  '🚗 VIP 내빈 영접 및 의전 이동 동선 확보 완료',
  '🧯 행사장 소화기 배치 및 비상 통로 점검 완료',
  '🎪 참가 부스 설비 및 전력 공급 연결 완료',
  '🌧️ 우천 대비 방수포 및 비상 천막 설치 완료',
];

export const OneMinuteFieldActionModal: React.FC<OneMinuteFieldActionModalProps> = ({
  isOpen,
  onClose,
  initialTask,
  initialTaskId,
}) => {
  const {
    eventTasks,
    currentEvent,
    quickCompleteTaskWithEvidence,
    syncState,
    toggleSimulateOffline,
  } = useApp();

  // Internal visibility state to guarantee instant closure on click
  const [localVisible, setLocalVisible] = useState(isOpen);

  useEffect(() => {
    setLocalVisible(isOpen);
  }, [isOpen]);

  const handleClose = () => {
    setLocalVisible(false);
    onClose();
  };

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [workLogInput, setWorkLogInput] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [newImages, setNewImages] = useState<{ fileName: string; fileUrl: string; fileSize: string }[]>([]);
  const [newDocs, setNewDocs] = useState<{ fileName: string; fileUrl: string; fileSize: string; extension: string }[]>([]);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean>(false);
  const [lastSavedTaskTitle, setLastSavedTaskTitle] = useState<string>('');

  // Choose appropriate default task
  useEffect(() => {
    if (initialTaskId) {
      const found = eventTasks.find((t) => t.id === initialTaskId);
      if (found) {
        setSelectedTaskId(found.id);
        setWorkLogInput(found.workLog || '');
      }
    } else if (initialTask) {
      setSelectedTaskId(initialTask.id);
      setWorkLogInput(initialTask.workLog || '');
    } else {
      const active =
        eventTasks.find((t) => t.dueDate === '2026-09-18' && t.status !== 'done') ||
        eventTasks.find((t) => t.status !== 'done') ||
        eventTasks[0];
      if (active) {
        setSelectedTaskId(active.id);
        setWorkLogInput(active.workLog || '');
      }
    }
    setNewImages([]);
    setNewDocs([]);
    setIsSuccessFeedback(false);
  }, [initialTask, initialTaskId, eventTasks, isOpen]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    if (!isOpen || !localVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, localVisible, onClose]);

  if (!isOpen || !localVisible) return null;

  const currentTask = eventTasks.find((t) => t.id === selectedTaskId);

  // Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          setNewImages((prev) => [
            ...prev,
            {
              fileName: file.name,
              fileUrl: reader.result as string,
              fileSize: sizeStr,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Doc Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop() || 'doc';
      const reader = new FileReader();
      reader.onload = () => {
        setNewDocs((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl: (reader.result as string) || '#',
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            extension: ext,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraCapture = (blobUrl: string, fileName: string) => {
    setNewImages((prev) => [
      ...prev,
      {
        fileName,
        fileUrl: blobUrl,
        fileSize: '1.8 MB',
      },
    ]);
  };

  const handleApplyPreset = (presetText: string) => {
    if (!workLogInput.trim()) {
      setWorkLogInput(presetText);
    } else {
      setWorkLogInput((prev) => `${prev}\n${presetText}`);
    }
  };

  const handleExecute1MinuteAction = () => {
    if (!currentTask) return;

    // Trigger PRD 27 quick action
    quickCompleteTaskWithEvidence(
      currentTask.id,
      workLogInput,
      newImages,
      newDocs
    );

    setLastSavedTaskTitle(currentTask.title);
    setIsSuccessFeedback(true);

    // Auto close after brief display if user doesn't close manually
    setTimeout(() => {
      handleClose();
    }, 1800);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto cursor-pointer pointer-events-auto"
        onClick={handleClose}
      >
        <div
          className="relative my-auto w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 px-4 py-3.5 sm:px-5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
                <Zap className="h-5 w-5 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm sm:text-base tracking-tight text-white">
                    ⚡ 1분 현장 빠른 액션
                  </h3>
                  <span className="rounded bg-amber-400/20 border border-amber-300/40 text-[10px] font-bold px-1.5 py-0.2 text-amber-300">
                    오프라인 즉시 저장
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium">
                  통신 상태와 무관하게 IndexedDB로 1초 만에 완료 처리
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-close-one-minute-action-x"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="rounded-xl p-2.5 text-white/80 hover:bg-white/20 hover:text-white transition active:scale-95 cursor-pointer flex items-center justify-center min-h-[40px] min-w-[40px]"
              aria-label="팝업창 닫기"
              title="닫기 (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Feedback Overlay */}
          {isSuccessFeedback ? (
            <div className="p-8 text-center space-y-4 my-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  1분 현장 완료 기록 성공!
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  [{lastSavedTaskTitle}]
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <Database className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    {syncState.isOnline
                      ? '온라인 클라우드 동기화 완료'
                      : 'IndexedDB 로컬 캐시 안전 보관 (복구 시 자동 전송)'}
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-close-one-minute-action-success"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold transition active:scale-95 shadow-md cursor-pointer"
                >
                  확인 및 창 닫기
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Network & Offline Status Banner */}
              <div
                className={`rounded-2xl border p-3 flex items-center justify-between gap-2 transition ${
                  syncState.isOnline
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : 'border-amber-300 bg-amber-50/90 text-amber-950'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      syncState.isOnline
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {syncState.isOnline ? (
                      <Wifi className="h-4 w-4" />
                    ) : (
                      <WifiOff className="h-4 w-4" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs">
                        {syncState.isOnline
                          ? '온라인 실시간 동기화 상태'
                          : '오프라인 로컬 우선(Local-First) 모드'}
                      </span>
                      <span className="rounded bg-white/70 px-1.5 py-0.2 text-[10px] font-bold">
                        IndexedDB
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 truncate">
                      {syncState.isOnline
                        ? '작업 즉시 클라우드에 영구 반영됩니다.'
                        : '통신 단절 시에도 기기에 즉시 저장되며 재접속 시 자동 병합됩니다.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className="shrink-0 rounded-xl bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  title="현장 통신 단절 환경 시뮬레이션"
                >
                  {syncState.isSimulatedOffline ? '온라인 복구' : '오프라인 시험'}
                </button>
              </div>

              {/* 1. Target Task Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  완료 처리할 현장 업무 선택
                </label>
                <div className="relative">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      setSelectedTaskId(e.target.value);
                      const t = eventTasks.find((item) => item.id === e.target.value);
                      if (t) setWorkLogInput(t.workLog || '');
                    }}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/70 p-3 pr-9 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden transition"
                  >
                    {eventTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.category}] {t.title} {t.status === 'done' ? '(완료됨)' : '(진행중)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* 2. Quick Presets for 1-Click Work Log */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>빠른 현장 기록 템플릿 (1초 완성 클릭)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">터치 시 자동 입력</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FIELD_LOG_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-950 px-2.5 py-1.5 text-[11px] font-semibold transition active:scale-95 text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Work Log Text Area */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                  실제 수행한 작업 내역 (선택)
                </label>
                <textarea
                  rows={2}
                  value={workLogInput}
                  onChange={(e) => setWorkLogInput(e.target.value)}
                  placeholder="예: VIP 2호차 진입로 주차 통제 완료 및 이상 유무 점검"
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>

              {/* 4. Evidence Attachments (Fast Camera & Photos) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    현장 사진 및 문서 증빙
                  </label>
                  <span className="text-[11px] text-slate-400">
                    사진 {newImages.length}장 · 문서 {newDocs.length}개 추가됨
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    <Camera className="h-5 w-5 text-emerald-700" />
                    <span className="text-xs font-bold">📷 현장 촬영</span>
                  </button>

                  <label className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-slate-700 hover:bg-slate-100 transition shadow-2xs">
                    <ImageIcon className="h-5 w-5 text-teal-700" />
                    <span className="text-xs font-bold">🖼 앨범 선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>

                  <label className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-slate-700 hover:bg-slate-100 transition shadow-2xs">
                    <Paperclip className="h-5 w-5 text-amber-700" />
                    <span className="text-xs font-bold">📎 문서 첨부</span>
                    <input
                      type="file"
                      accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.zip"
                      multiple
                      className="hidden"
                      onChange={handleDocUpload}
                    />
                  </label>
                </div>

                {/* Staged Images Preview */}
                {newImages.length > 0 && (
                  <div className="mt-2.5 rounded-2xl bg-emerald-50/40 p-2.5 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-800 block mb-1.5">
                      저장 대기 중인 사진 ({newImages.length}장)
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {newImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-emerald-200"
                        >
                          <img
                            src={img.fileUrl}
                            alt={img.fileName}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Primary Action */}
          {!isSuccessFeedback && (
            <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2">
              <button
                type="button"
                id="btn-close-one-minute-action-cancel"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClose();
                }}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 shadow-2xs cursor-pointer min-h-[40px]"
                title="작업 취소 및 팝업창 닫기"
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleExecute1MinuteAction}
                disabled={!currentTask}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-800 to-teal-800 px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-emerald-900/20 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition disabled:opacity-50"
              >
                <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                <span>
                  {syncState.isOnline
                    ? '⚡ 1분 현장 완료 & 즉시 동기화'
                    : '⚡ 1분 현장 완료 (IndexedDB 로컬 저장)'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};
