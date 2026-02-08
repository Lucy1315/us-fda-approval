
# 시스템 개요 마크다운 문서 작성

## 개요
이전에 설명한 대시보드 시스템 개요(데이터 구조, 항암제 필터링 키워드, 수집방법, 필터링 프로세스, 데이터 출처/검증, 기술스택, AI 관여 필요 항목)를 별도의 마크다운 파일로 작성합니다.

---

## 생성할 파일

**파일 경로**: `docs/SYSTEM_OVERVIEW.md`

---

## 문서 내용

### 1. 데이터 구조 표
| 분류 | 필드 | 타입 | 설명 | 데이터 출처 |
|------|------|------|------|-------------|
| 식별정보 | applicationNo | string | 허가번호 | FDA |
| 식별정보 | applicationType | "NDA"/"BLA" | 신청 유형 | FDA |
| ... (21개 필드 전체) |

### 2. 항암제 필터링 키워드
- `isOncology` = true/false (수동 판정)
- 자동 판정 불가 사유 및 키워드 목록

### 3. 데이터 수집 방법
- Drugs@FDA (CDER)
- CBER Approvals
- openFDA API
- FDA Press Releases
- 엑셀 업로드

### 4. 필터링 프로세스 표
| 필터 | 적용 방식 | 기준 |
|------|-----------|------|
| 기간 | 오늘 날짜 기준 상대 계산 | `new Date()` |
| 항암제 | Boolean 필드 매칭 | `isOncology` |
| ... |

### 5. 데이터 출처 및 검증 표
| 항목 | 출처 | 검증 방법 |
|------|------|-----------|
| 허가번호, 승인일 | Drugs@FDA | openFDA API |
| 브랜드명 | Drugs@FDA | openFDA API |
| ... |

### 6. 기술 스택 표
| 분류 | 기술 | 용도 |
|------|------|------|
| Frontend | React 18 + TypeScript | UI 렌더링 |
| ... |

### 7. AI/수동 개입 필요 항목 (별도 섹션)
| 필드 | 개입 유형 | 이유 |
|------|-----------|------|
| therapeuticArea | 수동 분류 | openFDA에 치료영역 필드 없음 |
| isOncology | 수동 판정 | 항암제 분류 기준 부재 |
| indicationFull (국문) | AI 번역 | 적응증 국문화 필요 |
| notes | AI 생성 | 임상적 맥락 요약 |

---

## 수정 파일
1. `docs/SYSTEM_OVERVIEW.md` (신규 생성)
