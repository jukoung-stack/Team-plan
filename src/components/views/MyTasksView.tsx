import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Check,
  ChevronRight,
  Filter,
  Home,
  Users,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface MyTasksViewProps {
  onSelectTask: (task: Task) => void;
  onGoHome?: () => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onSelectTask, onGoHome }) => {
  const { eventTasks, currentUser, users, setCurrentUser, toggleTaskCompletion, setActiveTab } = useApp();
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);

  const handleNavigateHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      setActiveTab('home');
    }
  };

  const [activeFilter, setActiveFilter] = useState<'today' | 'this_week' | 'delayed' | 'done' | 'all'>('all');

  // Filter tasks assigned to currentUser (either directly or via subtasks)
  const myAssignedTasks = eventTasks.filter((t) =>
    t.assignees.some((a) => a.userId === currentUser.id)
  );

  // Apply sub-filters (PRD 16: 오늘, 이번 주, 지연, 완료, 전체)
  const filteredTasks = myAssignedTasks.filter((t) => {
    const isDone = t.status === 'done' || t.assignees.some((a) => a.userId === currentUser.id && a.isCompleted);
    const isDelayed = t.status === 'delayed' || (!isDone && t.dueDate < '2026-09-18');
    const isToday = t.dueDate === '2026-09-18';
    const isThisWeek = t.dueDate >= '2026-09-15' && t.dueDate <= '2026-09-22';

    if (activeFilter === 'today') return isToday;
    if (activeFilter === 'this_week') return isThisWeek;
    if (activeFilter === 'delayed') return isDelayed;
    if (activeFilter === 'done') return isDone;
    return true; // 'all'
  });

  const getDDayPill = (task: Task) => {
    const mySubtask = task.assignees.find((a) => a.userId === currentUser.id);
    const isDone = task.status === 'done' || (mySubtask && mySubtask.isCompleted);

    if (isDone) {
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          <Check className="h-3 w-3 stroke-[3]" /> 완료
        </span>
      );
    }
    if (task.dueDate === '2026-09-18') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
          🔴 오늘
        </span>
      );
    }
    if (task.dueDate === '2026-09-20') {
      return (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
          🟡 D-2
        </span>
      );
    }
    if (task.dueDate === '2026-09-21') {
      return (
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
          🟡 D-3
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
        {task.dueDate.slice(5)}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Top Action Bar with Home Return Button & Fast User Switching */}
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={handleNavigateHome}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xs border border-emerald-900/10 hover:bg-slate-50 hover:text-emerald-800 transition active:scale-95"
          title="처음(홈 화면)으로 돌아가기"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-600" />
          <Home className="h-3.5 w-3.5 text-emerald-700" />
          <span>처음으로 (홈)</span>
        </button>

        {/* User Switch Quick Dropdown Toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition active:scale-95"
            title="다른 팀원의 배정업무 조회"
          >
            <Users className="h-3.5 w-3.5 text-emerald-700" />
            <span>사용자 전환</span>
            <span className="max-w-[70px] truncate text-[11px] font-semibold text-emerald-800">
              ({currentUser.name})
            </span>
          </button>

          {isUserSwitcherOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserSwitcherOpen(false)}
              />
              <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl bg-white p-2.5 shadow-xl border border-slate-200">
                <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-100 px-1.5">
                  <span className="text-[11px] font-bold text-slate-400">
                    팀원별 배정 업무 조회
                  </span>
                  <button
                    type="button"
                    onClick={handleNavigateHome}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    <Home className="h-3 w-3" />
                    <span>처음으로</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setCurrentUser(u);
                        setIsUserSwitcherOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                        u.id === currentUser.id
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-md text-white text-[11px] font-bold ${u.avatarColor}`}
                        >
                          {u.name[0]}
                        </div>
                        <div>
                          <span className="block font-medium">{u.name}</span>
                          <span className="text-[10px] text-slate-400">{u.department}</span>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {currentUser.name}님의 배정 업무
              </h2>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                {currentUser.role === 'admin' ? '총괄관리자' : currentUser.role === 'leader' ? '팀장' : '현장팀원'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              총 {myAssignedTasks.length}개 업무 중{' '}
              <span className="font-bold text-emerald-700">
                {myAssignedTasks.filter((t) => t.status === 'done').length}개 완료
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNavigateHome}
              className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              title="처음(홈)으로 이동"
            >
              <Home className="h-4 w-4 text-emerald-800" />
            </button>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold text-base ${currentUser.avatarColor}`}
            >
              {currentUser.name[0]}
            </div>
          </div>
        </div>

        {/* Quick Team Member Switch Horizontal Chips */}
        <div className="pt-2 pb-2 mb-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-400">
              담당자 전환 (클릭 시 해당 팀원의 배정업무 보기)
            </span>
            <button
              type="button"
              onClick={handleNavigateHome}
              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Home className="h-3 w-3" />
              <span>홈으로</span>
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setCurrentUser(u)}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs shrink-0 transition border ${
                    isSelected
                      ? 'bg-emerald-700 text-white font-bold border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelected ? 'bg-white' : u.avatarColor
                    }`}
                  />
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PRD 16 Filter Tabs (오늘, 이번 주, 지연, 완료, 전체) */}
        <div className="flex gap-1.5 overflow-x-auto text-xs font-semibold pt-1">
          {[
            { id: 'today', label: '🔴 오늘' },
            { id: 'this_week', label: '이번 주' },
            { id: 'delayed', label: '지연' },
            { id: 'done', label: '완료' },
            { id: 'all', label: '전체' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as any)}
              className={`rounded-xl px-3 py-1.5 shrink-0 transition ${
                activeFilter === f.id
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-slate-200 shadow-xs">
            <CheckSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">해당 조건의 업무가 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              상단 필터를 변경하거나 행사 탭에서 새 업무를 배정받아보세요.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const mySubtask = task.assignees.find((a) => a.userId === currentUser.id);
            const isDone = task.status === 'done' || (mySubtask && mySubtask.isCompleted);

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-4 transition shadow-xs ${
                  isDone
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-white border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id, mySubtask?.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
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
                      {mySubtask?.subTaskName && (
                        <span className="inline-block mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-100">
                          담당 작업: {mySubtask.subTaskName}
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {task.workLog || task.description || '수행 작업 기록 대기 중'}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => onSelectTask(task)}
                    className="cursor-pointer shrink-0 pl-2"
                  >
                    {getDDayPill(task)}
                  </div>
                </div>

                {/* Bottom action trigger */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <span className="text-[11px] text-slate-400">
                    마감: {task.dueDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className="flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>사진·문서 첨부 / 상세</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Floating Return Home Action */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={handleNavigateHome}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs border border-emerald-900/10 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition active:scale-95"
        >
          <Home className="h-4 w-4 text-emerald-700" />
          <span>처음으로 돌아가기 (홈 화면)</span>
        </button>
      </div>
    </div>
  );
};
