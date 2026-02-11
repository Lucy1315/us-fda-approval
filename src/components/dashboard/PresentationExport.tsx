import { useState } from "react";
import { Presentation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function PresentationExport() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const pptxgen = (await import("pptxgenjs")).default;
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";
      pres.author = "FDA Dashboard";
      pres.subject = "US FDA 승인 전문의약품 대시보드 프로젝트 소개";

      const INDIGO = "4338CA";
      const EMERALD = "059669";
      const DARK = "1E293B";
      const GRAY = "64748B";
      const LIGHT_BG = "F8FAFC";
      const WHITE = "FFFFFF";
      const todayStr = format(new Date(), "yyyy년 M월 d일", { locale: ko });

      const addPageNumber = (slide: any, num: number) => {
        slide.addText(`${num} / 10`, {
          x: 8.5, y: 6.9, w: 1.5, h: 0.3,
          fontSize: 9, color: GRAY, align: "right",
        });
      };

      const addHeader = (slide: any, title: string, subtitle?: string) => {
        slide.addShape("rect", { x: 0, y: 0, w: 10, h: 1.2, fill: { color: INDIGO } });
        slide.addText(title, {
          x: 0.6, y: 0.15, w: 8.8, h: 0.6,
          fontSize: 24, bold: true, color: WHITE, fontFace: "Arial",
        });
        if (subtitle) {
          slide.addText(subtitle, {
            x: 0.6, y: 0.7, w: 8.8, h: 0.35,
            fontSize: 13, color: "C7D2FE", fontFace: "Arial",
          });
        }
      };

      const addBullets = (slide: any, items: string[], opts: any = {}) => {
        const { x = 0.8, y = 1.6, w = 8.4, fontSize = 13 } = opts;
        const textItems = items.map(item => ({
          text: item,
          options: { bullet: { code: "2022" }, fontSize, color: DARK, lineSpacing: 26, fontFace: "Arial" },
        }));
        slide.addText(textItems, { x, y, w, h: 5 });
      };

      // ─── Slide 1: 표지 ───
      const s1 = pres.addSlide();
      s1.addShape("rect", { x: 0, y: 0, w: 10, h: 7.5, fill: { color: INDIGO } });
      s1.addShape("rect", { x: 0, y: 5.5, w: 10, h: 2, fill: { color: "312E81" } });
      s1.addText("US FDA 승인\n전문의약품 대시보드", {
        x: 0.8, y: 1.2, w: 8.4, h: 2.2,
        fontSize: 36, bold: true, color: WHITE, fontFace: "Arial", lineSpacing: 48,
      });
      s1.addText("미국 FDA 전문의약품 승인 데이터 통합 관리 및 분석 플랫폼", {
        x: 0.8, y: 3.5, w: 8.4, h: 0.5,
        fontSize: 16, color: "C7D2FE", fontFace: "Arial",
      });
      s1.addText(todayStr, {
        x: 0.8, y: 5.8, w: 4, h: 0.4,
        fontSize: 14, color: "A5B4FC", fontFace: "Arial",
      });
      s1.addText("Lovable Cloud 기반 웹 애플리케이션", {
        x: 0.8, y: 6.3, w: 4, h: 0.4,
        fontSize: 12, color: "818CF8", fontFace: "Arial",
      });
      addPageNumber(s1, 1);

      // ─── Slide 2: 프로젝트 개요 ───
      const s2 = pres.addSlide();
      addHeader(s2, "프로젝트 개요", "Project Overview");
      s2.addText("목적", {
        x: 0.6, y: 1.5, w: 4, h: 0.4,
        fontSize: 16, bold: true, color: INDIGO, fontFace: "Arial",
      });
      addBullets(s2, [
        "미국 FDA에서 승인한 전문의약품(Rx) 데이터를 체계적으로 수집·관리",
        "치료영역별, 승인유형별 다차원 분석 및 시각화 제공",
        "관리자 워크플로우를 통한 데이터 검증·확정·배포 자동화",
        "이메일 리포트 발송 및 엑셀 내보내기 지원",
      ], { y: 2.0 });
      s2.addText("대상 데이터", {
        x: 0.6, y: 4.3, w: 4, h: 0.4,
        fontSize: 16, bold: true, color: INDIGO, fontFace: "Arial",
      });
      addBullets(s2, [
        "FDA 승인 전문의약품 (NDA/BLA/ANDA) 정보",
        "치료영역, 승인유형(신규/변경), 항암제 여부, 신약/바이오시밀러 분류",
        "한글/영문 이중 표기 지원 (21개 데이터 필드)",
      ], { y: 4.7 });
      addPageNumber(s2, 2);

      // ─── Slide 3: 기술 스택 ───
      const s3 = pres.addSlide();
      addHeader(s3, "기술 스택", "Technology Stack");

      const techItems = [
        { category: "Frontend", items: "React 18, TypeScript, Vite, Tailwind CSS" },
        { category: "UI Components", items: "shadcn/ui, Radix UI, Lucide Icons" },
        { category: "Data Visualization", items: "Recharts (차트), ExcelJS (엑셀)" },
        { category: "Backend", items: "Lovable Cloud (Supabase Edge Functions)" },
        { category: "Database", items: "PostgreSQL (버전 관리, RLS 보안)" },
        { category: "Email", items: "Resend API (HTML + Excel 첨부)" },
        { category: "State Management", items: "TanStack React Query, React Hooks" },
        { category: "Deployment", items: "Lovable 자동 배포, 프리뷰 환경" },
      ];
      techItems.forEach((item, i) => {
        const yPos = 1.5 + i * 0.6;
        s3.addShape("rect", {
          x: 0.6, y: yPos, w: 2.2, h: 0.45,
          fill: { color: i % 2 === 0 ? INDIGO : EMERALD },
          rectRadius: 0.05,
        });
        s3.addText(item.category, {
          x: 0.7, y: yPos, w: 2, h: 0.45,
          fontSize: 11, bold: true, color: WHITE, fontFace: "Arial", valign: "middle",
        });
        s3.addText(item.items, {
          x: 3.0, y: yPos, w: 6.5, h: 0.45,
          fontSize: 12, color: DARK, fontFace: "Arial", valign: "middle",
        });
      });
      addPageNumber(s3, 3);

      // ─── Slide 4: 시스템 아키텍처 ───
      const s4 = pres.addSlide();
      addHeader(s4, "시스템 아키텍처", "System Architecture");

      // 3-layer diagram
      const layers = [
        { label: "소스코드 데이터\n(fdaData.ts)", y: 1.6, color: "3B82F6" },
        { label: "클라우드 데이터\n(PostgreSQL)", y: 3.0, color: EMERALD },
        { label: "병합 → 대시보드\n(최신 버전 우선)", y: 4.4, color: INDIGO },
      ];
      layers.forEach(l => {
        s4.addShape("rect", {
          x: 1.0, y: l.y, w: 3.5, h: 1.0,
          fill: { color: l.color }, rectRadius: 0.1,
        });
        s4.addText(l.label, {
          x: 1.0, y: l.y, w: 3.5, h: 1.0,
          fontSize: 13, bold: true, color: WHITE, fontFace: "Arial",
          align: "center", valign: "middle",
        });
      });
      // Arrows
      s4.addText("▼", { x: 2.5, y: 2.6, w: 0.5, h: 0.4, fontSize: 18, color: GRAY, align: "center" });
      s4.addText("▼", { x: 2.5, y: 4.0, w: 0.5, h: 0.4, fontSize: 18, color: GRAY, align: "center" });

      // Edge Functions
      s4.addText("Edge Functions", {
        x: 5.5, y: 1.6, w: 4, h: 0.4,
        fontSize: 14, bold: true, color: INDIGO, fontFace: "Arial",
      });
      const edgeFns = [
        "persist-fda-data: 데이터 저장/버전 관리",
        "validate-fda-data: FDA 공식 데이터 검증",
        "send-email: HTML + Excel 첨부 이메일 발송",
      ];
      addBullets(s4, edgeFns, { x: 5.5, y: 2.1, w: 4, fontSize: 11 });

      s4.addText("보안 (RLS)", {
        x: 5.5, y: 3.8, w: 4, h: 0.4,
        fontSize: 14, bold: true, color: INDIGO, fontFace: "Arial",
      });
      addBullets(s4, [
        "Row Level Security 정책 적용",
        "관리자 역할 기반 접근 제어",
        "Service Role Key로 Edge Function 인증",
      ], { x: 5.5, y: 4.3, w: 4, fontSize: 11 });
      addPageNumber(s4, 4);

      // ─── Slide 5: 핵심 기능 1 - 데이터 시각화 ───
      const s5 = pres.addSlide();
      addHeader(s5, "핵심 기능 ① 데이터 시각화", "Statistics & Charts");
      addBullets(s5, [
        "통계 카드: 전체 건수, 항암제, 신약, 희귀의약품, Orig/Suppl 비율 등",
        "치료영역 차트: Recharts 기반 바 차트 (상위 10개 영역)",
        "하이라이트 섹션: 최근 승인, 주요 항암제, 바이오시밀러 현황",
        "실시간 필터 연동: 필터 변경 시 모든 시각화가 즉시 갱신",
      ], { y: 1.5 });
      try {
        s5.addImage({ path: "/screenshots/dashboard-main.png", x: 0.8, y: 3.8, w: 8.4, h: 3.2 });
      } catch (e) {
        s5.addShape("rect", { x: 0.8, y: 3.8, w: 8.4, h: 3.2, fill: { color: LIGHT_BG } });
        s5.addText("[대시보드 메인 화면 스크린샷]", {
          x: 0.8, y: 4.8, w: 8.4, h: 1,
          fontSize: 14, color: GRAY, align: "center", fontFace: "Arial",
        });
      }
      addPageNumber(s5, 5);

      // ─── Slide 6: 핵심 기능 2 - 필터링 & 검색 ───
      const s6 = pres.addSlide();
      addHeader(s6, "핵심 기능 ② 필터링 & 검색", "Filtering & Search");

      const filterItems = [
        "치료영역 (Therapeutic Area)",
        "승인유형 (Orig / Suppl)",
        "항암제 여부 (Oncology)",
        "신약/바이오시밀러 분류",
        "희귀의약품 (Orphan Drug)",
        "한글명 유무 필터",
        "기간 설정 (Date Range)",
        "통합 검색 (약품명, 회사명, 성분명 등)",
      ];
      filterItems.forEach((item, i) => {
        const col = i < 4 ? 0 : 1;
        const row = i % 4;
        const xPos = 0.6 + col * 4.8;
        const yPos = 1.5 + row * 0.55;
        s6.addText(`${i + 1}. ${item}`, {
          x: xPos, y: yPos, w: 4.5, h: 0.45,
          fontSize: 12, color: DARK, fontFace: "Arial",
          bullet: false,
        });
      });

      try {
        s6.addImage({ path: "/screenshots/dashboard-filters.png", x: 0.8, y: 3.8, w: 8.4, h: 3.2 });
      } catch (e) {
        s6.addShape("rect", { x: 0.8, y: 3.8, w: 8.4, h: 3.2, fill: { color: LIGHT_BG } });
        s6.addText("[필터 영역 스크린샷]", {
          x: 0.8, y: 4.8, w: 8.4, h: 1,
          fontSize: 14, color: GRAY, align: "center", fontFace: "Arial",
        });
      }
      addPageNumber(s6, 6);

      // ─── Slide 7: 핵심 기능 3 - 데이터 관리 ───
      const s7 = pres.addSlide();
      addHeader(s7, "핵심 기능 ③ 데이터 관리", "Data Management");

      const mgmtFeatures = [
        { title: "엑셀 업로드/다운로드", desc: "ExcelJS 기반 다중 시트 엑셀 생성, 업로드 시 기존 데이터와 병합" },
        { title: "FDA 공식 검증", desc: "Edge Function으로 FDA Novel Drugs 페이지와 자동 대조 검증" },
        { title: "클라우드 저장 (확정)", desc: "버전 관리 기반 데이터 확정, 자동 fingerprint 생성" },
        { title: "이메일 리포트", desc: "Resend API로 HTML 본문 + Excel 첨부 이메일 발송" },
      ];
      mgmtFeatures.forEach((feat, i) => {
        const yPos = 1.5 + i * 1.2;
        s7.addShape("rect", {
          x: 0.6, y: yPos, w: 0.08, h: 0.8,
          fill: { color: i % 2 === 0 ? INDIGO : EMERALD },
        });
        s7.addText(feat.title, {
          x: 0.9, y: yPos, w: 8.5, h: 0.4,
          fontSize: 14, bold: true, color: DARK, fontFace: "Arial",
        });
        s7.addText(feat.desc, {
          x: 0.9, y: yPos + 0.35, w: 8.5, h: 0.4,
          fontSize: 11, color: GRAY, fontFace: "Arial",
        });
      });
      addPageNumber(s7, 7);

      // ─── Slide 8: 워크플로우 ───
      const s8 = pres.addSlide();
      addHeader(s8, "워크플로우", "Workflows");

      // 일반 사용 흐름
      s8.addText("📊 일반 사용 흐름", {
        x: 0.6, y: 1.5, w: 9, h: 0.4,
        fontSize: 14, bold: true, color: INDIGO, fontFace: "Arial",
      });
      const userFlow = ["대시보드 접속", "통계 확인", "필터 적용", "데이터 조회", "엑셀 다운로드"];
      userFlow.forEach((step, i) => {
        const xPos = 0.5 + i * 1.9;
        s8.addShape("rect", {
          x: xPos, y: 2.0, w: 1.6, h: 0.6,
          fill: { color: "EEF2FF" }, rectRadius: 0.08,
          line: { color: INDIGO, width: 1 },
        });
        s8.addText(step, {
          x: xPos, y: 2.0, w: 1.6, h: 0.6,
          fontSize: 10, color: INDIGO, align: "center", valign: "middle", fontFace: "Arial",
        });
        if (i < userFlow.length - 1) {
          s8.addText("→", { x: xPos + 1.6, y: 2.0, w: 0.3, h: 0.6, fontSize: 14, color: GRAY, align: "center", valign: "middle" });
        }
      });

      // 데이터 업데이트 흐름
      s8.addText("🔄 데이터 업데이트 흐름", {
        x: 0.6, y: 3.0, w: 9, h: 0.4,
        fontSize: 14, bold: true, color: EMERALD, fontFace: "Arial",
      });
      const updateFlow = ["관리자 인증", "엑셀 업로드", "FDA 검증", "데이터 확정", "클라우드 저장"];
      updateFlow.forEach((step, i) => {
        const xPos = 0.5 + i * 1.9;
        s8.addShape("rect", {
          x: xPos, y: 3.5, w: 1.6, h: 0.6,
          fill: { color: "ECFDF5" }, rectRadius: 0.08,
          line: { color: EMERALD, width: 1 },
        });
        s8.addText(step, {
          x: xPos, y: 3.5, w: 1.6, h: 0.6,
          fontSize: 10, color: EMERALD, align: "center", valign: "middle", fontFace: "Arial",
        });
        if (i < updateFlow.length - 1) {
          s8.addText("→", { x: xPos + 1.6, y: 3.5, w: 0.3, h: 0.6, fontSize: 14, color: GRAY, align: "center", valign: "middle" });
        }
      });

      // 이메일 발송 흐름
      s8.addText("📧 이메일 발송 흐름", {
        x: 0.6, y: 4.5, w: 9, h: 0.4,
        fontSize: 14, bold: true, color: "DC2626", fontFace: "Arial",
      });
      const emailFlow = ["필터 적용", "이메일 작성", "통계 요약 생성", "Excel 생성", "Resend 발송"];
      emailFlow.forEach((step, i) => {
        const xPos = 0.5 + i * 1.9;
        s8.addShape("rect", {
          x: xPos, y: 5.0, w: 1.6, h: 0.6,
          fill: { color: "FEF2F2" }, rectRadius: 0.08,
          line: { color: "DC2626", width: 1 },
        });
        s8.addText(step, {
          x: xPos, y: 5.0, w: 1.6, h: 0.6,
          fontSize: 10, color: "DC2626", align: "center", valign: "middle", fontFace: "Arial",
        });
        if (i < emailFlow.length - 1) {
          s8.addText("→", { x: xPos + 1.6, y: 5.0, w: 0.3, h: 0.6, fontSize: 14, color: GRAY, align: "center", valign: "middle" });
        }
      });
      addPageNumber(s8, 8);

      // ─── Slide 9: 특장점 ───
      const s9 = pres.addSlide();
      addHeader(s9, "특장점", "Key Strengths");

      const strengths = [
        { icon: "☁️", title: "클라우드 데이터 병합", desc: "소스코드 기본 데이터 + 클라우드 최신 데이터 자동 병합으로 무중단 업데이트" },
        { icon: "🔒", title: "관리자 모드 보안", desc: "비밀번호 인증 기반 관리자 접근, RLS 정책으로 데이터 보호" },
        { icon: "🌐", title: "한/영 이중 표기", desc: "약품명, 회사명, 치료영역 등 21개 필드 한글·영문 동시 지원" },
        { icon: "✅", title: "FDA 공식 데이터 자동 검증", desc: "Edge Function으로 FDA Novel Drugs 페이지와 실시간 대조 검증" },
        { icon: "📊", title: "다차원 분석", desc: "8가지 필터 + 통합 검색으로 다양한 각도의 데이터 분석 가능" },
        { icon: "📧", title: "이메일 리포트 자동화", desc: "필터된 데이터 기반 HTML + Excel 첨부 리포트 원클릭 발송" },
      ];
      strengths.forEach((s, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i % 3;
        const xPos = 0.5 + col * 4.8;
        const yPos = 1.5 + row * 1.7;
        s9.addShape("rect", {
          x: xPos, y: yPos, w: 4.5, h: 1.4,
          fill: { color: LIGHT_BG }, rectRadius: 0.1,
        });
        s9.addText(`${s.icon} ${s.title}`, {
          x: xPos + 0.2, y: yPos + 0.1, w: 4.1, h: 0.45,
          fontSize: 13, bold: true, color: DARK, fontFace: "Arial",
        });
        s9.addText(s.desc, {
          x: xPos + 0.2, y: yPos + 0.55, w: 4.1, h: 0.7,
          fontSize: 10, color: GRAY, fontFace: "Arial",
        });
      });
      addPageNumber(s9, 9);

      // ─── Slide 10: 향후 개선사항 ───
      const s10 = pres.addSlide();
      addHeader(s10, "향후 개선사항", "Future Improvements");

      const improvements = [
        { phase: "Phase 1", items: ["AI 기반 치료영역 자동 분류", "FDA API 실시간 연동으로 자동 데이터 수집"] },
        { phase: "Phase 2", items: ["사용자 인증 및 역할 기반 권한 관리", "대시보드 커스터마이징 (위젯 배치)"] },
        { phase: "Phase 3", items: ["모바일 최적화 (반응형 디자인 강화)", "데이터 변경 이력 추적 및 감사 로그"] },
        { phase: "Phase 4", items: ["다국어 UI 지원 (EN/KR 전환)", "PDF 리포트 생성 및 정기 발송 스케줄링"] },
      ];
      improvements.forEach((phase, i) => {
        const xPos = 0.4 + i * 2.4;
        s10.addShape("rect", {
          x: xPos, y: 1.5, w: 2.2, h: 0.5,
          fill: { color: INDIGO }, rectRadius: 0.08,
        });
        s10.addText(phase.phase, {
          x: xPos, y: 1.5, w: 2.2, h: 0.5,
          fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle", fontFace: "Arial",
        });
        phase.items.forEach((item, j) => {
          s10.addShape("rect", {
            x: xPos, y: 2.2 + j * 1.5, w: 2.2, h: 1.2,
            fill: { color: LIGHT_BG }, rectRadius: 0.08,
            line: { color: "E2E8F0", width: 1 },
          });
          s10.addText(item, {
            x: xPos + 0.15, y: 2.2 + j * 1.5, w: 1.9, h: 1.2,
            fontSize: 10, color: DARK, fontFace: "Arial", valign: "middle",
          });
        });
      });

      // Footer
      s10.addShape("rect", { x: 0, y: 6.0, w: 10, h: 1.5, fill: { color: "312E81" } });
      s10.addText("Thank You", {
        x: 0, y: 6.1, w: 10, h: 0.6,
        fontSize: 22, bold: true, color: WHITE, align: "center", fontFace: "Arial",
      });
      s10.addText("US FDA 승인 전문의약품 대시보드 | Lovable Cloud", {
        x: 0, y: 6.7, w: 10, h: 0.4,
        fontSize: 11, color: "A5B4FC", align: "center", fontFace: "Arial",
      });
      addPageNumber(s10, 10);

      await pres.writeFile({ fileName: `FDA-Dashboard-소개_${format(new Date(), "yyyyMMdd")}.pptx` });
      toast.success("PPT 파일이 다운로드되었습니다!");
    } catch (error) {
      console.error("PPT generation error:", error);
      toast.error("PPT 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          생성 중...
        </>
      ) : (
        <>
          <Presentation className="h-4 w-4" />
          PPT
        </>
      )}
    </Button>
  );
}
