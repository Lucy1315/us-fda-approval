

# FDA 승인 데이터 대시보드 반영 계획

## 현황 분석

사용자가 제공한 2026년 1월 28일 FDA 승인 데이터 7건을 분석한 결과:

| 품목명 | 허가번호 | 유형 | 현재 상태 |
|--------|----------|------|----------|
| VFEND | NDA 021266 | SUPPL-59 | 이미 등록됨 |
| VFEND | NDA 021267 | SUPPL-69 | 이미 등록됨 |
| VFEND | NDA 021630 | SUPPL-49 | 이미 등록됨 |
| DAYSEE | ANDA 091467 | SUPPL-16 | 추가 필요 |
| ABILIFY MAINTENA KIT | NDA 202971 | SUPPL-20 | 이미 등록됨 |
| SERTRALINE HYDROCHLORIDE | ANDA 219655 | ORIG-1 | 추가 필요 |
| YUVEZZI | NDA 220142 | ORIG-1 | 이미 등록됨 |

## 추가 대상 (2건)

### 1. DAYSEE (ANDA 091467)
- **성분**: Ethinyl Estradiol + Levonorgestrel
- **제약사**: Lupin Ltd
- **분류**: Manufacturing (CMC) 변경승인
- **비고**: 제네릭 경구피임제

### 2. SERTRALINE HYDROCHLORIDE (ANDA 219655)
- **성분**: Sertraline Hydrochloride
- **제약사**: SKG Pharma
- **분류**: 최초승인 (ORIG-1)
- **비고**: 제네릭 항우울제

## 고려사항

현재 대시보드는 **NDA/BLA** 위주로 관리되고 있으며, 위 2개 품목은 **ANDA**(제네릭 의약품)입니다.

- ANDA 품목 포함 시 `applicationType` 필드에 "ANDA" 값 추가 필요
- 필터 및 통계 로직에서 ANDA 처리 여부 검토 필요

## 작업 내용

1. **`src/data/fdaData.ts` 수정**
   - DAYSEE 항목 추가 (산부인과 - 경구피임제)
   - SERTRALINE HYDROCHLORIDE 항목 추가 (정신건강의학과 - 항우울제)
   - 2026-01-28 승인일로 기존 데이터 블록에 삽입

2. **데이터 구조 예시**
```text
┌─────────────────────────────────────────────────┐
│  DAYSEE (ANDA 091467)                           │
├─────────────────────────────────────────────────┤
│  approvalMonth: "2026-01"                       │
│  approvalDate: "2026-01-28"                     │
│  ndaBlaNumber: "ANDA 091467"                    │
│  applicationNo: "091467"                        │
│  applicationType: "ANDA"                        │
│  brandName: "DAYSEE"                            │
│  activeIngredient: "ethinyl estradiol;          │
│                     levonorgestrel"             │
│  sponsor: "Lupin Ltd"                           │
│  therapeuticArea: "산부인과 - 경구피임제"         │
│  supplementCategory: "SUPPL-16 - Manufacturing" │
│  notes: "변경승인. 제조공정(CMC) 변경"            │
└─────────────────────────────────────────────────┘
```

## 클라우드 동기화

소스 코드(`fdaData.ts`)를 수정한 후에는 관리자 로그인 상태에서 **클라우드 저장**을 수행해야 실제 대시보드에 반영됩니다 (Cloud-stored data takes precedence 정책).

