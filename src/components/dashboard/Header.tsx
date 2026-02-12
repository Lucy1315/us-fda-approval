import { useState } from "react";
import { Calendar, CalendarCheck, Database, FileText, Cloud, CloudUpload, Loader2, Settings2, ChevronDown, ChevronUp, Lock, LogOut } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { EmailSend } from "./EmailSend";
import { ExcelUpload } from "./ExcelUpload";
import { FdaNovelDrugsExport } from "./FdaNovelDrugsExport";
import { FdaValidation } from "./FdaValidation";
import { UsageGuide } from "./UsageGuide";
import { AdminPasswordDialog } from "./AdminPasswordDialog";
import { DrugApproval } from "@/data/fdaData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { FilterState } from "./Filters";

interface HeaderProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  data: DrugApproval[];
  filteredData: DrugApproval[];
  filters: FilterState;
  saveToCloud: (data: DrugApproval[], notes?: string) => Promise<boolean>;
  isFromCloud: boolean;
  cloudVersion: number | null;
}

export function Header({ onDataUpdate, data, filteredData, filters, saveToCloud, isFromCloud, cloudVersion }: HeaderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const handleConfirm = async () => {
    if (data.length === 0) {
      toast.error("저장할 데이터가 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveToCloud(data, "데이터 확정");
      if (success) {
        toast.success(`v${(cloudVersion || 0) + 1} 저장 완료! 대시보드가 갱신되었습니다.`);
      } else {
        toast.error("클라우드 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Confirm save error:", error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const todayFormatted = format(new Date(), "yyyy-MM-dd (EEE)", { locale: ko });

  const handleAdminClick = () => {
    if (!isAdminAuthenticated) {
      setShowPasswordDialog(true);
    } else {
      setIsAdminOpen(!isAdminOpen);
    }
  };

  const handleAdminSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminOpen(false);
    toast.info("관리자 모드가 해제되었습니다.");
  };

  return (
    <>
      <AdminPasswordDialog 
        open={showPasswordDialog} 
        onOpenChange={setShowPasswordDialog} 
        onSuccess={handleAdminSuccess} 
      />
      
      <header className="mb-8">
        <div className="flex flex-col gap-3">
          {/* 타이틀 */}
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">
              US FDA 승인 전문의약품
            </h1>
            {isFromCloud && (
              <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                <Cloud className="h-3 w-3" />
                v{cloudVersion}
              </span>
            )}
          </div>
          
          {/* 서브타이틀 + 데이터 정보 + 액션 버튼 */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm relative">
            <span className="text-muted-foreground">미국 FDA 전문의약품 승인 데이터 대시보드</span>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>데이터: <strong className="text-foreground">{data.length}건</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>수집일: <strong className="text-foreground">2026-02-12</strong></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              <span>기준일: <strong className="text-foreground">{todayFormatted}</strong></span>
            </div>
            
            <div className="flex items-center gap-2">
              <UsageGuide />
              <FdaNovelDrugsExport data={data} filteredData={filteredData} />
              
              {isAdminAuthenticated ? (
                <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                  <div className="flex items-center gap-1">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings2 className="h-4 w-4" />
                        관리자
                        {isAdminOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </CollapsibleTrigger>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-9 w-9 p-0"
                      onClick={handleAdminLogout}
                      title="관리자 모드 해제"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <CollapsibleContent className="absolute right-0 mt-2 z-10">
                    <div className="flex items-center gap-2 p-2 bg-background border rounded-md shadow-md">
                      <FdaValidation data={data} onDataUpdate={onDataUpdate} />
                      <EmailSend filteredData={filteredData} filters={filters} />
                      <ExcelUpload onDataUpdate={onDataUpdate} currentData={data} />
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleConfirm}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            저장 중...
                          </>
                        ) : (
                          <>
                            <CloudUpload className="h-4 w-4" />
                            확정
                          </>
                        )}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleAdminClick}>
                  <Lock className="h-4 w-4" />
                  관리자
                </Button>
              )}
            </div>
          </div>
          
          {/* 데이터 소스 태그 */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">FDA Official</span>
            <span className="px-2 py-1 rounded bg-muted">Drugs.com</span>
            <span className="px-2 py-1 rounded bg-muted">ASCO Post</span>
            <span className="px-2 py-1 rounded bg-muted">NeurologyLive</span>
          </div>
        </div>
      </header>
    </>
  );
}
