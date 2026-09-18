import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';

interface ScheduleViewProps {
  onSelectTask: (task: Task) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onSelectTask }) => {
  const { eventTasks, toggleTaskCompletion } = useApp();

  // Calendar month state: 2026년 9월
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(9); // 1-indexed (9 = September)
  const [selectedDay, setSelectedDay] = useState<number>(18); // Default 18th per PRD

  // Days in month calculation
  const daysInMonth = 30; // September has 30 days
  const startDayOfWeek = 2; // Sept 1, 2026 is Tuesday (0=Sun, 1=Mon, 2=Tue...)

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  // Format date string for matching
  const selectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(
    selectedDay
  ).padStart(2, '0')}`;

  // Find tasks on this date or nearby
  const tasksOnSelectedDate = eventTasks.filter(
    (t) => t.dueDate === selectedDateStr
  );

  // Group all tasks by day of this month
  const tasksByDay: { [day: number]: Task[] } = {};
  eventTasks.forEach((t) => {
    const parts = t.dueDate.split('-');
    if (parts.length === 3) {
      const taskYear = parseInt(parts[0]);
      const taskMonth = parseInt(parts[1]);
      const taskDay = parseInt(parts[2]);
      if (taskYear === year && taskMonth === month) {
        if (!tasksByDay[taskDay]) tasksByDay[taskDay] = [];
        tasksByDay[taskDay].push(t);
      }
    }
  });

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Calendar Header */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-black text-slate-900">
              {year}년 {month}월
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (month === 1) {
                  setYear(year - 1);
                  setMonth(12);
                } else {
                  setMonth(month - 1);
                }
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (month === 12) {
                  setYear(year + 1);
                  setMonth(1);
                } else {
                  setMonth(month + 1);
                }
              }}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
          {daysOfWeek.map((dow, idx) => (
            <div
              key={dow}
              className={`py-1 ${idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-emerald-700' : ''}`}
            >
              {dow}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {/* Empty prefix cells */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 sm:h-12" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            const tasksOnDay = tasksByDay[dayNum] || [];
            const hasDelayed = tasksOnDay.some((t) => t.status === 'delayed' || (t.status !== 'done' && dayNum < 18));
            const hasPending = tasksOnDay.some((t) => t.status === 'in_progress');
            const hasDone = tasksOnDay.some((t) => t.status === 'done');

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`relative flex flex-col items-center justify-between rounded-xl p-1.5 h-10 sm:h-12 transition ${
                  isSelected
                    ? 'bg-emerald-700 text-white font-black shadow-sm ring-2 ring-emerald-700/30'
                    : 'hover:bg-slate-100 text-slate-800'
                }`}
              >
                <span className="text-xs">{dayNum}</span>

                {/* Dot indicators */}
                <div className="flex gap-0.5 mt-auto">
                  {hasDelayed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  )}
                  {hasPending && !hasDelayed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                  {hasDone && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda */}
      <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">
              {month}월 {selectedDay}일 업무 일정
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              {tasksOnSelectedDate.length}건
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{selectedDateStr}</span>
        </div>

        {tasksOnSelectedDate.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            이 날짜에 등록된 마감 업무가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {tasksOnSelectedDate.map((task) => {
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between rounded-xl border p-3 text-xs transition ${
                    isDone
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
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
                        className={`font-bold block truncate ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {task.category} · 담당: {task.assignees.map((a) => a.userName).join(', ')}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-bold shrink-0 ${
                      isDone
                        ? 'text-emerald-700'
                        : task.priority === 'high'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {isDone ? '완료' : task.priority === 'high' ? '🔴 긴급' : '🟡 진행중'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Dates Preview */}
      <div className="rounded-2xl bg-white p-4 shadow-xs border border-emerald-900/10">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block mb-3">
          주요 임박 일정 목록
        </span>
        <div className="space-y-2">
          {eventTasks
            .filter((t) => t.dueDate >= '2026-09-18')
            .slice(0, 4)
            .map((t) => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-700">
                    {t.dueDate.slice(5)}
                  </span>
                  <span className="font-semibold text-slate-800">{t.title}</span>
                </div>
                <span className="text-slate-400">
                  {t.assignees.map((a) => a.userName).join(', ')}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
