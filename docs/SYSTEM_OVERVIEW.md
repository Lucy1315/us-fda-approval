# FDA 승인 의약품 대시보드 - 시스템 개요

> 최종 업데이트: 2026-02-08

---

## 1. 데이터 구조 (DrugApproval Interface)

| 분류 | 필드명 | 타입 | 설명 | 데이터 출처 |
|------|--------|------|------|-------------|
| **식별정보** | `applicationNo` | `string` | FDA 허가번호 (예: NDA217600) | FDA |
| | `applicationType` | `"NDA" \| "BLA"` | 신청 유형 | FDA |
| | `supplementCategory` | `string?` | 보충 승인 분류 (예: SUPPL-21) | FDA |
| **제품정보** | `brandName` | `string` | 브랜드명 | FDA |
| | `genericName` | `string` | 성분명 (영문) | FDA |
| | `genericNameKo` | `string?` | 성분명 (국문) | 수동/AI |
| | `dosageForm` | `string` | 제형 | FDA |
| | `routeOfAdmin` | `string` | 투여경로 | FDA |
| **승인정보** | `approvalDate` | `string` | 승인일 (YYYY-MM-DD) | FDA |
| | `sponsor` | `string` | 제약사/스폰서 | FDA |
| **분류정보** | `therapeuticArea` | `string` | 치료영역 (대분류 - 소분류) | **수동 분류** |
| | `isOncology` | `boolean` | 항암제 여부 | **수동 판정** |
| | `isBiosimilar` | `boolean` | 바이오시밀러 여부 | FDA/수동 |
| | `isNovelDrug` | `boolean` | 신약 (Novel Drug) 여부 | FDA |
| | `isOrphanDrug` | `boolean` | 희귀의약품 여부 | FDA |
| **적응증** | `indication` | `string` | 주요 적응증 (영문) | FDA |
| | `indicationFull` | `string?` | 상세 적응증 (국문) | **AI 번역** |
| **참고정보** | `notes` | `string?` | 임상적 맥락/의의 | **AI 생성** |
| | `fdaUrl` | `string` | FDA 상세 페이지 URL | FDA |
| | `isCber` | `boolean?` | CBER 규제 제품 여부 | FDA |

### 고유 키 생성 규칙
```
UniqueKey = applicationNo + approvalDate + (supplementCategory || "")
예: "NDA217600-2025-01-15-SUPPL-21"
```

---

## 2. 항암제 필터링 (isOncology)

### 2.1 현재 방식: 수동 판정
OpenFDA API에는 "항암제" 분류를 위한 표준 필드가 없어 **수동으로 판정**합니다.

### 2.2 참고 키워드 목록

#### 치료영역 기반 키워드
| 영문 | 국문 | 예시 |
|------|------|------|
| Oncology | 항암제 | 항암제 - 폐암 |
| Cancer | 암 | Oncology - Breast Cancer |
| Tumor | 종양 | Solid Tumor |
| Leukemia | 백혈병 | Acute Myeloid Leukemia |
| Lymphoma | 림프종 | Non-Hodgkin Lymphoma |
| Myeloma | 골수종 | Multiple Myeloma |
| Carcinoma | 암종 | Hepatocellular Carcinoma |
| Melanoma | 흑색종 | Metastatic Melanoma |
| Sarcoma | 육종 | Soft Tissue Sarcoma |

#### 자동 판정이 어려운 이유
1. **중복 적응증**: 같은 약물이 항암 + 비항암 적응증을 동시에 가질 수 있음
2. **지지요법**: 항암치료 부작용 관리 약물은 항암제로 분류할지 모호함
3. **면역관문억제제**: 자가면역질환과 암 치료에 모두 사용 가능

---

## 3. 데이터 수집 방법

| 수집 방법 | 데이터 유형 | 빈도 | 비고 |
|-----------|-------------|------|------|
| **Drugs@FDA (CDER)** | NDA/BLA 승인 데이터 | 일별 | 주요 데이터 소스 |
| **CBER Approvals** | 생물의약품, 세포/유전자치료제 | 일별 | CBER 규제 제품 |
| **openFDA API** | 검증용 데이터 | 온디맨드 | 브랜드명, 스폰서 검증 |
| **FDA Press Releases** | 주요 승인 뉴스 | 수시 | Novel Drug 확인 |
| **엑셀 업로드** | 사용자 입력 데이터 | 수시 | 병합(Merge) 방식 |

### 엑셀 업로드 병합 로직
```
1. 업로드된 각 행에 대해 고유 키 생성
2. 기존 데이터와 키 비교
3. 신규 키만 추가 (중복 무시)
4. 기존 데이터 보존
```

---

## 4. 필터링 프로세스

### 4.1 필터 유형별 적용 방식

| 필터 | 유형 | 적용 방식 | 기준값 |
|------|------|-----------|--------|
| **기간** | 상대 기간 | 오늘 날짜 기준 역산 | `new Date()` |
| | 직접 선택 | 시작일~종료일 범위 | 사용자 입력 |
| **신청 유형** | 단일 선택 | 정확히 일치 | NDA / BLA |
| **제약사** | 단일 선택 | 정확히 일치 | sponsor 필드 |
| **치료영역** | 단일 선택 | 부분 일치 | therapeuticArea 필드 |
| **항암제** | Boolean | true/false 매칭 | isOncology |
| **바이오시밀러** | Boolean | true/false 매칭 | isBiosimilar |
| **신약** | Boolean | true/false 매칭 | isNovelDrug |
| **희귀의약품** | Boolean | true/false 매칭 | isOrphanDrug |

### 4.2 기간 필터 상세

```typescript
// 기준일: 오늘 날짜 (시스템 시간)
const reference = new Date();

// 상대 기간 계산
const dateRanges = {
  "1m": subMonths(reference, 1),   // 오늘 - 1개월
  "3m": subMonths(reference, 3),   // 오늘 - 3개월
  "6m": subMonths(reference, 6),   // 오늘 - 6개월
  "1y": subYears(reference, 1),    // 오늘 - 1년
  "2y": subYears(reference, 2),    // 오늘 - 2년
};
```

### 4.3 중복 제거 로직
```typescript
function deduplicateData(items: DrugApproval[]): DrugApproval[] {
  const seen = new Set<string>();
  return items.filter((drug) => {
    const key = `${drug.applicationNo}-${drug.approvalDate}-${drug.supplementCategory || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

---

## 5. 데이터 출처 및 검증

| 항목 | 1차 출처 | 검증 방법 | 자동화 수준 |
|------|----------|-----------|-------------|
| 허가번호 | Drugs@FDA | openFDA API | ✅ 자동 |
| 승인일 | Drugs@FDA | openFDA API | ✅ 자동 |
| 브랜드명 | Drugs@FDA | openFDA API 교차검증 | ✅ 자동 |
| 성분명 | Drugs@FDA | openFDA API | ✅ 자동 |
| 스폰서 | Drugs@FDA | openFDA API 교차검증 | ✅ 자동 |
| 제형/투여경로 | Drugs@FDA | - | ❌ 수동 |
| 치료영역 | - | - | ❌ **수동 분류** |
| 항암제 여부 | - | - | ❌ **수동 판정** |
| 적응증 (국문) | - | - | 🤖 **AI 번역** |
| 임상적 의의 | - | - | 🤖 **AI 생성** |

### FDA 검증 Edge Function
```
POST /functions/v1/validate-fda-data
- 입력: { applicationNo, brandName, sponsor }
- 출력: { isValid, discrepancies[], openFdaData }
```

---

## 6. 기술 스택

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Frontend** | React | 18.3.x | UI 렌더링 |
| | TypeScript | 5.x | 타입 안전성 |
| | Vite | 5.x | 빌드/개발 서버 |
| **Styling** | Tailwind CSS | 3.x | 스타일링 |
| | shadcn/ui | - | UI 컴포넌트 |
| **Charts** | Recharts | 2.x | 데이터 시각화 |
| **Excel** | ExcelJS | 4.x | 엑셀 가져오기/내보내기 |
| **Backend** | Lovable Cloud | - | Edge Functions |
| | Supabase | - | PostgreSQL DB |
| **날짜 처리** | date-fns | 3.x | 날짜 계산/포맷 |
| **상태 관리** | TanStack Query | 5.x | 서버 상태 관리 |

---

## 7. AI/수동 개입 필요 항목

> ⚠️ 아래 항목들은 openFDA API에서 제공하지 않아 **별도 작업이 필요**합니다.

| 필드 | 개입 유형 | 필요 이유 | 작업 방법 |
|------|-----------|-----------|-----------|
| `therapeuticArea` | 📝 **수동 분류** | openFDA에 치료영역 표준 필드 없음 | 적응증 기반 수동 분류 |
| `isOncology` | 📝 **수동 판정** | 항암제 분류 기준 부재 | 치료영역/적응증 검토 후 판정 |
| `isBiosimilar` | 📝 **수동 확인** | BLA 중 바이오시밀러 구분 필요 | FDA 승인 문서 확인 |
| `genericNameKo` | 🤖 **AI 번역** | 성분명 국문화 | GPT/번역 API |
| `indicationFull` | 🤖 **AI 번역** | 적응증 국문 상세 설명 | GPT 번역 + 전문용어 검수 |
| `notes` | 🤖 **AI 생성** | 임상적 맥락/의의 요약 | GPT 기반 생성 |

### 권장 워크플로우

```
1. FDA 데이터 수집 (자동)
   ↓
2. openFDA API 검증 (자동)
   ↓
3. 치료영역 분류 (수동)
   ↓
4. 항암제 여부 판정 (수동)
   ↓
5. 국문 번역 (AI + 검수)
   ↓
6. 클라우드 저장 (확정 버튼)
```

---

## 8. 엑셀 내보내기 구조

### 시트 구성 (5개)
| 시트명 | 내용 | 언어 |
|--------|------|------|
| Summary | 통계 요약, 색상 범례 | 한국어 |
| 국문 상세 | 전체 데이터 (국문) | 한국어 |
| English Details | 전체 데이터 (영문) | English |
| 최초승인(ORIG-1) | 신규 승인만 | 한국어 |
| 변경승인(SUPPL) | 변경 승인만 | 한국어 |

### 색상 코드
| 색상 | 의미 | Hex |
|------|------|-----|
| 🟠 주황 | 항암제 (Oncology) | `#FFF3E0` |
| 🟢 초록 | 바이오시밀러 | `#E8F5E9` |

---

## 9. 관련 문서

- [기술 구현 문서](./DASHBOARD_IMPLEMENTATION.md)
- [README](../README.md)

---

*문서 작성: Lovable AI*
