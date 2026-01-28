import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DrugApproval } from "@/data/fdaData";
import { toast } from "sonner";

interface FdaValidationProps {
  data: DrugApproval[];
}

interface ValidationResult {
  applicationNo: string;
  brandName: string;
  isValid: boolean;
  fdaBrandNames: string[];
  fdaSponsor: string | null;
  error?: string;
}

export function FdaValidation({ data }: FdaValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleValidate = async () => {
    setIsValidating(true);
    setResults([]);
    
    // Prepare items for validation (unique application numbers only)
    const uniqueApps = new Map<string, { applicationNo: string; brandName: string; applicationType: string }>();
    
    data.forEach((drug) => {
      const key = drug.applicationNo;
      if (!uniqueApps.has(key)) {
        uniqueApps.set(key, {
          applicationNo: drug.applicationNo,
          brandName: drug.brandName,
          applicationType: drug.applicationType,
        });
      }
    });

    const items = Array.from(uniqueApps.values());
    setProgress({ current: 0, total: items.length });

    // Process in batches of 10 to avoid timeout
    const batchSize = 10;
    const allResults: ValidationResult[] = [];

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const { data: responseData, error } = await supabase.functions.invoke(
          "validate-fda-data",
          { body: { items: batch } }
        );

        if (error) {
          console.error("Validation error:", error);
          toast.error(`검증 오류: ${error.message}`);
          break;
        }

        if (responseData?.results) {
          allResults.push(...responseData.results);
        }

        setProgress({ current: Math.min(i + batchSize, items.length), total: items.length });
        setResults([...allResults]);

        // Small delay between batches
        if (i + batchSize < items.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const invalidCount = allResults.filter((r) => !r.isValid).length;
      if (invalidCount > 0) {
        toast.warning(`${invalidCount}건의 불일치 항목이 발견되었습니다.`);
      } else {
        toast.success("모든 데이터가 FDA 공식 데이터와 일치합니다.");
      }
    } catch (err) {
      console.error("Validation failed:", err);
      toast.error("검증 중 오류가 발생했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  const invalidResults = results.filter((r) => !r.isValid);
  const validResults = results.filter((r) => r.isValid);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">FDA 검증</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            openFDA API 데이터 검증
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            현재 데이터의 허가번호와 제품명이 FDA 공식 데이터베이스와 일치하는지 확인합니다.
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleValidate} 
              disabled={isValidating}
              className="gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  검증 중... ({progress.current}/{progress.total})
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  검증 시작
                </>
              )}
            </Button>

            {results.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <CheckCircle className="h-4 w-4" />
                  일치: {validResults.length}
                </span>
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" />
                  불일치: {invalidResults.length}
                </span>
              </div>
            )}
          </div>

          {invalidResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                불일치 항목 ({invalidResults.length}건)
              </h4>
              <ScrollArea className="h-[300px] border rounded-md p-3">
                <div className="space-y-3">
                  {invalidResults.map((result, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-destructive/10 rounded-md border border-destructive/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{result.brandName}</div>
                          <div className="text-sm text-muted-foreground">
                            허가번호: {result.applicationNo}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {result.error || "불일치"}
                        </Badge>
                      </div>
                      {result.fdaBrandNames.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">FDA 등록 제품명: </span>
                          <span className="font-medium">{result.fdaBrandNames.join(", ")}</span>
                        </div>
                      )}
                      {result.fdaSponsor && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">FDA 스폰서: </span>
                          <span>{result.fdaSponsor}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {validResults.length > 0 && invalidResults.length === 0 && (
            <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">모든 데이터가 FDA 공식 데이터와 일치합니다.</span>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>※ openFDA API를 통해 Drugs@FDA 데이터베이스를 조회합니다.</p>
            <p>※ CBER 제품(혈액제제, 백신 등)은 이 API에 포함되지 않을 수 있습니다.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
