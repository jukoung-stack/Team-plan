export type UserRole = 'admin' | 'leader' | 'member';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  phone: string;
  avatarColor: string;
}

export interface TaskMember {
  id: string;
  userId: string;
  userName: string;
  subTaskName?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'delayed';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  eventId: string;
  category: string; // 기획, 홍보, 현장, 계약, 종료 등
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  assignees: TaskMember[];
  workLog?: string; // 실제 수행한 작업내용
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  eventId: string;
  taskId?: string;
  taskTitle?: string;
  fileName: string;
  fileType: 'image' | 'doc';
  fileUrl: string; // base64 or preview url
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  extension: string; // jpg, png, pdf, hwp, xlsx, docx, etc.
  category?: 'task_material' | 'event_general'; // 업무 자료 vs 행사 전체 자료
}

export interface Activity {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  actionType: 'complete_task' | 'add_photo' | 'add_doc' | 'create_task' | 'update_task' | 'comment' | 'close_event';
  message: string;
  timestamp: string; // ISO or formatted
  detail?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface AiDraftReport {
  executiveSummary: string;
  keyOutcomes: string;
  taskExecutionAnalysis: string;
  evidenceSummary: string;
  issuesAndRiskReview: string;
  actionableImprovements: string;
  fullMarkdownReport: string;
  generatedAt: string;
}

export interface AiChecklistRecommendation {
  category: string;
  title: string;
  description: string;
  priority: TaskPriority;
  recommendedDueDateDaysBefore: number;
  suggestedRole?: string;
}

export interface EventResult {
  eventId: string;
  attendeeCount: number;
  revenueOrKeyOutcome: string;
  issues: string;
  improvements: string;
  closedAt?: string;
  closedBy?: string;
  aiDraftReport?: AiDraftReport;
}

export interface EventTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  tasks: Array<{
    category: string;
    title: string;
    description?: string;
    subTasks?: string[];
  }>;
}

export interface EventItem {
  id: string;
  title: string;
  date: string; // YYYY.MM.DD
  endDate?: string;
  location: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed';
  createdBy: string;
  inviteCode: string;
  coverGradient: string;
  result?: EventResult;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'task_assigned' | 'deadline_soon' | 'delayed' | 'task_completed' | 'system';
  timestamp: string;
  read: boolean;
  eventId?: string;
  taskId?: string;
}

export type ActiveTab = 'home' | 'events' | 'schedule' | 'my_tasks' | 'more';
export type DeviceSkin = 'ios' | 'android' | 'responsive';
