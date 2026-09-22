import React from 'react';
import {
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SyncQueueItem } from '../../types';

interface SyncQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncQueueModal: React.FC<SyncQueueModalProps> = ({ isOpen, onClose }) => {
  const {
    syncState,
    syncQueue,
    triggerSyncNow,
    toggleSimulateOffline,
    clearSyncedQueue,
    removeSyncQueueItem,
    retrySyncItem,
  } = useApp();

  if (!isOpen) return null;

  const pendingItems = syncQueue.filter((item) => item.status === 'pending');
  const syncingItems = syncQueue.filter((item) => item.status === 'syncing');
  const syncedItems = syncQueue.filter((item) => item.status === 'synced');
  const failedItems = syncQueue.filter((item) => item.status === 'failed');

  const getActionTypeBadge = (type: SyncQueueItem['type']) => {
    switch (type) {
      case 'quick_field_action':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            <Zap className="h-3 w-3 text-amber-600" /> 1분 현장 조치
          </span>
        );
      case 'toggle_completion':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> 업무 완료 변경
          </span>
        );
      case 'update_task':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
            내용 수정
          </span>
        );
      case 'create_task':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800">
            새 업무 생성
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
            업무 업데이트
          </span>
        );
    }
  };

  const getStatusBadge = (status: SyncQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
            <Clock className="h-3 w-3" /> 대기 중 (오프라인)
          </span>
        );
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800">
            <RefreshCw className="h-3 w-3 animate-spin" /> 동기화 진행 중
          </span>
        );
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> 클라우드 반영 완료
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800">
            <AlertTriangle className="h-3 w-3" /> 재시도 필요
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative my-auto w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-950 px-4 py-3.5 sm:px-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-emerald-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                  로컬 우선(Local-First) 동기화 센터
                </h3>
                <span className="rounded bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-bold px-1.5 py-0.2 text-emerald-200">
                  IndexedDB
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80">
                네트워크가 단절된 현장에서도 1분 빠른 기록 보장
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-white/80 hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Network & Simulation Status Card */}
          <div
            className={`rounded-2xl border p-4 transition ${
              syncState.isOnline
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-amber-300 bg-amber-50/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    syncState.isOnline
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-amber-600 text-white shadow-sm'
                  }`}
                >
                  {syncState.isOnline ? (
                    <Wifi className="h-6 w-6" />
                  ) : (
                    <WifiOff className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {syncState.isOnline ? '현재 상태: 온라인 (연결됨)' : '현재 상태: 오프라인 (통신 단절)'}
                    </span>
                    {syncState.isSimulatedOffline && (
                      <span className="rounded bg-amber-200 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5">
                        시뮬레이션 중
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {syncState.isOnline
                      ? '실시간 클라우드 연결 상태입니다. 오프라인 작업 발생 시 즉시 동기화됩니다.'
                      : '네트워크가 연결되지 않았습니다. 모든 1분 현장 조치와 사진은 IndexedDB에 즉시 보존됩니다.'}
                  </p>
                </div>
              </div>

              {/* Simulation Toggle Button */}
              <button
                type="button"
                onClick={toggleSimulateOffline}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs border ${
                  syncState.isSimulatedOffline
                    ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
                title="현장 통신 단절 환경을 시뮬레이션하여 오프라인 저장을 테스트합니다"
              >
                {syncState.isSimulatedOffline ? '온라인 복구하기' : '오프라인 단절 테스트'}
              </button>
            </div>
          </div>

          {/* IndexedDB Storage Statistics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                로컬 캐시 업무
              </span>
              <span className="mt-1 block text-lg font-black text-slate-900">
                {syncState.totalCachedTasks}개
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                IndexedDB 보관
              </span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight block">
                동기화 대기 큐
              </span>
              <span className="mt-1 block text-lg font-black text-amber-950">
                {syncState.pendingCount}건
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">
                {syncState.pendingCount > 0 ? '복구 시 자동 전송' : '모두 동기화됨'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                최근 동기화
              </span>
              <span className="mt-1 block text-xs font-extrabold text-slate-800 truncate">
                {syncState.lastSyncedAt || '방금 전'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                무결성 유지
              </span>
            </div>
          </div>

          {/* Quick Explanation Banner */}
          <div className="rounded-2xl bg-slate-100/80 p-3 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold text-slate-800 block">
                현장 무중단 1분 액션 보장 기술 (Local-First Sync)
              </span>
              <p className="text-[11px] text-slate-600">
                지하 주차장, 무대 뒤편, 야외 행사장 등 와이파이나 LTE 신호가 미약해도 업무 완료 처리, 사진 증빙, 작업 일지 저장이 실패하지 않으며 기기 내 <strong>브라우저 IndexedDB</strong>에 즉시 영구 저장된 후 통신 복구 시 자동으로 병합됩니다.
              </p>
            </div>
          </div>

          {/* Sync Actions Queue List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                  동기화 대기열 내역 ({syncQueue.length})
                </h4>
                {pendingItems.length > 0 && (
                  <span className="rounded-full bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2">
                    {pendingItems.length}
                  </span>
                )}
              </div>
              {syncedItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearSyncedQueue}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  완료된 항목 정리
                </button>
              )}
            </div>

            {syncQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-1.5">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold text-slate-700">
                  대기 중인 오프라인 작업이 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  모든 현장 기록이 최신 상태로 안전하게 동기화되어 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {syncQueue.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getActionTypeBadge(item.type)}
                        {getStatusBadge(item.status)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.formattedTime}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {item.taskTitle}
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-slate-400" />
                        로컬 반영: {item.appliedLocallyAt}
                      </span>

                      <div className="flex items-center gap-1">
                        {item.status === 'failed' && (
                          <button
                            type="button"
                            onClick={() => retrySyncItem(item.id)}
                            className="rounded-lg bg-rose-50 px-2 py-0.5 text-rose-700 font-bold hover:bg-rose-100 transition"
                          >
                            재시도
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSyncQueueItem(item.id)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition"
                          title="목록에서 삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            닫기
          </button>

          <button
            type="button"
            onClick={() => triggerSyncNow()}
            disabled={syncState.isSyncing || (!syncState.isOnline && syncState.isSimulatedOffline)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-600 active:scale-[0.99] disabled:opacity-50 transition"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncState.isSyncing ? 'animate-spin' : ''}`}
            />
            <span>
              {syncState.isSyncing
                ? '동기화 진행 중...'
                : syncState.pendingCount > 0
                ? `⚡ ${syncState.pendingCount}건 지금 즉시 동기화`
                : '⚡ 지금 동기화 상태 점검'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
