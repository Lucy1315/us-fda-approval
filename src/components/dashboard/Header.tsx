import { Calendar, Database, FileText } from "lucide-react";
import { ExcelUpload } from "./ExcelUpload";
import { FdaNovelDrugsExport } from "./FdaNovelDrugsExport";
import { FdaValidation } from "./FdaValidation";
import { UsageGuide } from "./UsageGuide";
import { DataCommit } from "./DataCommit";
import { DrugApproval } from "@/data/fdaData";

interface HeaderProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  data: DrugApproval[];
  filteredData: DrugApproval[];
}

export function Header({ onDataUpdate, data, filteredData }: HeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground whitespace-nowrap">
              US FDA 승인 전문의약품
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              미국 FDA 전문의약품 승인 데이터 대시보드
            </p>
          </div>
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
          <FdaValidation data={data} onDataUpdate={onDataUpdate} />
          <DataCommit data={data} />
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
