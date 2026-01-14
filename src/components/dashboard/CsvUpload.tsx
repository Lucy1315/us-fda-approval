import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DrugApproval } from "@/data/fdaData";
import { useToast } from "@/hooks/use-toast";

interface CsvUploadProps {
  onDataUpdate: (data: DrugApproval[]) => void;
}

export function CsvUpload({ onDataUpdate }: CsvUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): DrugApproval[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      return {
        approvalMonth: row["approval_month"] || row["승인월"] || "",
        approvalDate: row["approval_date"] || row["승인일"] || "",
        ndaBlaNumber: row["nda_bla_number"] || row["신청번호"] || "",
        applicationNo: row["application_no"] || row["허가번호"] || "",
        applicationType: row["application_type"] || row["신청유형"] || "",
        brandName: row["brand_name"] || row["제품명"] || "",
        activeIngredient: row["active_ingredient"] || row["주성분"] || "",
        sponsor: row["sponsor"] || row["제약사"] || "",
        indicationFull: row["indication_full"] || row["적응증"] || "",
        therapeuticArea: row["therapeutic_area"] || row["치료영역"] || "",
        isOncology: row["is_oncology"]?.toLowerCase() === "true" || row["항암제"] === "Y",
        isBiosimilar: row["is_biosimilar"]?.toLowerCase() === "true" || row["바이오시밀러"] === "Y",
        isNovelDrug: row["is_novel_drug"]?.toLowerCase() === "true" || row["신약"] === "Y",
        isOrphanDrug: row["is_orphan_drug"]?.toLowerCase() === "true" || row["희귀의약품"] === "Y",
        approvalType: row["approval_type"] || row["승인유형"] || "",
        notes: row["notes"] || row["비고"] || "",
      };
    }).filter(drug => drug.brandName && drug.approvalDate);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      if (parsedData.length === 0) {
        toast({
          title: "파싱 오류",
          description: "CSV 파일에서 유효한 데이터를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setFileName(null);
        return;
      }

      onDataUpdate(parsedData);
      toast({
        title: "업로드 완료",
        description: `${parsedData.length}건의 데이터가 성공적으로 로드되었습니다.`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "파일 읽기 오류",
        description: "CSV 파일을 읽는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          CSV 업로드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            CSV 데이터 업로드
          </DialogTitle>
          <DialogDescription>
            FDA 승인 데이터가 포함된 CSV 파일을 업로드하세요. 
            대시보드가 자동으로 업데이트됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {fileName ? (
                <>
                  <Check className="h-10 w-10 text-green-500" />
                  <span className="text-sm font-medium">{fileName}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.preventDefault(); handleClear(); }}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    클릭하여 CSV 파일 선택
                  </span>
                </>
              )}
            </label>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">필수 컬럼:</p>
            <p>brand_name, approval_date, therapeutic_area, sponsor</p>
            <p className="font-medium mt-2">선택 컬럼:</p>
            <p>is_oncology, is_biosimilar, is_novel_drug, is_orphan_drug, approval_type, notes</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
