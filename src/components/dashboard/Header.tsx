import { Calendar, Database, FileText } from "lucide-react";
import { ExcelUpload } from "./ExcelUpload";
import { FdaNovelDrugsExport } from "./FdaNovelDrugsExport";
import { FdaValidation } from "./FdaValidation";
import { UsageGuide } from "./UsageGuide";
import { DataReset } from "./DataReset";
import { DrugApproval, fdaApprovals } from "@/data/fdaData";

interface HeaderProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  data: DrugApproval[];
  filteredData: DrugApproval[];
}

export function Header({ onDataUpdate, data, filteredData }: HeaderProps) {
  const handleReset = () => {
    onDataUpdate(fdaApprovals);
  };
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              US FDA 승인 전문의약품
            </h1>
          </div>
          <p className="text-muted-foreground">
            미국 FDA 전문의약품 승인 데이터 대시보드
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>데이터: <strong className="text-foreground">{data.length}건</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>수집일: <strong className="text-foreground">2026-01-28</strong></span>
            </div>
          </div>
          <UsageGuide />
          <DataReset onReset={handleReset} />
          <FdaValidation data={data} onDataUpdate={onDataUpdate} />
          <FdaNovelDrugsExport data={data} filteredData={filteredData} />
          <ExcelUpload onDataUpdate={onDataUpdate} />
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="px-2 py-1 rounded bg-muted">FDA Official</span>
        <span className="px-2 py-1 rounded bg-muted">Drugs.com</span>
        <span className="px-2 py-1 rounded bg-muted">ASCO Post</span>
        <span className="px-2 py-1 rounded bg-muted">NeurologyLive</span>
      </div>
    </header>
  );
}
