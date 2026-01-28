

# 허가번호 수정 및 FDA 링크 업데이트 계획

## 개요
첨부된 FDA 공식 CSV 데이터와 대시보드의 허가번호 불일치 문제를 수정합니다.

## 수정 대상 및 내용

| 제품명 | 현재 번호 | 올바른 번호 | 변경 필요 |
|--------|-----------|-------------|-----------|
| RYBREVANT FASPRO | BLA 761385 | BLA 761433 | ✅ |
| NUFYMCO | BLA 761702 | BLA 761473 | ✅ |
| BONCRESA | BLA 761688 | BLA 761456 | ✅ |
| OZILTUS | BLA 761689 | BLA 761457 | ✅ |

## 작업 내용

### 1. 데이터 파일 수정 (`src/data/fdaData.ts`)
각 제품의 `ndaBlaNumber`와 `applicationNo` 필드를 올바른 값으로 수정:

- **RYBREVANT FASPRO**: 
  - `ndaBlaNumber`: "BLA 761385" → "BLA 761433"
  - `applicationNo`: "761385" → "761433"
  - `fdaUrl`: 사용자가 제공한 링크로 변경
  
- **NUFYMCO**:
  - `ndaBlaNumber`: "BLA 761702" → "BLA 761473"
  - `applicationNo`: "761702" → "761473"

- **BONCRESA**:
  - `ndaBlaNumber`: "BLA 761688" → "BLA 761456"
  - `applicationNo`: "761688" → "761456"

- **OZILTUS**:
  - `ndaBlaNumber`: "BLA 761689" → "BLA 761457"
  - `applicationNo`: "761689" → "761457"

### 2. FDA 링크 설정
- **RYBREVANT FASPRO**: `https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-amivantamab-and-hyaluronidase-lpuj-subcutaneous-injection/`

## 영향 범위
- **대시보드 테이블**: 자동 반영 (데이터 소스 변경)
- **상세 팝업**: 자동 반영
- **엑셀 내보내기**: 자동 반영 (`DrugApproval` 인터페이스 사용)
- **FDA 링크**: 제품명 클릭 시 올바른 페이지로 이동

## 파일 변경 목록
| 파일 | 변경 내용 |
|------|----------|
| `src/data/fdaData.ts` | 4개 제품의 허가번호 및 URL 수정 |

