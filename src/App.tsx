import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { HomeView } from './components/views/HomeView';
import { EventsView } from './components/views/EventsView';
import { ScheduleView } from './components/views/ScheduleView';
import { MyTasksView } from './components/views/MyTasksView';
import { MoreView } from './components/views/MoreView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import {
  NewEventModal,
  CloneEventModal,
  EventCloseModal,
  TeamInviteModal,
} from './components/events/EventModals';
import { AiReportAssistantModal } from './components/ai/AiReportAssistantModal';
import { LoginModal } from './components/auth/LoginModal';
import { AppFooter } from './components/layout/AppFooter';
import { Task, EventItem } from './types';
import { Camera, Plus, Zap, Wifi, Battery, Signal } from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    deviceSkin,
    setDeviceSkin,
    eventTasks,
    currentEvent,
  } = useApp();

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [cloneSourceEvent, setCloneSourceEvent] = useState<EventItem | null>(null);
  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [closeCheckEvent, setCloseCheckEvent] = useState<EventItem | null>(null);
  const [isCloseCheckOpen, setIsCloseCheckOpen] = useState(false);
  const [inviteCodeToShare, setInviteCodeToShare] = useState<string>('');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAiReportOpen, setIsAiReportOpen] = useState(false);
  const [aiReportTargetEvent, setAiReportTargetEvent] = useState<EventItem | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // PRD 27: 1-Minute Fast Field Action
  const handleQuickFieldAction = () => {
    const activeTask =
      eventTasks.find((t) => t.dueDate === '2026-09-18' && t.status !== 'done') ||
      eventTasks.find((t) => t.status !== 'done') ||
      eventTasks[0];

    if (activeTask) {
      handleOpenTask(activeTask);
    }
  };

  const handleOpenClone = (event: EventItem) => {
    setCloneSourceEvent(event);
    setIsCloneOpen(true);
  };

  const handleOpenCloseCheck = (event: EventItem) => {
    setCloseCheckEvent(event);
    setIsCloseCheckOpen(true);
  };

  const handleOpenInvite = (code?: string) => {
    setInviteCodeToShare(code || currentEvent?.inviteCode || 'EVT-2026-CHECK');
    setIsInviteOpen(true);
  };

  const handleOpenAiReport = (event?: EventItem) => {
    setAiReportTargetEvent(event || currentEvent || null);
    setIsAiReportOpen(true);
  };

  // Active View Rendering
  const renderView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            onSelectTask={handleOpenTask}
            onGoToEvents={() => setActiveTab('events')}
            onGoToMyTasks={() => setActiveTab('my_tasks')}
            onQuickFieldAction={handleQuickFieldAction}
            onOpenAiReport={() => handleOpenAiReport()}
            onOpenNewEvent={() => setIsNewEventOpen(true)}
          />
        );
      case 'events':
        return (
          <EventsView
            onSelectTask={handleOpenTask}
            onOpenNewEvent={() => setIsNewEventOpen(true)}
            onOpenCloneEvent={handleOpenClone}
            onOpenCloseCheck={handleOpenCloseCheck}
            onOpenTeamInvite={handleOpenInvite}
            onOpenAiReportAssistant={handleOpenAiReport}
          />
        );
      case 'schedule':
        return <ScheduleView onSelectTask={handleOpenTask} />;
      case 'my_tasks':
        return <MyTasksView onSelectTask={handleOpenTask} />;
      case 'more':
        return (
          <MoreView
            onOpenTeamInvite={() => handleOpenInvite()}
            onOpenNewEvent={() => setIsNewEventOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        );
      default:
        return null;
    }
  };

  const isFramed = deviceSkin === 'ios' || deviceSkin === 'android';

  return (
    <div className={`min-h-screen bg-[#07130f] ${isFramed ? 'py-4 sm:py-8 px-2 flex flex-col items-center justify-center' : ''}`}>
      {/* Top Device Bar (when in framed mode) */}
      {isFramed && (
        <div className="mb-3 flex items-center justify-between w-full max-w-sm px-2 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">
              {deviceSkin === 'ios' ? '📱 Apple iOS 모드' : '🤖 Android 모드'}
            </span>
          </div>
          <button
            onClick={() => setDeviceSkin('responsive')}
            className="rounded-lg bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:text-white transition"
          >
            전체화면으로 보기
          </button>
        </div>
      )}

      {/* Main Container with Deep Green Palette framing */}
      <div
        className={`relative w-full overflow-hidden bg-slate-50 transition-all ${
          deviceSkin === 'ios'
            ? 'max-w-[390px] h-[844px] rounded-[50px] ring-12 ring-slate-900 shadow-2xl flex flex-col'
            : deviceSkin === 'android'
            ? 'max-w-[390px] h-[844px] rounded-[36px] ring-10 ring-slate-800 shadow-2xl flex flex-col'
            : 'max-w-xl mx-auto min-h-screen shadow-2xl border-x border-emerald-950/20 flex flex-col'
        }`}
      >
        {/* iOS / Android Native Status Bar Simulation */}
        {isFramed && (
          <div
            className={`sticky top-0 z-40 flex items-center justify-between px-6 pt-3 pb-1.5 text-xs text-slate-900 ${
              deviceSkin === 'ios' ? 'bg-white' : 'bg-white'
            }`}
          >
            <span className="font-bold tracking-tight text-[13px]">09:41</span>
            {deviceSkin === 'ios' && (
              <div className="h-5 w-24 rounded-full bg-black mx-auto" />
            )}
            {deviceSkin === 'android' && (
              <div className="h-3.5 w-3.5 rounded-full bg-black/80 mr-auto ml-2" />
            )}
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <Battery className="h-3.5 w-3.5" />
            </div>
          </div>
        )}

        {/* Global App Header */}
        <AppHeader
          onOpenNewEvent={() => setIsNewEventOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-4">
          {renderView()}
          {/* App Footer */}
          <AppFooter
            onOpenInvite={() => handleOpenInvite()}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenNewEvent={() => setIsNewEventOpen(true)}
          />
        </main>

        {/* Floating Fast Action Button (PRD 27: 1분 현장 빠른 완료) */}
        {activeTab === 'home' && (
          <button
            type="button"
            onClick={handleQuickFieldAction}
            className="fixed bottom-16 right-4 sm:right-auto sm:left-[calc(50%+130px)] z-20 flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:bg-emerald-600 active:scale-95 transition"
            title="현장 1분 빠른 기록"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>1분 현장 기록</span>
          </button>
        )}

        {/* Bottom Navigation */}
        <BottomNav />

        {/* iOS Home Indicator Bar */}
        {deviceSkin === 'ios' && (
          <div className="pointer-events-none pb-1 bg-white flex justify-center">
            <div className="h-1 w-32 rounded-full bg-slate-300" />
          </div>
        )}
      </div>

      {/* Global Modals */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
      />

      <NewEventModal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
      />

      <CloneEventModal
        sourceEvent={cloneSourceEvent}
        isOpen={isCloneOpen}
        onClose={() => {
          setIsCloneOpen(false);
          setCloneSourceEvent(null);
        }}
      />

      <EventCloseModal
        event={closeCheckEvent}
        isOpen={isCloseCheckOpen}
        onClose={() => {
          setIsCloseCheckOpen(false);
          setCloseCheckEvent(null);
        }}
        onOpenAiReportAssistant={() => {
          if (closeCheckEvent) {
            handleOpenAiReport(closeCheckEvent);
          }
        }}
      />

      <AiReportAssistantModal
        event={aiReportTargetEvent}
        isOpen={isAiReportOpen}
        onClose={() => {
          setIsAiReportOpen(false);
          setAiReportTargetEvent(null);
        }}
      />

      <TeamInviteModal
        inviteCode={inviteCodeToShare}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
