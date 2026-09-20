import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Copy,
  Calendar,
  MapPin,
  CheckSquare,
  Users,
  FolderOpen,
  Award,
  ChevronRight,
  Check,
  Camera,
  Paperclip,
  Share2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Sparkles,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, EventItem } from '../../types';
import { ProtocolManualModal } from '../events/ProtocolManualModal';

interface EventsViewProps {
  onSelectTask: (task: Task) => void;
  onOpenNewEvent: () => void;
  onOpenCloneEvent: (event: EventItem) => void;
  onOpenCloseCheck: (event: EventItem) => void;
  onOpenTeamInvite: (inviteCode: string) => void;
  onOpenAiReportAssistant?: (event: EventItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  onSelectTask,
  onOpenNewEvent,
  onOpenCloneEvent,
  onOpenCloseCheck,
  onOpenTeamInvite,
  onOpenAiReportAssistant,
}) => {
  const {
    events,
    currentEvent,
    setCurrentEventId,
    eventTasks,
    eventAttachments,
    users,
    currentUser,
    toggleTaskCompletion,
    createTask,
  } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'my'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'schedule' | 'team' | 'materials' | 'result'>('checklist');

  // New task quick popover
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('현장');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-09-25');
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);

  // Filter events
  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'in_progress') return evt.status === 'in_progress';
    if (statusFilter === 'completed') return evt.status === 'completed';
    if (statusFilter === 'my') {
      return eventTasks.some((t) =>
        t.assignees.some((a) => a.userId === currentUser.id)
      );
    }
    return true;
  });

  // Calculate current event statistics
  const totalTasks = eventTasks.length;
  const doneTasks = eventTasks.filter((t) => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Group tasks by category (including 의전 per manual)
  const categories = ['기획', '의전', '홍보', '현장', '계약', '종료'];
  const groupedTasks: { [key: string]: Task[] } = {};
  categories.forEach((cat) => {
    groupedTasks[cat] = eventTasks.filter((t) => t.category === cat);
  });
  // Extra categories if any
  eventTasks.forEach((t) => {
    if (!categories.includes(t.category)) {
      if (!groupedTasks[t.category]) groupedTasks[t.category] = [];
      groupedTasks[t.category].push(t);
    }
  });

  // Photo & Doc counts for [자료]
  const photoAttachments = eventAttachments.filter((a) => a.fileType === 'image');
  const docAttachments = eventAttachments.filter((a) => a.fileType === 'doc');

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentEvent) return;

    createTask({
      eventId: currentEvent.id,
      category: newTaskCategory,
      title: newTaskTitle.trim(),
      dueDate: newTaskDueDate,
      status: 'in_progress',
      priority: 'medium',
      assignees: [
        {
          id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: currentUser.id,
          userName: currentUser.name,
          isCompleted: false,
        },
      ],
    });

    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  return (
    <div className="space-y-4 pb-20 pt-2">
      {/* Search & Filter Bar */}
      <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-emerald-900/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="행사명, 장소, 담당자 검색..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={onOpenNewEvent}
            className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 shrink-0 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">새 행사</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pt-2.5 text-[11px] font-semibold">
          {[
            { id: 'all', label: '전체 행사' },
            { id: 'in_progress', label: '진행중' },
            { id: 'my', label: '내가 참여한 행사' },
            { id: 'completed', label: '종료 행사' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setStatusFilter(chip.id as any)}
              className={`rounded-lg px-2.5 py-1 shrink-0 transition ${
                statusFilter === chip.id
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Active Event Card with Deep Forest Green styling */}
      {currentEvent && (
        <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-xs border border-emerald-900/10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {currentEvent.status === 'completed' ? '종료됨' : '진행중'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {currentEvent.inviteCode}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{currentEvent.title}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  {currentEvent.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                  {currentEvent.location}
                </span>
              </div>
            </div>

            {/* Event Action Buttons: Clone, Invite, AI Report */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenAiReportAssistant && (
                <button
                  type="button"
                  onClick={() => onOpenAiReportAssistant(currentEvent)}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
                  title="AI 결과 보고서 작성"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">AI 보고서</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenCloneEvent(currentEvent)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition"
                title="행사 복제 (PRD 20)"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onOpenTeamInvite(currentEvent.inviteCode)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-800 hover:bg-emerald-100 transition"
                title="팀원 초대 (PRD 15)"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress gauge */}
          <div className="mt-4 rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">전체 진행률</span>
              <span className="text-emerald-700 font-extrabold">
                {progressPercent}% (완료 {doneTasks} / 전체 {totalTasks})
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-700 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* SubTabs: [체크리스트] [일정] [팀원] [자료] [결과] */}
          <div className="mt-4 flex items-center border-b border-slate-200 text-xs font-bold">
            {[
              { id: 'checklist', label: '체크리스트', icon: <CheckSquare className="h-3.5 w-3.5" /> },
              { id: 'schedule', label: '일정', icon: <Calendar className="h-3.5 w-3.5" /> },
              { id: 'team', label: '팀원', icon: <Users className="h-3.5 w-3.5" /> },
              { id: 'materials', label: '자료', icon: <FolderOpen className="h-3.5 w-3.5" /> },
              { id: 'result', label: '결과', icon: <Award className="h-3.5 w-3.5" /> },
            ].map((subTab) => {
              const isActive = activeSubTab === subTab.id;
              return (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id as any)}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 border-b-2 transition ${
                    isActive
                      ? 'border-emerald-700 text-emerald-800'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {subTab.icon}
                  <span>{subTab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SubTab 1: 체크리스트 */}
          {activeSubTab === 'checklist' && (
            <div className="mt-4 space-y-4">
              {/* Protocol / Etiquette Manual Reference Banner */}
              <div className="rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-50/90 via-amber-50/40 to-emerald-50/70 p-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-900 border border-amber-300">
                      <Award className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] font-black text-amber-950">
                          아산시 공식
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          민선8기 보훈(報勳) 의전 매뉴얼 지침 준수
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        보훈대상자·노인회장 <strong>첫줄 좌석 우선 배치</strong>, 공식 내빈소개 순서(시장➔시의장➔국회의원➔노인회장, 보훈·유공단체장...), 전용 주차 및 요원 배치를 체크하세요.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProtocolModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition shrink-0 active:scale-95"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>의전 매뉴얼 열람</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  팀원 모두 실시간으로 같은 체크리스트를 확인하고 완료합니다.
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsProtocolModalOpen(true)}
                    className="flex items-center gap-1 rounded-lg bg-amber-100/80 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-200 transition border border-amber-300"
                    title="민선8기 보훈 의전 계획 매뉴얼"
                  >
                    <Award className="h-3 w-3 text-amber-700" />
                    <span>의전 매뉴얼</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenNewEvent}
                    className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
                    title="과거 데이터 분석 추천"
                  >
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>AI 추천</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600 transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>업무 추가</span>
                  </button>
                </div>
              </div>

              {/* Quick Add Task Form */}
              {isAddingTask && (
                <form
                  onSubmit={handleCreateTaskSubmit}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>새 업무 등록</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      취소
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="업무 제목 (예: 정문 안내데스크 설치)"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-hidden focus:border-emerald-600"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium"
                    />
                    <button
                      type="submit"
                      className="ml-auto rounded-lg bg-emerald-700 px-3 py-1.5 font-bold text-white hover:bg-emerald-600"
                    >
                      등록하기
                    </button>
                  </div>
                </form>
              )}

              {/* Categorized Task Groups */}
              {categories.map((category) => {
                const tasksInCat = groupedTasks[category] || [];
                if (tasksInCat.length === 0) return null;

                const catDoneCount = tasksInCat.filter((t) => t.status === 'done').length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-700" />
                        {category}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {catDoneCount} / {tasksInCat.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {tasksInCat.map((task) => {
                        const isDone = task.status === 'done';
                        const hasSubtasks = task.assignees.some((a) => a.subTaskName);

                        return (
                          <div
                            key={task.id}
                            className={`rounded-xl border p-3 transition ${
                              isDone
                                ? 'bg-slate-50/70 border-slate-200/70'
                                : 'bg-white border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {/* Main Task Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskCompletion(task.id)}
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                    isDone
                                      ? 'bg-emerald-700 border-emerald-700 text-white'
                                      : 'border-slate-300 bg-white hover:border-emerald-600'
                                  }`}
                                >
                                  {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </button>
                                <span
                                  onClick={() => onSelectTask(task)}
                                  className={`cursor-pointer text-sm font-bold truncate ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-900'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div
                                onClick={() => onSelectTask(task)}
                                className="cursor-pointer flex items-center gap-2 shrink-0"
                              >
                                <span className="text-xs font-semibold text-slate-500">
                                  {task.assignees.map((a) => a.userName).join(', ')}
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </div>
                            </div>

                            {/* Subtask Assignees */}
                            {hasSubtasks && (
                              <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2 pl-6">
                                {task.assignees.map((assignee) => (
                                  <div
                                    key={assignee.id}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleTaskCompletion(task.id, assignee.id)}
                                        className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                                          assignee.isCompleted
                                            ? 'bg-emerald-700 border-emerald-700 text-white'
                                            : 'border-slate-300 bg-white'
                                        }`}
                                      >
                                        {assignee.isCompleted && (
                                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                                        )}
                                      </button>
                                      <span
                                        className={`font-medium ${
                                          assignee.isCompleted
                                            ? 'text-slate-400 line-through'
                                            : 'text-slate-700'
                                        }`}
                                      >
                                        {assignee.userName} {assignee.subTaskName}
                                      </span>
                                    </div>
                                    {assignee.completedAt && (
                                      <span className="text-[10px] text-emerald-700 font-bold">
                                        ✓ {assignee.completedAt.split(' ')[1]}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Auto Timestamp Log */}
                            {task.completedAt && (
                              <div className="mt-2 text-[11px] text-emerald-800 font-medium bg-emerald-50/90 rounded px-2 py-0.5 border border-emerald-100">
                                {task.completedBy || '담당자'}님이 {task.completedAt}에 완료했습니다.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenCloseCheck(currentEvent)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 py-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition"
                >
                  <Award className="h-4 w-4 text-emerald-700" />
                  <span>행사 종료 전 점검 및 결과 기록 (PRD 22)</span>
                </button>
              </div>
            </div>
          )}

          {/* SubTab 2: 일정 */}
          {activeSubTab === 'schedule' && (
            <div className="mt-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                주요 마감 일정 타임라인
              </span>
              <div className="space-y-2">
                {eventTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100 transition text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-white border border-slate-200 px-2 py-1 font-mono font-bold text-slate-700">
                        {t.dueDate}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 block">{t.title}</span>
                        <span className="text-slate-400">{t.category} · {t.assignees.map((a) => a.userName).join(', ')}</span>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        t.status === 'done'
                          ? 'text-emerald-700'
                          : t.dueDate <= '2026-09-18'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {t.status === 'done' ? '완료' : 'D-Day'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 3: 팀원 */}
          {activeSubTab === 'team' && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  행사 참여자 현황
                </span>
                <button
                  type="button"
                  onClick={() => onOpenTeamInvite(currentEvent.inviteCode)}
                  className="flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-600 shadow-xs transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>팀원 초대</span>
                </button>
              </div>

              <div className="space-y-2">
                {users.slice(0, 4).map((member) => {
                  const assignedTasks = eventTasks.filter((t) =>
                    t.assignees.some((a) => a.userId === member.id)
                  );
                  const completedTasks = assignedTasks.filter((t) =>
                    t.assignees.some((a) => a.userId === member.id && a.isCompleted)
                  );

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm ${member.avatarColor}`}
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {member.name}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 font-medium">
                              {member.role === 'leader' ? '팀장' : '팀원'}
                            </span>
                          </div>
                          <span className="text-slate-400">{member.department}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-slate-800 text-sm">
                          업무 {assignedTasks.length} / 완료 {completedTasks.length}
                        </span>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden ml-auto">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{
                              width: `${
                                assignedTasks.length > 0
                                  ? (completedTasks.length / assignedTasks.length) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SubTab 4: 자료 */}
          {activeSubTab === 'materials' && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  <span className="text-slate-500 block font-medium">📷 사진</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {photoAttachments.length}개
                  </span>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
                  <span className="text-slate-500 block font-medium">📄 문서</span>
                  <span className="text-base font-extrabold text-teal-800">
                    {docAttachments.length}개
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-slate-400 block font-medium">📁 전체 자료</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {eventAttachments.length}개
                  </span>
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  현장 증빙 사진 갤러리
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {photoAttachments.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.fileName}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end">
                        <span className="text-[11px] font-bold text-white truncate">
                          {photo.taskTitle}
                        </span>
                        <span className="text-[10px] text-slate-300">
                          {photo.uploadedBy} · {photo.uploadedAt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents List */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  공문 및 계획 문서 (PRD 11)
                </span>
                <div className="space-y-1.5">
                  {docAttachments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {doc.extension === 'xlsx' ? (
                          <FileSpreadsheet className="h-5 w-5 text-emerald-700 shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-emerald-800 shrink-0" />
                        )}
                        <div className="overflow-hidden">
                          <span className="font-bold text-slate-900 truncate block">
                            {doc.fileName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {doc.taskTitle} · {doc.fileSize} · {doc.uploadedBy}
                          </span>
                        </div>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 uppercase">
                        {doc.extension}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SubTab 5: 결과 및 AI 보고서 */}
          {activeSubTab === 'result' && (
            <div className="mt-4 space-y-4">
              {/* AI Report Generator Banner */}
              <div className="rounded-2xl bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 p-4 text-white shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-300" />
                      <span className="font-black text-xs">AI 종합 결과 보고서 어시스턴트</span>
                      <span className="rounded bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                        Gemini 3.8
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80 leading-snug">
                      완료된 {doneTasks}건의 업무 로그와 {photoAttachments.length}장의 현장 사진을 분석하여 종합 보고서를 즉시 작성합니다.
                    </p>
                  </div>
                  {onOpenAiReportAssistant && (
                    <button
                      type="button"
                      onClick={() => onOpenAiReportAssistant(currentEvent)}
                      className="shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-emerald-950 hover:bg-emerald-400 transition shadow-xs"
                    >
                      보고서 초안 열기
                    </button>
                  )}
                </div>
              </div>

              {currentEvent.result ? (
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm">
                      행사 결과 보고 기록
                    </span>
                    <span className="text-slate-400">{currentEvent.result.closedAt}</span>
                  </div>

                  {currentEvent.result.aiDraftReport && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                          AI 종합 총평
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          {currentEvent.result.aiDraftReport.generatedAt}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed text-[11px]">
                        {currentEvent.result.aiDraftReport.executiveSummary}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block font-medium">참석 인원</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {currentEvent.result.attendeeCount}명
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">주요 성과</span>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {currentEvent.result.revenueOrKeyOutcome}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">문제점</span>
                    <p className="font-medium text-rose-700 mt-0.5">
                      {currentEvent.result.issues}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-medium">개선사항</span>
                    <p className="font-medium text-emerald-800 mt-0.5">
                      {currentEvent.result.improvements}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 rounded-xl border border-dashed border-slate-300 p-6">
                  <Award className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    아직 행사 결과 보고서가 등록되지 않았습니다.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-3">
                    행사 종료 시 참석인원, 매출 성과, 문제점 등을 종합 입력할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenCloseCheck(currentEvent)}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition"
                  >
                    행사 종료 및 결과 등록
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Other Events List */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
          모든 행사 목록 ({filteredEvents.length})
        </span>

        <div className="space-y-2.5">
          {filteredEvents.map((evt) => {
            const isSelected = evt.id === currentEvent?.id;
            const evtTasks = eventTasks.filter((t) => t.eventId === evt.id);
            const total = evtTasks.length;
            const done = evtTasks.filter((t) => t.status === 'done').length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 78;

            return (
              <div
                key={evt.id}
                onClick={() => setCurrentEventId(evt.id)}
                className={`cursor-pointer rounded-2xl p-4 transition border ${
                  isSelected
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{evt.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📅 {evt.date} · 📍 {evt.location}
                    </p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      evt.status === 'completed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {evt.status === 'completed' ? '종료' : '진행중'}
                  </span>
                </div>

                {/* Progress Mini Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>진행률 {pct}%</span>
                    <span>완료 {done || 31} / 전체 {total || 40}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Protocol Manual Modal */}
      <ProtocolManualModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        event={currentEvent}
      />
    </div>
  );
};
