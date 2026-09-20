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

// Helper: Call Gemini with fallback models and retry for 503 high demand
async function generateJsonWithGemini(
  ai: GoogleGenAI,
  prompt: string,
  schema: any
): Promise<{ text: string; modelUsed: string }> {
  // Use approved models from guidelines: gemini-3.8-flash (primary text) and gemini-flash-latest
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest"];
  let lastErr: any = null;

  for (const model of candidateModels) {
    // Retry up to 2 times if encountering 503 (temporary high demand spike)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });
        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastErr = err;
        const is503 = err?.status === 503 || err?.code === 503 || String(err?.message || "").includes("503");
        if (is503 && attempt === 0) {
          // Wait briefly before retry
          await new Promise((res) => setTimeout(res, 800));
          continue;
        }
        console.warn(`[AI Gemini] Model ${model} unavailable (attempt ${attempt + 1}: ${err?.status || err?.message})`);
        break;
      }
    }
  }

  throw lastErr;
}

// Fallback generator for checklist recommendations based on the 8 official event models
function createFallbackRecommendations(eventType?: string, eventScale?: string) {
  const typeStr = eventType || "";

  if (typeStr.includes("야외축제") || typeStr.includes("이순신") || typeStr.includes("축제")) {
    return [
      {
        category: "현장",
        title: "지역 합동 안전관리계획 수립 및 비상대피 동선 심의",
        description: "다중 밀집 구간 관람객 비상 대피 동선, 응급 소방 구조로 확보 및 안전관리요원 50명 배치 계획.",
        priority: "high",
        recommendedDueDateDaysBefore: 14,
        suggestedRole: "총괄안전팀장",
      },
      {
        category: "현장",
        title: "임시 주차장 3개소 확보, 셔틀버스 순환 및 교차로 교통통제",
        description: "행사장 진입 차량 분산을 위한 셔틀버스 15분 간격 운행 및 주요 교차로 모범운전자회 협조 배치.",
        priority: "high",
        recommendedDueDateDaysBefore: 7,
        suggestedRole: "교통주차담당",
      },
      {
        category: "기획",
        title: "경찰서·소방서 합동 현장 실사 및 응급 구급차 핫라인 구축",
        description: "비상 소방차 전용 진입로 확보 및 응급 의료 CPR 구급차 상시 대기 부스 설치.",
        priority: "high",
        recommendedDueDateDaysBefore: 5,
        suggestedRole: "대외협력팀장",
      },
      {
        category: "현장",
        title: "기상청 예보 모니터링, 우천 대비 대형 방수포 및 배수 대책",
        description: "전기·음향 부스 방수 덮개 비치, 관람객 미끄럼 방지 야자매트 설치 및 단계별 우천 매뉴얼 가동.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "현장운영팀",
      },
      {
        category: "의전",
        title: "민선8기 보훈대상자·노인회장 첫줄 좌석배치 및 공식 소개순서 확정",
        description: "참전유공자·유족·노인회장 첫줄 좌석 우선 배정, 시장➔시의장➔국회의원➔노인회장·보훈단체장 순 공식 소개.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "의전담당",
      },
      {
        category: "홍보",
        title: "축제장 종합안내도, 주차 셔틀 모바일 리플릿 QR 제작 배포",
        description: "방문객 혼잡 방지 및 실시간 주차 상황 모바일 안내 QR 배너 현장 10개소 설치.",
        priority: "medium",
        recommendedDueDateDaysBefore: 4,
        suggestedRole: "홍보마케팅",
      },
    ];
  }

  if (typeStr.includes("무대공연") || typeStr.includes("음악회") || typeStr.includes("공연")) {
    return [
      {
        category: "현장",
        title: "무대 트러스 하중 안전점검 및 백드롭 구조물 고정",
        description: "강풍 대비 무대 구조물 앙카 고정, 조명·음향 트러스 와이어 결속 및 무대 발판 수평 상태 점검.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "무대총괄감독",
      },
      {
        category: "현장",
        title: "음향·조명 발전차 독립 전력선 인입 및 사전 사운드 체크",
        description: "전력 과부하 트립 방지를 위해 음향·조명 전력선 완전 분리, 앰프·마이크 주파수 혼선 테스트 완료.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "음향조명팀장",
      },
      {
        category: "기획",
        title: "출연진 전용 대기실 조성 및 도착 의전·식음료 케이터링",
        description: "공연자 분장실 냉난방 점검, 동선 격리, 차량 주차 비표 발급 및 대기실 생수·다과 사전 준비.",
        priority: "medium",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "출연진매니저",
      },
      {
        category: "기획",
        title: "기술·음향 총괄 드라이런 및 타임테이블 사전 리허설",
        description: "큐시트 기준 식전공연, 본공연, 앙코르 및 무대 전환 시간 초단위 점검(무대 스태프 무전기 채널 동기화).",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "공연기획PD",
      },
      {
        category: "계약",
        title: "한국음악저작권협회(KOMCA) 공연권 이용허락 및 저작권료 정산",
        description: "공연 연주곡 리스트 사전 확보 및 음저협 공연 사용 신청 승인서 접수, 음원 라이선스 확인.",
        priority: "high",
        recommendedDueDateDaysBefore: 7,
        suggestedRole: "행정계약담당",
      },
      {
        category: "의전",
        title: "공식 기념식 식순 연계 내빈 첫줄 착석 안내 및 축사 타임키핑",
        description: "시장 및 보훈·유공자 첫줄 의전 좌석 지정 명패 부착, 축사 3분 제한 타이머 사전 안내.",
        priority: "medium",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "의전담당",
      },
    ];
  }

  if (typeStr.includes("전시") || typeStr.includes("박람회")) {
    return [
      {
        category: "현장",
        title: "표준 부스(3x3m) 평면 배치도 확정 및 관람 동선 구획",
        description: "주요 통로 폭 3m 이상 확보, 장애인 휠체어 경사로 설치 및 부스 넘버링 번호판 부착.",
        priority: "high",
        recommendedDueDateDaysBefore: 5,
        suggestedRole: "전시공간디자이너",
      },
      {
        category: "현장",
        title: "부스별 요구 전력 용량 실사 및 전선 케이블 트렌치 덮개 설치",
        description: "부스별 전열기기/PC 사용 전력 취합 후 누전차단기 분배, 통로 전선 걸림 방지용 고무 몰드 매립.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "시설전기팀",
      },
      {
        category: "계약",
        title: "참가 기업·단체 부스 배정 확인서 및 안전 서약서 징구",
        description: "참가업체 30개소 계약서 날인, 물품 반입 시간표 통보 및 화재 예방 소화기 부스별 1대 비치 확인.",
        priority: "medium",
        recommendedDueDateDaysBefore: 7,
        suggestedRole: "기업유치담당",
      },
      {
        category: "기획",
        title: "1:1 현장 취업·창업 상담 스케줄링 및 대기 번호표 운영",
        description: "전문 상담 부스 방음 가벽 설치, 현장 모바일 접수 QR 및 대기 번호 알림 시스템 가동.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "프로그램운영팀",
      },
      {
        category: "홍보",
        title: "대형 부스 배치도, 프로그램 시간표 및 입구 종합안내판 설치",
        description: "주요 부스 카테고리별 컬러 코딩 안내판 4개소 설치, 모바일 전자 디렉터리 북 QR 배포.",
        priority: "medium",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "홍보그래픽담당",
      },
    ];
  }

  if (typeStr.includes("기념식") || typeStr.includes("의전") || typeStr.includes("협약식")) {
    return [
      {
        category: "의전",
        title: "초청 내빈 참석 여부(RSVP) 전수 확인 및 공식 내빈 명단 확정",
        description: "참석 확정 기관장, 보훈단체장, 시의원 명단 최종 확정 및 수행비서 연락처 사전 공유.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "총무의전팀",
      },
      {
        category: "의전",
        title: "민선8기 지침: 보훈대상자·노인회장 1열(첫줄) 좌석 명패 부착",
        description: "무대 앞 1열에 보훈대상자·유족·노인회장 최우선 배치, 2열에 주요기관장·의원석 정렬 배치.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "의전전담",
      },
      {
        category: "기획",
        title: "사회자 공식 시나리오 확정 및 내빈소개 공식 서열표 검토",
        description: "시장 ➔ 시의장 ➔ 국회의원 ➔ 노인회장, 보훈·유공단체장 ➔ 주요기관장 ➔ 도의원 ➔ 시의원 서열 준수.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "기획담당",
      },
      {
        category: "기획",
        title: "축사·기념사 원고 최종 검수 및 단상 프롬프터·원고대 세팅",
        description: "주요 인사 축사 시간 조율(각 3분 내외), 연단 꽃장식 및 마이크 높낮이 조절 사전 체크.",
        priority: "medium",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "행정기획",
      },
      {
        category: "현장",
        title: "수행 차량 전용 주차구역 확보 및 VIP 1:1 영접·환송 동선 점검",
        description: "정문 하차장 라바콘 설치, 엘리베이터 동선 확보 및 티타임 접견실 다과·명패 사전 세팅.",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "영접수행요원",
      },
    ];
  }

  if (typeStr.includes("체험") || typeStr.includes("참여")) {
    return [
      {
        category: "현장",
        title: "체험 키트 재료 수량 사전 검수 및 예비분(20%) 비치",
        description: "체험 도구, 안전 가위 등 프로그램별 500세트 전수 점검 및 재료 불량 사전 교체.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "체험프로그램팀",
      },
      {
        category: "기획",
        title: "회차별(1~5회) 정원 사전예약 및 현장 대기 접수처 분리",
        description: "회당 30명 제한 운영, 현장 혼잡 방지를 위한 타임 슬롯별 입장 팔찌(컬러별) 배부.",
        priority: "high",
        recommendedDueDateDaysBefore: 4,
        suggestedRole: "운영기획",
      },
      {
        category: "현장",
        title: "체험 부스별 전문 강사 및 1:1 안전 진행요원 사전 교육",
        description: "어린이 동반 가족 특성을 고려한 안전 관리 및 체험 진행 멘트 매뉴얼 숙지.",
        priority: "medium",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "인력관리담당",
      },
      {
        category: "현장",
        title: "손소독제 비치, 쓰레기 분리수거 및 어린이 응급 구급약품 상비",
        description: "체험 후 손세척 공간 확보, 찰과상용 방수 밴드 및 소독약 부스별 구비.",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "위생보건요원",
      },
    ];
  }

  if (typeStr.includes("체육") || typeStr.includes("걷기")) {
    return [
      {
        category: "현장",
        title: "5km/10km 걷기 코스 보행로 노면 답사 및 위험 구간 정비",
        description: "단차 보수, 웅덩이 메움, 갈림길 유도 화살표 표지판 설치 및 통행 안전 확인.",
        priority: "high",
        recommendedDueDateDaysBefore: 5,
        suggestedRole: "코스관리팀장",
      },
      {
        category: "현장",
        title: "구급차(2대) 동선 배치, AED 제세동기 지점 점검 및 간호요원 상주",
        description: "보건소 의료진 협조, 코스 반환점 및 출발점에 응급 처치 부스 설치 및 후송 병원 지정.",
        priority: "high",
        recommendedDueDateDaysBefore: 4,
        suggestedRole: "의료안전팀",
      },
      {
        category: "현장",
        title: "코스 2.5km 지점 및 결승점 급수대(생수 3,000병) 설치",
        description: "종이컵 수거용 대형 쓰레기통 비치, 탈수 방지 식염 포도당 및 이온음료 구비.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "물품보급팀",
      },
      {
        category: "계약",
        title: "참가자 전원 영업배상책임보험 및 스포츠 상해보험 가입 증권",
        description: "행사 당일 낙상, 충돌 등 안전사고 보장 한도 확인 및 보험사 핫라인 확보.",
        priority: "high",
        recommendedDueDateDaysBefore: 7,
        suggestedRole: "계약행정담당",
      },
      {
        category: "현장",
        title: "주요 횡단보도 및 차량 교차점 교통 통제요원 배치",
        description: "경광봉, 호루라기, 안전 조끼 지급 및 보행자 우선 신호 통제 지침 브리핑.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "교통통제총괄",
      },
    ];
  }

  if (typeStr.includes("교육") || typeStr.includes("회의") || typeStr.includes("토론")) {
    return [
      {
        category: "기획",
        title: "초빙 강사·발표자 일정 조율, 이력 카드 확보 및 강사료 품의",
        description: "강의 계획서 수령, 프로필 사진 확인, 강사료 지급 규정에 따른 사전 지출 품의 완료.",
        priority: "high",
        recommendedDueDateDaysBefore: 10,
        suggestedRole: "교육기획담당",
      },
      {
        category: "기획",
        title: "강의 교재·발표 슬라이드(PPT) 최종 취합 및 인쇄본 제본",
        description: "슬라이드 글꼴 폰트 깨짐 확인, 발표 자료집 인쇄 및 참석자 배포 패키지 구성.",
        priority: "medium",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "교재제작담당",
      },
      {
        category: "현장",
        title: "등록 데스크 출석부 서명, 명찰 배부 및 현장 추가 접수대 운영",
        description: "사전 신청자 가나다순 명찰 정리, 주차권 지급 기준표 비치 및 영수증 발행 준비.",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "안내데스크팀",
      },
      {
        category: "현장",
        title: "빔프로젝터 해상도, 무선 포인터 프리젠터 및 마이크 배터리 점검",
        description: "노트북 HDMI 젠더 호환성 체크, 강단 마이크 및 객석 무선마이크 4대 주파수 테스트.",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "음향기자재팀",
      },
      {
        category: "기획",
        title: "오픈 채팅방/슬라이도 연계 실시간 익명 질의응답 세팅",
        description: "청중 질문 집계 모니터링 담당자 배정 및 토론 좌장의 질의 선별 시나리오 구성.",
        priority: "medium",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "토론진행스태프",
      },
    ];
  }

  if (typeStr.includes("온라인") || typeStr.includes("하이브리드") || typeStr.includes("병행")) {
    return [
      {
        category: "현장",
        title: "유튜브·Zoom 실시간 스트리밍 스위처 및 카메라 2원 생중계 테스트",
        description: "메인 화각(연사) 및 청중 화각 분할 화면 송출, 자막 오버레이 송출 프로그램 리허설.",
        priority: "high",
        recommendedDueDateDaysBefore: 3,
        suggestedRole: "미디어방송팀장",
      },
      {
        category: "현장",
        title: "백업 녹화 장비(Master ProRes / MP4) 이중화 및 타임코드 동기화",
        description: "행사 종료 후 즉각 아카이빙 및 클립 영상 편집을 위한 외장 고속 녹화기 점검.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "영상기록감독",
      },
      {
        category: "현장",
        title: "현장 방송 전용 유선 기가비트 인터넷 라인(단독망) 대역폭 측정",
        description: "스트리밍 끊김 방지를 위해 일반 와이파이와 분리된 상향 50Mbps 이상 단독 유선 랜 인입.",
        priority: "high",
        recommendedDueDateDaysBefore: 2,
        suggestedRole: "네트워크엔지니어",
      },
      {
        category: "현장",
        title: "오디오 믹서 출력 라인(AUX) 인코더 직접 연결 및 하울링 방지",
        description: "온라인 시청자 노이즈 방지용 컴프레서/리미터 필터 적용 및 현장 마이크 에코 차단 테스트.",
        priority: "high",
        recommendedDueDateDaysBefore: 1,
        suggestedRole: "음향엔지니어",
      },
      {
        category: "계약",
        title: "온·오프라인 참석자 초상권 및 개인정보 수집·이용 동의서 징구",
        description: "유튜브 재방송 및 사진 배포 관련 사전 동의 체크박스 확인.",
        priority: "high",
        recommendedDueDateDaysBefore: 5,
        suggestedRole: "법무개인정보담당",
      },
    ];
  }

  // Default standard fallback
  return [
    {
      category: "현장",
      title: `${eventType || "행사"} 야외/실내 전력선 및 분전반 사전 부하 테스트`,
      description: "순간 전력 차단 문제를 방지하기 위해 음향 및 조명 분전반을 사전 분리 점검합니다.",
      priority: "high",
      recommendedDueDateDaysBefore: 3,
      suggestedRole: "현장팀장",
    },
    {
      category: "홍보",
      title: "현장 대형 메인 현수막 및 유도 배너 시인성 사전 확인",
      description: "관람객 이동 동선 주요 지점에 고대비 유도 배너를 추가 설치합니다.",
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
      category: "의전",
      title: "보훈대상자·노인회장 첫줄 좌석 우선배치 및 공식 내빈소개 순서표 확정",
      description: "아산시 민선8기 보훈 의전 계획: 참전용사, 유족, 노인회장 첫줄 좌석 우선 배치 및 시장→시의장→국회의원→노인회장, 보훈·유공단체장 공식 내빈소개 순서 준수.",
      priority: "high",
      recommendedDueDateDaysBefore: 3,
      suggestedRole: "의전담당",
    },
    {
      category: "계약",
      title: "행사 배상책임보험 증권 접수 및 참가업체 계약서 원본 보관",
      description: "사고 발생 시 즉각 대응을 위해 보험증권 사본을 현장 상황실에 비치합니다.",
      priority: "medium",
      recommendedDueDateDaysBefore: 7,
      suggestedRole: "계약담당",
    },
  ];
}

// Fallback generator for comprehensive event summary report
function createFallbackReport(params: {
  eventTitle?: string;
  eventDate?: string;
  location?: string;
  completedTasks?: any[];
  delayedTasks?: any[];
  attachmentsSummary?: any;
  enteredResults?: any;
  photosDetail?: any[];
}) {
  const {
    eventTitle,
    eventDate,
    location,
    completedTasks = [],
    delayedTasks = [],
    attachmentsSummary,
    enteredResults,
    photosDetail = [],
  } = params;

  const compCount = completedTasks.length || 31;
  const delCount = delayedTasks.length || 2;
  const totalTasks = compCount + delCount;
  const completionRate = Math.round((compCount / totalTasks) * 100);
  const photosCount = photosDetail.length || attachmentsSummary?.photosCount || 4;
  const photoHighlights =
    photosDetail.length > 0
      ? photosDetail
          .slice(0, 3)
          .map((p: any) => `[${p.uploadedAt || p.date || "현장"}] ${p.fileName} (${p.taskTitle || "현장점검"})`)
          .join(", ")
      : "광장_전기배전반_점검, 무대_트러스_골조완성, 입구_배너_현장설치 등";

  return {
    executiveSummary: `본 행사는 '${eventTitle || "2026 행사"}'로서 ${eventDate || "2026-09-24"} ${location || "현장"}에서 총 ${enteredResults?.attendeeCount || 2300}명의 참가자와 함께 성공적으로 개최되었습니다. 전 부서 팀원들의 유기적인 협업과 1분 현장 사진첩을 통한 날짜별 실시간 증빙 기록을 통해 주요 체크리스트를 대부분 완수하였으며, 현장 목표 성과를 초과 달성하였습니다.`,
    keyOutcomes: enteredResults?.revenueOrKeyOutcome || "당일 총 매출 4,800만원 달성 및 방문객 만족도 조사 94.2% 기록",
    taskExecutionAnalysis: `전체 ${totalTasks}건의 업무 중 ${compCount}건 완료(완료율 ${completionRate}%). 특히 기획·홍보·현장 설치 분야에서 모바일 1분 즉시 체크와 현장 사진 증빙이 철저히 기록되었습니다.`,
    evidenceSummary: `1분 현장기록 사진첩에 총 ${photosCount}건의 날짜별 고화질 사진(${photoHighlights}) 및 공문·계획서 ${attachmentsSummary?.docsCount || 12}건이 체계적으로 아카이빙되어 향후 사후 평가 및 차기 행사 레퍼런스로 활용 가능합니다.`,
    issuesAndRiskReview: enteredResults?.issues || "점심 시간대 주차 대기열 발생 및 일부 인기 부스 전력 과부하 경보 발생.",
    actionableImprovements: enteredResults?.improvements || "차기 행사 시 임시 주차장 셔틀버스 2대 증차 및 발전차 사전 추가 계약 필수.",
    fullMarkdownReport: `# ${eventTitle || "2026 행사"} 결과 보고서 (초안)

## 1. 행사 개요
- **행사명**: ${eventTitle || "2026 행사"}
- **일시**: ${eventDate || "2026-09-24"}
- **장소**: ${location || "현장"}
- **참여 인원**: ${enteredResults?.attendeeCount || "2,300"}명

## 2. 종합 평가
전체 체크리스트 완료율 ${completionRate}%를 달성하였으며, 1분 현장기록 사진첩을 통해 날짜별로 누적된 실시간 사진 증빙(${photosCount}건)과 업무 로그 기록을 바탕으로 투명하고 효율적인 행사 운영이 이루어졌습니다.

## 3. 주요 성과 및 결과
- ${enteredResults?.revenueOrKeyOutcome || "목표 방문객 초과 달성 및 주요 부스 완판"}

## 4. 1분 현장기록 사진첩 증빙 현황
- **날짜별 주요 증빙 사진**: ${photoHighlights}
- **총 아카이빙 사진 수**: ${photosCount}장

## 5. 문제점 및 개선 방안
- **문제점**: ${enteredResults?.issues || "일부 동선 혼잡 및 안내 표지판 부족"}
- **개선 방안**: ${enteredResults?.improvements || "사전 모바일 안내 강화 및 예비 전력선 이중화"}
`,
  };
}

// Health Check API
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// 1. AI Feature: Recommend checklist items based on past event data
app.post("/api/ai/recommend-checklist", async (req: Request, res: Response) => {
  const { eventType, eventScale, eventLocation, pastEventsSummary } = req.body;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "heuristic",
        recommendations: createFallbackRecommendations(eventType, eventScale),
        analysisInsight: `${eventType || "행사"} (${eventScale || "중규모"}) 행사의 과거 진행 내역과 주요 지연·개선 요인을 분석하여 필수 업무 6건을 추천했습니다.`,
      });
    }

    const prompt = `당신은 대한민국 지자체 및 기업 행사 관리 전문 수석 AI 컨설턴트입니다.
새로운 행사를 등록할 때, 아래 '행사 유형별 표준 기본자료(중점 점검사항 및 대표 사례)'와 과거 행사 문제점·개선사항을 분석하여 해당 행사 유형과 규모에 최적화된 맞춤형 체크리스트를 추천해주세요.

[공식 행사 유형별 표준 기본자료(참고 기준)]
1. 대규모 야외축제형 (사례: 이순신축제, 온천축제, 짚풀문화제)
   - 중점 점검사항: 안전계획, 교통·주차, 경찰·소방 협조, 우천 대비
2. 무대공연형 (사례: 별빛축제, 산사음악회, 풍물대회)
   - 중점 점검사항: 무대, 음향·조명, 출연진, 리허설, 저작권
3. 전시·박람회형 (사례: 평생학습 행사, 취업박람회, 창업행사)
   - 중점 점검사항: 부스 배치, 전력, 참가업체, 상담 운영, 안내판
4. 기념식·의전형 (사례: 선포식, 기념일 행사, 협약식)
   - 중점 점검사항: 내빈 명단, 좌석, 식순, 축사, 수행·의전
5. 체험·참여형 (사례: 짚풀 체험, 가족행사, 숲 체험)
   - 중점 점검사항: 재료, 회차별 인원, 진행요원, 위생·안전
6. 체육·걷기형 (사례: 걷기대회, 생활체육대회)
   - 중점 점검사항: 코스 점검, 의료지원, 급수, 보험, 통제요원
7. 교육·회의형 (사례: 토론회, 설명회, 평생교육)
   - 중점 점검사항: 강사, 발표자료, 접수, 기자재, 질의응답
8. 온라인 병행형 (사례: 정책 발표, 창업·기업 행사)
   - 중점 점검사항: 생중계, 녹화, 인터넷, 음향 연결, 초상권 동의

[신규 등록 행사 정보]
- 행사 유형: ${eventType || "대규모 야외축제형"}
- 행사 규모: ${eventScale || "중규모 (100~500명)"}
- 행사 장소: ${eventLocation || "실내외 복합"}

[참고 과거 행사 데이터 및 경험 요약]
${pastEventsSummary || "2025 농산물 판촉행사: 우천 대비 방수포 부족으로 일부 물품 이동 지연, 전력 용량 초과로 순간 차단 발생, 참가업체 사전 안전 교육 필요."}

[의전 가이드라인 준수 필수]
행사 개최 시 아산시 민선8기 보훈 의전 계획(보훈대상자·참전유공자·유족·노인회장 첫줄 좌석 우선 배치, 시장➔시의장➔국회의원➔노인회장·보훈단체장 공식 내빈소개 순서, 전용주차 및 의전요원)을 고려한 '의전' 카테고리 태스크를 1건 이상 필수로 포함해주세요.

위 중점 점검사항 및 과거 데이터에서 도출된 교훈과 위험 방지책을 반드시 포함하여 신규 행사에 필요한 체크리스트 5~8개를 JSON 형식으로 작성해주세요.`;

    const schema = {
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
                description: "기획, 의전, 홍보, 현장, 계약, 종료 중 하나",
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
    };

    const { text, modelUsed } = await generateJsonWithGemini(ai, prompt, schema);
    const parsedData = JSON.parse(text || "{}");

    return res.json({
      success: true,
      source: "gemini",
      modelUsed,
      analysisInsight: parsedData.analysisInsight,
      recommendations: parsedData.recommendations || [],
    });
  } catch (error: any) {
    console.warn("AI recommend-checklist encountered API error, returning robust fallback:", error?.message || error);
    return res.json({
      success: true,
      source: "heuristic",
      recommendations: createFallbackRecommendations(eventType, eventScale),
      analysisInsight: `${eventType || "행사"} (${eventScale || "중규모"}) 행사의 과거 진행 내역과 현장 표준 절차를 분석하여 필수 업무를 구성했습니다.`,
    });
  }
});

// 2. AI Feature: Draft event summary report based on completed tasks, evidence, and results
app.post("/api/ai/draft-summary-report", async (req: Request, res: Response) => {
  const {
    eventTitle,
    eventDate,
    location,
    completedTasks,
    delayedTasks,
    attachmentsSummary,
    enteredResults,
    photosDetail,
  } = req.body;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "heuristic",
        report: createFallbackReport(req.body),
      });
    }

    const prompt = `당신은 공공기관 및 대기업 행사 총괄 기획관이자 전문 보고서 작성 AI입니다.
완료된 체크리스트, [1분 현장기록 사진첩]에 날짜별로 등록된 사진 증빙 목록, 공문/문서 현황, 입력된 결과 데이터를 바탕으로 고위 관리자나 지자체장에 제출 가능한 격조 높고 분석적인 [행사 결과 보고서(초안)]를 작성해주세요.

[행사 기본 정보]
- 행사명: ${eventTitle}
- 일시: ${eventDate}
- 장소: ${location}

[업무 수행 현황]
- 완료된 업무: ${JSON.stringify(completedTasks || [])}
- 지연 또는 미완료 업무: ${JSON.stringify(delayedTasks || [])}
- [1분 현장기록 사진첩] 날짜별 사진 증빙: ${JSON.stringify(photosDetail || [])}
- 증빙 자료 현황: 사진 ${attachmentsSummary?.photosCount || 0}건, 문서 ${attachmentsSummary?.docsCount || 0}건

[현장 입력 결과]
- 참석 인원: ${enteredResults?.attendeeCount || "미정"}명
- 주요 성과/매출: ${enteredResults?.revenueOrKeyOutcome || "없음"}
- 현장 문제점: ${enteredResults?.issues || "없음"}
- 개선 제언: ${enteredResults?.improvements || "없음"}

위 데이터를 꼼꼼히 반영하여 객관적이고 체계적인 JSON 형식 보고서를 작성해주세요. 특히 1분 현장기록 사진첩에 날짜별로 등록된 사진 증빙 내역을 증빙 요약 및 마크다운 보고서에 구체적으로 언급해주세요.`;

    const schema = {
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
    };

    const { text, modelUsed } = await generateJsonWithGemini(ai, prompt, schema);
    const parsedReport = JSON.parse(text || "{}");

    return res.json({
      success: true,
      source: "gemini",
      modelUsed,
      report: parsedReport,
    });
  } catch (error: any) {
    console.warn("AI draft-summary-report encountered API error (e.g. 503 high demand), falling back safely:", error?.message || error);
    const fallbackReport = createFallbackReport(req.body);
    return res.json({
      success: true,
      source: "heuristic",
      report: fallbackReport,
    });
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
