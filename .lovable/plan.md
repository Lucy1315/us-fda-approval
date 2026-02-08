

# 이메일 엑셀 첨부 기능 추가 계획

## ✅ 구현 완료

이메일 발송 시 **필터로 설정한 기간의 데이터를 엑셀 파일로 생성**하여 첨부 파일로 함께 전송합니다.

---

## 변경 내용

### 변경 전
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

## 수정된 파일

1. `src/components/dashboard/EmailSend.tsx`
   - 필터된 데이터를 `drugs` 배열로 변환하여 API 요청에 포함
   - 미리보기에 "엑셀 첨부" 표시 추가

2. `supabase/functions/send-email/index.ts`
   - `npm:exceljs` import
   - `generateExcelBuffer()` 함수 구현 (5개 시트)
   - Resend `attachments` 옵션 추가

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

```
사용자 이메일 발송 버튼 클릭
        ↓
EmailSend에서 데이터 수집 (stats, dateRangeText, drugs)
        ↓
Edge Function 호출 (send-email)
        ↓
Edge Function 내에서:
  a) ExcelJS로 5개 시트 엑셀 생성
  b) Buffer → Base64 인코딩
  c) HTML 이메일 본문 생성
  d) Resend API로 이메일 + 첨부파일 발송
        ↓
수신자 이메일 도착 (본문 + 엑셀 첨부)
```
