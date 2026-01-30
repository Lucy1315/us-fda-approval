import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fdaApprovals, DrugApproval } from "@/data/fdaData";
import { toast } from "sonner";

interface CloudDataState {
  data: DrugApproval[];
  isLoading: boolean;
  cloudVersion: number | null;
  cloudUpdatedAt: string | null;
  isFromCloud: boolean;
}

const createDataFingerprint = (data: DrugApproval[]): string => {
  if (data.length === 0) return "empty";
  const first = data[0];
  const last = data[data.length - 1];
  const idsLen = data.reduce((acc, d) => acc + (d.applicationNo?.length || 0), 0);
  return `v2-${data.length}-${first?.applicationNo || ""}-${last?.applicationNo || ""}-${idsLen}`;
};

function deduplicateData(items: DrugApproval[]): DrugApproval[] {
  const seen = new Set<string>();
  return items.filter((drug) => {
    const key = `${drug.applicationNo}-${drug.approvalDate}-${drug.supplementCategory || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useCloudData() {
  const [state, setState] = useState<CloudDataState>({
    data: fdaApprovals,
    isLoading: true,
    cloudVersion: null,
    cloudUpdatedAt: null,
    isFromCloud: false,
  });

  // Load data from cloud
  const loadFromCloud = useCallback(async () => {
    try {
      const { data: response, error } = await supabase.functions.invoke("persist-fda-data", {
        body: { action: "load" },
      });

      if (error) {
        console.error("Cloud load error:", error);
        return null;
      }

      if (response?.success && response.data && response.data.length > 0) {
        return {
          data: deduplicateData(response.data as DrugApproval[]),
          version: response.version,
          updatedAt: response.updatedAt,
        };
      }

      return null;
    } catch (err) {
      console.error("Cloud load failed:", err);
      return null;
    }
  }, []);

  // Save data to cloud
  const saveToCloud = useCallback(async (data: DrugApproval[], notes?: string): Promise<boolean> => {
    try {
      const { data: response, error } = await supabase.functions.invoke("persist-fda-data", {
        body: { action: "save", data, notes },
      });

      if (error) {
        console.error("Cloud save error:", error);
        toast.error(`저장 오류: ${error.message}`);
        return false;
      }

      if (!response?.success) {
        toast.error(response?.error || "저장 실패");
        return false;
      }

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

      toast.success(`✅ 데이터가 영구 저장되었습니다 (버전 ${response.version})`);
      return true;
    } catch (err) {
      console.error("Cloud save failed:", err);
      toast.error("저장 중 오류가 발생했습니다.");
      return false;
    }
  }, [loadFromCloud]);

  // Update local data (without cloud save)
  const updateData = useCallback((newData: DrugApproval[]) => {
    setState((prev) => ({
      ...prev,
      data: deduplicateData(newData),
    }));
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const cloudResult = await loadFromCloud();

      if (cloudResult) {
        setState({
          data: cloudResult.data,
          isLoading: false,
          cloudVersion: cloudResult.version,
          cloudUpdatedAt: cloudResult.updatedAt,
          isFromCloud: true,
        });
      } else {
        // Fallback to source data
        setState({
          data: fdaApprovals,
          isLoading: false,
          cloudVersion: null,
          cloudUpdatedAt: null,
          isFromCloud: false,
        });
      }
    };

    init();
  }, [loadFromCloud]);

  return {
    ...state,
    updateData,
    saveToCloud,
    loadFromCloud,
    fingerprint: createDataFingerprint(state.data),
  };
}
