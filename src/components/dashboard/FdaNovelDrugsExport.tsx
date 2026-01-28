import { useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import ExcelJS from "exceljs";

// 2026년 1월 US FDA NDA/BLA 신약 전문의약품 (최초승인 또는 변경승인)
// CSV 데이터에서 NDA/BLA의 ORIG-1 또는 Type 1 NME 추출
const januaryNovelDrugs = [
  {
    approvalDate: "2026-01-12",
    brandName: "ZYCUBO",
    activeIngredient: "copper histidinate",
    ndaBlaNumber: "NDA 211241",
    sponsor: "Sentynl Therapeutics",
    approvalCategory: "최초승인",
    approvalCategoryEn: "Original Approval (Type 1 - New Molecular Entity)",
    summaryKr: "Menkes disease 소아 환자의 구리 보충 치료제. FDA 최초 승인 Menkes disease 치료제로 Breakthrough Therapy 및 Rare Pediatric Disease 지정.",
    summaryEn: "Copper supplementation therapy for pediatric patients with Menkes disease. First FDA-approved treatment for Menkes disease with Breakthrough Therapy and Rare Pediatric Disease designations.",
    therapeuticArea: "소아과 - 대사질환",
    therapeuticAreaEn: "Pediatrics - Metabolic Diseases",
    isNovelDrug: true,
    isOrphanDrug: true,
  },
  {
    approvalDate: "2026-01-15",
    brandName: "FILKRI",
    activeIngredient: "filgrastim-laha",
    ndaBlaNumber: "BLA 761027",
    sponsor: "Accord Biopharma",
    approvalCategory: "최초승인",
    approvalCategoryEn: "Original Approval (Biosimilar)",
    summaryKr: "호중구감소증 치료를 위한 filgrastim 바이오시밀러. Neupogen 바이오시밀러 제품.",
    summaryEn: "Filgrastim biosimilar for treatment of neutropenia. Biosimilar to Neupogen.",
    therapeuticArea: "혈액종양내과",
    therapeuticAreaEn: "Hematology/Oncology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-21",
    brandName: "AVTOZMA",
    activeIngredient: "tocilizumab-anoh",
    ndaBlaNumber: "BLA 761498",
    sponsor: "Celltrion",
    approvalCategory: "최초승인",
    approvalCategoryEn: "Original Approval (Biosimilar)",
    summaryKr: "류마티스 관절염, 전신형 소아 특발성 관절염, 사이토카인 방출 증후군 치료를 위한 tocilizumab 바이오시밀러. Actemra 바이오시밀러 제품.",
    summaryEn: "Tocilizumab biosimilar for rheumatoid arthritis, systemic juvenile idiopathic arthritis, and cytokine release syndrome. Biosimilar to Actemra.",
    therapeuticArea: "류마티스내과",
    therapeuticAreaEn: "Rheumatology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-26",
    brandName: "QUIOFIC",
    activeIngredient: "folic acid",
    ndaBlaNumber: "NDA 216395",
    sponsor: "CMP Development",
    approvalCategory: "최초승인",
    approvalCategoryEn: "Original Approval (Type 3 - New Dosage Form)",
    summaryKr: "엽산 결핍 치료를 위한 새로운 제형. Type 3 신규 제형 승인.",
    summaryEn: "New dosage form for treatment of folic acid deficiency. Type 3 - New Dosage Form approval.",
    therapeuticArea: "내과 - 영양결핍",
    therapeuticAreaEn: "Internal Medicine - Nutritional Deficiency",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
];

// 주요 NDA/BLA 변경승인 (SUPPL) 중 중요한 건
const januaryMajorSupplements = [
  {
    approvalDate: "2026-01-07",
    brandName: "YESINTEK",
    activeIngredient: "ustekinumab-kfce",
    ndaBlaNumber: "BLA 761406",
    sponsor: "Biocon Biologics",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "크론병, 궤양성 대장염, 건선, 건선성 관절염 치료를 위한 ustekinumab 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for ustekinumab biosimilar for Crohn's disease, ulcerative colitis, psoriasis, and psoriatic arthritis.",
    therapeuticArea: "소화기내과/류마티스내과",
    therapeuticAreaEn: "Gastroenterology/Rheumatology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-08",
    brandName: "ENSACOVE",
    activeIngredient: "ensartinib hydrochloride",
    ndaBlaNumber: "NDA 218171",
    sponsor: "Xcovery",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval (Labeling)",
    summaryKr: "ALK 양성 비소세포폐암 치료를 위한 ensartinib 라벨링 변경승인.",
    summaryEn: "Labeling supplement approval for ensartinib for ALK-positive non-small cell lung cancer.",
    therapeuticArea: "항암제 - 폐암",
    therapeuticAreaEn: "Oncology - Lung Cancer",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-13",
    brandName: "YESAFILI",
    activeIngredient: "aflibercept-jbvf",
    ndaBlaNumber: "BLA 761274",
    sponsor: "Biocon Biologics",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "황반변성, 당뇨망막병증, 황반부종 치료를 위한 aflibercept 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for aflibercept biosimilar for macular degeneration, diabetic retinopathy, and macular edema.",
    therapeuticArea: "안과",
    therapeuticAreaEn: "Ophthalmology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-14",
    brandName: "AVTOZMA",
    activeIngredient: "tocilizumab-anoh",
    ndaBlaNumber: "BLA 761420",
    sponsor: "Celltrion",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "류마티스 관절염, 소아 특발성 관절염 치료를 위한 tocilizumab 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for tocilizumab biosimilar for rheumatoid arthritis and juvenile idiopathic arthritis.",
    therapeuticArea: "류마티스내과",
    therapeuticAreaEn: "Rheumatology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-15",
    brandName: "OTULFI",
    activeIngredient: "ustekinumab-aauz",
    ndaBlaNumber: "BLA 761379",
    sponsor: "Fresenius Kabi",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "건선, 건선성 관절염, 크론병, 궤양성 대장염 치료를 위한 ustekinumab 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for ustekinumab biosimilar for psoriasis, psoriatic arthritis, Crohn's disease, and ulcerative colitis.",
    therapeuticArea: "피부과/소화기내과",
    therapeuticAreaEn: "Dermatology/Gastroenterology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-16",
    brandName: "ZYNLONTA",
    activeIngredient: "loncastuximab tesirine-lpyl",
    ndaBlaNumber: "BLA 761196",
    sponsor: "ADC Therapeutics",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "재발성 또는 불응성 미만성 거대 B세포 림프종 치료를 위한 loncastuximab tesirine 보충신청 승인.",
    summaryEn: "Supplemental approval for loncastuximab tesirine for relapsed or refractory diffuse large B-cell lymphoma.",
    therapeuticArea: "항암제 - 림프종",
    therapeuticAreaEn: "Oncology - Lymphoma",
    isNovelDrug: false,
    isOrphanDrug: true,
  },
  {
    approvalDate: "2026-01-16",
    brandName: "BRIUMVI",
    activeIngredient: "ublituximab-xiiy",
    ndaBlaNumber: "BLA 761238",
    sponsor: "TG Therapeutics",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "재발형 다발성 경화증 치료를 위한 ublituximab 보충신청 승인.",
    summaryEn: "Supplemental approval for ublituximab for relapsing forms of multiple sclerosis.",
    therapeuticArea: "신경과 - 다발성 경화증",
    therapeuticAreaEn: "Neurology - Multiple Sclerosis",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-16",
    brandName: "LEQEMBI",
    activeIngredient: "lecanemab-irmb",
    ndaBlaNumber: "BLA 761269",
    sponsor: "Eisai",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "초기 알츠하이머병 치료를 위한 lecanemab 보충신청 승인.",
    summaryEn: "Supplemental approval for lecanemab for early Alzheimer's disease.",
    therapeuticArea: "신경과 - 알츠하이머병",
    therapeuticAreaEn: "Neurology - Alzheimer's Disease",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-21",
    brandName: "TYENNE",
    activeIngredient: "tocilizumab-aazg",
    ndaBlaNumber: "BLA 761275",
    sponsor: "Fresenius Kabi",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "류마티스 관절염, 거대세포 동맥염, 사이토카인 방출 증후군 치료를 위한 tocilizumab 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for tocilizumab biosimilar for rheumatoid arthritis, giant cell arteritis, and cytokine release syndrome.",
    therapeuticArea: "류마티스내과",
    therapeuticAreaEn: "Rheumatology",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-21",
    brandName: "VERQUVO",
    activeIngredient: "vericiguat",
    ndaBlaNumber: "NDA 214377",
    sponsor: "MSD",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval (Efficacy)",
    summaryKr: "만성 심부전 치료를 위한 vericiguat 효능 변경승인.",
    summaryEn: "Efficacy supplement approval for vericiguat for chronic heart failure.",
    therapeuticArea: "심장내과 - 심부전",
    therapeuticAreaEn: "Cardiology - Heart Failure",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
  {
    approvalDate: "2026-01-23",
    brandName: "EPYSQLI",
    activeIngredient: "eculizumab-aagh",
    ndaBlaNumber: "BLA 761340",
    sponsor: "Samsung Bioepis",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval",
    summaryKr: "발작성 야간 혈색소뇨증, 비정형 용혈성 요독증후군 치료를 위한 eculizumab 바이오시밀러 보충신청 승인.",
    summaryEn: "Supplemental approval for eculizumab biosimilar for paroxysmal nocturnal hemoglobinuria and atypical hemolytic uremic syndrome.",
    therapeuticArea: "혈액내과",
    therapeuticAreaEn: "Hematology",
    isNovelDrug: false,
    isOrphanDrug: true,
  },
  {
    approvalDate: "2026-01-23",
    brandName: "JOURNAVX",
    activeIngredient: "suzetrigine",
    ndaBlaNumber: "NDA 219209",
    sponsor: "Vertex Pharmaceuticals",
    approvalCategory: "변경승인",
    approvalCategoryEn: "Supplemental Approval (Labeling)",
    summaryKr: "중등도 내지 중증 급성 통증 치료를 위한 suzetrigine 라벨링 변경승인. 비오피오이드 진통제.",
    summaryEn: "Labeling supplement approval for suzetrigine for moderate to severe acute pain. Non-opioid analgesic.",
    therapeuticArea: "통증의학과",
    therapeuticAreaEn: "Pain Medicine",
    isNovelDrug: false,
    isOrphanDrug: false,
  },
];

// 전체 데이터 합치기
const allJanuaryDrugs = [...januaryNovelDrugs, ...januaryMajorSupplements];

export function FdaNovelDrugsExport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateExcel = async () => {
    setIsGenerating(true);
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FDA Drug Approval Dashboard";
      workbook.created = new Date();

      // 통계 계산
      const total = allJanuaryDrugs.length;
      const oncologyDrugs = allJanuaryDrugs.filter(d => d.therapeuticArea.includes("항암제"));
      const oncologyCount = oncologyDrugs.length;
      const nonOncologyCount = total - oncologyCount;
      const biosimilarCount = allJanuaryDrugs.filter(d => 
        d.approvalCategoryEn.includes("Biosimilar") || d.therapeuticArea.includes("바이오시밀러")
      ).length;
      const novelDrugCount = allJanuaryDrugs.filter(d => d.isNovelDrug).length;
      const orphanDrugCount = allJanuaryDrugs.filter(d => d.isOrphanDrug).length;

      // 치료영역별 분포 계산
      const therapeuticAreaMap = new Map<string, number>();
      allJanuaryDrugs.forEach(drug => {
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

      // 스타일 정의
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, size: 14, color: { argb: "FF1E40AF" } },
        alignment: { vertical: "middle" },
      };
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
      titleRow.getCell(1).value = "✅ 2026년 1월 FDA 전문의약품 승인 현황";
      titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: "FF1E40AF" } };
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum += 2;

      // 기본 정보
      summarySheet.getRow(rowNum).getCell(1).value = "📅 대상 월";
      summarySheet.getRow(rowNum).getCell(2).value = "2026-01";
      rowNum++;
      summarySheet.getRow(rowNum).getCell(1).value = "🗓️ 데이터 수집일";
      summarySheet.getRow(rowNum).getCell(2).value = "2026-01-28";
      rowNum++;
      summarySheet.getRow(rowNum).getCell(1).value = "🔗 데이터 출처";
      summarySheet.getRow(rowNum).getCell(2).value = "FDA Official + Drugs.com + DrugsFDA CSV";
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
      summarySheet.getRow(rowNum).getCell(2).value = total;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "├─ 항암제";
      summarySheet.getRow(rowNum).getCell(2).value = oncologyCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "└─ 비항암제";
      summarySheet.getRow(rowNum).getCell(2).value = nonOncologyCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum += 2;

      summarySheet.getRow(rowNum).getCell(1).value = "바이오시밀러";
      summarySheet.getRow(rowNum).getCell(2).value = biosimilarCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "신약 (Novel Drug)";
      summarySheet.getRow(rowNum).getCell(2).value = novelDrugCount;
      summarySheet.getRow(rowNum).getCell(2).font = valueStyle;
      rowNum++;

      summarySheet.getRow(rowNum).getCell(1).value = "희귀의약품 (Orphan Drug)";
      summarySheet.getRow(rowNum).getCell(2).value = orphanDrugCount;
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

      allJanuaryDrugs.forEach(drug => {
        const drugRow = summarySheet.getRow(rowNum);
        drugRow.getCell(1).value = `• ${drug.brandName}`;
        drugRow.getCell(2).value = drug.therapeuticArea;
        
        // 항암제 주황색 배경
        if (drug.therapeuticArea.includes("항암제")) {
          drugRow.getCell(2).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFED7AA" },
          };
        }
        // 바이오시밀러 연두색 배경
        if (drug.approvalCategoryEn.includes("Biosimilar")) {
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
        ["FDA Novel Drug Approvals 2026", "https://www.fda.gov/drugs/novel-drug-approvals-fda/novel-drug-approvals-2026"],
        ["Drugs.com New Approvals", "https://www.drugs.com/newdrugs.html"],
        ["FDA Drugs@FDA Database", "https://www.accessdata.fda.gov/scripts/cder/daf/"],
        ["DrugsFDA CSV Data", "FDA Official DrugsFDA_FDA-Approved_Drugs CSV"],
      ];
      sources.forEach(([name, url]) => {
        summarySheet.getRow(rowNum).getCell(1).value = name;
        summarySheet.getRow(rowNum).getCell(2).value = url;
        rowNum++;
      });
      rowNum++;

      // 색상 범례
      const legendHeaderRow = summarySheet.getRow(rowNum);
      legendHeaderRow.getCell(1).value = "🎨 색상 범례";
      legendHeaderRow.getCell(1).font = { bold: true, size: 12 };
      legendHeaderRow.fill = sectionHeaderStyle as ExcelJS.Fill;
      summarySheet.mergeCells(`A${rowNum}:B${rowNum}`);
      rowNum++;

      const legendOrange = summarySheet.getRow(rowNum);
      legendOrange.getCell(1).value = "🟠 주황색";
      legendOrange.getCell(2).value = "항암제";
      legendOrange.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFED7AA" },
      };
      rowNum++;

      const legendGreen = summarySheet.getRow(rowNum);
      legendGreen.getCell(1).value = "🟢 연두색";
      legendGreen.getCell(2).value = "바이오시밀러";
      legendGreen.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFBBF7D0" },
      };
      rowNum++;

      const legendWhite = summarySheet.getRow(rowNum);
      legendWhite.getCell(1).value = "⬜ 색상 없음";
      legendWhite.getCell(2).value = "비항암제 (바이오시밀러 제외)";

      // Sheet 2: 국문 상세
      const krSheet = workbook.addWorksheet("국문 상세");
      
      krSheet.columns = [
        { header: "승인일", key: "approvalDate", width: 12 },
        { header: "제품명", key: "brandName", width: 18 },
        { header: "성분명", key: "activeIngredient", width: 28 },
        { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 15 },
        { header: "제약사", key: "sponsor", width: 22 },
        { header: "승인유형", key: "approvalCategory", width: 12 },
        { header: "치료영역", key: "therapeuticArea", width: 25 },
        { header: "요약 (국문)", key: "summaryKr", width: 80 },
      ];

      krSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      krSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF059669" },
      };
      krSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      allJanuaryDrugs.forEach((drug) => {
        krSheet.addRow(drug);
      });

      // 텍스트 줄바꿈
      krSheet.getColumn("summaryKr").alignment = { wrapText: true };

      // Sheet 3: 영문 상세
      const enSheet = workbook.addWorksheet("English Details");
      
      enSheet.columns = [
        { header: "Approval Date", key: "approvalDate", width: 14 },
        { header: "Brand Name", key: "brandName", width: 18 },
        { header: "Active Ingredient", key: "activeIngredient", width: 28 },
        { header: "NDA/BLA Number", key: "ndaBlaNumber", width: 15 },
        { header: "Sponsor", key: "sponsor", width: 22 },
        { header: "Approval Type", key: "approvalCategoryEn", width: 42 },
        { header: "Therapeutic Area", key: "therapeuticAreaEn", width: 35 },
        { header: "Summary (English)", key: "summaryEn", width: 80 },
      ];

      enSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      enSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF7C3AED" },
      };
      enSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      allJanuaryDrugs.forEach((drug) => {
        enSheet.addRow(drug);
      });

      enSheet.getColumn("summaryEn").alignment = { wrapText: true };

      // Sheet 4: 최초승인만
      const origSheet = workbook.addWorksheet("최초승인 (ORIG-1)");
      
      origSheet.columns = [
        { header: "승인일", key: "approvalDate", width: 12 },
        { header: "제품명", key: "brandName", width: 18 },
        { header: "성분명", key: "activeIngredient", width: 28 },
        { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 15 },
        { header: "제약사", key: "sponsor", width: 22 },
        { header: "승인유형", key: "approvalCategoryEn", width: 45 },
        { header: "요약 (국문)", key: "summaryKr", width: 60 },
        { header: "Summary (English)", key: "summaryEn", width: 60 },
      ];

      origSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      origSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC2626" },
      };
      origSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      januaryNovelDrugs.forEach((drug) => {
        origSheet.addRow(drug);
      });

      origSheet.getColumn("summaryKr").alignment = { wrapText: true };
      origSheet.getColumn("summaryEn").alignment = { wrapText: true };

      // Sheet 5: 변경승인
      const supplSheet = workbook.addWorksheet("변경승인 (SUPPL)");
      
      supplSheet.columns = [
        { header: "승인일", key: "approvalDate", width: 12 },
        { header: "제품명", key: "brandName", width: 18 },
        { header: "성분명", key: "activeIngredient", width: 28 },
        { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 15 },
        { header: "제약사", key: "sponsor", width: 22 },
        { header: "승인유형", key: "approvalCategoryEn", width: 35 },
        { header: "요약 (국문)", key: "summaryKr", width: 60 },
        { header: "Summary (English)", key: "summaryEn", width: 60 },
      ];

      supplSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      supplSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF59E0B" },
      };
      supplSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      januaryMajorSupplements.forEach((drug) => {
        supplSheet.addRow(drug);
      });

      supplSheet.getColumn("summaryKr").alignment = { wrapText: true };
      supplSheet.getColumn("summaryEn").alignment = { wrapText: true };

      // 엑셀 파일 다운로드
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "2026-01-US-FDA-Novel-Drugs.xlsx";
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "엑셀 다운로드 완료",
        description: `2026년 1월 US FDA 신약 전문의약품 ${allJanuaryDrugs.length}건이 다운로드되었습니다.`,
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
          1월 신약 엑셀
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            2026년 1월 US FDA 신약 전문의약품
          </DialogTitle>
          <DialogDescription>
            NDA/BLA 최초승인 및 주요 변경승인 목록을 엑셀로 다운로드합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">최초승인 (ORIG-1)</span>
              <span className="text-sm text-primary font-bold">{januaryNovelDrugs.length}건</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">주요 변경승인 (SUPPL)</span>
              <span className="text-sm text-amber-600 font-bold">{januaryMajorSupplements.length}건</span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-semibold">총계</span>
              <span className="text-sm font-bold">{allJanuaryDrugs.length}건</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">포함 시트:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>2026년 1월 신약 요약 (전체)</li>
              <li>국문 상세</li>
              <li>English Details</li>
              <li>최초승인 (ORIG-1)</li>
              <li>변경승인 (SUPPL)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={generateExcel} disabled={isGenerating} className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                엑셀 다운로드
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
