import React, { useState } from 'react';
import {
  X,
  Award,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Car,
  Scissors,
  BookmarkCheck,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EventItem } from '../../types';

interface ProtocolManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: EventItem | null;
  onOpenTaskDetail?: (taskId: string) => void;
}

export const ProtocolManualModal: React.FC<ProtocolManualModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { currentEvent, eventTasks, createTask } = useApp();
  const activeEvent = event || currentEvent;

  const [copiedScenario, setCopiedScenario] = useState(false);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'order' | 'seating' | 'tasks'>('summary');

  if (!isOpen) return null;

  // 5 standard protocol checklist tasks per manual
  const PROTOCOL_TASKS_TO_APPLY = [
    {
      category: '의전',
      title: '보훈대상자·노인회장 첫줄 좌석 및 가족석(유족) 우대 배치도 확정',
      description: '참전용사, 유족, 노인회장, 아너소사이어티 가입자 등 첫줄 최우선 배치 및 명패 부착 (행사 성격에 맞게 유족 앞자리 배려)',
      priority: 'high' as const,
      dueDateOffsetDays: 3,
    },
    {
      category: '의전',
      title: '시 주관 내빈소개 공식 순서표 확정 및 사회자 시나리오 사전 검토',
      description: '순서: 시장 ➔ 시의장 ➔ 국회의원 ➔ 노인회장, 보훈·유공단체장 ➔ 주요기관장 ➔ 도의원 ➔ 시의원 (누락 방지)',
      priority: 'high' as const,
      dueDateOffsetDays: 2,
    },
    {
      category: '의전',
      title: '초청 범위 보훈·유공 대상자 우선 초청장 발송 및 참석여부 전수 확인',
      description: '국가 및 지역 발전 공헌자, 봉사자, 보훈단체 회원 초청 명단 사전 확보 및 수신 확인',
      priority: 'medium' as const,
      dueDateOffsetDays: 7,
    },
    {
      category: '의전',
      title: '의전 대상자 전용 주차구역 확보 및 전담 의전 요원 안내 편성',
      description: '행사장 입구 인근 전용 주차면 10면 이상 확보, 승하차 보조 및 좌석 착석 동선 1:1 의전 요원 배치',
      priority: 'high' as const,
      dueDateOffsetDays: 1,
    },
    {
      category: '의전',
      title: '주요 공식 이벤트(테이프 커팅/케이크 커팅/건배제의) 의전 대상자 편성',
      description: '무대 커팅식 및 축하 이벤트 참여 명단에 보훈대상자 및 지역 공헌 대표 인사 반드시 포함',
      priority: 'medium' as const,
      dueDateOffsetDays: 2,
    },
  ];

  // Apply protocol tasks to the current event checklist
  const handleApplyProtocolChecklist = () => {
    if (!activeEvent) return;

    let addedCount = 0;
    const existingTitles = eventTasks.map((t) => t.title.trim().toLowerCase());

    PROTOCOL_TASKS_TO_APPLY.forEach((item) => {
      // Avoid duplicate exact matches
      const isDuplicate = existingTitles.some((title) =>
        title.includes(item.title.trim().toLowerCase().slice(0, 15))
      );

      if (!isDuplicate) {
        createTask({
          eventId: activeEvent.id,
          category: item.category,
          title: item.title,
          description: item.description,
          dueDate: activeEvent.date.replace(/\./g, '-'),
          status: 'todo',
          priority: item.priority,
          assignees: [],
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setAppliedNotification(`보훈 의전 체크리스트 ${addedCount}개 항목이 체크리스트에 등록되었습니다!`);
    } else {
      setAppliedNotification('이미 의전 체크리스트 항목들이 등록되어 있습니다.');
    }
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  // Copy moderator introduction order scenario
  const handleCopyScenario = () => {
    const scenarioText = `[아산시 민선8기 보훈 의전 계획 - 사회자 내빈소개 표준 시나리오]
■ 보훈(報勳)의 취지: 공훈에 보답하는 의미로 국가와 아산시를 위해 헌신·희생하신 분들을 첫줄에 모시고 최고의 예우를 표합니다.

■ 공식 내빈소개 순서 (시 주관 행사):
1. 아산시장
2. 아산시의회 의장
3. 지역구 국회의원
4. 대한노인회 아산시지회장, 보훈·유공단체장 (광복회, 6.25참전유공자회, 상이군경회 등)
5. 주요 유관기관장
6. 충청남도의회 의원
7. 아산시의회 의원

■ 주요 의전 점검:
- 보훈대상자 및 유족 첫줄 좌석 배치 확인
- 전용 주차 및 1:1 안내 요원 동선 유도
- 기념행사 커팅식 참여자 포함`;

    navigator.clipboard.writeText(scenarioText).then(() => {
      setCopiedScenario(true);
      setTimeout(() => setCopiedScenario(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl border border-emerald-900/20 overflow-hidden">
        {/* Header with Official Badge and Civic Forest Theme */}
        <div className="bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 px-5 py-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-emerald-300 shadow-inner">
                <Award className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-200 uppercase tracking-wide">
                    아산시 총무과 공식 매뉴얼
                  </span>
                  <span className="text-[11px] text-emerald-300">2022. 7. 수립</span>
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  민선8기 보훈(報勳) 의전 계획
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subtitle / Meaning of Bohun */}
          <div className="mt-3 rounded-xl bg-white/10 p-2.5 text-xs text-emerald-100 border border-white/10 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold text-white">보훈(報勳)의 의미:</span> 공훈에 보답한다는 의미로,
              국가를 위해 헌신한 유공자 외 <strong className="text-amber-200">지역발전공헌자, 지역사회 봉사자 등 국가와 지역의 발전을 위해 노력한 모든 이</strong>를 포함합니다.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-3 flex gap-1 border-t border-white/10 pt-2 text-xs font-bold">
            {[
              { id: 'summary', label: '의전 중점사항' },
              { id: 'order', label: '내빈소개 순서' },
              { id: 'seating', label: '좌석배치 가이드' },
              { id: 'tasks', label: '체크리스트 반영' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-xl px-3 py-1.5 transition ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Applied Notification Banner */}
        {appliedNotification && (
          <div className="bg-emerald-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-inner">
            <CheckCircle2 className="h-4 w-4" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-slate-800 text-xs sm:text-sm">
          {/* TAB 1: SUMMARY / 5대 의전 중점사항 */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span>민선8기 보훈 의전 기본 방향</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  민선8기는 각종 행사 개최 시 자리 배치 및 주요 의전 대상을 국가 및 아산시를 위해 공헌(희생)한 분들을 예우하기 위해 
                  <strong> 자리를 첫줄에 배치</strong>하고 각종 의전 대상에 포함하는 등 보훈 의전을 실시합니다.
                </p>
              </div>

              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 pt-1">
                <BookmarkCheck className="h-4 w-4 text-emerald-700" />
                <span>의전 5대 핵심 실무 체크포인트</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. 소개 및 좌석 첫줄 우선 배치 */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-emerald-300 transition">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white text-xs">
                      1
                    </span>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                          소개 및 좌석 첫줄 우선 배치
                        </h5>
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          최우선 예우
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        노인회장, 보훈대상자(참전용사 또는 유족 등), 국가와 시를 빛낸 유공자, 아너소사이어티 가입자 등 지역에 헌신하고, 희생·봉사한 분에 대한 소개 및 <strong>좌석 첫줄 우선 배치</strong>
                      </p>
                      <div className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 border border-slate-100">
                        📌 <strong>참고:</strong> 행사 성격에 맞춰 가족(유족) 등도 앞자리 배치 (예: 현충일 관련 행사 시 보훈 대상자 가족 및 유족 좌석 우대 배치)
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 내빈소개 순서 */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-emerald-300 transition">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white text-xs">
                      2
                    </span>
                    <div className="space-y-1 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                        공식 내빈 소개 순서 준수 (시 주관 행사)
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        시장 ➔ 시의장 ➔ 국회의원 ➔ <strong>노인회장, 보훈·유공단체장</strong> ➔ 주요기관장 ➔ 도의원 ➔ 시의원
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. 초청 범위 */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-emerald-300 transition">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white text-xs">
                      3
                    </span>
                    <div className="space-y-1 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                        초청 범위에 의전 대상자 우선 고려
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        기획 및 초청 단계부터 지역사회 공헌자, 참전유공자회 및 보훈가족 명단을 우선 취합하여 발송
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. 전용 주차 및 의전 요원 */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-emerald-300 transition">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white text-xs">
                      4
                    </span>
                    <div className="space-y-1 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                        의전 대상자 전용 주차 공간 마련 및 의전 요원 편성
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        거동이 불편하신 어르신 및 보훈대상자를 위한 무대/좌석 인접 전용 주차면 배정 및 1:1 안내요원 동선 안내
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. 주요 이벤트 편성 */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-emerald-300 transition">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-700 font-extrabold text-white text-xs">
                      5
                    </span>
                    <div className="space-y-1 flex-1">
                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                        주요 공식 이벤트에 의전 대상자 편성
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        케이크 커팅, 테이프 커팅식, 건배 제의 등에 보훈 대상자 및 지역 대표 공헌자를 함께 무대에 등단시켜 예우
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDER / 내빈소개 순서 */}
          {activeTab === 'order' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    공식 내빈 소개 순서 (시 주관 행사 기준)
                  </h4>
                  <p className="text-xs text-slate-500">
                    사회자 진행 대본에 반드시 아래 순서대로 내빈을 호명합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyScenario}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition active:scale-95"
                >
                  {copiedScenario ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>시나리오 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Visual Sequence Flow */}
              <div className="space-y-2">
                {[
                  { step: 1, title: '시장', desc: '아산시장 (행사 주최/주관 자치단체장)', highlight: false },
                  { step: 2, title: '시의장', desc: '아산시의회 의장', highlight: false },
                  { step: 3, title: '국회의원', desc: '지역구 국회의원', highlight: false },
                  {
                    step: 4,
                    title: '노인회장, 보훈·유공단체장',
                    desc: '★ 민선8기 핵심 예우 대상 (대한노인회 지회장, 6.25참전유공자회, 상이군경회, 광복회, 아너소사이어티 등)',
                    highlight: true,
                  },
                  { step: 5, title: '주요기관장', desc: '경찰서장, 소방서장, 교육지원청 교육장 등 유관 공공기관장', highlight: false },
                  { step: 6, title: '도의원', desc: '충청남도의회 의원', highlight: false },
                  { step: 7, title: '시의원', desc: '아산시의회 의원 일동', highlight: false },
                ].map((item, idx) => (
                  <div
                    key={item.step}
                    className={`flex items-center gap-3 rounded-xl p-3 border transition ${
                      item.highlight
                        ? 'border-amber-400 bg-amber-50/90 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-xl font-black text-xs shrink-0 ${
                        item.highlight ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xs sm:text-sm ${
                            item.highlight ? 'text-amber-950' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.highlight && (
                          <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900">
                            보훈의전 중점
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    {idx < 6 && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SEATING / 좌석배치 가이드 */}
          {activeTab === 'seating' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  행사장 좌석 배치도 가이드
                </h4>
                <p className="text-xs text-slate-500">
                  무대 앞 첫 번째 열에 보훈대상자 및 유공자를 우선 배치합니다.
                </p>
              </div>

              {/* Visual Seating Diagram */}
              <div className="rounded-2xl border border-slate-300 bg-slate-900 p-4 text-white space-y-4">
                {/* Stage Indicator */}
                <div className="mx-auto max-w-xs rounded-lg bg-slate-800 border border-slate-700 py-1.5 text-center text-xs font-black text-emerald-400 tracking-wider">
                  [ 행 사 무 대 (STAGE) ]
                </div>

                {/* Row 1: First Line (Honored Guests & Mayor) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                    <span>👑 제 1열 (첫줄) : 보훈의전 최우선 좌석</span>
                    <span className="text-amber-400">민선8기 지침 준수</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-[11px]">
                    <div className="rounded-lg bg-amber-500/20 border border-amber-400/50 p-2 font-bold text-amber-200">
                      보훈대상자<br />참전용사·유족
                    </div>
                    <div className="rounded-lg bg-amber-500/20 border border-amber-400/50 p-2 font-bold text-amber-200">
                      노인회장<br />유공단체장
                    </div>
                    <div className="rounded-lg bg-emerald-600 border border-emerald-400 p-2 font-black text-white shadow-xs">
                      시장<br />(자치단체장)
                    </div>
                    <div className="rounded-lg bg-emerald-800 border border-emerald-600 p-2 font-bold text-emerald-100">
                      시의장<br />국회의원
                    </div>
                    <div className="rounded-lg bg-amber-500/20 border border-amber-400/50 p-2 font-bold text-amber-200">
                      아너소사이어티<br />지역사회봉사자
                    </div>
                  </div>
                </div>

                {/* Row 2: Second Line (Institutional Heads, Council Members) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">
                    제 2열 : 주요기관장 및 도의원·시의원
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] text-slate-300">
                    <div className="rounded-lg bg-slate-800 border border-slate-700 p-1.5">
                      경찰서장/소방서장
                    </div>
                    <div className="rounded-lg bg-slate-800 border border-slate-700 p-1.5">
                      교육장/기관장
                    </div>
                    <div className="rounded-lg bg-slate-800 border border-slate-700 p-1.5">
                      충남도의회 의원
                    </div>
                    <div className="rounded-lg bg-slate-800 border border-slate-700 p-1.5">
                      아산시의회 의원
                    </div>
                  </div>
                </div>

                {/* Row 3+: General Citizens */}
                <div className="rounded-lg bg-slate-800/60 p-2 text-center text-[11px] text-slate-400">
                  제 3열 이후 : 일반 시민, 단체 참가자 및 관람객 좌석
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-emerald-700" />
                  <span>현장 세팅 실무 팁:</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>첫줄 좌석에는 사전 출력된 <strong>이름표(명패)</strong>를 좌석 등받이에 반드시 부착합니다.</li>
                  <li>고령의 보훈대상자 및 어르신을 위해 진입 통로 쪽 좌석으로 우선 배정합니다.</li>
                  <li>기념품 및 식순 리플릿을 착석 전 첫줄 좌석 위에 정갈하게 사전 비치합니다.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: TASKS / 체크리스트에 반영 */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    행사 체크리스트 일괄 반영 항목 (총 5개)
                  </h4>
                  <p className="text-xs text-slate-500">
                    버튼 한 번으로 현재 행사({activeEvent?.title || '선택된 행사'})의 체크리스트에 의전 업무를 등록합니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {PROTOCOL_TASKS_TO_APPLY.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {item.category}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        D-{item.dueDateOffsetDays}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-1">{item.description}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleApplyProtocolChecklist}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 active:scale-98 transition"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>현재 행사 체크리스트에 위 5개 의전 업무 즉시 등록하기</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <span className="font-medium">아산시 총무과 민선8기 의전 지침 준수</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyProtocolChecklist}
              className="rounded-xl bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
            >
              체크리스트에 의전 항목 추가
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
