import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  EventItem,
  Task,
  Attachment,
  Activity,
  Comment,
  EventTemplate,
  AppNotification,
  ActiveTab,
  DeviceSkin,
  EventResult,
  UserRole,
  EmergencySupportCenter,
  SyncQueueItem,
  NetworkSyncState
} from '../types';
import {
  cacheTaskInDB,
  cacheTasksBatchInDB,
  getAllCachedTasksFromDB,
  deleteCachedTaskFromDB,
  enqueueSyncActionInDB,
  getAllSyncQueueFromDB,
  getPendingSyncQueueFromDB,
  updateSyncQueueItemInDB,
  removeSyncQueueItemFromDB,
  clearSyncedQueueFromDB,
  getIndexedDBStats
} from '../services/indexedDb';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_TASKS,
  INITIAL_ATTACHMENTS,
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
  INITIAL_TEMPLATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_EMERGENCY_CENTER
} from '../data/initialData';

interface AppContextType {
  // State
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  events: EventItem[];
  currentEventId: string;
  setCurrentEventId: (id: string) => void;
  currentEvent: EventItem | undefined;
  tasks: Task[];
  eventTasks: Task[];
  attachments: Attachment[];
  eventAttachments: Attachment[];
  activities: Activity[];
  eventActivities: Activity[];
  comments: Comment[];
  templates: EventTemplate[];
  notifications: AppNotification[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  deviceSkin: DeviceSkin;
  setDeviceSkin: (skin: DeviceSkin) => void;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  assignAdmin: (data: {
    userId?: string;
    name?: string;
    department?: string;
    phone?: string;
  }) => { success: boolean; message: string; admin?: User };
  addTeamMember: (data: {
    name: string;
    department: string;
    phone: string;
    role?: UserRole;
  }) => { success: boolean; message: string; user?: User };
  deleteTeamMember: (userId: string) => { success: boolean; message: string };
  
  // Actions
  toggleTaskCompletion: (taskId: string, memberId?: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  createTasksBatch: (tasksData: Omit<Task, 'id' | 'createdAt'>[]) => void;
  deleteTask: (taskId: string) => void;
  quickCompleteTaskWithEvidence: (
    taskId: string,
    workLog: string,
    newImages: { fileName: string; fileUrl: string; fileSize: string }[],
    newDocs: { fileName: string; fileUrl: string; fileSize: string; extension: string }[]
  ) => void;
  addAttachment: (attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  removeAttachment: (attachmentId: string) => void;
  addComment: (taskId: string, text: string) => void;
  createEvent: (
    eventData: Omit<EventItem, 'id' | 'createdBy' | 'inviteCode'>,
    templateId?: string
  ) => string;
  cloneEvent: (
    sourceEventId: string,
    newTitle: string,
    newDate: string,
    newLocation: string
  ) => string;
  closeEvent: (eventId: string, result: EventResult) => void;
  updateEventResult: (eventId: string, result: EventResult) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationCount: number;
  resetToSampleData: () => void;
  emergencyCenter: EmergencySupportCenter;
  updateEmergencyCenter: (data: Partial<EmergencySupportCenter>) => void;

  // Local-First IndexedDB Sync
  syncState: NetworkSyncState;
  syncQueue: SyncQueueItem[];
  triggerSyncNow: () => Promise<void>;
  toggleSimulateOffline: () => void;
  clearSyncedQueue: () => Promise<void>;
  removeSyncQueueItem: (id: string) => Promise<void>;
  retrySyncItem: (id: string) => Promise<void>;
  lastOfflineActionMessage: string | null;
  clearOfflineActionMessage: () => void;
  
  // 1-Minute Fast Field Action Modal State
  isOneMinuteModalOpen: boolean;
  oneMinuteTargetTaskId?: string;
  openOneMinuteModal: (taskId?: string) => void;
  closeOneMinuteModal: () => void;
}

const STORAGE_KEYS = {
  USERS: 'eventcheck_users',
  CURRENT_USER_ID: 'eventcheck_current_user_id',
  EVENTS: 'eventcheck_events',
  CURRENT_EVENT_ID: 'eventcheck_current_event_id',
  TASKS: 'eventcheck_tasks',
  ATTACHMENTS: 'eventcheck_attachments',
  ACTIVITIES: 'eventcheck_activities',
  COMMENTS: 'eventcheck_comments',
  NOTIFICATIONS: 'eventcheck_notifications',
  DEVICE_SKIN: 'eventcheck_device_skin',
  IS_LOGGED_IN: 'eventcheck_is_logged_in',
  EMERGENCY_CENTER: 'eventcheck_emergency_center',
};

// Counter to ensure unique IDs even if executed within the same millisecond
let idSequence = 0;
const generateUniqueId = (prefix: string) => {
  idSequence = (idSequence + 1) % 100000;
  return `${prefix}-${Date.now()}-${idSequence}-${Math.random().toString(36).substring(2, 7)}`;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitialStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Deduplicate arrays with 'id' property to heal corrupted localStorage from previous turns
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        const deduplicated = parsed.filter((item) => {
          if (item && typeof item === 'object' && 'id' in item) {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
          }
          return true;
        });
        return deduplicated as unknown as T;
      }
      return parsed;
    }
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
  }
  return fallback;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    getInitialStorage(STORAGE_KEYS.IS_LOGGED_IN, true)
  );

  const [users, setUsers] = useState<User[]>(() =>
    getInitialStorage(STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    getInitialStorage(STORAGE_KEYS.CURRENT_USER_ID, 'u-1')
  );

  const [events, setEvents] = useState<EventItem[]>(() =>
    getInitialStorage(STORAGE_KEYS.EVENTS, INITIAL_EVENTS)
  );

  const [currentEventId, setCurrentEventId] = useState<string>(() =>
    getInitialStorage(STORAGE_KEYS.CURRENT_EVENT_ID, 'evt-1')
  );

  const [tasks, setTasks] = useState<Task[]>(() =>
    getInitialStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS)
  );

  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    getInitialStorage(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS)
  );

  const [activities, setActivities] = useState<Activity[]>(() =>
    getInitialStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES)
  );

  const [comments, setComments] = useState<Comment[]>(() =>
    getInitialStorage(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS)
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getInitialStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [deviceSkin, setDeviceSkin] = useState<DeviceSkin>(() =>
    getInitialStorage(STORAGE_KEYS.DEVICE_SKIN, 'responsive')
  );

  const [emergencyCenter, setEmergencyCenter] = useState<EmergencySupportCenter>(() =>
    getInitialStorage(STORAGE_KEYS.EMERGENCY_CENTER, INITIAL_EMERGENCY_CENTER)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const templates = INITIAL_TEMPLATES;

  // Persist states
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_CENTER, JSON.stringify(emergencyCenter));
  }, [emergencyCenter]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, JSON.stringify(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT_ID, JSON.stringify(currentEventId));
  }, [currentEventId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTACHMENTS, JSON.stringify(attachments));
  }, [attachments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEVICE_SKIN, JSON.stringify(deviceSkin));
  }, [deviceSkin]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentEvent = events.find((e) => e.id === currentEventId) || events[0];

  const eventTasks = tasks.filter((t) => t.eventId === currentEventId);
  const eventAttachments = attachments.filter((a) => a.eventId === currentEventId);
  const eventActivities = activities.filter((a) => a.eventId === currentEventId);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const nowFormatted = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  const timeOnly = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  // ==================== LOCAL-FIRST INDEXEDDB SYNC STATE ====================
  const [isOnlineRaw, setIsOnlineRaw] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem('eventcheck_simulated_offline') === 'true';
    } catch {
      return false;
    }
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    try {
      return localStorage.getItem('eventcheck_last_synced_at') || nowFormatted();
    } catch {
      return null;
    }
  });
  const [totalCachedTasksCount, setTotalCachedTasksCount] = useState<number>(0);
  const [lastOfflineActionMessage, setLastOfflineActionMessage] = useState<string | null>(null);
  const [lastOfflineActionAt, setLastOfflineActionAt] = useState<string | null>(null);

  // 1-Minute Fast Field Action modal state (Global singleton for entire app)
  const [isOneMinuteModalOpen, setIsOneMinuteModalOpen] = useState(false);
  const [oneMinuteTargetTaskId, setOneMinuteTargetTaskId] = useState<string | undefined>(undefined);

  const openOneMinuteModal = (taskId?: string) => {
    setOneMinuteTargetTaskId(taskId);
    setIsOneMinuteModalOpen(true);
  };

  const closeOneMinuteModal = () => {
    setIsOneMinuteModalOpen(false);
    setOneMinuteTargetTaskId(undefined);
  };

  const isOnline = isOnlineRaw && !isSimulatedOffline;

  const syncState: NetworkSyncState = {
    isOnline,
    isSimulatedOffline,
    isSyncing,
    pendingCount: syncQueue.filter((q) => q.status === 'pending').length,
    lastSyncedAt,
    totalCachedTasks: totalCachedTasksCount || tasks.length,
    lastOfflineActionAt,
  };

  // Core Sync Engine: process pending sync queue items sequentially
  const syncPendingQueue = async () => {
    if (isSyncing) return;
    if (!isOnline) return;

    setIsSyncing(true);
    try {
      const pendingItems = await getPendingSyncQueueFromDB();
      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          // 1. Mark as syncing
          await updateSyncQueueItemInDB(item.id, { status: 'syncing' });
          setSyncQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'syncing' } : q))
          );

          // Simulate realistic cloud API transmission latency (250ms)
          await new Promise((resolve) => setTimeout(resolve, 250));

          // 2. Mark as synced
          await updateSyncQueueItemInDB(item.id, { status: 'synced' });
          setSyncQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'synced' } : q))
          );
        }

        const syncTime = nowFormatted();
        setLastSyncedAt(syncTime);
        try {
          localStorage.setItem('eventcheck_last_synced_at', syncTime);
        } catch {
          // ignore
        }

        // Add audit activity
        const syncAct: Activity = {
          id: generateUniqueId('act-sync'),
          eventId: currentEventId,
          userId: currentUser.id,
          userName: '클라우드 동기화',
          actionType: 'update_task',
          message: `☁️ 오프라인 현장 작업 ${pendingItems.length}건 동기화 완료`,
          timestamp: `${timeOnly()} 자동반영`,
          detail: `IndexedDB에 로컬 캐시되었던 1분 현장 조치 및 업무 변경 ${pendingItems.length}건이 클라우드에 성공적으로 반영되었습니다.`,
        };
        setActivities((prev) => [syncAct, ...prev]);

        // Push notification
        const syncNotif: AppNotification = {
          id: generateUniqueId('notif-sync'),
          title: '현장 작업 클라우드 동기화 완료',
          body: `오프라인에서 로컬 캐시된 ${pendingItems.length}건의 현장 작업이 클라우드에 안전하게 병합되었습니다.`,
          type: 'system',
          timestamp: '방금 전',
          read: false,
          eventId: currentEventId,
        };
        setNotifications((prev) => [syncNotif, ...prev]);
      } else {
        const syncTime = nowFormatted();
        setLastSyncedAt(syncTime);
      }
    } catch (err) {
      console.error('[SyncEngine] Error syncing pending queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerSyncNow = async () => {
    if (!isOnline && isSimulatedOffline) {
      alert('현재 현장 통신 단절 시뮬레이션 모드입니다. "온라인 복구" 버튼을 누르시면 자동 동기화됩니다.');
      return;
    }
    await syncPendingQueue();
  };

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eventcheck_simulated_offline', String(next));
      } catch {
        // ignore
      }
      if (!next && isOnlineRaw) {
        // Switching back online -> automatically sync
        setTimeout(() => {
          syncPendingQueue();
        }, 300);
      }
      return next;
    });
  };

  const clearSyncedQueue = async () => {
    await clearSyncedQueueFromDB();
    const remaining = await getAllSyncQueueFromDB();
    setSyncQueue(remaining);
  };

  const removeSyncQueueItem = async (id: string) => {
    await removeSyncQueueItemFromDB(id);
    setSyncQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const retrySyncItem = async (id: string) => {
    await updateSyncQueueItemInDB(id, { status: 'pending', error: undefined });
    setSyncQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'pending', error: undefined } : item))
    );
    if (isOnline) {
      setTimeout(() => {
        syncPendingQueue();
      }, 100);
    }
  };

  const clearOfflineActionMessage = () => {
    setLastOfflineActionMessage(null);
  };

  // Sync initialization & network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineRaw(true);
      if (!isSimulatedOffline) {
        setTimeout(() => {
          syncPendingQueue();
        }, 500);
      }
    };
    const handleOffline = () => {
      setIsOnlineRaw(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Hydrate from IndexedDB on startup
    (async () => {
      try {
        // 1. Load sync queue
        const queue = await getAllSyncQueueFromDB();
        setSyncQueue(queue);

        // 2. Cache initial / stored tasks into IndexedDB
        await cacheTasksBatchInDB(tasks);
        const stats = await getIndexedDBStats();
        setTotalCachedTasksCount(stats.cachedTasksCount || tasks.length);

        // 3. Auto sync if online and has pending queue
        const effectiveOnline = (typeof navigator !== 'undefined' ? navigator.onLine : true) && !isSimulatedOffline;
        if (effectiveOnline && queue.some((q) => q.status === 'pending')) {
          setTimeout(() => {
            syncPendingQueue();
          }, 800);
        }
      } catch (err) {
        console.warn('[IndexedDB Hydration error]:', err);
      }
    })();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync tasks changes into IndexedDB
  useEffect(() => {
    if (tasks.length > 0) {
      cacheTasksBatchInDB(tasks).then(async () => {
        const stats = await getIndexedDBStats();
        setTotalCachedTasksCount(stats.cachedTasksCount || tasks.length);
      }).catch(console.warn);
    }
  }, [tasks]);

  // 1. Toggle task completion or member subtask completion (Local-first & IndexedDB cached)
  const toggleTaskCompletion = (taskId: string, memberId?: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const timestamp = nowFormatted();
    let updatedTaskForCache: Task | null = null;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;

        // If specific subtask member is toggled
        if (memberId && t.assignees.length > 0) {
          const updatedAssignees = t.assignees.map((m) => {
            if (m.id === memberId) {
              const nextState = !m.isCompleted;
              return {
                ...m,
                isCompleted: nextState,
                completedAt: nextState ? timestamp : undefined,
              };
            }
            return m;
          });

          // Check if all subtasks are complete
          const allDone = updatedAssignees.every((m) => m.isCompleted);
          const nextTask: Task = {
            ...t,
            assignees: updatedAssignees,
            status: allDone ? 'done' : 'in_progress',
            completedAt: allDone ? timestamp : undefined,
            completedBy: allDone ? currentUser.name : undefined,
          };
          updatedTaskForCache = nextTask;
          return nextTask;
        }

        // Toggle entire task
        const nextStatus = t.status === 'done' ? 'in_progress' : 'done';
        const isCompleted = nextStatus === 'done';
        const updatedAssignees = t.assignees.map((m) => ({
          ...m,
          isCompleted: isCompleted,
          completedAt: isCompleted ? timestamp : undefined,
        }));

        const nextTask: Task = {
          ...t,
          status: nextStatus,
          assignees: updatedAssignees,
          completedAt: isCompleted ? timestamp : undefined,
          completedBy: isCompleted ? currentUser.name : undefined,
        };
        updatedTaskForCache = nextTask;
        return nextTask;
      })
    );

    // Cache updated task in IndexedDB
    if (updatedTaskForCache) {
      cacheTaskInDB(updatedTaskForCache).catch(console.warn);
    }

    // Queue sync action
    const syncItem: SyncQueueItem = {
      id: generateUniqueId('sync'),
      type: 'toggle_completion',
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      eventId: targetTask.eventId,
      summary: `[상태 변경] "${targetTask.title}" (${targetTask.status === 'done' ? '진행중으로 복원' : '완료'})`,
      payload: { taskId, memberId, timestamp },
      timestamp: Date.now(),
      formattedTime: `${timeOnly()}`,
      status: isOnline ? 'syncing' : 'pending',
      retryCount: 0,
      appliedLocallyAt: timestamp,
    };
    enqueueSyncActionInDB(syncItem).catch(console.warn);
    setSyncQueue((prev) => [syncItem, ...prev]);

    if (!isOnline) {
      setLastOfflineActionMessage(`⚡ 오프라인 로컬 저장: [${targetTask.title}] 상태가 IndexedDB에 보관되었습니다.`);
      setLastOfflineActionAt(timestamp);
    } else {
      setTimeout(async () => {
        await updateSyncQueueItemInDB(syncItem.id, { status: 'synced' });
        setSyncQueue((prev) =>
          prev.map((q) => (q.id === syncItem.id ? { ...q, status: 'synced' } : q))
        );
      }, 300);
    }

    // Auto-record audit log
    const isNowDone = targetTask.status !== 'done';
    if (isNowDone) {
      const newActivity: Activity = {
        id: generateUniqueId('act'),
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'complete_task',
        message: `✓ ${targetTask.title} 완료`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
        detail: `${currentUser.name}님이 ${timestamp}에 완료했습니다.`,
      };
      setActivities((prev) => [newActivity, ...prev]);

      // Push notification
      const newNotif: AppNotification = {
        id: generateUniqueId('notif'),
        title: '팀원 업무 완료',
        body: `✓ ${currentUser.name}님이 [${targetTask.title}]을(를) 완료했습니다.`,
        type: 'task_completed',
        timestamp: '방금 전',
        read: false,
        eventId: targetTask.eventId,
        taskId: targetTask.id,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // 2. PRD 27번: Fast 1-minute field action (Work log + photos + docs + complete in 1 shot with IndexedDB Cache)
  const quickCompleteTaskWithEvidence = (
    taskId: string,
    workLog: string,
    newImages: { fileName: string; fileUrl: string; fileSize: string }[],
    newDocs: { fileName: string; fileUrl: string; fileSize: string; extension: string }[]
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const timestamp = nowFormatted();

    // 1) Update task in React State
    const updatedTask: Task = {
      ...targetTask,
      workLog: workLog || targetTask.workLog,
      status: 'done',
      completedAt: timestamp,
      completedBy: currentUser.name,
      assignees: targetTask.assignees.map((m) => ({
        ...m,
        isCompleted: true,
        completedAt: timestamp,
      })),
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updatedTask : t))
    );

    // 2) Cache task immediately to IndexedDB
    cacheTaskInDB(updatedTask).catch(console.warn);

    // 3) Create Sync Queue Item in IndexedDB
    const syncItem: SyncQueueItem = {
      id: generateUniqueId('sync'),
      type: 'quick_field_action',
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      eventId: targetTask.eventId,
      summary: `[1분 현장 완료] "${targetTask.title}" 완료 (작업내용: ${
        workLog ? workLog.slice(0, 25) : '완료'
      }, 사진: ${newImages.length}장, 문서: ${newDocs.length}개)`,
      payload: {
        taskId,
        workLog,
        newImagesCount: newImages.length,
        newDocsCount: newDocs.length,
        completedAt: timestamp,
        completedBy: currentUser.name,
      },
      timestamp: Date.now(),
      formattedTime: `${timeOnly()}`,
      status: isOnline ? 'syncing' : 'pending',
      retryCount: 0,
      appliedLocallyAt: timestamp,
    };
    enqueueSyncActionInDB(syncItem).catch(console.warn);
    setSyncQueue((prev) => [syncItem, ...prev]);

    // Offline toast & message
    if (!isOnline) {
      setLastOfflineActionMessage(
        `⚡ [1분 현장 조치] 네트워크 단절 감지: 내용 및 사진이 IndexedDB에 안전하게 로컬 저장되었습니다.`
      );
      setLastOfflineActionAt(timestamp);
    } else {
      setTimeout(async () => {
        await updateSyncQueueItemInDB(syncItem.id, { status: 'synced' });
        setSyncQueue((prev) =>
          prev.map((q) => (q.id === syncItem.id ? { ...q, status: 'synced' } : q))
        );
        const syncTime = nowFormatted();
        setLastSyncedAt(syncTime);
        try {
          localStorage.setItem('eventcheck_last_synced_at', syncTime);
        } catch {
          // ignore
        }
      }, 400);
    }

    // 4) Attachments
    const newAttachmentsList: Attachment[] = [];
    newImages.forEach((img) => {
      newAttachmentsList.push({
        id: generateUniqueId('att-img'),
        eventId: targetTask.eventId,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        fileName: img.fileName,
        fileType: 'image',
        fileUrl: img.fileUrl,
        fileSize: img.fileSize,
        uploadedBy: currentUser.name,
        uploadedAt: timestamp,
        extension: 'jpg',
        category: 'task_material',
      });
    });

    newDocs.forEach((doc) => {
      newAttachmentsList.push({
        id: generateUniqueId('att-doc'),
        eventId: targetTask.eventId,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        fileName: doc.fileName,
        fileType: 'doc',
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        uploadedBy: currentUser.name,
        uploadedAt: timestamp,
        extension: doc.extension,
        category: 'task_material',
      });
    });

    if (newAttachmentsList.length > 0) {
      setAttachments((prev) => [...newAttachmentsList, ...prev]);
    }

    // 5) Audit Activity
    const actList: Activity[] = [
      {
        id: generateUniqueId('act-comp'),
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'complete_task',
        message: isOnline
          ? `✓ ${targetTask.title} 1분 현장 완료`
          : `⚡ ${targetTask.title} 1분 현장 완료 (오프라인 IndexedDB 저장)`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
        detail: `${currentUser.name}님이 ${timestamp}에 완료했습니다. (${
          workLog ? '기록: ' + workLog : '기록 완료'
        }) [${isOnline ? '클라우드 동기화' : 'IndexedDB 로컬 보관'}]`,
      },
    ];

    if (newImages.length > 0) {
      actList.push({
        id: generateUniqueId('act-photo'),
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'add_photo',
        message: `📷 ${targetTask.title} 사진 ${newImages.length}장 등록`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
      });
    }

    if (newDocs.length > 0) {
      actList.push({
        id: generateUniqueId('act-doc'),
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'add_doc',
        message: `📄 ${newDocs[0].fileName} 등록`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
      });
    }

    setActivities((prev) => [...actList, ...prev]);

    // 6) Push notification
    const newNotif: AppNotification = {
      id: generateUniqueId('notif'),
      title: isOnline ? '현장 업무 완료 및 사진 등록' : '⚡ 1분 현장 조치 오프라인 저장',
      body: isOnline
        ? `✓ ${currentUser.name}님이 [${targetTask.title}]을 완료하고 증빙 자료를 등록했습니다.`
        : `⚡ [${targetTask.title}] 1분 조치 및 증빙이 기기 IndexedDB에 보관되었습니다. 복구 시 자동 전송됩니다.`,
      type: 'task_completed',
      timestamp: '방금 전',
      read: false,
      eventId: targetTask.eventId,
      taskId: targetTask.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    let updatedTaskForCache: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          updatedTaskForCache = updated;
          return updated;
        }
        return t;
      })
    );

    if (updatedTaskForCache) {
      cacheTaskInDB(updatedTaskForCache).catch(console.warn);

      const target = tasks.find((t) => t.id === taskId);
      const syncItem: SyncQueueItem = {
        id: generateUniqueId('sync'),
        type: 'update_task',
        taskId: taskId,
        taskTitle: target ? target.title : '업무',
        eventId: target ? target.eventId : currentEventId,
        summary: `[업무 수정] "${target ? target.title : taskId}" 속성 수정`,
        payload: { taskId, updates },
        timestamp: Date.now(),
        formattedTime: `${timeOnly()}`,
        status: isOnline ? 'syncing' : 'pending',
        retryCount: 0,
        appliedLocallyAt: nowFormatted(),
      };
      enqueueSyncActionInDB(syncItem).catch(console.warn);
      setSyncQueue((prev) => [syncItem, ...prev]);

      if (isOnline) {
        setTimeout(async () => {
          await updateSyncQueueItemInDB(syncItem.id, { status: 'synced' });
          setSyncQueue((prev) =>
            prev.map((q) => (q.id === syncItem.id ? { ...q, status: 'synced' } : q))
          );
        }, 300);
      }
    }
  };

  const createTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateUniqueId('t'),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);

    // Cache in IndexedDB
    cacheTaskInDB(newTask).catch(console.warn);

    // Sync queue item
    const syncItem: SyncQueueItem = {
      id: generateUniqueId('sync'),
      type: 'create_task',
      taskId: newTask.id,
      taskTitle: newTask.title,
      eventId: newTask.eventId,
      summary: `[새 업무 생성] "${newTask.title}" 등록`,
      payload: newTask,
      timestamp: Date.now(),
      formattedTime: `${timeOnly()}`,
      status: isOnline ? 'syncing' : 'pending',
      retryCount: 0,
      appliedLocallyAt: nowFormatted(),
    };
    enqueueSyncActionInDB(syncItem).catch(console.warn);
    setSyncQueue((prev) => [syncItem, ...prev]);

    if (isOnline) {
      setTimeout(async () => {
        await updateSyncQueueItemInDB(syncItem.id, { status: 'synced' });
        setSyncQueue((prev) =>
          prev.map((q) => (q.id === syncItem.id ? { ...q, status: 'synced' } : q))
        );
      }, 300);
    }

    // Activity
    const act: Activity = {
      id: generateUniqueId('act'),
      eventId: newTask.eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'create_task',
      message: `📋 새 업무 [${newTask.title}] 생성`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
    };
    setActivities((prev) => [act, ...prev]);
  };

  // Batch create tasks to safely add multiple recommended tasks without key collision
  const createTasksBatch = (tasksData: Omit<Task, 'id' | 'createdAt'>[]) => {
    if (!tasksData.length) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const newTasks: Task[] = tasksData.map((t) => ({
      ...t,
      id: generateUniqueId('t'),
      createdAt: nowStr,
    }));
    setTasks((prev) => [...newTasks, ...prev]);

    // Cache in IndexedDB
    cacheTasksBatchInDB(newTasks).catch(console.warn);

    const act: Activity = {
      id: generateUniqueId('act'),
      eventId: newTasks[0].eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'create_task',
      message: `📋 맞춤 추천 업무 ${newTasks.length}건 일괄 등록`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
    };
    setActivities((prev) => [act, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setAttachments((prev) => prev.filter((a) => a.taskId !== taskId));
    setComments((prev) => prev.filter((c) => c.taskId !== taskId));

    // Remove from IndexedDB
    deleteCachedTaskFromDB(taskId).catch(console.warn);

    if (target) {
      const syncItem: SyncQueueItem = {
        id: generateUniqueId('sync'),
        type: 'delete_task',
        taskId: taskId,
        taskTitle: target.title,
        eventId: target.eventId,
        summary: `[업무 삭제] "${target.title}" 삭제`,
        payload: { taskId },
        timestamp: Date.now(),
        formattedTime: `${timeOnly()}`,
        status: isOnline ? 'syncing' : 'pending',
        retryCount: 0,
        appliedLocallyAt: nowFormatted(),
      };
      enqueueSyncActionInDB(syncItem).catch(console.warn);
      setSyncQueue((prev) => [syncItem, ...prev]);

      if (isOnline) {
        setTimeout(async () => {
          await updateSyncQueueItemInDB(syncItem.id, { status: 'synced' });
          setSyncQueue((prev) =>
            prev.map((q) => (q.id === syncItem.id ? { ...q, status: 'synced' } : q))
          );
        }, 300);
      }
    }
  };

  const addAttachment = (
    attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'uploadedBy'>
  ) => {
    const newAtt: Attachment = {
      ...attachment,
      id: generateUniqueId('att'),
      uploadedAt: nowFormatted(),
      uploadedBy: currentUser.name,
    };
    setAttachments((prev) => [newAtt, ...prev]);

    const act: Activity = {
      id: generateUniqueId('act'),
      eventId: attachment.eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: attachment.fileType === 'image' ? 'add_photo' : 'add_doc',
      message:
        attachment.fileType === 'image'
          ? `📷 ${attachment.fileName} 사진 등록`
          : `📄 ${attachment.fileName} 문서 등록`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
    };
    setActivities((prev) => [act, ...prev]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const addComment = (taskId: string, text: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    const newComment: Comment = {
      id: generateUniqueId('c'),
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      timestamp: `${String(new Date().getMonth() + 1).padStart(2, '0')}.${String(
        new Date().getDate()
      ).padStart(2, '0')} ${timeOnly()}`,
    };
    setComments((prev) => [...prev, newComment]);

    if (targetTask) {
      const act: Activity = {
        id: generateUniqueId('act'),
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'comment',
        message: `💬 [${targetTask.title}] 댓글 작성: "${text.slice(0, 15)}..."`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
      };
      setActivities((prev) => [act, ...prev]);
    }
  };

  // Create Event with Optional Template (PRD 19)
  const createEvent = (
    eventData: Omit<EventItem, 'id' | 'createdBy' | 'inviteCode'>,
    templateId?: string
  ): string => {
    const newId = generateUniqueId('evt');
    const inviteCode = `EVT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newEvent: EventItem = {
      ...eventData,
      id: newId,
      createdBy: currentUser.id,
      inviteCode,
    };

    setEvents((prev) => [newEvent, ...prev]);
    setCurrentEventId(newId);

    // Apply template tasks if selected
    if (templateId) {
      const tmpl = templates.find((t) => t.id === templateId);
      if (tmpl) {
        const createdTasks: Task[] = tmpl.tasks.map((t) => ({
          id: generateUniqueId('t'),
          eventId: newId,
          category: t.category,
          title: t.title,
          description: t.description || `${t.title} 관련 업무 체크`,
          dueDate: eventData.date.replace(/\./g, '-'),
          status: 'todo',
          priority: 'medium',
          assignees: [
            {
              id: generateUniqueId('tm'),
              userId: currentUser.id,
              userName: currentUser.name,
              isCompleted: false,
            },
          ],
          createdAt: new Date().toISOString().split('T')[0],
        }));
        setTasks((prev) => [...createdTasks, ...prev]);
      }
    }

    return newId;
  };

  // Clone Event (PRD 20)
  const cloneEvent = (
    sourceEventId: string,
    newTitle: string,
    newDate: string,
    newLocation: string
  ): string => {
    const source = events.find((e) => e.id === sourceEventId);
    if (!source) return '';

    const newId = generateUniqueId('evt');
    const inviteCode = `EVT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const clonedEvent: EventItem = {
      ...source,
      id: newId,
      title: newTitle,
      date: newDate,
      location: newLocation,
      status: 'in_progress',
      createdBy: currentUser.id,
      inviteCode,
      result: undefined,
    };

    // Clone tasks resetting completion status
    const sourceTasks = tasks.filter((t) => t.eventId === sourceEventId);
    const clonedTasks: Task[] = sourceTasks.map((t) => ({
      ...t,
      id: generateUniqueId('t'),
      eventId: newId,
      dueDate: newDate.replace(/\./g, '-'),
      status: 'todo',
      completedAt: undefined,
      completedBy: undefined,
      workLog: undefined,
      assignees: t.assignees.map((a) => ({
        ...a,
        id: generateUniqueId('tm'),
        isCompleted: false,
        completedAt: undefined,
      })),
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setEvents((prev) => [clonedEvent, ...prev]);
    setTasks((prev) => [...clonedTasks, ...prev]);
    setCurrentEventId(newId);

    const act: Activity = {
      id: generateUniqueId('act'),
      eventId: newId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'create_task',
      message: `🎉 [${source.title}]에서 복제되어 새 행사 생성 완료`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
    };
    setActivities((prev) => [act, ...prev]);

    return newId;
  };

  // Close Event (PRD 21, 22)
  const closeEvent = (eventId: string, result: EventResult) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: 'completed',
              result: {
                ...result,
                closedAt: nowFormatted(),
                closedBy: currentUser.name,
              },
            }
          : e
      )
    );

    const act: Activity = {
      id: generateUniqueId('act'),
      eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'close_event',
      message: `🏁 행사 최종 종료 및 결과보고 등록 완료`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
      detail: `참석인원: ${result.attendeeCount}명, 성과: ${result.revenueOrKeyOutcome}`,
    };
    setActivities((prev) => [act, ...prev]);
  };

  const updateEventResult = (eventId: string, result: EventResult) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              result: {
                ...result,
                closedAt: result.closedAt || nowFormatted(),
                closedBy: result.closedBy || currentUser.name,
              },
            }
          : e
      )
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const login = (user: User) => {
    setCurrentUserId(user.id);
    setIsLoggedIn(true);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(true));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, JSON.stringify(user.id));
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, JSON.stringify(false));
  };

  // Assign single admin (총괄관리자는 오직 1명만 존재하도록 보장)
  const assignAdmin = (data: {
    userId?: string;
    name?: string;
    department?: string;
    phone?: string;
  }): { success: boolean; message: string; admin?: User } => {
    // 1. 기존 유저 ID로 총괄관리자를 지정/교체하는 경우
    if (data.userId) {
      const targetUser = users.find((u) => u.id === data.userId);
      if (!targetUser) {
        return { success: false, message: '지정할 팀원을 찾을 수 없습니다.' };
      }

      // 기존 총괄관리자는 팀원으로 전환하여 전체 시스템 내 총괄관리자는 1명만 유지
      const updatedUsers = users.map((u) => {
        if (u.id === data.userId) {
          return { ...u, role: 'admin' as UserRole };
        }
        if (u.role === 'admin') {
          return { ...u, role: 'member' as UserRole };
        }
        return u;
      });

      setUsers(updatedUsers);
      const assigned = updatedUsers.find((u) => u.id === data.userId)!;

      const act: Activity = {
        id: `act-${Date.now()}`,
        eventId: currentEventId,
        userId: assigned.id,
        userName: assigned.name,
        actionType: 'update_task',
        message: `👑 총괄관리자(단독 1인) 지정: [${assigned.name}]`,
        timestamp: `${timeOnly()} ${assigned.name}`,
        detail: `총괄관리자 1명 원칙에 따라 기존 총괄관리자는 팀원으로 전환되었습니다.`,
      };
      setActivities((prev) => [act, ...prev]);

      return {
        success: true,
        message: `'${assigned.name}' 님이 총괄관리자(1명)로 지정되었습니다.`,
        admin: assigned,
      };
    }

    // 2. 신규 성명/휴대폰 번호로 총괄관리자 신규 지정
    const trimmedName = (data.name || '').trim();
    if (!trimmedName) {
      return { success: false, message: '총괄관리자 성명(한글)을 입력해주세요.' };
    }

    const koreanNameRegex = /^[가-힣\s]{2,10}$/;
    if (!koreanNameRegex.test(trimmedName)) {
      return {
        success: false,
        message: '총괄관리자 성명은 2~10자의 한글 이름으로 입력해야 합니다. (예: 홍길동)',
      };
    }

    const trimmedPhone = (data.phone || '').trim();
    const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9) {
      return {
        success: false,
        message: '유효한 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)',
      };
    }

    let formattedPhone = trimmedPhone;
    if (phoneDigits.length === 11 && phoneDigits.startsWith('010')) {
      formattedPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`;
    }

    // 기존 유저 중 동일한 이름이 있으면 해당 유저를 총괄관리자로 승격
    const existingIndex = users.findIndex(
      (u) => u.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    let finalAdmin: User;
    if (existingIndex !== -1) {
      const updatedUsers = users.map((u, idx) => {
        if (idx === existingIndex) {
          return {
            ...u,
            role: 'admin' as UserRole,
            phone: formattedPhone,
            department: data.department?.trim() || u.department || '행사총괄운영국',
          };
        }
        if (u.role === 'admin') {
          return { ...u, role: 'member' as UserRole };
        }
        return u;
      });
      setUsers(updatedUsers);
      finalAdmin = updatedUsers[existingIndex];
    } else {
      const newAdmin: User = {
        id: `u-admin-${Date.now()}`,
        name: trimmedName,
        role: 'admin',
        department: data.department?.trim() || '행사총괄운영국',
        phone: formattedPhone,
        avatarColor: 'bg-slate-900',
      };
      // 기존 admin 계정들은 팀원으로 전환 (총괄관리자는 오직 1명)
      const demoted = users.map((u) =>
        u.role === 'admin' ? { ...u, role: 'member' as UserRole } : u
      );
      setUsers([newAdmin, ...demoted]);
      finalAdmin = newAdmin;
    }

    const act: Activity = {
      id: `act-${Date.now()}`,
      eventId: currentEventId,
      userId: finalAdmin.id,
      userName: finalAdmin.name,
      actionType: 'update_task',
      message: `👑 총괄관리자(단독 1인) 신규 지정: [${finalAdmin.name}]`,
      timestamp: `${timeOnly()} ${finalAdmin.name}`,
      detail: `연락처: ${finalAdmin.phone}, 부서: ${finalAdmin.department}`,
    };
    setActivities((prev) => [act, ...prev]);

    return {
      success: true,
      message: `'${finalAdmin.name}' 님이 총괄관리자(1명)로 지정되었습니다. 이제 팀원을 입력하여 지정할 수 있습니다.`,
      admin: finalAdmin,
    };
  };

  const addTeamMember = (data: {
    name: string;
    department: string;
    phone: string;
    role?: UserRole;
  }): { success: boolean; message: string; user?: User } => {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, message: '팀원명을 입력해주세요.' };
    }

    // Must be Korean name (2~10 Korean characters)
    const koreanNameRegex = /^[가-힣\s]{2,10}$/;
    if (!koreanNameRegex.test(trimmedName)) {
      return {
        success: false,
        message: '팀원명은 2~10자의 한글 이름으로 입력해야 합니다. (예: 홍길동)',
      };
    }

    // Check duplicate name
    if (users.some((u) => u.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return {
        success: false,
        message: `'${trimmedName}' 이름의 팀원이 이미 등록되어 있습니다. 다른 이름을 사용하거나 직함을 병기해주세요.`,
      };
    }

    const trimmedPhone = data.phone.trim();
    const phoneDigits = trimmedPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 9) {
      return {
        success: false,
        message: '유효한 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)',
      };
    }

    // Format phone if standard 11 digits
    let formattedPhone = trimmedPhone;
    if (phoneDigits.length === 11 && phoneDigits.startsWith('010')) {
      formattedPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`;
    }

    const avatarColors = [
      'bg-blue-600',
      'bg-emerald-600',
      'bg-amber-600',
      'bg-violet-600',
      'bg-teal-600',
      'bg-indigo-600',
      'bg-rose-600',
      'bg-cyan-600',
    ];
    const assignedColor = avatarColors[users.length % avatarColors.length];

    // 총괄관리자는 단 1명이므로 팀원 등록 시 role은 member 또는 leader만 허용
    const assignedRole: UserRole = data.role === 'leader' ? 'leader' : 'member';

    const newMember: User = {
      id: `u-${Date.now()}`,
      name: trimmedName,
      role: assignedRole,
      department: data.department.trim() || '현장운영팀',
      phone: formattedPhone,
      avatarColor: assignedColor,
    };

    setUsers((prev) => [...prev, newMember]);

    const act: Activity = {
      id: `act-${Date.now()}`,
      eventId: currentEventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'create_task',
      message: `👤 신규 팀원 '${newMember.name}'(${newMember.department}) 등록 완료`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
      detail: `연락처: ${newMember.phone}, 직책: ${assignedRole === 'leader' ? '팀장' : '팀원'}`,
    };
    setActivities((prev) => [act, ...prev]);

    return {
      success: true,
      message: `'${newMember.name}' 팀원이 등록되었습니다. 이제 해당 이름과 휴대폰 번호로 로그인이 가능합니다.`,
      user: newMember,
    };
  };

  const deleteTeamMember = (userId: string): { success: boolean; message: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, message: '해당 팀원을 찾을 수 없습니다.' };
    }
    if (target.role === 'admin') {
      return {
        success: false,
        message: '총괄관리자는 시스템에 반드시 1명이 유지되어야 하므로 삭제할 수 없습니다. 다른 팀원을 총괄관리자로 먼저 지정해주세요.',
      };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // If current logged-in user was deleted, fallback to admin
    if (currentUserId === userId) {
      const admin = users.find((u) => u.role === 'admin') || users[0];
      setCurrentUserId(admin.id);
    }

    return {
      success: true,
      message: `'${target.name}' 팀원이 삭제되었습니다.`,
    };
  };

  const updateEmergencyCenter = (data: Partial<EmergencySupportCenter>) => {
    const now = new Date();
    const formattedTime = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated: EmergencySupportCenter = {
      ...emergencyCenter,
      ...data,
      updatedAt: formattedTime,
      updatedBy: currentUser.name || '총괄관리자',
    };
    setEmergencyCenter(updated);

    const activityId = generateUniqueId('act');
    const newAct: Activity = {
      id: activityId,
      eventId: currentEventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'update_task',
      message: `🚨 총괄관리자가 현장 긴급지원센터 연락망·운영 정보를 업데이트했습니다.`,
      timestamp: '방금 전',
      detail: `전화: ${updated.phone} | 상황실: ${updated.location}`,
    };
    setActivities((prev) => [newAct, ...prev]);

    const notifId = generateUniqueId('notif');
    const newNotif: AppNotification = {
      id: notifId,
      title: '현장 긴급지원센터 정보 업데이트',
      body: `🚨 [${currentUser.name} 총괄관리자] 현장 긴급지원센터 연락망(☎ ${updated.phone}) 및 상황실 위치(${updated.location})가 등록되었습니다.`,
      type: 'system',
      timestamp: '방금 전',
      read: false,
      eventId: currentEventId,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const resetToSampleData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserId('u-1');
    setIsLoggedIn(true);
    setEvents(INITIAL_EVENTS);
    setCurrentEventId('evt-1');
    setTasks(INITIAL_TASKS);
    setAttachments(INITIAL_ATTACHMENTS);
    setActivities(INITIAL_ACTIVITIES);
    setComments(INITIAL_COMMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setEmergencyCenter(INITIAL_EMERGENCY_CENTER);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser: (u: User) => setCurrentUserId(u.id),
        isLoggedIn,
        login,
        logout,
        assignAdmin,
        addTeamMember,
        deleteTeamMember,
        events,
        currentEventId,
        setCurrentEventId,
        currentEvent,
        tasks,
        eventTasks,
        attachments,
        eventAttachments,
        activities,
        eventActivities,
        comments,
        templates,
        notifications,
        activeTab,
        setActiveTab,
        deviceSkin,
        setDeviceSkin,
        toggleTaskCompletion,
        updateTask,
        createTask,
        createTasksBatch,
        deleteTask,
        quickCompleteTaskWithEvidence,
        addAttachment,
        removeAttachment,
        addComment,
        createEvent,
        cloneEvent,
        closeEvent,
        updateEventResult,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationCount,
        resetToSampleData,
        emergencyCenter,
        updateEmergencyCenter,
        syncState,
        syncQueue,
        triggerSyncNow,
        toggleSimulateOffline,
        clearSyncedQueue,
        removeSyncQueueItem,
        retrySyncItem,
        lastOfflineActionMessage,
        clearOfflineActionMessage,
        isOneMinuteModalOpen,
        oneMinuteTargetTaskId,
        openOneMinuteModal,
        closeOneMinuteModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
