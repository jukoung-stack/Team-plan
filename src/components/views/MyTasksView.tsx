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
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface MyTasksViewProps {
  onSelectTask: (task: Task) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ onSelectTask }) => {
  const { eventTasks, currentUser, toggleTaskCompletion } = useApp();

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
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {currentUser.name}님의 배정 업무
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              총 {myAssignedTasks.length}개 업무 중{' '}
              <span className="font-bold text-emerald-700">
                {myAssignedTasks.filter((t) => t.status === 'done').length}개 완료
              </span>
            </p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold text-base ${currentUser.avatarColor}`}
          >
            {currentUser.name[0]}
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
    </div>
  );
};
