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

// Normalize cloud data to ensure all required fields exist
function normalizeCloudData(item: Record<string, unknown>): DrugApproval {
  return {
    applicationNo: (item.applicationNo as string) || "",
    applicationType: (item.applicationType as "NDA" | "BLA") || "NDA",
    brandName: (item.brandName as string) || "",
    brandNameKorean: (item.brandNameKorean as string) || (item.brandName as string) || "",
    activeIngredient: (item.activeIngredient as string) || "",
    activeIngredientKorean: (item.activeIngredientKorean as string) || (item.activeIngredient as string) || "",
    sponsor: (item.sponsor as string) || "",
    approvalDate: (item.approvalDate as string) || "",
    therapeuticArea: (item.therapeuticArea as string) || "",
    indication: (item.indication as string) || (item.indicationFull as string) || "",
    indicationKorean: (item.indicationKorean as string) || (item.indicationFull as string) || "",
    isOncology: (item.isOncology as boolean) ?? false,
    isBiosimilar: (item.isBiosimilar as boolean) ?? false,
    isNovelDrug: (item.isNovelDrug as boolean) ?? false,
    isOrphanDrug: (item.isOrphanDrug as boolean) ?? false,
    ndaBlaNumber: (item.ndaBlaNumber as string) || "",
    fdaUrl: (item.fdaUrl as string) || "",
    supplementCategory: item.supplementCategory as string | undefined,
    isCberProduct: (item.isCberProduct as boolean) ?? false,
    notes: item.notes as string | undefined,
    approvalMonth: item.approvalMonth as string | undefined,
    approvalType: item.approvalType as string | undefined,
    indicationFull: item.indicationFull as string | undefined,
  } as DrugApproval;
}

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

  // Load data from cloud with timeout
  const loadFromCloud = useCallback(async () => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Cloud load timeout")), 8000);
      });

      // Race between cloud load and timeout
      const loadPromise = supabase.functions.invoke("persist-fda-data", {
        body: { action: "load" },
      });

      const result = await Promise.race([loadPromise, timeoutPromise]);
      
      if (!result || typeof result !== 'object') {
        console.warn("Cloud load returned invalid result");
        return null;
      }

      const { data: response, error } = result as { data: any; error: any };

      if (error) {
        console.error("Cloud load error:", error);
        return null;
      }

      if (response?.success && response.data && response.data.length > 0) {
        const normalizedData = (response.data as Record<string, unknown>[]).map(normalizeCloudData);
        return {
          data: deduplicateData(normalizedData),
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

      // Update local state
      setState((prev) => ({
        ...prev,
        data,
        cloudVersion: response.version,
        cloudUpdatedAt: new Date().toISOString(),
        isFromCloud: true,
      }));

      toast.success(`✅ 데이터가 영구 저장되었습니다 (버전 ${response.version})`);
      return true;
    } catch (err) {
      console.error("Cloud save failed:", err);
      toast.error("저장 중 오류가 발생했습니다.");
      return false;
    }
  }, []);

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
