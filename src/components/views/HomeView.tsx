import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Check,
  Zap,
  Award,
  Headphones,
  Phone,
  MapPin,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import { EmergencyCenterModal } from '../common/EmergencyCenterModal';

interface HomeViewProps {
  onSelectTask: (task: Task) => void;
  onGoToEvents: () => void;
  onGoToMyTasks: () => void;
  onGoToPhotos?: () => void;
  onQuickFieldAction: () => void;
  onOpenAiReport?: () => void;
  onOpenNewEvent?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTask,
  onGoToEvents,
  onGoToMyTasks,
  onGoToPhotos,
  onQuickFieldAction,
  onOpenAiReport,
  onOpenNewEvent,
}) => {
  const {
    currentUser,
    currentEvent,
    eventTasks,
    attachments,
    eventActivities,
    toggleTaskCompletion,
    emergencyCenter,
  } = useApp();

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalEditMode, setEmergencyModalEditMode] = useState(false);
  const isAdmin = currentUser.role === 'admin';

  // Calculate statistics
  const totalTasks = eventTasks.length;
  const doneTasks = eventTasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const inProgressTasks = eventTasks.filter((t) => t.status === 'in_progress').length;
  const delayedTasks = eventTasks.filter(
    (t) => t.status === 'delayed' || (t.status !== 'done' && t.dueDate < '2026-09-18')
  ).length;

  // PRD 4 "오늘 해야 할 일" list items
  const todayTasks = eventTasks.slice(0, 5);

  const getDDayBadge = (task: Task) => {
    if (task.status === 'done') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          <Check className="h-3 w-3 stroke-[3]" /> 완료
        </span>
      );
    }
    if (task.dueDate === '2026-09-18') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
          🔴 오늘 마감
        </span>
      );
    }
    if (task.dueDate === '2026-09-20') {
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          🟡 D-2
        </span>
      );
    }
    if (task.dueDate === '2026-09-21') {
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          🟡 D-3
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        {task.dueDate.slice(5)}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* 1. Greeting & User Hero with Deep Pine/Emerald Gradient Theme */}
      <div className="flex items-center justify-between rounded-3xl bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 sm:p-5 text-white shadow-xl border border-emerald-800/30">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
            {currentUser.department}
          </span>
          <h1 className="mt-0.5 text-xl sm:text-2xl font-black tracking-tight">
            안녕하세요, {currentUser.name}님!
          </h1>
          <p className="mt-1 text-xs text-emerald-200/90 font-medium">
            오늘도 현장 업무를 빠르게 확인하고 기록해보세요.
          </p>
        </div>

        {/* 1-Minute Fast Field Action Button (PRD 27) */}
        <button
          type="button"
          onClick={onQuickFieldAction}
          className="flex flex-col items-center justify-center rounded-2xl bg-white/10 px-3.5 py-2.5 backdrop-blur-md hover:bg-white/20 active:scale-95 transition border border-white/20 text-center shrink-0 shadow-xs"
          title="1분 현장 빠른 기록"
        >
          <Camera className="h-5 w-5 text-amber-300" />
          <span className="text-[10px] font-bold mt-1 text-white">현장 빠른기록</span>
        </button>
      </div>

      {/* AI Assistant Quick Banner */}
      <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-3.5 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
            <Sparkles className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 text-xs">AI 행사 어시스턴트</span>
              <span className="rounded bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate">
              과거 데이터 기반 체크리스트 추천 & 실시간 결과 보고서 자동 초안
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenNewEvent && (
            <button
              type="button"
              onClick={onOpenNewEvent}
              className="rounded-xl border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 transition"
            >
              업무 추천
            </button>
          )}
          {onOpenAiReport && (
            <button
              type="button"
              onClick={onOpenAiReport}
              className="rounded-xl bg-emerald-700 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-600 transition shadow-xs"
            >
              보고서 생성
            </button>
          )}
        </div>
      </div>

      {/* 현장 긴급 지원센터 실시간 공유 바 (총괄관리자 별도 입력 & 팀원 실시간 열람) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3 sm:p-3.5 text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Headphones className="h-4 w-4" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-xs">{emergencyCenter.centerName}</span>
              {isAdmin ? (
                <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 text-[9px] font-bold">
                  총괄관리자 입력
                </span>
              ) : (
                <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold">
                  팀원 열람
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5 truncate">
              <span className="font-mono font-bold text-emerald-300">☎ {emergencyCenter.phone}</span>
              <span className="text-slate-500">|</span>
              <span className="truncate text-slate-400">📍 {emergencyCenter.location}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={`tel:${emergencyCenter.phone}`}
            className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 text-[11px] transition shadow-xs active:scale-95"
          >
            <Phone className="h-3 w-3 fill-current" />
            <span>연결</span>
          </a>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                setEmergencyModalEditMode(true);
                setIsEmergencyModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 font-bold px-2.5 py-1.5 text-[11px] transition active:scale-95"
            >
              <Edit3 className="h-3 w-3" />
              <span>수정</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEmergencyModalEditMode(false);
                setIsEmergencyModalOpen(true);
              }}
              className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1.5 text-[11px] transition border border-slate-700"
            >
              <span>안내</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PRD 4 "오늘 해야 할 일" */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-base font-black text-slate-900">오늘 해야 할 일</h2>
          </div>
          <button
            type="button"
            onClick={onGoToMyTasks}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
          >
            <span>전체보기</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Checklist List Items */}
        <div className="space-y-2">
          {todayTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between rounded-xl p-3 transition border ${
                  isDone
                    ? 'bg-slate-50/70 border-slate-200/60 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCompletion(task.id);
                    }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isDone
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'border-slate-300 bg-white hover:border-emerald-600'
                    }`}
                  >
                    {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div
                    onClick={() => onSelectTask(task)}
                    className="cursor-pointer overflow-hidden"
                  >
                    <span
                      className={`block text-sm font-bold truncate ${
                        isDone ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {task.category} · 담당: {task.assignees.map((a) => a.userName).join(', ') || '미정'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => onSelectTask(task)}
                  className="cursor-pointer shrink-0 pl-2"
                >
                  {getDDayBadge(task)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PRD 4 "우리 팀 행사" Overview Card */}
      {currentEvent && (
        <div
          onClick={onGoToEvents}
          className="cursor-pointer rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10 hover:border-emerald-300 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              우리 팀 행사
            </span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              진행 중
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900">{currentEvent.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            📅 {currentEvent.date} · 📍 {currentEvent.location}
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-600">전체 진행률</span>
              <span className="text-emerald-700 text-sm font-extrabold">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-700 to-teal-700 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stats Breakdown: 완료, 진행, 지연 */}
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">완료</span>
              <span className="text-base font-extrabold text-emerald-700">
                {doneTasks}
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[11px] text-slate-400 block font-medium">진행</span>
              <span className="text-base font-extrabold text-amber-600">
                {inProgressTasks}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">지연</span>
              <span className="text-base font-extrabold text-rose-600">
                {delayedTasks}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. 1분 현장기록 사진첩 Card (PRD/User Request) */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                1분 현장기록 사진첩
              </h2>
              <span className="text-[11px] text-slate-500">
                날짜별 실시간 현장 증빙 사진 ({attachments.filter((a) => a.fileType === 'image').length}장 보관)
              </span>
            </div>
          </div>
          {onGoToPhotos && (
            <button
              type="button"
              onClick={onGoToPhotos}
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
            >
              <span>사진첩 열기</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Thumbnail Preview Strip */}
        <div className="grid grid-cols-3 gap-2">
          {attachments
            .filter((a) => a.fileType === 'image')
            .slice(0, 3)
            .map((photo) => (
              <div
                key={photo.id}
                onClick={onGoToPhotos}
                className="group relative aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer shadow-2xs"
              >
                <img
                  src={photo.fileUrl}
                  alt={photo.fileName}
                  className="h-full w-full object-cover group-hover:scale-105 transition"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-1.5">
                  <span className="text-[10px] font-bold text-white truncate">
                    {photo.fileName}
                  </span>
                  <span className="text-[9px] text-emerald-300 font-mono">
                    {photo.uploadedAt.split(' ')[0]}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 5. PRD 14 "최근 활동 (Live Timeline)" */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-900">최근 활동 기록</h2>
          <span className="text-xs text-slate-400 font-medium">실시간 피드</span>
        </div>

        <div className="space-y-3">
          {eventActivities.slice(0, 5).map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                {act.userName[0]}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{act.userName}</span>
                  <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                </div>
                <p className="mt-0.5 font-medium text-slate-700">{act.message}</p>
                {act.detail && (
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">{act.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Center Modal */}
      <EmergencyCenterModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        initialEditMode={emergencyModalEditMode}
      />
    </div>
  );
};
