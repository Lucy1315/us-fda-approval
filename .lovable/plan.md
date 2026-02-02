
# 승인일 필터 로직 수정 및 헤더에 오늘 날짜 표시

## 요약
현재 승인일 필터가 "데이터 수집일(최신 승인일)"을 기준으로 작동하고 있어 실제 오늘 날짜와 맞지 않습니다. 이를 **오늘 날짜 기준**으로 변경하고, 헤더에 오늘 날짜를 명시합니다.

---

## 변경 내용

### 1. 필터 로직 수정 (`Filters.tsx`)
- **기존**: 데이터셋 내 최신 승인일을 `reference`로 사용
- **변경**: 시스템의 오늘 날짜(`new Date()`)를 기준으로 사용

**수정 전:**
```
reference = 데이터셋의 최신 승인일 (예: 2025-12-30)
1개월 필터 = 2025-11-30 ~ 2025-12-30
```

**수정 후:**
```
reference = 오늘 날짜 (예: 2026-02-02)
1개월 필터 = 2026-01-02 ~ 2026-02-02
```

### 2. 헤더에 오늘 날짜 추가 (`Header.tsx`)
- 기존 "수집일" 옆에 "기준일: 오늘 날짜" 표시
- 형식: `기준일: 2026-02-02 (일)`

---

## 기술적 세부사항

### Filters.tsx 수정
`applyFilters` 함수에서 reference 계산 로직 변경:

```typescript
// 기존: 데이터셋 최신 승인일 사용
const reference = (() => {
  if (!data.length) { return today; }
  let max = parseLocalDate(data[0].approvalDate);
  for (let i = 1; i < data.length; i++) { ... }
  return max;
})();

// 변경: 항상 오늘 날짜 사용
const reference = (() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
})();
```

### Header.tsx 수정
오늘 날짜를 동적으로 표시:

```typescript
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// 컴포넌트 내부
const today = new Date();
const todayFormatted = format(today, "yyyy-MM-dd (EEE)", { locale: ko });

// JSX
<div className="flex items-center gap-1.5 text-muted-foreground">
  <CalendarCheck className="h-4 w-4" />
  <span>기준일: <strong className="text-foreground">{todayFormatted}</strong></span>
</div>
```

---

## 예상 결과

| 구분 | 기존 | 변경 후 |
|------|------|---------|
| 기준일 | 2025-12-30 (데이터 최신일) | 2026-02-02 (오늘) |
| 1개월 필터 범위 | 2025-11-30 ~ 2025-12-30 | 2026-01-02 ~ 2026-02-02 |
| 헤더 표시 | 수집일: 2026-01-29 | 수집일: 2026-01-29 / 기준일: 2026-02-02 |

---

## 수정 파일
1. `src/components/dashboard/Filters.tsx` - applyFilters 함수 수정
2. `src/components/dashboard/Header.tsx` - 오늘 날짜 표시 추가
