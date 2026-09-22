import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Camera,
  Image as ImageIcon,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileCode,
  Send,
  Trash2,
  AlertCircle,
  ExternalLink,
  Users,
  Check,
  Award,
  Wifi,
  WifiOff,
  Database,
  Zap,
} from 'lucide-react';
import { Task, TaskMember } from '../../types';
import { useApp } from '../../context/AppContext';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { ProtocolManualModal } from '../events/ProtocolManualModal';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    users,
    attachments,
    comments,
    toggleTaskCompletion,
    quickCompleteTaskWithEvidence,
    updateTask,
    deleteTask,
    addComment,
    removeAttachment,
    syncState,
  } = useApp();

  const [workLogInput, setWorkLogInput] = useState<string>(task?.workLog || '');
  const [commentText, setCommentText] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCompletedState, setIsCompletedState] = useState<boolean>(task?.status === 'done');
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState<boolean>(false);

  // Staged attachments for instant upload
  const [newImages, setNewImages] = useState<{ fileName: string; fileUrl: string; fileSize: string }[]>([]);
  const [newDocs, setNewDocs] = useState<{ fileName: string; fileUrl: string; fileSize: string; extension: string }[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sync when task changes
  React.useEffect(() => {
    if (task) {
      setWorkLogInput(task.workLog || '');
      setIsCompletedState(task.status === 'done');
      setNewImages([]);
      setNewDocs([]);
      setCommentText('');
    }
  }, [task]);

  // Keyboard navigation: Escape key closes modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const taskAttachments = attachments.filter((a) => a.taskId === task.id);
  const taskComments = comments.filter((c) => c.taskId === task.id);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">✓ 완료</span>;
      case 'delayed':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">⚠️ 지연</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">🟡 진행중</span>;
    }
  };

  const getDocIcon = (ext: string) => {
    const lower = ext.toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(lower)) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-700" />;
    }
    if (['pdf'].includes(lower)) {
      return <FileText className="h-5 w-5 text-rose-600" />;
    }
    if (['hwp', 'hwpx', 'doc', 'docx'].includes(lower)) {
      return <FileText className="h-5 w-5 text-emerald-800" />;
    }
    return <FileCode className="h-5 w-5 text-slate-500" />;
  };

  // Handle Photo Upload from Gallery
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          setNewImages((prev) => [
            ...prev,
            {
              fileName: file.name,
              fileUrl: reader.result as string,
              fileSize: sizeStr,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Document Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop() || 'dat';
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      // Read as base64 or blob URL
      const reader = new FileReader();
      reader.onload = () => {
        setNewDocs((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl: (reader.result as string) || '#',
            fileSize: sizeStr,
            extension: ext,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Instant Camera Shot
  const handleCameraCapture = (blobUrl: string, fileName: string) => {
    setNewImages((prev) => [
      ...prev,
      {
        fileName,
        fileUrl: blobUrl,
        fileSize: '1.8 MB',
      },
    ]);
  };

  // PRD 27번: Save all in 1 Action
  const handleSaveAndComplete = () => {
    quickCompleteTaskWithEvidence(
      task.id,
      workLogInput,
      newImages,
      newDocs
    );
    onClose();
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(task.id, commentText.trim());
    setCommentText('');
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto cursor-pointer"
        onClick={onClose}
      >
        <div
          className="relative my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/50 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {task.category}
              </span>
              {getStatusBadge(task.status)}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  syncState.isOnline
                    ? 'bg-emerald-100/80 text-emerald-800'
                    : 'bg-amber-100 text-amber-900 animate-pulse'
                }`}
              >
                {syncState.isOnline ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>{syncState.isOnline ? '온라인 동기화' : 'IndexedDB 로컬 모드'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm('이 업무를 삭제하시겠습니까?')) {
                    deleteTask(task.id);
                    onClose();
                  }
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                title="업무 삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                id="btn-close-task-detail-x"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                aria-label="팝업창 닫기"
                title="닫기 (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Title & Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{task.title}</h2>
              {task.description && (
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  {task.description}
                </p>
              )}
            </div>

            {/* Protocol (의전) Guidance Card */}
            {(task.category === '의전' ||
              task.title.includes('의전') ||
              task.title.includes('보훈') ||
              task.title.includes('내빈')) && (
              <div className="rounded-2xl border border-amber-300 bg-linear-to-r from-amber-50 via-amber-50/50 to-orange-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                    <Award className="h-4 w-4 text-amber-700" />
                    <span>아산시 민선8기 보훈(報勳) 의전 매뉴얼 지침 적용</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProtocolModalOpen(true)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2"
                  >
                    매뉴얼 전체보기 &gt;
                  </button>
                </div>
                <div className="text-xs text-amber-900/90 leading-relaxed space-y-1">
                  <p>• <strong>좌석 첫줄 우선배치:</strong> 노인회장, 보훈대상자(참전용사·유족), 시를 빛낸 유공자, 아너소사이어티 가입자</p>
                  <p>• <strong>내빈소개 순서:</strong> 시장 ➔ 시의장 ➔ 국회의원 ➔ <strong>노인회장, 보훈·유공단체장</strong> ➔ 주요기관장 ➔ 도의원 ➔ 시의원</p>
                  <p>• <strong>주차 &amp; 요원:</strong> 전용 주차공간 확보 및 거동 불편 시 1:1 의전 요원 안내 동선 편성</p>
                </div>
              </div>
            )}

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">마감일</span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  <span>{task.dueDate}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-medium">우선순위</span>
                <span
                  className={`inline-block font-semibold ${
                    task.priority === 'high'
                      ? 'text-rose-600'
                      : task.priority === 'medium'
                      ? 'text-amber-600'
                      : 'text-slate-600'
                  }`}
                >
                  {task.priority === 'high' ? '높음 (긴급)' : task.priority === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
            </div>

            {/* PRD 8: Team Members Checklist (다중 담당자 참여 및 개별 체크) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-700" />
                  <span>담당자 및 분담 체크</span>
                </label>
                <span className="text-xs text-slate-500">
                  {task.assignees.filter((a) => a.isCompleted).length} / {task.assignees.length} 완료
                </span>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2 sm:p-3">
                {task.assignees.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">배정된 담당자가 없습니다.</p>
                ) : (
                  task.assignees.map((assignee) => (
                    <div
                      key={assignee.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 hover:bg-slate-100/80 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id, assignee.id)}
                          className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                            assignee.isCompleted
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'border-slate-300 bg-white hover:border-emerald-600'
                          }`}
                        >
                          {assignee.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-800 mr-2">
                            {assignee.userName}
                          </span>
                          {assignee.subTaskName && (
                            <span className="text-xs text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded">
                              {assignee.subTaskName}
                            </span>
                          )}
                        </div>
                      </div>

                      {assignee.completedAt ? (
                        <span className="text-xs text-emerald-700 font-bold">
                          ✓ {assignee.completedAt.split(' ')[1]} 완료
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">미완료</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Audit Trail Note (PRD 8) */}
            {task.completedAt && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200/60 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                <div>
                  <span className="font-semibold">{task.completedBy || '담당자'}</span>님이{' '}
                  <span className="font-semibold">{task.completedAt}</span>에 완료했습니다.
                </div>
              </div>
            )}

            {/* PRD 13: 작업내용 기록 */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-1.5 block">
                작업내용 기록 (수행 결과)
              </label>
              <textarea
                value={workLogInput}
                onChange={(e) => setWorkLogInput(e.target.value)}
                placeholder="예: 행사장 전기시설 및 냉난방 시설 정상 작동 확인 완료"
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden transition"
              />
            </div>

            {/* PRD 10, 11: 사진 및 문서 첨부 도구 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800">
                  현장 증빙 자료 첨부
                </label>
                <span className="text-xs text-slate-500">
                  사진 {taskAttachments.filter((a) => a.fileType === 'image').length + newImages.length}개 · 문서 {taskAttachments.filter((a) => a.fileType === 'doc').length + newDocs.length}개
                </span>
              </div>

              {/* Fast Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {/* 1. Camera Capture */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-xs font-semibold">📷 사진 촬영</span>
                </button>

                {/* 2. Gallery Photo Picker */}
                <label className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 hover:bg-slate-100 transition">
                  <ImageIcon className="h-5 w-5 text-emerald-700" />
                  <span className="text-xs font-semibold">🖼 사진 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>

                {/* 3. Document Attachment */}
                <label className="flex flex-col items-center justify-center gap-1 cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 hover:bg-slate-100 transition">
                  <Paperclip className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-semibold">📎 문서 첨부</span>
                  <input
                    type="file"
                    accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.zip"
                    multiple
                    className="hidden"
                    onChange={handleDocUpload}
                  />
                </label>
              </div>

              {/* Staged new images preview */}
              {newImages.length > 0 && (
                <div className="rounded-xl bg-emerald-50/40 p-3 border border-emerald-100">
                  <span className="text-xs font-semibold text-emerald-800 block mb-2">
                    방금 추가된 사진 ({newImages.length}장 - 저장 시 영구 반영)
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {newImages.map((img, idx) => (
                      <div key={idx} className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-emerald-200">
                        <img
                          src={img.fileUrl}
                          alt={img.fileName}
                          className="h-full w-full object-cover cursor-pointer"
                          onClick={() => setPreviewImage(img.fileUrl)}
                        />
                        <button
                          type="button"
                          onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Photos Grid */}
              {taskAttachments.filter((a) => a.fileType === 'image').length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-600 block">
                    기존 등록 사진
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {taskAttachments
                      .filter((a) => a.fileType === 'image')
                      .map((att) => (
                        <div
                          key={att.id}
                          className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105 cursor-pointer"
                            onClick={() => setPreviewImage(att.fileUrl)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition p-1.5 flex flex-col justify-between">
                            <button
                              type="button"
                              onClick={() => removeAttachment(att.id)}
                              className="self-end rounded-full bg-rose-600/90 p-1 text-white hover:bg-rose-600"
                              title="삭제"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            <span className="text-[10px] text-white truncate font-medium">
                              {att.uploadedBy}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Existing & New Documents List (PRD 11) */}
              {(taskAttachments.filter((a) => a.fileType === 'doc').length > 0 || newDocs.length > 0) && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-600 block">
                    첨부 문서 ({taskAttachments.filter((a) => a.fileType === 'doc').length + newDocs.length}개)
                  </span>
                  <div className="space-y-1.5">
                    {/* New staged docs */}
                    {newDocs.map((doc, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {getDocIcon(doc.extension)}
                          <span className="font-medium text-slate-800 truncate">{doc.fileName}</span>
                          <span className="text-slate-400">({doc.fileSize})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewDocs((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Existing docs */}
                    {taskAttachments
                      .filter((a) => a.fileType === 'doc')
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs hover:border-emerald-300 transition"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {getDocIcon(doc.extension)}
                            <div className="overflow-hidden">
                              <span className="font-medium text-slate-800 truncate block">
                                {doc.fileName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {doc.fileSize} · {doc.uploadedBy} · {doc.uploadedAt}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => removeAttachment(doc.id)}
                              className="text-slate-300 hover:text-rose-600 p-1"
                              title="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section (PRD 9, 26) */}
            <div className="border-t border-slate-100 pt-4">
              <label className="text-sm font-bold text-slate-800 mb-2 block">
                업무 댓글 및 실시간 메모 ({taskComments.length})
              </label>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {taskComments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">등록된 댓글이 없습니다.</p>
                ) : (
                  taskComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span>{comment.userName}</span>
                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="팀원과 소통할 댓글을 입력하세요..."
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-xl bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-600 disabled:opacity-40 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Footer Action: PRD 27번 핵심 UX - [완료 처리 및 저장] */}
          <div className="border-t border-slate-200 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2">
            <button
              type="button"
              id="btn-close-task-detail-cancel"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition active:scale-95 shadow-2xs cursor-pointer"
              title="작업 취소 및 팝업창 닫기"
            >
              취소
            </button>

            <button
              type="button"
              onClick={() => {
                updateTask(task.id, {
                  workLog: workLogInput,
                });
                onClose();
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              내용만 임시저장
            </button>

            <button
              type="button"
              onClick={handleSaveAndComplete}
              className="flex-1 flex flex-col items-center justify-center rounded-xl bg-linear-to-r from-emerald-800 to-teal-800 py-2 sm:py-2.5 px-3 text-white shadow-md hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                <Zap className="h-4 w-4 fill-amber-300 text-amber-300" />
                <span>⚡ 1분 현장 완료 체크 & 저장</span>
              </div>
              <span className="text-[10px] text-emerald-200/90 font-medium">
                {syncState.isOnline ? '로컬 IndexedDB 즉시 기록 후 클라우드 동기화' : '오프라인 안심 저장 (복구 시 자동 업로드)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Image Lightbox Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <img
              src={previewImage}
              alt="확대보기"
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      {/* Protocol Manual Modal */}
      <ProtocolManualModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
      />
    </>
  );
};
