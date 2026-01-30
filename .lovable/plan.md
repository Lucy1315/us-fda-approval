

# 관리자 모드 제거 및 워크플로우 간소화 계획

## 현재 문제점

1. **관리자 로그인 필요**: 데이터를 저장하려면 로그인/관리자 권한이 필요함
2. **워크플로우 분리**: 엑셀 업로드 → 대시보드 적용 → FDA 검증 → 수정 → 클라우드 저장 등 단계가 많고 복잡함
3. **저장 성능 이슈**: 클라우드 저장에 1~2초 소요

## 새로운 워크플로우

```text
┌─────────────────────────────────────────────────────────────────┐
│  간소화된 데이터 관리 흐름                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 엑셀 업로드  ──→  대시보드 즉시 반영 (세션 임시 저장)          │
│         │                                                        │
│         ▼                                                        │
│  2. FDA 검증 실행  ──→  불일치 항목 수정                          │
│         │                                                        │
│         ▼                                                        │
│  3. "확정" 버튼 클릭  ──→  클라우드 영구 저장                     │
│         │                    + 대시보드 갱신                      │
│         │                    + 엑셀 다운로드 반영                 │
│         ▼                                                        │
│  완료! (인증 불필요)                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 제거 대상

| 항목 | 설명 |
|------|------|
| AdminAuth 컴포넌트 | 로그인/회원가입/관리자 등록 UI 전체 제거 |
| useAuth 훅 사용 | Index.tsx에서 isAdmin 의존성 제거 |
| isAdmin prop | ExcelUpload, Header에서 제거 |
| 관리자 로그인 버튼 | Header에서 AdminAuth 컴포넌트 삭제 |

## 변경 사항

### 1. Header 컴포넌트 수정
- AdminAuth 제거
- "확정" 버튼 추가 (클라우드 저장 + 새로고침)
- isAdmin prop 제거

### 2. ExcelUpload 컴포넌트 수정
- isAdmin 조건 제거 (항상 세션에만 적용)
- 버튼 텍스트: "적용" (클라우드 저장 없이 대시보드만 반영)
- saveToCloud prop 제거

### 3. FdaValidation 컴포넌트 수정
- 수정 시 세션에만 반영 (기존 로직 유지)
- "확정" 버튼과 연계하여 최종 저장

### 4. Index.tsx 수정
- useAuth 훅 제거
- isAdmin 전달 제거

### 5. ConfirmButton 신규 컴포넌트
- "확정" 버튼: 현재 세션 데이터를 클라우드에 저장
- 저장 완료 후 대시보드 자동 갱신

### 6. UsageGuide 수정
- 관리자 관련 안내 삭제
- 새로운 워크플로우 안내 추가

### 7. RLS 정책 수정
- 클라우드 저장 시 인증 없이도 저장 가능하도록 Edge Function 수정
- 또는 Service Role Key로 저장 (기존 구조 유지)

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| `src/components/dashboard/Header.tsx` | AdminAuth 제거, 확정 버튼 추가, isAdmin prop 제거 |
| `src/components/dashboard/ExcelUpload.tsx` | isAdmin 로직 제거, saveToCloud prop 제거 |
| `src/components/dashboard/UsageGuide.tsx` | 관리자 관련 내용 삭제, 새 워크플로우 안내 |
| `src/pages/Index.tsx` | useAuth 제거, isAdmin 전달 제거 |
| `src/components/dashboard/AdminAuth.tsx` | **삭제** |
| `src/hooks/useAuth.ts` | **유지** (향후 필요 시 사용, 현재 미사용) |

## 기술적 상세

### Header.tsx 변경
```typescript
// 제거: AdminAuth import 및 사용
// 제거: isAdmin prop

// 추가: 확정 버튼
<Button onClick={handleConfirm} disabled={isSaving}>
  {isSaving ? <Loader2 className="animate-spin" /> : <CloudUpload />}
  확정
</Button>
```

### ExcelUpload.tsx 변경
```typescript
// 변경 전
interface ExcelUploadProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  currentData: DrugApproval[];
  saveToCloud: (data: DrugApproval[], notes?: string) => Promise<boolean>;
  isAdmin: boolean;
}

// 변경 후
interface ExcelUploadProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  currentData: DrugApproval[];
}
```

### Index.tsx 변경
```typescript
// 제거
import { useAuth } from "@/hooks/useAuth";
const { isAdmin } = useAuth();

// Header 호출 변경
<Header
  onDataUpdate={updateData}
  data={data}
  filteredData={filteredData}
  saveToCloud={saveToCloud}
  isFromCloud={isFromCloud}
  cloudVersion={cloudVersion}
  // isAdmin 제거
/>
```

## 예상 결과

- 로그인 없이 누구나 데이터 업로드/수정/저장 가능
- 워크플로우 단순화: 업로드 → 검증/수정 → 확정
- "확정" 버튼 하나로 클라우드 저장 + 대시보드 갱신 완료

