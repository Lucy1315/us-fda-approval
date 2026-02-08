

# 이메일 엑셀 첨부 기능 추가 계획

## 요약
이메일 발송 시 **필터로 설정한 기간의 데이터를 엑셀 파일로 생성**하여 첨부 파일로 함께 전송합니다.

---

## 현재 상태 분석

| 항목 | 현재 |
|---|---|
| 이메일 발송 | 통계 요약 + 대시보드 링크만 전송 |
| 엑셀 다운로드 | 별도 버튼으로 브라우저에서 다운로드 |
| 첨부 파일 | 없음 |

### 변경 후
| 항목 | 변경 후 |
|---|---|
| 이메일 발송 | 통계 요약 + 대시보드 링크 + 엑셀 첨부 |
| 엑셀 생성 | Edge Function 내에서 서버사이드 생성 |
| 첨부 파일 | Base64 인코딩된 엑셀 파일 |

---

## 기술적 고려사항

### Resend 첨부 파일 방식
Resend API는 Base64 인코딩된 파일을 첨부할 수 있습니다:

```typescript
await resend.emails.send({
  from: "...",
  to: [...],
  subject: "...",
  html: "...",
  attachments: [
    {
      content: base64EncodedContent, // Base64 문자열
      filename: "US-FDA-Approvals.xlsx"
    }
  ]
});
```

### 엑셀 생성 위치 변경
- **현재**: 브라우저에서 ExcelJS로 생성 (클라이언트 사이드)
- **변경**: Edge Function에서 생성 (서버 사이드)

---

## 구현 방식

### 방식 1: Edge Function에서 엑셀 생성 (선택)
- Edge Function에 필터된 데이터 전체를 전송
- 서버에서 엑셀 생성 후 Base64 인코딩하여 첨부
- 장점: 보안적으로 안전, 일관된 포맷
- 단점: 데이터량이 많으면 요청 크기 증가

### 방식 2: 클라이언트에서 Base64 생성 후 전송
- 브라우저에서 엑셀 생성 → Base64 인코딩
- Base64 문자열을 Edge Function으로 전송
- 장점: 기존 엑셀 생성 로직 재사용
- 단점: 대용량 Base64 전송, 요청 크기 제한 가능성

→ **방식 1을 선택**: 안정성과 일관성을 위해 Edge Function에서 생성

---

## 수정 파일

### 1. `src/components/dashboard/EmailSend.tsx`
- 필터된 데이터 전체를 API 요청에 포함
- 간소화된 약물 데이터 배열 전송 (필수 필드만)

### 2. `supabase/functions/send-email/index.ts`
- ExcelJS import 추가 (npm:exceljs)
- 엑셀 생성 함수 추가 (5개 시트 동일 구조)
- Resend attachments 옵션에 Base64 엑셀 첨부
- EmailRequest 인터페이스에 drugs 배열 추가

---

## 데이터 전송 구조

```typescript
// EmailRequest 확장
interface EmailRequest {
  to: string;
  subject: string;
  dateRangeText: string;
  stats: { ... };
  drugs: Array<{
    approvalDate: string;
    brandName: string;
    activeIngredient: string;
    ndaBlaNumber: string;
    sponsor: string;
    therapeuticArea: string;
    indicationFull: string;
    notes: string;
    isOncology: boolean;
    isBiosimilar: boolean;
    isNovelDrug: boolean;
    isOrphanDrug: boolean;
  }>;
}
```

---

## 엑셀 구조 (기존과 동일)

| 시트 | 내용 |
|---|---|
| 요약 | 기간, 통계, 약물 목록, 색상 범례 |
| 국문 상세 | 한글 상세 정보 |
| English Details | 영문 상세 정보 |
| 최초승인 (ORIG-1) | 최초승인만 필터 |
| 변경승인 (SUPPL) | 변경승인만 필터 |

---

## 이메일 발송 흐름

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. 사용자가 이메일 발송 버튼 클릭                               │
├─────────────────────────────────────────────────────────────────┤
│ 2. EmailSend 컴포넌트에서 필터된 데이터 수집                    │
│    - stats (통계)                                               │
│    - dateRangeText (승인일 기간)                                │
│    - drugs (약물 상세 데이터 배열)                              │
├─────────────────────────────────────────────────────────────────┤
│ 3. Edge Function 호출 (send-email)                              │
├─────────────────────────────────────────────────────────────────┤
│ 4. Edge Function 내에서:                                        │
│    a) ExcelJS로 5개 시트 엑셀 생성                              │
│    b) Buffer → Base64 인코딩                                    │
│    c) HTML 이메일 본문 생성                                     │
│    d) Resend API로 이메일 + 첨부파일 발송                       │
├─────────────────────────────────────────────────────────────────┤
│ 5. 수신자 이메일 도착 (본문 + 엑셀 첨부)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 제한사항 확인

| 항목 | 제한 | 대응 |
|---|---|---|
| Resend 첨부 용량 | 40MB (Base64 인코딩 후) | 충분함 (일반적으로 수백KB) |
| Edge Function 메모리 | 기본 충분 | ExcelJS 경량 |
| 데이터 전송량 | 약물 1000건 예상 최대 | JSON 압축 시 ~500KB |

---

## 구현 순서

1. `EmailSend.tsx` 수정
   - 필터된 데이터를 간소화하여 drugs 배열 생성
   - API 요청 body에 drugs 포함
   - 미리보기에 "엑셀 첨부" 표시 추가

2. `send-email/index.ts` 수정
   - npm:exceljs import
   - EmailRequest 인터페이스에 drugs 추가
   - generateExcel 함수 구현 (5개 시트)
   - Resend attachments 옵션 추가

3. Edge Function 재배포

4. 테스트
   - 필터 적용 후 이메일 발송
   - 수신된 이메일에서 첨부파일 확인

---

## 예상 결과

이메일 수신 시:
- 본문: 기존과 동일 (2x2 통계 카드 + 대시보드 링크)
- 첨부: `US-FDA-Approvals_2025-01-01_2025-12-31.xlsx` (5개 시트)

