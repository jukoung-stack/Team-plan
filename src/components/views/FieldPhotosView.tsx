import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  Sparkles,
  Calendar,
  Filter,
  Plus,
  Trash2,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  User,
  Tag,
  Search,
  X,
  ChevronDown,
  UploadCloud,
  FileImage,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Attachment, EventItem, Task } from '../../types';

interface FieldPhotosViewProps {
  onOpenAiReport: (event?: EventItem) => void;
  onSelectTask?: (task: Task) => void;
}

// Quick Presets for 1-minute field photo simulation
const FIELD_PHOTO_PRESETS = [
  {
    title: '광장 메인 무대 트러스 점검',
    taskTitle: '행사장 설치',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    memo: '무대 조명 및 스피커 리깅 안전 점검 완료 (수평도 이상 없음)',
  },
  {
    title: '전기 배전반 및 예비 발전차 점검',
    taskTitle: '행사장 점검',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    memo: '행사장 3개 구역 전력 분전반 누전 차단기 사전 부하 테스트 완료',
  },
  {
    title: '입구 대형 안내 배너 현장 시공',
    taskTitle: '현수막 설치',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    memo: '정문 관람객 유도 현수막 및 종합 안내도 부착 완료',
  },
  {
    title: '행사 공식 포스터 및 리플렛 검수',
    taskTitle: '홍보물 제작',
    url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80',
    memo: '공식 팸플릿 2,000부 인쇄 납품 수령 및 안내데스크 비치',
  },
  {
    title: '현장 비상 소화기 및 구급약품 비치',
    taskTitle: '행사장 점검',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    memo: '상황실 내 응급 구급함 및 3.3kg 분말소화기 4대 점검 완료',
  },
  {
    title: '체험 부스 테이블 및 캐노피 텐트 설치',
    taskTitle: '행사 물품 확인 및 검수',
    url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=80',
    memo: '농특산물 직거래 부스 24개동 고정 팩 시공 및 테이블 세팅',
  },
];

export const FieldPhotosView: React.FC<FieldPhotosViewProps> = ({
  onOpenAiReport,
  onSelectTask,
}) => {
  const {
    events,
    currentEvent,
    currentEventId,
    setCurrentEventId,
    attachments,
    tasks,
    currentUser,
    addAttachment,
    removeAttachment,
  } = useApp();

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>(currentEventId || 'all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Attachment | null>(null);

  // Upload Form State
  const [formEventId, setFormEventId] = useState<string>(currentEventId || events[0]?.id || 'evt-1');
  const [formDate, setFormDate] = useState<string>('2026-09-18');
  const [formTime, setFormTime] = useState<string>('15:30');
  const [formTaskId, setFormTaskId] = useState<string>('');
  const [formFileName, setFormFileName] = useState<string>('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>('');
  const [formMemo, setFormMemo] = useState<string>('');
  const [presetIndex, setPresetIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // All image attachments
  const allPhotos = useMemo(() => {
    return attachments.filter((a) => a.fileType === 'image');
  }, [attachments]);

  // Filtered by event
  const eventPhotos = useMemo(() => {
    let list = allPhotos;
    if (selectedEventId !== 'all') {
      list = list.filter((p) => p.eventId === selectedEventId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.fileName.toLowerCase().includes(q) ||
          (p.taskTitle && p.taskTitle.toLowerCase().includes(q)) ||
          p.uploadedBy.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allPhotos, selectedEventId, searchQuery]);

  // Extract dates and group
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Attachment[]>();

    eventPhotos.forEach((photo) => {
      // Normalizing date string from "2026.09.18 14:15" or "2026-09-18"
      const rawDate = photo.uploadedAt.split(' ')[0] || '2026.09.18';
      const normalizedDate = rawDate.replace(/-/g, '.');
      if (!map.has(normalizedDate)) {
        map.set(normalizedDate, []);
      }
      map.get(normalizedDate)!.push(photo);
    });

    // Sort dates descending
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((date) => ({
      date,
      photos: map.get(date)!.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    }));
  }, [eventPhotos]);

  // Distinct dates for quick filter chips
  const distinctDates = useMemo(() => {
    const dates = new Set<string>();
    allPhotos.forEach((p) => {
      const rawDate = p.uploadedAt.split(' ')[0] || '2026.09.18';
      dates.add(rawDate.replace(/-/g, '.'));
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [allPhotos]);

  // Active target event object
  const activeEvent = useMemo(() => {
    if (selectedEventId === 'all') {
      return currentEvent || events[0];
    }
    return events.find((e) => e.id === selectedEventId) || currentEvent || events[0];
  }, [selectedEventId, currentEvent, events]);

  // Filter tasks for upload form
  const formEventTasks = useMemo(() => {
    return tasks.filter((t) => t.eventId === formEventId);
  }, [tasks, formEventId]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFileName(file.name);
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (loadEvt.target?.result) {
          setFormPhotoUrl(loadEvt.target.result as string);
          setPresetIndex(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select Preset Photo
  const handleSelectPreset = (preset: typeof FIELD_PHOTO_PRESETS[0], idx: number) => {
    setPresetIndex(idx);
    setFormPhotoUrl(preset.url);
    setFormFileName(`${preset.title.replace(/\s+/g, '_')}.jpg`);
    setFormMemo(preset.memo);
    const matchedTask = formEventTasks.find((t) => t.title.includes(preset.taskTitle));
    if (matchedTask) {
      setFormTaskId(matchedTask.id);
    }
  };

  // Submit New Field Photo
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhotoUrl) {
      alert('현장 사진을 촬영하거나 선택해주세요.');
      return;
    }

    const matchedTask = tasks.find((t) => t.id === formTaskId);
    const formattedDate = formDate.replace(/-/g, '.');
    const fullUploadedAt = `${formattedDate} ${formTime}`;

    addAttachment({
      eventId: formEventId,
      taskId: formTaskId || undefined,
      taskTitle: matchedTask ? matchedTask.title : formMemo ? formMemo.slice(0, 20) : '1분 현장 점검',
      fileName: formFileName || `현장사진_${formDate}_${formTime.replace(':', '')}.jpg`,
      fileType: 'image',
      fileUrl: formPhotoUrl,
      fileSize: '3.1 MB',
      extension: 'jpg',
      category: 'task_material',
    });

    // Reset and close
    setIsUploadModalOpen(false);
    setFormPhotoUrl('');
    setFormFileName('');
    setFormMemo('');
    setPresetIndex(null);
    setSelectedEventId(formEventId);
    setSelectedDateFilter('all');
  };

  const handleOpenUploadWithEvent = (evtId?: string) => {
    const target = evtId || (selectedEventId !== 'all' ? selectedEventId : currentEventId);
    setFormEventId(target);
    setFormDate('2026-09-18');
    setFormTime(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    );
    // default to first preset for instant smooth experience
    handleSelectPreset(FIELD_PHOTO_PRESETS[0], 0);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-12 pt-2 break-keep">
      {/* 1. Top Banner: Title & 2 Main Actions (1분 사진 등록 & AI 결과보고서 작성) */}
      <div className="rounded-3xl bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-4 sm:p-5 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white font-black text-xs shadow-xs">
                📷
              </span>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                1분 현장기록 사진첩
              </h1>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                실시간 아카이빙
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed max-w-xl">
              행사별 현장 사진을 날짜별 타임라인으로 기록하고, 누적된 사진과 업무 로그를 기반으로 <strong>Google Gemini AI 보고서 초안</strong>을 원클릭 작성합니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* 1-Minute Photo Shutter/Upload Button */}
            <button
              type="button"
              onClick={() => handleOpenUploadWithEvent()}
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-emerald-900 shadow-md hover:bg-emerald-50 active:scale-95 transition"
            >
              <Camera className="h-4 w-4 text-emerald-700" />
              <span>1분 사진 촬영·등록</span>
            </button>

            {/* AI Report Generation Button (Gemini) */}
            <button
              type="button"
              onClick={() => onOpenAiReport(activeEvent)}
              className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md hover:from-amber-300 hover:to-amber-400 active:scale-95 transition"
              title="지금 행사 내용을 바탕으로 제미나이 보고서 초안 작성"
            >
              <Sparkles className="h-4 w-4 text-slate-950" />
              <span>AI 보고서 초안 작성 (Gemini)</span>
            </button>
          </div>
        </div>

        {/* Real-time stats bar */}
        <div className="mt-4 pt-3 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-200">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-emerald-300/80">전체 보관 사진: </span>
              <strong className="text-white font-black">{allPhotos.length}장</strong>
            </div>
            <div>
              <span className="text-emerald-300/80">기록 일자: </span>
              <strong className="text-white font-black">{distinctDates.length}일간</strong>
            </div>
            <div>
              <span className="text-emerald-300/80">현재 행사: </span>
              <strong className="text-white font-black">{activeEvent?.title || '선택 없음'}</strong>
            </div>
          </div>
          <span className="text-[10px] text-emerald-300/90 font-mono">
            SSL 256-bit 클라우드 백업 보관 중
          </span>
        </div>
      </div>

      {/* 2. Event Selector Chips (행사별 사진 필터) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-700" />
            <span>행사별 사진 선택:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            총 {events.length}개 행사 진행 중
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedEventId('all');
              setSelectedDateFilter('all');
            }}
            className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
              selectedEventId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>전체 행사 사진</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                selectedEventId === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {allPhotos.length}
            </span>
          </button>

          {events.map((evt) => {
            const isSelected = selectedEventId === evt.id;
            const photoCount = allPhotos.filter((p) => p.eventId === evt.id).length;
            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => {
                  setSelectedEventId(evt.id);
                  setCurrentEventId(evt.id);
                  setSelectedDateFilter('all');
                }}
                className={`shrink-0 rounded-2xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
                }`}
              >
                <span>{evt.title}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {photoCount}장
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Date Timeline Filter & Search Bar */}
      <div className="rounded-2xl bg-white p-3 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0 ml-1 mr-0.5" />
          <span className="text-[11px] font-bold text-slate-400 shrink-0">날짜:</span>
          <button
            type="button"
            onClick={() => setSelectedDateFilter('all')}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
              selectedDateFilter === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 일자
          </button>
          {distinctDates.map((dt) => {
            const isToday = dt === '2026.09.18';
            return (
              <button
                key={dt}
                type="button"
                onClick={() => setSelectedDateFilter(dt)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
                  selectedDateFilter === dt
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{dt}</span>
                {isToday && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative shrink-0 sm:w-56">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="사진명, 업무명, 작성자 검색"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Grouped Photos by Date (각 행사의 사진을 날짜에 맞게 기록) */}
      {groupedByDate.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">등록된 현장 사진이 없습니다</h3>
          <p className="mt-1 text-xs text-slate-400">
            [1분 사진 촬영·등록] 버튼을 눌러 첫 번째 현장 사진과 점검 내역을 기록해보세요.
          </p>
          <button
            type="button"
            onClick={() => handleOpenUploadWithEvent()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>첫 현장 사진 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate
            .filter((group) => selectedDateFilter === 'all' || group.date === selectedDateFilter)
            .map((group) => {
              const isToday = group.date === '2026.09.18';
              return (
                <section key={group.date} className="space-y-3">
                  {/* Date Section Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl bg-slate-100/95 backdrop-blur-md px-4 py-2.5 border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white font-bold text-xs">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-black text-slate-900">
                            {group.date}
                          </h2>
                          {isToday && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              오늘 (행사 D-6)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">
                        {group.photos.length}장의 사진 기록
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormDate(group.date.replace(/\./g, '-'));
                          handleOpenUploadWithEvent();
                        }}
                        className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 transition flex items-center gap-1"
                        title="이 날짜에 사진 추가 등록"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>사진 추가</span>
                      </button>
                    </div>
                  </div>

                  {/* Photo Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {group.photos.map((photo) => {
                      const photoEvent = events.find((e) => e.id === photo.eventId);
                      return (
                        <div
                          key={photo.id}
                          className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition overflow-hidden"
                        >
                          {/* Photo Thumbnail Container */}
                          <div
                            onClick={() => setViewingPhoto(photo)}
                            className="relative aspect-16/10 w-full bg-slate-100 cursor-pointer overflow-hidden"
                          >
                            <img
                              src={photo.fileUrl}
                              alt={photo.fileName}
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <span className="rounded-full bg-white/90 p-2 text-slate-900 shadow-md">
                                <Eye className="h-4 w-4" />
                              </span>
                              <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded-md">
                                크게 보기
                              </span>
                            </div>

                            {/* Top Badges */}
                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                              {photoEvent && (
                                <span className="rounded-md bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                                  {photoEvent.title.length > 12 ? photoEvent.title.slice(0, 12) + '...' : photoEvent.title}
                                </span>
                              )}
                            </div>

                            <div className="absolute top-2 right-2">
                              <span className="rounded-md bg-emerald-950/80 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-200">
                                {photo.uploadedAt.split(' ')[1] || '12:00'}
                              </span>
                            </div>
                          </div>

                          {/* Photo Metadata Card Body */}
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              {/* Task linkage if available */}
                              {photo.taskTitle && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 mb-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{photo.taskTitle}</span>
                                </div>
                              )}

                              <h3 className="text-xs font-black text-slate-900 truncate" title={photo.fileName}>
                                {photo.fileName}
                              </h3>

                              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-slate-400" />
                                  <span>{photo.uploadedBy}</span>
                                </span>
                                <span>•</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {photo.fileSize}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => setViewingPhoto(photo)}
                                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                              >
                                <span>상세 확인</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </button>

                              <div className="flex items-center gap-1.5">
                                <a
                                  href={photo.fileUrl}
                                  download={photo.fileName}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                                  title="다운로드"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`'${photo.fileName}' 사진을 삭제하시겠습니까?`)) {
                                      removeAttachment(photo.id);
                                    }
                                  }}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="사진 삭제"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>
      )}

      {/* 5. Floating / Sticky Gemini Report Action Strip */}
      <div className="rounded-3xl bg-linear-to-r from-emerald-950 to-slate-900 p-4 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-800/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-amber-300">
              AI 행사 결과 보고서 자동 초안 생성
            </h3>
            <p className="text-[11px] text-slate-300">
              지금 선택된 행사(<strong>{activeEvent?.title}</strong>)의 체크리스트 달성률과 1분 사진첩 사진들을 분석하여 Gemini가 공문서 양식 초안을 작성합니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenAiReport(activeEvent)}
          className="rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 text-xs transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          <span>지금 행사 보고서 초안 생성 요청</span>
        </button>
      </div>

      {/* 6. Modal: 1-Minute Photo Registration (1분 현장 사진 촬영/등록 모달) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800 text-white font-black text-sm">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    1분 현장 사진 촬영 및 기록
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    현장 상황을 즉시 사진으로 찍고 날짜·시간과 함께 저장합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Form */}
            <form onSubmit={handleSavePhoto} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Target Event Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  기록할 행사 선택 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formEventId}
                  onChange={(e) => {
                    setFormEventId(e.target.value);
                    setFormTaskId('');
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 font-medium focus:bg-white focus:border-emerald-700 focus:outline-none"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({e.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Selection (날짜에 맞게 기록) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    촬영·기록 일자 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 font-medium focus:bg-white focus:border-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    기록 시간 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 font-medium focus:bg-white focus:border-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Photo Input (Camera/File or Quick Presets) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  현장 사진 선택 또는 촬영 <span className="text-rose-500">*</span>
                </label>

                {/* File Upload Button */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 font-bold text-slate-700 transition active:scale-98 border border-slate-200"
                  >
                    <Camera className="h-4 w-4 text-emerald-700" />
                    <span>카메라 촬영 / 갤러리 업로드</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Instant Preset Buttons for 1-minute test */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    ⚡ 현장 시나리오 프리셋 사진 (원클릭 선택):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {FIELD_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.title}
                        type="button"
                        onClick={() => handleSelectPreset(preset, idx)}
                        className={`p-1.5 rounded-xl border text-left transition flex items-center gap-1.5 ${
                          presetIndex === idx
                            ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="h-7 w-7 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-[10px] leading-tight truncate">{preset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Preview */}
                {formPhotoUrl && (
                  <div className="mt-3 relative rounded-2xl overflow-hidden border border-emerald-700/40 bg-slate-900 aspect-16/9">
                    <img
                      src={formPhotoUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/70 backdrop-blur-xs p-2 text-[11px] text-white flex items-center justify-between">
                      <span className="truncate">{formFileName}</span>
                      <span className="text-emerald-300 font-mono text-[10px]">
                        {formDate} {formTime}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Linkage (선택) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  연계 업무 선택 (선택 사항)
                </label>
                <select
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 font-medium focus:bg-white focus:border-emerald-700 focus:outline-none"
                >
                  <option value="">-- 특정 업무 없이 일반 현장 사진으로 등록 --</option>
                  {formEventTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.title} ({t.status === 'done' ? '완료' : '진행중'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-Minute Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1분 현장 점검 메모
                </label>
                <textarea
                  rows={2}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  placeholder="예: 무대 트러스 조립 안전 점검 이상 없음, 분전반 전력 정상 확인"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-slate-50 placeholder-slate-400 focus:bg-white focus:border-emerald-700 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Uploader Indicator */}
              <div className="rounded-xl bg-slate-100 p-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                <span>기록 담당자:</span>
                <strong className="text-slate-800 font-bold">
                  {currentUser.name} ({currentUser.department})
                </strong>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <Camera className="h-4 w-4" />
                  <span>사진첩에 저장 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Full Photo Zoom Viewer */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-5 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-xs truncate max-w-sm sm:max-w-md">
                    {viewingPhoto.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {viewingPhoto.uploadedAt} · 등록자: {viewingPhoto.uploadedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingPhoto.fileUrl}
                  download={viewingPhoto.fileName}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>다운로드</span>
                </a>
                <button
                  type="button"
                  onClick={() => setViewingPhoto(null)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Photo Center */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-auto p-2">
              <img
                src={viewingPhoto.fileUrl}
                alt={viewingPhoto.fileName}
                className="max-h-[68vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Photo Bottom Details */}
            <div className="bg-slate-950 px-5 py-3 text-xs text-slate-300 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {viewingPhoto.taskTitle && (
                  <div>
                    <span className="text-slate-500 text-[10px] block">연계 업무</span>
                    <strong className="text-emerald-400 font-bold">
                      {viewingPhoto.taskTitle}
                    </strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-[10px] block">파일 크기</span>
                  <span className="font-mono text-slate-200">{viewingPhoto.fileSize}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewingPhoto(null);
                  onOpenAiReport(activeEvent);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3.5 py-1.5 text-xs transition active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-950" />
                <span>이 행사 AI 보고서 초안 열기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
