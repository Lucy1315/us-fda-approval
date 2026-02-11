

# 프로젝트 소개 PPT 생성 기능 구현

## 요약
`pptxgenjs` 라이브러리를 사용하여 **10페이지 PowerPoint 프레젠테이션**을 자동 생성하는 기능을 구현합니다. 대시보드에 "PPT 다운로드" 버튼을 추가하여 클릭 시 .pptx 파일이 다운로드됩니다.

---

## PPT 구성 (10페이지)

| 페이지 | 제목 | 내용 |
|--------|------|------|
| 1 | 표지 | 프로젝트명, 부제, 날짜 |
| 2 | 프로젝트 개요 | 목적, 대상 데이터, 주요 기능 요약 |
| 3 | 기술 스택 | React, TypeScript, Tailwind, Recharts, ExcelJS, Lovable Cloud |
| 4 | 시스템 아키텍처 | 데이터 계층 구조 (소스코드 + 클라우드 병합), Edge Functions |
| 5 | 핵심 기능 1 - 데이터 시각화 | 통계 카드, 치료영역 차트, 하이라이트 + 대시보드 스크린샷 |
| 6 | 핵심 기능 2 - 필터링 & 검색 | 8가지 필터, 통합 검색, 기간 설정 |
| 7 | 핵심 기능 3 - 데이터 관리 | 엑셀 업로드/다운로드, FDA 검증, 클라우드 저장, 이메일 발송 |
| 8 | 워크플로우 | 일반 사용 흐름, 데이터 업데이트 흐름, 이메일 발송 흐름 |
| 9 | 특장점 | 클라우드 병합, 다국어 지원, 관리자 모드, 자동 검증 등 |
| 10 | 향후 개선사항 | AI 자동 분류, 실시간 FDA 연동, 사용자 권한 관리, 모바일 최적화 등 |

---

## 스크린샷 포함 방식

실제 대시보드 스크린샷을 캡처하여 프로젝트 `public/` 폴더에 이미지로 저장한 뒤, PPT 생성 시 해당 이미지를 슬라이드에 삽입합니다.

캡처할 화면:
- 대시보드 메인 화면 (통계 카드 + 차트)
- 필터 영역
- 데이터 테이블
- 관리자 패널

---

## 수정/생성 파일

### 1. 새 파일: `src/components/dashboard/PresentationExport.tsx`
- "PPT 다운로드" 버튼 컴포넌트
- `pptxgenjs`를 사용하여 10페이지 슬라이드 생성
- 각 슬라이드에 텍스트, 도형, 이미지 배치
- 클릭 시 .pptx 파일 다운로드

### 2. `src/components/dashboard/Header.tsx`
- PresentationExport 컴포넌트를 헤더 영역에 추가 (일반 사용자 영역, 엑셀 다운로드 옆)

### 3. 스크린샷 이미지 파일들
- `public/screenshots/dashboard-main.png`
- `public/screenshots/dashboard-filters.png`
- `public/screenshots/dashboard-table.png`
- `public/screenshots/admin-panel.png`

---

## 기술적 세부사항

### 의존성 추가
```
pptxgenjs (npm install pptxgenjs)
```

### PPT 생성 코드 구조

```typescript
import pptxgen from "pptxgenjs";

function generatePresentation() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  
  // 슬라이드 1: 표지
  const slide1 = pres.addSlide();
  slide1.addText("US FDA 승인 전문의약품 대시보드", { ... });
  
  // 슬라이드 2~10: 각 섹션별 내용
  // ...
  
  // 스크린샷 이미지 삽입
  slide.addImage({ path: "/screenshots/dashboard-main.png", ... });
  
  pres.writeFile({ fileName: "FDA-Dashboard-소개.pptx" });
}
```

### 디자인 가이드
- 배경: 흰색 + 파란색 그라디언트 헤더
- 타이틀 폰트: 28pt Bold
- 본문 폰트: 14pt
- 포인트 컬러: #4338CA (인디고), #059669 (에메랄드)
- 각 슬라이드 하단에 페이지 번호 표시

---

## 구현 순서

1. 대시보드 스크린샷 캡처 → `public/screenshots/`에 저장
2. `pptxgenjs` 패키지 설치
3. `PresentationExport.tsx` 컴포넌트 생성 (10페이지 PPT 생성 로직)
4. `Header.tsx`에 PPT 다운로드 버튼 추가
5. 테스트 (다운로드 및 PowerPoint에서 열기 확인)

