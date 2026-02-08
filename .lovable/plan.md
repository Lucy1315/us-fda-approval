
# 이메일 발송 기능 구현 계획

## 개요
대시보드에 "이메일 보내기" 버튼을 추가하고, 현재 필터링된 FDA 승인 데이터를 이메일로 발송하는 기능을 구현합니다.

---

## 추천 서비스: Resend

| 항목 | 내용 |
|------|------|
| 서비스 | Resend (https://resend.com) |
| 무료 티어 | 월 3,000건 |
| 장점 | 현대적 API, 간단한 설정, HTML 이메일 지원 |
| 필요 작업 | 1) 회원가입 2) 도메인 인증 3) API 키 발급 |

---

## 구현 내용

### 1. 새 컴포넌트 생성
**파일**: `src/components/dashboard/EmailSend.tsx`

- 이메일 보내기 버튼 (Mail 아이콘)
- Dialog로 수신자 이메일 입력
- 이메일 제목 및 내용 미리보기
- 발송 확인 버튼

### 2. Edge Function 생성
**파일**: `supabase/functions/send-email/index.ts`

- Resend API 연동
- HTML 이메일 템플릿 생성
- 필터링된 데이터 요약 포함
- 에러 핸들링

### 3. Header 컴포넌트 수정
**파일**: `src/components/dashboard/Header.tsx`

- EmailSend 컴포넌트 추가
- filteredData props 전달

---

## 기술 세부사항

### Edge Function 구조

```text
┌─────────────────────────────────────────────────┐
│  Frontend (EmailSend.tsx)                       │
│  - 수신자 이메일 입력                            │
│  - 발송할 데이터 요약 정보                       │
└───────────────────┬─────────────────────────────┘
                    │ POST /functions/v1/send-email
                    ▼
┌─────────────────────────────────────────────────┐
│  Edge Function (send-email/index.ts)            │
│  - RESEND_API_KEY 환경변수 사용                  │
│  - HTML 이메일 템플릿 생성                       │
│  - Resend API 호출                              │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Resend API                                     │
│  - 이메일 발송                                   │
└─────────────────────────────────────────────────┘
```

### 이메일 내용 구성

| 섹션 | 내용 |
|------|------|
| 제목 | `[FDA 승인 현황] YYYY-MM-DD 기준 N건` |
| 요약 | 전체 건수, 항암제, 신약, 바이오시밀러 통계 |
| 테이블 | 승인일, 브랜드명, 적응증 (상위 10건) |
| 푸터 | 대시보드 링크, 발송 시각 |

### 필요한 Secret

| 이름 | 설명 | 발급 위치 |
|------|------|-----------|
| `RESEND_API_KEY` | Resend API 키 | https://resend.com/api-keys |

---

## 사용자 설정 단계

1. https://resend.com 에서 회원가입
2. https://resend.com/domains 에서 도메인 인증 (또는 테스트용 onboarding@resend.dev 사용)
3. https://resend.com/api-keys 에서 API 키 생성
4. Lovable에서 RESEND_API_KEY 시크릿 등록

---

## 생성/수정 파일

| 파일 | 작업 |
|------|------|
| `src/components/dashboard/EmailSend.tsx` | 신규 생성 |
| `supabase/functions/send-email/index.ts` | 신규 생성 |
| `src/components/dashboard/Header.tsx` | EmailSend 추가 |

---

## 대안 서비스 (Resend 외)

사용자가 다른 서비스를 원할 경우:

| 서비스 | API 키 발급 URL |
|--------|-----------------|
| Brevo | https://app.brevo.com/settings/keys/api |
| SendGrid | https://app.sendgrid.com/settings/api_keys |
| Mailgun | https://app.mailgun.com/app/account/security/api_keys |
