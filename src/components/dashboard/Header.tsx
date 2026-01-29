import { Calendar, Database, FileText, RotateCcw } from "lucide-react";
import { ExcelUpload } from "./ExcelUpload";
import { FdaNovelDrugsExport } from "./FdaNovelDrugsExport";
import { FdaValidation } from "./FdaValidation";
import { UsageGuide } from "./UsageGuide";
import { DataCommit } from "./DataCommit";
import { DrugApproval, fdaApprovals } from "@/data/fdaData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HeaderProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  data: DrugApproval[];
  filteredData: DrugApproval[];
}

const LOCAL_DATA_KEY = "fda_approvals_overrides_v1";

export function Header({ onDataUpdate, data, filteredData }: HeaderProps) {
  const handleResetData = () => {
    localStorage.removeItem(LOCAL_DATA_KEY);
    onDataUpdate(fdaApprovals);
    toast.success(`데이터가 소스 파일 기준 ${fdaApprovals.length}건으로 초기화되었습니다.`);
  };

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">
            US FDA 승인 전문의약품
          </h1>
        </div>
        
        {/* 서브타이틀 + 데이터 정보 + 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">미국 FDA 전문의약품 승인 데이터 대시보드</span>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>데이터: <strong className="text-foreground">{data.length}건</strong></span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>수집일: <strong className="text-foreground">2026-01-29</strong></span>
          </div>
          
          <div className="flex items-center gap-2">
            <UsageGuide />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetData}
              className="h-7 text-xs gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              데이터 초기화
            </Button>
            <FdaValidation data={data} onDataUpdate={onDataUpdate} />
            <DataCommit data={data} />
            <FdaNovelDrugsExport data={data} filteredData={filteredData} />
            <ExcelUpload onDataUpdate={onDataUpdate} />
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
  );
}
