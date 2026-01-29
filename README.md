# US FDA 승인 전문의약품 대시보드

미국 FDA 전문의약품 승인 데이터를 시각화하고 관리하는 대시보드 애플리케이션입니다.

## 📋 기술 문서

- **[대시보드 구현 문서](docs/DASHBOARD_IMPLEMENTATION.md)** - 데이터 아키텍처, 핵심 컴포넌트, 개발 가이드

## 🚀 주요 기능

- FDA 승인 의약품 데이터 시각화 (통계 카드, 차트)
- 다양한 필터링 (기간, 유형, 치료영역, 항암제/바이오시밀러 등)
- 통합 검색 (제품명, 성분명, 스폰서, 허가번호)
- FDA API 연동 검증
- 엑셀 내보내기/가져오기

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Excel**: ExcelJS
- **Backend**: Lovable Cloud (Edge Functions)

## 📦 설치 및 실행

```sh
# 저장소 클론
git clone <YOUR_GIT_URL>

# 디렉토리 이동
cd <YOUR_PROJECT_NAME>

# 의존성 설치
npm i

# 개발 서버 실행
npm run dev
```

## 📁 프로젝트 구조

```
src/
├── pages/Index.tsx          # 메인 대시보드
├── components/dashboard/    # 대시보드 컴포넌트
├── data/fdaData.ts          # 기본 데이터
└── integrations/supabase/   # 백엔드 연동

supabase/functions/          # Edge Functions
docs/                        # 기술 문서
```

## 🔗 링크

- **Preview**: https://id-preview--bd00b1a0-3925-46e7-b5b1-36e545a7d2ab.lovable.app
- **Published**: https://us-fda-approval.lovable.app

## 📄 라이선스

MIT License
