
# 대시보드 관리자 탭 분리 계획

## 요약
대시보드 헤더에 **탭 구조**를 도입하여 일반 사용자와 관리자 기능을 분리합니다.

---

## 변경 내용

### 현재 상태
- 모든 버튼이 헤더에 한 줄로 나열됨
  - 사용 방법, FDA 검증, 엑셀 다운로드, 이메일, 엑셀 업로드, 확정

### 변경 후 구조

| 탭 | 포함 버튼 |
|---|---|
| **기본 뷰** (탭 없음) | 사용 방법, 엑셀 다운로드 |
| **관리자** (클릭 시 확장) | FDA 검증, 이메일, 엑셀 업로드, 확정 |

---

## UI 구현 방식

관리자 버튼을 **Collapsible** 또는 **탭 토글** 방식으로 숨기고, "관리자" 버튼 클릭 시 확장되도록 합니다:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  [사용 방법]  [엑셀 다운로드]  │  [관리자 ▼]                        │
└──────────────────────────────────────────────────────────────────────┘
                                        ↓ 클릭 시 확장
┌──────────────────────────────────────────────────────────────────────┐
│  [사용 방법]  [엑셀 다운로드]  │  [관리자 ▲]                        │
│                               │  [FDA 검증] [이메일] [엑셀 업로드] [확정]  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 파일 수정 목록

### 1. `src/components/dashboard/Header.tsx`
- 상태 추가: `isAdminOpen` (관리자 패널 토글)
- 기본 버튼 영역: `UsageGuide` + `FdaNovelDrugsExport` (엑셀 다운로드)
- 관리자 버튼 추가: 클릭 시 관리자 도구 패널 토글
- 관리자 패널: `FdaValidation`, `EmailSend`, `ExcelUpload`, "확정" 버튼

---

## 기술적 세부사항

### Header.tsx 수정 내용

```tsx
// 새로운 import
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Settings2, ChevronDown, ChevronUp } from "lucide-react";

// 상태 추가
const [isAdminOpen, setIsAdminOpen] = useState(false);

// 기본 버튼 영역 (항상 표시)
<div className="flex items-center gap-2">
  <UsageGuide />
  <FdaNovelDrugsExport data={data} filteredData={filteredData} />
  
  {/* 관리자 토글 버튼 */}
  <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
    <CollapsibleTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <Settings2 className="h-4 w-4" />
        관리자
        {isAdminOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>
    </CollapsibleTrigger>
    
    <CollapsibleContent>
      {/* 관리자 도구 패널 */}
      <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md">
        <FdaValidation data={data} onDataUpdate={onDataUpdate} />
        <EmailSend filteredData={filteredData} />
        <ExcelUpload onDataUpdate={onDataUpdate} currentData={data} />
        <Button variant="default" size="sm" onClick={handleConfirm} disabled={isSaving}>
          {/* 확정 버튼 */}
        </Button>
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
```

---

## 예상 결과

| 항목 | 설명 |
|---|---|
| 기본 화면 | 사용 방법, 엑셀 다운로드만 보임 |
| 관리자 클릭 | FDA 검증, 이메일, 엑셀 업로드, 확정 버튼이 펼쳐짐 |
| 인증 불필요 | 별도 로그인 없이 누구나 관리자 기능 접근 가능 |

---

## 구현 순서

1. `Header.tsx` 파일 수정
   - `Collapsible` 컴포넌트 import
   - `isAdminOpen` 상태 추가
   - 버튼 영역 재구성 (기본 + 관리자 토글)
   
2. 테스트
   - 관리자 버튼 토글 동작 확인
   - 각 버튼 기능 정상 작동 확인
