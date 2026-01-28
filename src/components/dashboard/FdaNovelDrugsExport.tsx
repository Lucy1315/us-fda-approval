import { useState, useMemo } from "react";
import { Download, FileSpreadsheet, Loader2, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DrugApproval } from "@/data/fdaData";
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import ExcelJS from "exceljs";
import { cn } from "@/lib/utils";

interface FdaNovelDrugsExportProps {
  data: DrugApproval[];
  filteredData: DrugApproval[];
}

type ExportMode = "all" | "filtered" | "custom";

export function FdaNovelDrugsExport({ data, filteredData }: FdaNovelDrugsExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("filtered");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(startOfMonth(subMonths(new Date(), 1)));
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(endOfMonth(subMonths(new Date(), 1)));
  const { toast } = useToast();

  // 내보내기 대상 데이터 계산
  const exportData = useMemo(() => {
    switch (exportMode) {
      case "all":
        return data;
      case "filtered":
        return filteredData;
      case "custom":
        if (!customStartDate || !customEndDate) return [];
        return data.filter((drug) => {
          const approvalDate = parseISO(drug.approvalDate);
          return isWithinInterval(approvalDate, { start: customStartDate, end: customEndDate });
        });
      default:
        return filteredData;
    }
  }, [exportMode, data, filteredData, customStartDate, customEndDate]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = exportData.length;
    const oncologyCount = exportData.filter(d => d.isOncology).length;
    const nonOncologyCount = total - oncologyCount;
    const biosimilarCount = exportData.filter(d => d.isBiosimilar).length;
    const novelDrugCount = exportData.filter(d => d.isNovelDrug).length;
    const orphanDrugCount = exportData.filter(d => d.isOrphanDrug).length;
    
    return { total, oncologyCount, nonOncologyCount, biosimilarCount, novelDrugCount, orphanDrugCount };
  }, [exportData]);

  // 기간 표시 텍스트
  const periodText = useMemo(() => {
    if (exportData.length === 0) return "데이터 없음";
    const dates = exportData.map(d => parseISO(d.approvalDate)).sort((a, b) => a.getTime() - b.getTime());
    const minDate = format(dates[0], "yyyy-MM-dd");
    const maxDate = format(dates[dates.length - 1], "yyyy-MM-dd");
    return `${minDate} ~ ${maxDate}`;
  }, [exportData]);

  // 색상 범례를 시트에 추가하는 함수
  const addColorLegend = (sheet: ExcelJS.Worksheet, startRow: number) => {
    const sectionHeaderStyle: Partial<ExcelJS.Fill> = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" },
    };

    let rowNum = startRow;
    rowNum++; // 빈 줄

    const legendHeaderRow = sheet.getRow(rowNum);
    legendHeaderRow.getCell(1).value = "🎨 색상 범례";
    legendHeaderRow.getCell(1).font = { bold: true, size: 11 };
    legendHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
    sheet.mergeCells(`A${rowNum}:B${rowNum}`);
    rowNum++;

    const legendOrange = sheet.getRow(rowNum);
    legendOrange.getCell(1).value = "🟠 주황색";
    legendOrange.getCell(2).value = "항암제";
    legendOrange.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFED7AA" },
    };
    rowNum++;

    const legendGreen = sheet.getRow(rowNum);
    legendGreen.getCell(1).value = "🟢 연두색";
    legendGreen.getCell(2).value = "바이오시밀러";
    legendGreen.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFBBF7D0" },
    };
    rowNum++;

    const legendWhite = sheet.getRow(rowNum);
    legendWhite.getCell(1).value = "⬜ 색상 없음";
    legendWhite.getCell(2).value = "비항암제 (바이오시밀러 제외)";

    return rowNum;
  };

  // 데이터 행에 색상 적용
  const applyRowColor = (row: ExcelJS.Row, drug: DrugApproval, columns: number) => {
    if (drug.isOncology) {
      for (let i = 1; i <= columns; i++) {
        row.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFED7AA" },
        };
      }
    } else if (drug.isBiosimilar) {
      for (let i = 1; i <= columns; i++) {
        row.getCell(i).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFBBF7D0" },
        };
      }
    }
  };

  const generateExcel = async () => {
    if (exportData.length === 0) {
      toast({
        title: "내보내기 실패",
        description: "내보낼 데이터가 없습니다. 필터 조건을 확인해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FDA Drug Approval Dashboard";
      workbook.created = new Date();

      // 치료영역별 분포 계산
      const therapeuticAreaMap = new Map<string, number>();
      exportData.forEach(drug => {
        const area = drug.therapeuticArea;
        therapeuticAreaMap.set(area, (therapeuticAreaMap.get(area) || 0) + 1);
      });
      const therapeuticAreaStats = Array.from(therapeuticAreaMap.entries())
        .sort((a, b) => b[1] - a[1]);

      // ===== Sheet 1: 요약 통계 =====
      const summarySheet = workbook.addWorksheet("요약");
      summarySheet.columns = [
        { key: "A", width: 35 },
        { key: "B", width: 55 },
      ];

      const sectionHeaderStyle: Partial<ExcelJS.Fill> = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };
      const valueStyle: Partial<ExcelJS.Font> = {
        color: { argb: "FF1E40AF" },
        bold: true,
      };

      let rowNum = 1;

      // 타이틀
      const titleRow = summarySheet.getRow(rowNum);
      titleRow.getCell(1).value = "✅ US FDA 전문의약품 승인 현황";
      titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FF1E40AF" } };
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum += 2;

      // 기본 정보
      summarySheet.getRow(rowNum).getCell(1).value = "📅 대상 기간";
      summarySheet.getRow(rowNum).getCell(2).value = periodText;
      rowNum++;
      summarySheet.getRow(rowNum).getCell(1).value = "🗓️ 데이터 수집일";
      summarySheet.getRow(rowNum).getCell(2).value = format(new Date(), "yyyy-MM-dd");
      rowNum++;
      summarySheet.getRow(rowNum).getCell(1).value = "🔗 데이터 출처";
      summarySheet.getRow(rowNum).getCell(2).value = "FDA Official + Drugs.com + ASCO Post";
      rowNum += 2;

      // 승인 현황
      const statsHeaderRow = summarySheet.getRow(rowNum);
      statsHeaderRow.getCell(1).value = "☑️ 승인 현황";
      statsHeaderRow.getCell(1).font = { bold: true, size: 12 };
      statsHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "구분";
      summarySheet.getRow(rowNum).getCell(2).value = "건수";
      summarySheet.getRow(rowNum).font = { bold: true };
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "전체 승인";
      summarySheet.getRow(rowNum).getCell(2).value = stats.total;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "├─ 항암제";
      summarySheet.getRow(rowNum).getCell(2).value = stats.oncologyCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "└─ 비항암제";
      summarySheet.getRow(rowNum).getCell(2).value = stats.nonOncologyCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum += 2;

      summarySheet.getRow(rowNum).getCell(1).value = "바이오시밀러";
      summarySheet.getRow(rowNum).getCell(2).value = stats.biosimilarCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "신약 (Novel Drug)";
      summarySheet.getRow(rowNum).getCell(2).value = stats.novelDrugCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "희귀의약품 (Orphan Drug)";
      summarySheet.getRow(rowNum).getCell(2).value = stats.orphanDrugCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum += 2;

      // 치료영역별 분포
      const areaHeaderRow = summarySheet.getRow(rowNum);
      areaHeaderRow.getCell(1).value = "📊 치료영역별 분포";
      areaHeaderRow.getCell(1).font = { bold: true, size: 12 };
      areaHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum++;

      therapeuticAreaStats.forEach(([area, count]) => {
        summarySheet.getRow(rowNum).getCell(1).value = `• ${area}`;
        summarySheet.getRow(rowNum).getCell(2).value = count;
        rowNum++;
      });
      rowNum++;

      // 승인 약물 목록
      const drugListHeaderRow = summarySheet.getRow(rowNum);
      drugListHeaderRow.getCell(1).value = "💊 승인 약물 목록";
      drugListHeaderRow.getCell(1).font = { bold: true, size: 12 };
      drugListHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "제품명";
      summarySheet.getRow(rowNum).getCell(2).value = "치료영역";
      summarySheet.getRow(rowNum).font = { bold: true };
      rowNum++;

      exportData.forEach(drug => {
        const drugRow = summarySheet.getRow(rowNum);
        drugRow.getCell(1).value = `• ${drug.brandName}`;
        drugRow.getCell(2).value = drug.therapeuticArea;
        
        if (drug.isOncology) {
          drugRow.getCell(2).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFED7AA" },
          };
        } else if (drug.isBiosimilar) {
          drugRow.getCell(2).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFBBF7D0" },
          };
        }
        rowNum++;
      });
      rowNum++;

      // 주요 출처
      const sourceHeaderRow = summarySheet.getRow(rowNum);
      sourceHeaderRow.getCell(1).value = "🌐 주요 출처";
      sourceHeaderRow.getCell(1).font = { bold: true, size: 12 };
      sourceHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum++;

      const sources = [
        ["FDA Novel Drug Approvals", "https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2025"],
        ["Drugs.com New Approvals", "https://www.drugs.com/newdrugs.html"],
        ["FDA Drugs@FDA Database", "https://www.accessdata.fda.gov/scripts/cder/daf/"],
        ["ASCO Post", "https://ascopost.com"],
      ];
      sources.forEach(([name, url]) => {
        summarySheet.getRow(rowNum).getCell(1).value = name;
        summarySheet.getRow(rowNum).getCell(2).value = url;
        rowNum++;
      });

      // 색상 범례 추가
      addColorLegend(summarySheet, rowNum);

      // ===== Sheet 2: 국문 상세 =====
      const krSheet = workbook.addWorksheet("국문 상세");
      
      const krColumns = [
        { header: "승인월", key: "approvalMonth", width: 12 },
        { header: "승인일", key: "approvalDate", width: 12 },
        { header: "NDA/BLA번호", key: "applicationNo", width: 15 },
        { header: "신청유형", key: "applicationType", width: 10 },
        { header: "제품명", key: "productName", width: 20 },
        { header: "주성분", key: "activeIngredient", width: 30 },
        { header: "제약사", key: "sponsor", width: 22 },
        { header: "적응증", key: "indication", width: 60 },
        { header: "치료영역", key: "therapeuticArea", width: 25 },
        { header: "항암제", key: "isOncology", width: 8 },
        { header: "바이오시밀러", key: "isBiosimilar", width: 12 },
        { header: "신약", key: "isNovelDrug", width: 8 },
        { header: "희귀의약품", key: "isOrphanDrug", width: 12 },
        { header: "승인유형", key: "approvalType", width: 12 },
        { header: "비고", key: "notes", width: 40 },
        { header: "FDA승인페이지", key: "fdaUrl", width: 50 },
      ];
      
      krSheet.columns = krColumns;

      krSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      krSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF059669" },
      };
      krSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      exportData.forEach((drug) => {
        const approvalMonth = drug.approvalDate.substring(0, 7);
        const row = krSheet.addRow({
          approvalMonth,
          approvalDate: drug.approvalDate,
          applicationNo: `${drug.applicationType} ${drug.applicationNo}`,
          applicationType: drug.applicationType,
          productName: drug.brandName,
          activeIngredient: drug.activeIngredient,
          sponsor: drug.sponsor,
          indication: drug.indicationFull,
          therapeuticArea: drug.therapeuticArea,
          isOncology: drug.isOncology ? "Y" : "N",
          isBiosimilar: drug.isBiosimilar ? "Y" : "N",
          isNovelDrug: drug.isNovelDrug ? "Y" : "N",
          isOrphanDrug: drug.isOrphanDrug ? "Y" : "N",
          approvalType: drug.approvalType,
          notes: drug.notes || "",
          fdaUrl: drug.fdaUrl || "",
        });
        applyRowColor(row, drug, krColumns.length);
      });

      krSheet.getColumn("indication").alignment = { wrapText: true };
      krSheet.getColumn("notes").alignment = { wrapText: true };

      // 국문 시트에 색상 범례 추가
      addColorLegend(krSheet, exportData.length + 3);

      // ===== Sheet 3: 영문 상세 =====
      const enSheet = workbook.addWorksheet("English Details");
      
      const enColumns = [
        { header: "Approval Month", key: "approvalMonth", width: 14 },
        { header: "Approval Date", key: "approvalDate", width: 14 },
        { header: "NDA/BLA Number", key: "applicationNo", width: 15 },
        { header: "Type", key: "applicationType", width: 8 },
        { header: "Brand Name", key: "productName", width: 20 },
        { header: "Active Ingredient", key: "activeIngredient", width: 30 },
        { header: "Sponsor", key: "sponsor", width: 22 },
        { header: "Indication", key: "indication", width: 60 },
        { header: "Therapeutic Area", key: "therapeuticArea", width: 25 },
        { header: "Oncology", key: "isOncology", width: 10 },
        { header: "Biosimilar", key: "isBiosimilar", width: 10 },
        { header: "Novel Drug", key: "isNovelDrug", width: 12 },
        { header: "Orphan Drug", key: "isOrphanDrug", width: 12 },
        { header: "Approval Type", key: "approvalType", width: 15 },
        { header: "Notes", key: "notes", width: 40 },
        { header: "FDA URL", key: "fdaUrl", width: 50 },
      ];

      enSheet.columns = enColumns;

      enSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      enSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7C3AED" },
      };
      enSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      exportData.forEach((drug) => {
        const approvalMonth = drug.approvalDate.substring(0, 7);
        const row = enSheet.addRow({
          approvalMonth,
          approvalDate: drug.approvalDate,
          applicationNo: `${drug.applicationType} ${drug.applicationNo}`,
          applicationType: drug.applicationType,
          productName: drug.brandName,
          activeIngredient: drug.activeIngredient,
          sponsor: drug.sponsor,
          indication: drug.indicationFull,
          therapeuticArea: drug.therapeuticArea,
          isOncology: drug.isOncology ? "Y" : "N",
          isBiosimilar: drug.isBiosimilar ? "Y" : "N",
          isNovelDrug: drug.isNovelDrug ? "Y" : "N",
          isOrphanDrug: drug.isOrphanDrug ? "Y" : "N",
          approvalType: drug.approvalType,
          notes: drug.notes || "",
          fdaUrl: drug.fdaUrl || "",
        });
        applyRowColor(row, drug, enColumns.length);
      });

      enSheet.getColumn("indication").alignment = { wrapText: true };
      enSheet.getColumn("notes").alignment = { wrapText: true };

      // 영문 시트에 색상 범례 추가
      addColorLegend(enSheet, exportData.length + 3);

      // 파일명 생성
      let fileName = "US-FDA-Approvals";
      if (exportMode === "custom" && customStartDate && customEndDate) {
        fileName = `US-FDA-Approvals_${format(customStartDate, "yyyyMMdd")}-${format(customEndDate, "yyyyMMdd")}`;
      } else if (exportMode === "filtered") {
        fileName = `US-FDA-Approvals_filtered_${format(new Date(), "yyyyMMdd")}`;
      } else {
        fileName = `US-FDA-Approvals_all_${format(new Date(), "yyyyMMdd")}`;
      }

      // 엑셀 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "엑셀 다운로드 완료",
        description: `US FDA 승인 의약품 ${exportData.length}건이 다운로드되었습니다.`,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Excel generation error:", error);
      toast({
        title: "엑셀 생성 오류",
        description: "엑셀 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            US FDA 전문의약품 엑셀 내보내기
          </DialogTitle>
          <DialogDescription>
            선택한 기간 또는 필터 조건에 맞는 데이터를 엑셀로 다운로드합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 내보내기 범위 선택 */}
          <div className="space-y-2">
            <Label>내보내기 범위</Label>
            <Select value={exportMode} onValueChange={(v) => setExportMode(v as ExportMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>전체 데이터</span>
                    <span className="text-xs text-muted-foreground">({data.length}건)</span>
                  </div>
                </SelectItem>
                <SelectItem value="filtered">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    <span>현재 필터 적용</span>
                    <span className="text-xs text-muted-foreground">({filteredData.length}건)</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>기간 직접 선택</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 커스텀 기간 선택 */}
          {exportMode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">시작일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "yyyy-MM-dd") : "시작일 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">종료일</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "yyyy-MM-dd") : "종료일 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      locale={ko}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* 통계 미리보기 */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">대상 기간</span>
              <span className="font-medium">{periodText}</span>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">전체 승인</span>
                <span className="text-primary font-bold">{stats.total}건</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>항암제</span>
                  <span>{stats.oncologyCount}건</span>
                </div>
                <div className="flex justify-between">
                  <span>비항암제</span>
                  <span>{stats.nonOncologyCount}건</span>
                </div>
                <div className="flex justify-between">
                  <span>바이오시밀러</span>
                  <span>{stats.biosimilarCount}건</span>
                </div>
                <div className="flex justify-between">
                  <span>신약</span>
                  <span>{stats.novelDrugCount}건</span>
                </div>
                <div className="flex justify-between">
                  <span>희귀의약품</span>
                  <span>{stats.orphanDrugCount}건</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">포함 시트:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>요약 (통계 + 치료영역별 분포 + 약물 목록)</li>
              <li>국문 상세 (전체 컬럼)</li>
              <li>English Details (전체 컬럼)</li>
            </ul>
            <p className="mt-2 text-muted-foreground/80">* 모든 시트에 색상 범례가 포함됩니다.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={generateExcel} disabled={isGenerating || exportData.length === 0} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                엑셀 다운로드 ({exportData.length}건)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
