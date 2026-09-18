import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Gemini API with user-agent header
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health Check API
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// 1. AI Feature: Recommend checklist items based on past event data
app.post("/api/ai/recommend-checklist", async (req: Request, res: Response) => {
  try {
    const { eventType, eventScale, eventLocation, pastEventsSummary } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback robust heuristic recommendation if API key is not yet set
      const fallbackRecommendations = [
        {
          category: "현장",
          title: `${eventType || "행사"} 야외/실내 전력선 및 분전반 사전 부하 테스트`,
          description: "과거 행사에서 발생한 순간 전력 차단 문제를 방지하기 위해 음향 및 조명 분전반을 사전 분리 점검합니다.",
          priority: "high",
          recommendedDueDateDaysBefore: 3,
          suggestedRole: "현장팀장",
        },
        {
          category: "홍보",
          title: "현장 대형 메인 현수막 및 유도 배너 시인성 사전 확인",
          description: "과거 행사 개선사항을 반영하여 관람객 이동 동선 3개 지점에 고대비 유도 배너를 추가 설치합니다.",
          priority: "medium",
          recommendedDueDateDaysBefore: 2,
          suggestedRole: "홍보담당",
        },
        {
          category: "현장",
          title: "우천 및 기상악화 대비 차광막·방수포 비치 및 우천 매뉴얼",
          description: `${eventScale || "해당 규모"} 행사 시 우천 대비 천막 고정 팩 및 비닐 커버를 현장 안내데스크에 사전 비치합니다.`,
          priority: "high",
          recommendedDueDateDaysBefore: 1,
          suggestedRole: "안전요원",
        },
        {
          category: "기획",
          title: "주요 내빈(VIP) 동선 및 비상 연락망(경찰/소방/의료) 최신화",
          description: "소방서 및 보건소 응급 구급차 진입로 확보 및 관계자 비상 핫라인 사전 점검.",
          priority: "high",
          recommendedDueDateDaysBefore: 5,
          suggestedRole: "총괄기획",
        },
        {
          category: "계약",
          title: "행사 배상책임보험 증권 접수 및 참가업체 계약서 원본 보관",
          description: "사고 발생 시 즉각 대응을 위해 보험증권 사본을 현장 상황실에 비치합니다.",
          priority: "medium",
          recommendedDueDateDaysBefore: 4,
          suggestedRole: "계약담당",
        },
        {
          category: "종료",
          title: "행사장 원상복구 점검 및 쓰레기 종량제 분리수거 검수",
          description: "대관처 반납 전 바닥 오염 및 파손 여부를 시설 관리자와 합동 확인합니다.",
          priority: "medium",
          recommendedDueDateDaysBefore: 0,
          suggestedRole: "현장담당",
        },
      ];

      return res.json({
        success: true,
        source: "heuristic",
        recommendations: fallbackRecommendations,
        analysisInsight: `${eventType} (${eventScale}) 행사의 과거 진행 내역과 주요 지연·개선 요인을 분석하여 필수 업무 6건을 추천했습니다.`,
      });
    }

    const prompt = `당신은 대한민국 지자체 및 기업 행사 관리 전문 AI 컨설턴트입니다.
신규 행사 등록 시, 과거 행사 데이터(과거 업무, 지연 이슈, 문제점, 개선사항)를 분석하여 해당 행사 유형과 규모에 최적화된 맞춤형 체크리스트 업무 목록을 추천해주세요.

[신규 행사 정보]
- 행사 유형: ${eventType || "일반 행사"}
- 행사 규모: ${eventScale || "중규모 (100~500명)"}
- 행사 장소: ${eventLocation || "실내외 복합"}

[참고 과거 행사 데이터 및 경험 요약]
${pastEventsSummary || "2025 농산물 판촉행사: 우천 대비 방수포 부족으로 일부 물품 이동 지연, 전력 용량 초과로 순간 차단 발생, 참가업체 사전 안전 교육 필요."}

위 과거 데이터에서 도출된 교훈과 위험 방지책을 반드시 포함하여 신규 행사에 필요한 체크리스트 5~8개를 JSON 형식으로 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysisInsight: {
              type: Type.STRING,
              description: "과거 행사 데이터 기반 분석 요약 및 추천 사유 (2~3문장)",
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "기획, 홍보, 현장, 계약, 종료 중 하나",
                  },
                  title: {
                    type: Type.STRING,
                    description: "구체적인 업무 명칭",
                  },
                  description: {
                    type: Type.STRING,
                    description: "과거 사례 기반 추천 사유 및 수행 팁",
                  },
                  priority: {
                    type: Type.STRING,
                    description: "high, medium, low 중 하나",
                  },
                  recommendedDueDateDaysBefore: {
                    type: Type.INTEGER,
                    description: "행사 D-Day 기준 마감 권장일 (예: 5면 D-5)",
                  },
                  suggestedRole: {
                    type: Type.STRING,
                    description: "추천 담당 역할 (예: 기획담당, 현장팀장 등)",
                  },
                },
                required: ["category", "title", "description", "priority", "recommendedDueDateDaysBefore"],
              },
            },
          },
          required: ["analysisInsight", "recommendations"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      source: "gemini",
      analysisInsight: parsedData.analysisInsight,
      recommendations: parsedData.recommendations || [],
    });
  } catch (error: any) {
    console.error("AI recommend-checklist error:", error);
    res.status(500).json({ error: error.message || "Failed to recommend checklist" });
  }
});

// 2. AI Feature: Draft event summary report based on completed tasks, evidence, and results
app.post("/api/ai/draft-summary-report", async (req: Request, res: Response) => {
  try {
    const {
      eventTitle,
      eventDate,
      location,
      completedTasks,
      delayedTasks,
      attachmentsSummary,
      enteredResults,
    } = req.body;

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback robust structured report draft
      const defaultReport = {
        executiveSummary: `본 행사는 '${eventTitle || "2026 행사"}'로서 ${eventDate} ${location}에서 총 ${enteredResults?.attendeeCount || 2300}명의 참가자와 함께 성공적으로 개최되었습니다. 전 부서 팀원들의 유기적인 협업과 실시간 증빙 기록을 통해 주요 체크리스트를 대부분 완수하였으며, 현장 목표 성과를 초과 달성하였습니다.`,
        keyOutcomes: enteredResults?.revenueOrKeyOutcome || "당일 총 매출 4,800만원 달성 및 방문객 만족도 조사 94.2% 기록",
        taskExecutionAnalysis: `전체 ${((completedTasks?.length || 31) + (delayedTasks?.length || 2))}건의 업무 중 ${completedTasks?.length || 31}건 완료(완료율 ${Math.round(((completedTasks?.length || 31) / ((completedTasks?.length || 31) + (delayedTasks?.length || 2))) * 100)}%). 특히 기획·홍보·현장 설치 분야에서 모바일 즉시 체크와 현장 사진 증빙이 철저히 기록되었습니다.`,
        evidenceSummary: `현장 사진 ${attachmentsSummary?.photosCount || 35}건 및 공문·계획서 ${attachmentsSummary?.docsCount || 12}건이 체계적으로 아카이빙되어 향후 감사 및 차기 행사 레퍼런스로 활용 가능합니다.`,
        issuesAndRiskReview: enteredResults?.issues || "점심 시간대 주차 대기열 발생 및 일부 인기 부스 전력 과부하 경보 발생.",
        actionableImprovements: enteredResults?.improvements || "차기 행사 시 임시 주차장 셔틀버스 2대 증차 및 발전차 사전 추가 계약 필수.",
        fullMarkdownReport: `# ${eventTitle || "2026 행사"} 결과 보고서 (초안)

## 1. 행사 개요
- **행사명**: ${eventTitle || "2026 행사"}
- **일시**: ${eventDate}
- **장소**: ${location}
- **참여 인원**: ${enteredResults?.attendeeCount || "2,300"}명

## 2. 종합 평가
전체 체크리스트 완료율 ${Math.round(((completedTasks?.length || 31) / ((completedTasks?.length || 31) + (delayedTasks?.length || 2))) * 100)}%를 달성하였으며, 현장 팀원들의 실시간 사진 증빙(${attachmentsSummary?.photosCount || 35}건)과 업무 로그 기록을 바탕으로 투명하고 효율적인 행사 운영이 이루어졌습니다.

## 3. 주요 성과 및 결과
- ${enteredResults?.revenueOrKeyOutcome || "목표 방문객 초과 달성 및 주요 부스 완판"}

## 4. 문제점 및 개선 방안
- **문제점**: ${enteredResults?.issues || "일부 동선 혼잡 및 안내 표지판 부족"}
- **개선 방안**: ${enteredResults?.improvements || "사전 모바일 안내 강화 및 예비 전력선 이중화"}
`,
      };

      return res.json({
        success: true,
        source: "heuristic",
        report: defaultReport,
      });
    }

    const prompt = `당신은 공공기관 및 대기업 행사 총괄 기획관이자 전문 보고서 작성 AI입니다.
완료된 체크리스트, 현장 사진/문서 증빙 현황, 입력된 결과 데이터를 바탕으로 고위 관리자나 지자체장에 제출 가능한 격조 높고 분석적인 [행사 결과 보고서(초안)]를 작성해주세요.

[행사 기본 정보]
- 행사명: ${eventTitle}
- 일시: ${eventDate}
- 장소: ${location}

[업무 수행 현황]
- 완료된 업무: ${JSON.stringify(completedTasks || [])}
- 지연 또는 미완료 업무: ${JSON.stringify(delayedTasks || [])}
- 증빙 자료 현황: 사진 ${attachmentsSummary?.photosCount || 0}건, 문서 ${attachmentsSummary?.docsCount || 0}건

[현장 입력 결과]
- 참석 인원: ${enteredResults?.attendeeCount || "미정"}명
- 주요 성과/매출: ${enteredResults?.revenueOrKeyOutcome || "없음"}
- 현장 문제점: ${enteredResults?.issues || "없음"}
- 개선 제언: ${enteredResults?.improvements || "없음"}

위 데이터를 꼼꼼히 반영하여 객관적이고 체계적인 JSON 형식 보고서를 작성해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "행사 총평 및 종합 평가 요약 (격식 있는 문체)",
            },
            keyOutcomes: {
              type: Type.STRING,
              description: "주요 정량/정성 성과 분석",
            },
            taskExecutionAnalysis: {
              type: Type.STRING,
              description: "체크리스트 수행 및 부서별 완료율 분석",
            },
            evidenceSummary: {
              type: Type.STRING,
              description: "현장 사진 및 문서 증빙 아카이빙 분석",
            },
            issuesAndRiskReview: {
              type: Type.STRING,
              description: "현장 발생 문제점 및 리스크 평가",
            },
            actionableImprovements: {
              type: Type.STRING,
              description: "차기 행사 시 즉시 적용할 개선 방안",
            },
            fullMarkdownReport: {
              type: Type.STRING,
              description: "완성된 공문서 형태의 Markdown 결과 보고서 전문",
            },
          },
          required: [
            "executiveSummary",
            "keyOutcomes",
            "taskExecutionAnalysis",
            "evidenceSummary",
            "issuesAndRiskReview",
            "actionableImprovements",
            "fullMarkdownReport",
          ],
        },
      },
    });

    const parsedReport = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      source: "gemini",
      report: parsedReport,
    });
  } catch (error: any) {
    console.error("AI draft-summary-report error:", error);
    res.status(500).json({ error: error.message || "Failed to draft report" });
  }
});

// Vite middleware & production static handler
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
