
# 대시보드 저장/로그아웃 문제 해결 계획

## 문제 분석

### 1. 저장 후 대시보드 미반영
- **원인**: `saveToCloud()` 함수가 저장 후 로컬 상태만 업데이트하고, 클라우드에서 저장된 데이터를 다시 불러오지 않음
- **현상**: 저장은 되지만 UI에 새 버전(v5→v6)이 즉시 반영되지 않음

### 2. 저장 시간 과다
- **현황**: Edge Function 실행시간 1.1~2.2초
- **원인**: 96건 데이터를 매번 전체 삽입하는 방식

### 3. 로그아웃 불가
- **원인 추정**: `signOut()` 호출 후 `onAuthStateChange` 리스너가 상태를 제대로 리셋하지 못하거나, 버튼 클릭 이벤트 처리 문제

## 해결 방안

### A. 저장 후 즉시 새로고침
```text
┌────────────────────────────────────────────────┐
│ saveToCloud() 개선                              │
├────────────────────────────────────────────────┤
│ 1. 데이터를 Edge Function으로 저장               │
│ 2. 저장 성공 후 loadFromCloud() 호출             │
│ 3. 최신 버전의 데이터로 UI 상태 갱신              │
│ 4. 토스트 메시지로 완료 알림                     │
└────────────────────────────────────────────────┘
```

**`src/hooks/useCloudData.ts` 수정**
- `saveToCloud` 함수에서 저장 성공 후 `loadFromCloud()`를 호출하여 최신 데이터로 상태 동기화
- 이렇게 하면 저장 직후 UI가 새 버전을 정확히 반영함

### B. 로그아웃 로직 강화
```text
┌────────────────────────────────────────────────┐
│ signOut() 개선                                  │
├────────────────────────────────────────────────┤
│ 1. 로그아웃 시작 즉시 로딩 상태 표시             │
│ 2. supabase.auth.signOut() 호출                │
│ 3. 수동으로 상태 즉시 리셋                       │
│    (onAuthStateChange 대기하지 않음)            │
│ 4. 토스트 메시지로 완료 알림                     │
└────────────────────────────────────────────────┘
```

**`src/hooks/useAuth.ts` 수정**
- `signOut` 함수에서 API 호출 후 즉시 상태를 `null`로 리셋
- `onAuthStateChange` 이벤트 의존 제거로 즉각적인 UI 업데이트

### C. AdminAuth 버튼 개선
**`src/components/dashboard/AdminAuth.tsx` 수정**
- 로그아웃 버튼에 로딩 상태 추가
- 클릭 후 즉각적인 피드백 제공

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/hooks/useCloudData.ts` | saveToCloud 후 loadFromCloud 호출 추가 |
| `src/hooks/useAuth.ts` | signOut 후 즉시 상태 리셋 |
| `src/components/dashboard/AdminAuth.tsx` | 로그아웃 버튼 로딩 상태 추가 |

## 기술적 상세

### useCloudData.ts 변경
```typescript
// 변경 전
const saveToCloud = useCallback(async (data, notes) => {
  // ... 저장 로직
  setState((prev) => ({ ...prev, data, cloudVersion: response.version, ... }));
  return true;
}, []);

// 변경 후
const saveToCloud = useCallback(async (data, notes) => {
  // ... 저장 로직
  // 저장 성공 후 클라우드에서 최신 데이터 다시 불러오기
  const cloudResult = await loadFromCloud();
  if (cloudResult) {
    setState({
      data: cloudResult.data,
      isLoading: false,
      cloudVersion: cloudResult.version,
      cloudUpdatedAt: cloudResult.updatedAt,
      isFromCloud: true,
    });
  }
  return true;
}, [loadFromCloud]);
```

### useAuth.ts 변경
```typescript
// 변경 전
const signOut = useCallback(async () => {
  const { error } = await supabase.auth.signOut();
  // onAuthStateChange에 의존하여 상태 변경
}, []);

// 변경 후
const signOut = useCallback(async () => {
  // 즉시 상태 리셋 (UI 즉각 반영)
  setState({ user: null, session: null, isLoading: false, isAdmin: false });
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error(error.message);
  } else {
    toast.success("로그아웃되었습니다.");
  }
}, []);
```

## 예상 결과
- 저장 버튼 클릭 후 1~2초 내에 대시보드 버전이 업데이트됨
- 로그아웃 버튼 클릭 시 즉시 로그인 화면으로 전환
- 사용자 경험 개선: 명확한 로딩 상태와 완료 피드백
