import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  FileText,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Award,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EventItem, AiDraftReport } from '../../types';

interface AiReportAssistantModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AiReportAssistantModal: React.FC<AiReportAssistantModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const { tasks, attachments, updateEventResult } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AiDraftReport | null>(
    event?.result?.aiDraftReport || null
  );
  const [activeTab, setActiveTab] = useState<'structured' | 'edit' | 'markdown'>('structured');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Editable fields state
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [keyOutcomes, setKeyOutcomes] = useState('');
  const [taskExecutionAnalysis, setTaskExecutionAnalysis] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');
  const [issuesAndRiskReview, setIssuesAndRiskReview] = useState('');
  const [actionableImprovements, setActionableImprovements] = useState('');

  if (!isOpen || !event) return null;

  const eventTasks = tasks.filter((t) => t.eventId === event.id);
  const completedTasks = eventTasks.filter((t) => t.status === 'done');
  const delayedTasks = eventTasks.filter(
    (t) => t.status === 'delayed' || (t.status !== 'done' && t.dueDate < '2026-09-18')
  );
  const eventPhotos = attachments.filter(
    (a) => a.eventId === event.id && a.fileType === 'image'
  );
  const eventDocs = attachments.filter(
    (a) => a.eventId === event.id && a.fileType === 'doc'
  );

  const handleGenerateReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/draft-summary-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTitle: event.title,
          eventDate: event.date,
          location: event.location,
          completedTasks: completedTasks.map((t) => ({
            title: t.title,
            category: t.category,
            workLog: t.workLog || '정상 완료',
            completedBy: t.completedBy,
            completedAt: t.completedAt,
          })),
          delayedTasks: delayedTasks.map((t) => ({
            title: t.title,
            category: t.category,
            dueDate: t.dueDate,
          })),
          attachmentsSummary: {
            photosCount: eventPhotos.length,
            docsCount: eventDocs.length,
          },
          enteredResults: event.result
            ? {
                attendeeCount: event.result.attendeeCount,
                revenueOrKeyOutcome: event.result.revenueOrKeyOutcome,
                issues: event.result.issues,
                improvements: event.result.improvements,
              }
            : {
                attendeeCount: 2300,
                revenueOrKeyOutcome: '당일 매출 4,800만원 및 만족도 94.2%',
                issues: '오후 시간대 안내데스크 전력 차단 및 주차 혼잡',
                improvements: '예비 발전차 추가 계약 및 셔틀버스 증차',
              },
        }),
      });

      const data = await response.json();
      if (data.report) {
        const generatedReport: AiDraftReport = {
          ...data.report,
          generatedAt: new Date().toLocaleString('ko-KR'),
        };
        setReport(generatedReport);
        setExecutiveSummary(generatedReport.executiveSummary);
        setKeyOutcomes(generatedReport.keyOutcomes);
        setTaskExecutionAnalysis(generatedReport.taskExecutionAnalysis);
        setEvidenceSummary(generatedReport.evidenceSummary);
        setIssuesAndRiskReview(generatedReport.issuesAndRiskReview);
        setActionableImprovements(generatedReport.actionableImprovements);
      }
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToEventResult = () => {
    if (!report) return;

    const updatedReport: AiDraftReport = {
      executiveSummary,
      keyOutcomes,
      taskExecutionAnalysis,
      evidenceSummary,
      issuesAndRiskReview,
      actionableImprovements,
      fullMarkdownReport: `# ${event.title} 결과 보고서

## 1. 종합 평가
${executiveSummary}

## 2. 주요 성과
${keyOutcomes}

## 3. 체크리스트 업무 수행도
${taskExecutionAnalysis}

## 4. 현장 증빙 자료 아카이빙
${evidenceSummary}

## 5. 문제점 및 리스크
${issuesAndRiskReview}

## 6. 차기 행사 개선 제언
${actionableImprovements}
`,
      generatedAt: new Date().toLocaleString('ko-KR'),
    };

    updateEventResult(event.id, {
      eventId: event.id,
      attendeeCount: event.result?.attendeeCount || 2300,
      revenueOrKeyOutcome: keyOutcomes || event.result?.revenueOrKeyOutcome || '',
      issues: issuesAndRiskReview || event.result?.issues || '',
      improvements: actionableImprovements || event.result?.improvements || '',
      closedAt: event.result?.closedAt || new Date().toISOString().split('T')[0],
      aiDraftReport: updatedReport,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    const textToCopy = report.fullMarkdownReport || `${executiveSummary}\n\n${keyOutcomes}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="flex h-full max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-emerald-900/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-emerald-950 via-emerald-900 to-teal-950 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">AI 행사 결과 보고서 어시스턴트</h2>
                <span className="rounded bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {event.title} · 완료 업무, 증빙 사진, 현장 결과를 종합 분석하여 초안을 생성합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Data Source Summary Bar */}
        <div className="grid grid-cols-4 gap-2 bg-emerald-950/5 border-b border-emerald-900/10 px-4 py-2.5 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">완료 업무</span>
            <span className="text-xs font-black text-emerald-700">
              {completedTasks.length}건 ({Math.round((completedTasks.length / (eventTasks.length || 1)) * 100)}%)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">지연 업무</span>
            <span className="text-xs font-black text-rose-600">
              {delayedTasks.length}건
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">증빙 사진</span>
            <span className="text-xs font-black text-slate-800">
              {eventPhotos.length}장
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-medium">결과 데이터</span>
            <span className="text-xs font-black text-emerald-700">
              {event.result ? '입력완료' : '자동추정'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!report && !isLoading && (
            <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-3">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                실시간 현장 데이터를 바탕으로 결과보고서를 자동 작성할까요?
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
                팀원들이 체크한 <strong>{completedTasks.length}건의 업무 로그</strong>, 현장에서 직접 촬영한 <strong>{eventPhotos.length}장의 사진</strong>, 그리고 등록된 성과 데이터를 종합 분석하여 공식 보고서 서식에 맞춘 완성도 높은 초안을 생성합니다.
              </p>
              <button
                type="button"
                onClick={handleGenerateReport}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <span>AI 결과 보고서 초안 자동 생성하기</span>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="mx-auto h-8 w-8 text-emerald-700 animate-spin" />
              <p className="text-sm font-black text-slate-900">
                과거 및 현장 데이터를 종합 분석하여 보고서 초안을 작성 중입니다...
              </p>
              <p className="text-xs text-slate-400">
                체크리스트 달성도 분석 → 증빙 자료 검수 → 문제점 및 차기 개선안 도출
              </p>
            </div>
          )}

          {report && !isLoading && (
            <>
              {/* Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('structured')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === 'structured'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    보고서 미리보기
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === 'edit'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    직접 검토 및 수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('markdown')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      activeTab === 'markdown'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Markdown 전문
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>다시 생성</span>
                </button>
              </div>

              {/* View 1: Structured Preview */}
              {activeTab === 'structured' && (
                <div className="space-y-3.5 text-xs">
                  {/* Executive Summary */}
                  <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4">
                    <div className="flex items-center gap-2 mb-1.5 text-emerald-900 font-extrabold text-sm">
                      <Award className="h-4 w-4 text-emerald-700" />
                      <span>1. 종합 평가 및 총평</span>
                    </div>
                    <p className="leading-relaxed text-slate-800 font-medium whitespace-pre-line">
                      {executiveSummary || report.executiveSummary}
                    </p>
                  </div>

                  {/* Key Outcomes */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5 text-slate-900 font-extrabold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>2. 주요 성과 및 달성 실적</span>
                    </div>
                    <p className="leading-relaxed text-slate-700 whitespace-pre-line">
                      {keyOutcomes || report.keyOutcomes}
                    </p>
                  </div>

                  {/* Task Execution & Evidence Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                      <span className="font-extrabold text-slate-900 block mb-1">
                        3. 체크리스트 수행 분석
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {taskExecutionAnalysis || report.taskExecutionAnalysis}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                      <span className="font-extrabold text-slate-900 block mb-1">
                        4. 현장 증빙 아카이빙
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {evidenceSummary || report.evidenceSummary}
                      </p>
                    </div>
                  </div>

                  {/* Issues & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                      <span className="font-extrabold text-rose-900 block mb-1">
                        5. 현장 문제점 및 한계
                      </span>
                      <p className="text-rose-800 leading-relaxed">
                        {issuesAndRiskReview || report.issuesAndRiskReview}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                      <span className="font-extrabold text-teal-900 block mb-1">
                        6. 차기 행사 개선 제언
                      </span>
                      <p className="text-teal-900 leading-relaxed">
                        {actionableImprovements || report.actionableImprovements}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Direct Edit Sections */}
              {activeTab === 'edit' && (
                <div className="space-y-3 text-xs">
                  <span className="text-slate-500 block">
                    AI가 작성한 보고서 각 항목을 원하는 표현으로 직접 수정할 수 있습니다.
                  </span>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">1. 종합 평가</label>
                    <textarea
                      rows={3}
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 outline-hidden font-normal"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">2. 주요 성과</label>
                    <textarea
                      rows={2}
                      value={keyOutcomes}
                      onChange={(e) => setKeyOutcomes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 outline-hidden font-normal"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">3. 문제점 및 리스크</label>
                    <textarea
                      rows={2}
                      value={issuesAndRiskReview}
                      onChange={(e) => setIssuesAndRiskReview(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 outline-hidden font-normal"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">4. 차기 개선 제언</label>
                    <textarea
                      rows={2}
                      value={actionableImprovements}
                      onChange={(e) => setActionableImprovements(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 outline-hidden font-normal"
                    />
                  </div>
                </div>
              )}

              {/* View 3: Markdown Full Text */}
              {activeTab === 'markdown' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>공문서 첨부 및 이메일 보고용 전체 텍스트</span>
                    <button
                      type="button"
                      onClick={handleCopyMarkdown}
                      className="flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? '복사 완료!' : '전체 텍스트 복사'}</span>
                    </button>
                  </div>
                  <pre className="max-h-80 overflow-y-auto rounded-xl bg-slate-900 p-3.5 text-[11px] text-emerald-200 leading-relaxed whitespace-pre-wrap font-mono">
                    {report.fullMarkdownReport}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-100"
          >
            닫기
          </button>

          {report && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-100"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? '복사됨' : '보고서 복사'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToEventResult}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white shadow-md hover:bg-emerald-600 transition active:scale-95"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>행사 결과에 저장 완료!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>행사 결과로 확정 저장</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
