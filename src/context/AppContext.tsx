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
  EventResult
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_TASKS,
  INITIAL_ATTACHMENTS,
  INITIAL_ACTIVITIES,
  INITIAL_COMMENTS,
  INITIAL_TEMPLATES,
  INITIAL_NOTIFICATIONS
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
  
  // Actions
  toggleTaskCompletion: (taskId: string, memberId?: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitialStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage:`, e);
  }
  return fallback;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const templates = INITIAL_TEMPLATES;

  // Persist states
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

  // 1. Toggle task completion or member subtask completion
  const toggleTaskCompletion = (taskId: string, memberId?: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const timestamp = nowFormatted();

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
          return {
            ...t,
            assignees: updatedAssignees,
            status: allDone ? 'done' : 'in_progress',
            completedAt: allDone ? timestamp : undefined,
            completedBy: allDone ? currentUser.name : undefined,
          };
        }

        // Toggle entire task
        const nextStatus = t.status === 'done' ? 'in_progress' : 'done';
        const isCompleted = nextStatus === 'done';
        const updatedAssignees = t.assignees.map((m) => ({
          ...m,
          isCompleted: isCompleted,
          completedAt: isCompleted ? timestamp : undefined,
        }));

        return {
          ...t,
          status: nextStatus,
          assignees: updatedAssignees,
          completedAt: isCompleted ? timestamp : undefined,
          completedBy: isCompleted ? currentUser.name : undefined,
        };
      })
    );

    // Auto-record audit log
    const isNowDone = targetTask.status !== 'done';
    if (isNowDone) {
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
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
        id: `notif-${Date.now()}`,
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

  // 2. PRD 27번: Fast 1-minute field action (Work log + photos + docs + complete in 1 shot)
  const quickCompleteTaskWithEvidence = (
    taskId: string,
    workLog: string,
    newImages: { fileName: string; fileUrl: string; fileSize: string }[],
    newDocs: { fileName: string; fileUrl: string; fileSize: string; extension: string }[]
  ) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const timestamp = nowFormatted();

    // 1) Update task
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          workLog: workLog || t.workLog,
          status: 'done',
          completedAt: timestamp,
          completedBy: currentUser.name,
          assignees: t.assignees.map((m) => ({
            ...m,
            isCompleted: true,
            completedAt: timestamp,
          })),
        };
      })
    );

    // 2) Attachments
    const newAttachmentsList: Attachment[] = [];
    newImages.forEach((img, idx) => {
      newAttachmentsList.push({
        id: `att-${Date.now()}-img-${idx}`,
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

    newDocs.forEach((doc, idx) => {
      newAttachmentsList.push({
        id: `att-${Date.now()}-doc-${idx}`,
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

    // 3) Audit Activity
    const actList: Activity[] = [
      {
        id: `act-${Date.now()}-comp`,
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'complete_task',
        message: `✓ ${targetTask.title} 완료`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
        detail: `${currentUser.name}님이 ${timestamp}에 완료했습니다. (${workLog ? '기록: ' + workLog : '기록 완료'})`,
      },
    ];

    if (newImages.length > 0) {
      actList.push({
        id: `act-${Date.now()}-photo`,
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
        id: `act-${Date.now()}-doc`,
        eventId: targetTask.eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        actionType: 'add_doc',
        message: `📄 ${newDocs[0].fileName} 등록`,
        timestamp: `${timeOnly()} ${currentUser.name}`,
      });
    }

    setActivities((prev) => [...actList, ...prev]);

    // 4) Push notification
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: '현장 업무 완료 및 사진 등록',
      body: `✓ ${currentUser.name}님이 [${targetTask.title}]을 완료하고 증빙 자료를 등록했습니다.`,
      type: 'task_completed',
      timestamp: '방금 전',
      read: false,
      eventId: targetTask.eventId,
      taskId: targetTask.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const createTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => [newTask, ...prev]);

    // Activity
    const act: Activity = {
      id: `act-${Date.now()}`,
      eventId: newTask.eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      actionType: 'create_task',
      message: `📋 새 업무 [${newTask.title}] 생성`,
      timestamp: `${timeOnly()} ${currentUser.name}`,
    };
    setActivities((prev) => [act, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setAttachments((prev) => prev.filter((a) => a.taskId !== taskId));
    setComments((prev) => prev.filter((c) => c.taskId !== taskId));
  };

  const addAttachment = (
    attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'uploadedBy'>
  ) => {
    const newAtt: Attachment = {
      ...attachment,
      id: `att-${Date.now()}`,
      uploadedAt: nowFormatted(),
      uploadedBy: currentUser.name,
    };
    setAttachments((prev) => [newAtt, ...prev]);

    const act: Activity = {
      id: `act-${Date.now()}`,
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
      id: `c-${Date.now()}`,
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
        id: `act-${Date.now()}`,
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
    const newId = `evt-${Date.now()}`;
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
        const createdTasks: Task[] = tmpl.tasks.map((t, idx) => ({
          id: `t-${Date.now()}-${idx}`,
          eventId: newId,
          category: t.category,
          title: t.title,
          description: t.description || `${t.title} 관련 업무 체크`,
          dueDate: eventData.date.replace(/\./g, '-'),
          status: 'todo',
          priority: 'medium',
          assignees: [
            {
              id: `tm-${Date.now()}-${idx}`,
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

    const newId = `evt-${Date.now()}`;
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
    const clonedTasks: Task[] = sourceTasks.map((t, idx) => ({
      ...t,
      id: `t-${Date.now()}-${idx}`,
      eventId: newId,
      dueDate: newDate.replace(/\./g, '-'),
      status: 'todo',
      completedAt: undefined,
      completedBy: undefined,
      workLog: undefined,
      assignees: t.assignees.map((a, aidx) => ({
        ...a,
        id: `tm-${Date.now()}-${idx}-${aidx}`,
        isCompleted: false,
        completedAt: undefined,
      })),
      createdAt: new Date().toISOString().split('T')[0],
    }));

    setEvents((prev) => [clonedEvent, ...prev]);
    setTasks((prev) => [...clonedTasks, ...prev]);
    setCurrentEventId(newId);

    const act: Activity = {
      id: `act-${Date.now()}`,
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
      id: `act-${Date.now()}`,
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

  const resetToSampleData = () => {
    setUsers(INITIAL_USERS);
    setCurrentUserId('u-1');
    setEvents(INITIAL_EVENTS);
    setCurrentEventId('evt-1');
    setTasks(INITIAL_TASKS);
    setAttachments(INITIAL_ATTACHMENTS);
    setActivities(INITIAL_ACTIVITIES);
    setComments(INITIAL_COMMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUser: (u: User) => setCurrentUserId(u.id),
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
