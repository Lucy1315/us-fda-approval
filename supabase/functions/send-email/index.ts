import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import ExcelJS from "npm:exceljs@4.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DrugData {
  approvalDate: string;
  brandName: string;
  activeIngredient: string;
  ndaBlaNumber: string;
  sponsor: string;
  therapeuticArea: string;
  indicationFull: string;
  notes: string;
  isOncology: boolean;
  isBiosimilar: boolean;
  isNovelDrug: boolean;
  isOrphanDrug: boolean;
  supplementCategory: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  dateRangeText: string;
  stats: {
    total: number;
    oncology: number;
    nonOncology: number;
    novelDrug: number;
    novelOncology: number;
    novelNonOncology: number;
    orphanDrug: number;
    biosimilar: number;
    blaCount: number;
    origCount: number;
    supplCount: number;
  };
  drugs: DrugData[];
}

// 치료영역 영문 매핑
const therapeuticAreaEnMap: Record<string, string> = {
  "항암제 - 다발골수종": "Oncology - Multiple Myeloma",
  "항암제 - 림프종": "Oncology - Lymphoma",
  "항암제 - 폐암": "Oncology - Lung Cancer",
  "항암제 - 유방암": "Oncology - Breast Cancer",
  "항암제 - 전립선암": "Oncology - Prostate Cancer",
  "항암제 - 골전이": "Oncology - Bone Metastasis",
  "항암제 - 위암": "Oncology - Gastric Cancer",
  "항암제 - 간암": "Oncology - Liver Cancer",
  "항암제 - 췌장암": "Oncology - Pancreatic Cancer",
  "항암제 - 대장암": "Oncology - Colorectal Cancer",
  "항암제 - 신장암": "Oncology - Renal Cancer",
  "항암제 - 방광암": "Oncology - Bladder Cancer",
  "항암제 - 흑색종": "Oncology - Melanoma",
  "항암제 - 백혈병": "Oncology - Leukemia",
  "소아과 - 대사질환": "Pediatrics - Metabolic Diseases",
  "신경과 - 다발성 경화증": "Neurology - Multiple Sclerosis",
  "신경과 - 알츠하이머병": "Neurology - Alzheimer's Disease",
  "신경과 - 파킨슨병": "Neurology - Parkinson's Disease",
  "신경과 - 멀미": "Neurology - Motion Sickness",
  "신경과 - 신경복구": "Neurology - Nerve Repair",
  "류마티스내과": "Rheumatology",
  "소화기내과/류마티스내과": "Gastroenterology/Rheumatology",
  "피부과/소화기내과": "Dermatology/Gastroenterology",
  "혈액종양내과": "Hematology/Oncology",
  "혈액내과": "Hematology",
  "혈액내과 - 지중해빈혈": "Hematology - Thalassemia",
  "혈액내과 - TA-TMA": "Hematology - TA-TMA",
  "안과": "Ophthalmology",
  "심장내과 - 심부전": "Cardiology - Heart Failure",
  "심장내과 - 부정맥": "Cardiology - Arrhythmia",
  "심장내과 - 심근병증": "Cardiology - Cardiomyopathy",
  "내분비내과 - 골다공증": "Endocrinology - Osteoporosis",
  "내과 - 영양결핍": "Internal Medicine - Nutritional Deficiency",
  "통증의학과": "Pain Medicine",
  "감염내과 - 성매개감염병": "Infectious Disease - STI",
  "호흡기내과 - 천식": "Pulmonology - Asthma",
  "면역학 - 유전자치료": "Immunology - Gene Therapy",
  "피부과 - 건선": "Dermatology - Psoriasis",
};

const isSupplementalApproval = (drug: DrugData): boolean => {
  const notes = drug.notes || "";
  return notes.includes("변경승인") || 
         notes.includes("적응증 추가") || 
         notes.includes("적응증 확대") ||
         notes.includes("보충신청") ||
         notes.includes("라벨링") ||
         notes.includes("Supplemental") ||
         (drug.supplementCategory || "").includes("SUPPL");
};

const getApprovalTypeEn = (drug: DrugData): string => {
  const isSuppl = isSupplementalApproval(drug);
  
  if (isSuppl) {
    if (drug.notes?.includes("라벨링") || drug.notes?.includes("Labeling")) {
      return "Supplemental Approval (Labeling)";
    }
    if (drug.notes?.includes("효능") || drug.notes?.includes("Efficacy")) {
      return "Supplemental Approval (Efficacy)";
    }
    return "Supplemental Approval";
  }
  
  if (drug.isNovelDrug) {
    return "Original Approval (Type 1 - New Molecular Entity)";
  }
  if (drug.isBiosimilar) {
    return "Original Approval (Biosimilar)";
  }
  return "Original Approval";
};

const ensureEnglish = (value: string, fallback: string) => {
  if (!value) return fallback;
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(value) ? fallback : value;
};

// Apply row color based on drug type
const applyRowColor = (row: ExcelJS.Row, drug: DrugData, columns: number) => {
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

// Add color legend to sheet
const addColorLegend = (sheet: ExcelJS.Worksheet, startRow: number) => {
  let rowNum = startRow + 2;
  
  const legendRow1 = sheet.getRow(rowNum);
  legendRow1.getCell(1).value = "🎨 색상 범례";
  legendRow1.getCell(1).font = { bold: true, size: 10 };
  rowNum++;

  const legendRow2 = sheet.getRow(rowNum);
  legendRow2.getCell(1).value = "🟠 주황색 = 항암제";
  legendRow2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
  legendRow2.getCell(2).value = "🟢 연두색 = 바이오시밀러";
  legendRow2.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBBF7D0" } };
  legendRow2.getCell(3).value = "⬜ 색상 없음 = 비항암제";
};

async function generateExcelBuffer(drugs: DrugData[], stats: EmailRequest["stats"], dateRangeText: string): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "FDA Drug Approval Dashboard";
  workbook.created = new Date();

  // Calculate period from drugs
  const dates = drugs.map(d => d.approvalDate).sort();
  const minDate = dates[0] || "";
  const maxDate = dates[dates.length - 1] || "";

  // ===== Sheet 1: 요약 (Summary) =====
  const summarySheet = workbook.addWorksheet("요약");
  
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 55;
  summarySheet.getColumn(3).width = 10;

  let rowNum = 1;

  const titleRow = summarySheet.getRow(rowNum);
  titleRow.getCell(1).value = "☑ US FDA 전문의약품 승인 현황";
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF4338CA" } };
  summarySheet.mergeCells(`A${rowNum}:C${rowNum}`);
  rowNum += 2;

  summarySheet.getRow(rowNum).getCell(1).value = "📅 대상 기간";
  summarySheet.getRow(rowNum).getCell(2).value = dateRangeText;
  rowNum++;
  
  summarySheet.getRow(rowNum).getCell(1).value = "🗓 데이터 수집일";
  summarySheet.getRow(rowNum).getCell(2).value = new Date().toISOString().split("T")[0];
  rowNum++;
  
  summarySheet.getRow(rowNum).getCell(1).value = "🌐 데이터 출처";
  summarySheet.getRow(rowNum).getCell(2).value = "FDA Official + Drugs.com + ASCO Post";
  rowNum += 2;

  const statsHeaderRow = summarySheet.getRow(rowNum);
  statsHeaderRow.getCell(1).value = "☑ 승인 현황";
  statsHeaderRow.getCell(1).font = { bold: true, size: 12 };
  rowNum++;

  const tableHeaderRow = summarySheet.getRow(rowNum);
  tableHeaderRow.getCell(1).value = "구분";
  tableHeaderRow.getCell(3).value = "건수";
  tableHeaderRow.font = { bold: true };
  tableHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  rowNum++;

  const statsRows = [
    { label: "전체 승인", value: stats.total },
    { label: "├── 항암제", value: stats.oncology },
    { label: "└── 비항암제", value: stats.nonOncology },
    { label: "", value: "" },
    { label: "바이오시밀러", value: stats.biosimilar },
    { label: "신약 (Novel Drug)", value: stats.novelDrug },
    { label: "희귀의약품 (Orphan Drug)", value: stats.orphanDrug },
  ];

  statsRows.forEach((stat) => {
    const row = summarySheet.getRow(rowNum);
    row.getCell(1).value = stat.label;
    row.getCell(3).value = stat.value;
    row.getCell(3).alignment = { horizontal: "right" };
    rowNum++;
  });
  rowNum++;

  // 치료영역별 분포
  const areaHeaderRow = summarySheet.getRow(rowNum);
  areaHeaderRow.getCell(1).value = "📊 치료영역별 분포";
  areaHeaderRow.getCell(1).font = { bold: true, size: 12 };
  rowNum++;

  const areaMap = new Map<string, number>();
  drugs.forEach((drug) => {
    const area = drug.therapeuticArea;
    areaMap.set(area, (areaMap.get(area) || 0) + 1);
  });
  const sortedAreas = Array.from(areaMap.entries()).sort((a, b) => b[1] - a[1]);

  sortedAreas.forEach(([area, count]) => {
    const row = summarySheet.getRow(rowNum);
    row.getCell(1).value = `• ${area}`;
    row.getCell(3).value = count;
    row.getCell(3).alignment = { horizontal: "right" };
    rowNum++;
  });
  rowNum++;

  // 약물 목록
  const drugListHeaderRow = summarySheet.getRow(rowNum);
  drugListHeaderRow.getCell(1).value = "💊 승인 약물 목록";
  drugListHeaderRow.getCell(1).font = { bold: true, size: 12 };
  rowNum++;

  const drugTableHeaderRow = summarySheet.getRow(rowNum);
  drugTableHeaderRow.getCell(1).value = "제품명";
  drugTableHeaderRow.getCell(2).value = "치료영역";
  drugTableHeaderRow.font = { bold: true };
  drugTableHeaderRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
  rowNum++;

  drugs.forEach((drug) => {
    const row = summarySheet.getRow(rowNum);
    row.getCell(1).value = `• ${drug.brandName}`;
    row.getCell(2).value = drug.therapeuticArea;
    
    if (drug.isOncology) {
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
    } else if (drug.isBiosimilar) {
      row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBBF7D0" } };
    }
    rowNum++;
  });
  rowNum++;

  // 색상 범례
  const legendHeaderRow = summarySheet.getRow(rowNum);
  legendHeaderRow.getCell(1).value = "🎨 색상 범례";
  legendHeaderRow.getCell(1).font = { bold: true, size: 12 };
  rowNum++;

  const legendRow1 = summarySheet.getRow(rowNum);
  legendRow1.getCell(1).value = "🟠 주황색";
  legendRow1.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
  legendRow1.getCell(2).value = "항암제";
  legendRow1.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
  rowNum++;

  const legendRow2 = summarySheet.getRow(rowNum);
  legendRow2.getCell(1).value = "🟢 연두색";
  legendRow2.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBBF7D0" } };
  legendRow2.getCell(2).value = "바이오시밀러";
  legendRow2.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBBF7D0" } };

  // ===== Sheet 2: 국문 상세 =====
  const krSheet = workbook.addWorksheet("국문 상세");
  
  const krColumns = [
    { header: "승인일", key: "approvalDate", width: 12 },
    { header: "제품명", key: "brandName", width: 14 },
    { header: "성분명", key: "activeIngredient", width: 28 },
    { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 14 },
    { header: "제약사", key: "sponsor", width: 22 },
    { header: "승인유형", key: "approvalTypeKr", width: 10 },
    { header: "치료영역", key: "therapeuticArea", width: 18 },
    { header: "요약 (국문)", key: "summaryKr", width: 80 },
  ];
  
  krSheet.columns = krColumns;

  krSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  krSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF059669" },
  };
  krSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  drugs.forEach((drug) => {
    const approvalTypeKr = isSupplementalApproval(drug) ? "변경승인" : "최초승인";
    const summaryKr = drug.indicationFull + (drug.notes ? ` ${drug.notes}` : "");
    
    const row = krSheet.addRow({
      approvalDate: drug.approvalDate,
      brandName: drug.brandName,
      activeIngredient: drug.activeIngredient,
      ndaBlaNumber: drug.ndaBlaNumber,
      sponsor: drug.sponsor,
      approvalTypeKr,
      therapeuticArea: drug.therapeuticArea,
      summaryKr,
    });
    applyRowColor(row, drug, krColumns.length);
  });

  krSheet.getColumn("summaryKr").alignment = { wrapText: true };
  addColorLegend(krSheet, drugs.length + 1);

  // ===== Sheet 3: English Details =====
  const enSheet = workbook.addWorksheet("English Details");
  
  const enColumns = [
    { header: "Approval Date", key: "approvalDate", width: 14 },
    { header: "Brand Name", key: "brandName", width: 14 },
    { header: "Active Ingredient", key: "activeIngredient", width: 28 },
    { header: "NDA/BLA Number", key: "ndaBlaNumber", width: 16 },
    { header: "Sponsor", key: "sponsor", width: 22 },
    { header: "Approval Type", key: "approvalTypeEn", width: 45 },
    { header: "Therapeutic Area", key: "therapeuticAreaEn", width: 35 },
    { header: "Summary (English)", key: "summaryEn", width: 90 },
  ];

  enSheet.columns = enColumns;

  enSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  enSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7C3AED" },
  };
  enSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  drugs.forEach((drug) => {
    const therapeuticAreaEn = ensureEnglish(
      therapeuticAreaEnMap[drug.therapeuticArea] || drug.therapeuticArea,
      "Unmapped Therapeutic Area"
    );
    const approvalTypeEn = getApprovalTypeEn(drug);
    
    let summaryEn = "";
    const indication = ensureEnglish(
      therapeuticAreaEn.split(" - ")[1] || therapeuticAreaEn,
      "unmapped indication"
    );
    
    if (drug.isNovelDrug) {
      summaryEn = `Novel drug (${drug.activeIngredient}) approved for ${indication.toLowerCase()}.`;
      if (drug.isOrphanDrug) {
        summaryEn += " Designated as Orphan Drug.";
      }
    } else if (drug.isBiosimilar) {
      summaryEn = `Biosimilar (${drug.activeIngredient}) approved for ${indication.toLowerCase()}.`;
    } else {
      const isSuppl = isSupplementalApproval(drug);
      if (isSuppl) {
        summaryEn = `Supplemental approval for ${drug.activeIngredient} for ${indication.toLowerCase()}.`;
      } else {
        summaryEn = `${drug.activeIngredient} approved for ${indication.toLowerCase()}.`;
      }
    }
    
    const row = enSheet.addRow({
      approvalDate: drug.approvalDate,
      brandName: drug.brandName,
      activeIngredient: drug.activeIngredient,
      ndaBlaNumber: drug.ndaBlaNumber,
      sponsor: drug.sponsor,
      approvalTypeEn,
      therapeuticAreaEn,
      summaryEn,
    });
    applyRowColor(row, drug, enColumns.length);
  });

  enSheet.getColumn("summaryEn").alignment = { wrapText: true };
  addColorLegend(enSheet, drugs.length + 1);

  // ===== Sheet 4: 최초승인 (ORIG-1) =====
  const origSheet = workbook.addWorksheet("최초승인 (ORIG-1)");
  
  const origColumns = [
    { header: "승인일", key: "approvalDate", width: 12 },
    { header: "제품명", key: "brandName", width: 14 },
    { header: "성분명", key: "activeIngredient", width: 25 },
    { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 14 },
    { header: "제약사", key: "sponsor", width: 22 },
    { header: "승인유형", key: "approvalTypeEn", width: 42 },
    { header: "요약 (국문)", key: "summaryKr", width: 70 },
    { header: "Summary (English)", key: "summaryEn", width: 80 },
  ];

  origSheet.columns = origColumns;

  origSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  origSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  origSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  const originalApprovals = drugs.filter(d => !isSupplementalApproval(d));
  
  originalApprovals.forEach((drug) => {
    const therapeuticAreaEn = ensureEnglish(
      therapeuticAreaEnMap[drug.therapeuticArea] || drug.therapeuticArea,
      "Unmapped Therapeutic Area"
    );
    const approvalTypeEn = getApprovalTypeEn(drug);
    const summaryKr = drug.indicationFull + (drug.notes ? ` ${drug.notes}` : "");
    
    let summaryEn = "";
    const indication = ensureEnglish(
      therapeuticAreaEn.split(" - ")[1] || therapeuticAreaEn,
      "unmapped indication"
    );

    if (drug.isBiosimilar) {
      summaryEn = `Biosimilar (${drug.activeIngredient}) for ${indication.toLowerCase()}.`;
    } else if (drug.isNovelDrug) {
      summaryEn = `Novel drug (${drug.activeIngredient}) approved for ${indication.toLowerCase()}.`;
      if (drug.isOrphanDrug) summaryEn += " Designated as Orphan Drug.";
    } else {
      summaryEn = `${drug.activeIngredient} approved for ${indication.toLowerCase()}.`;
    }
    
    const row = origSheet.addRow({
      approvalDate: drug.approvalDate,
      brandName: drug.brandName,
      activeIngredient: drug.activeIngredient,
      ndaBlaNumber: drug.ndaBlaNumber,
      sponsor: drug.sponsor,
      approvalTypeEn,
      summaryKr,
      summaryEn: summaryEn.trim(),
    });
    applyRowColor(row, drug, origColumns.length);
  });

  origSheet.getColumn("summaryKr").alignment = { wrapText: true };
  origSheet.getColumn("summaryEn").alignment = { wrapText: true };
  addColorLegend(origSheet, originalApprovals.length + 1);

  // ===== Sheet 5: 변경승인 (SUPPL) =====
  const supplSheet = workbook.addWorksheet("변경승인 (SUPPL)");
  
  const supplColumns = [
    { header: "승인일", key: "approvalDate", width: 12 },
    { header: "제품명", key: "brandName", width: 14 },
    { header: "성분명", key: "activeIngredient", width: 25 },
    { header: "NDA/BLA 번호", key: "ndaBlaNumber", width: 14 },
    { header: "제약사", key: "sponsor", width: 22 },
    { header: "승인유형", key: "approvalTypeEn", width: 32 },
    { header: "요약 (국문)", key: "summaryKr", width: 70 },
    { header: "Summary (English)", key: "summaryEn", width: 80 },
  ];

  supplSheet.columns = supplColumns;

  supplSheet.getRow(1).font = { bold: true, color: { argb: "FF000000" } };
  supplSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFBBF24" },
  };
  supplSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  const supplementalApprovals = drugs.filter(d => isSupplementalApproval(d));
  
  supplementalApprovals.forEach((drug) => {
    const therapeuticAreaEn = ensureEnglish(
      therapeuticAreaEnMap[drug.therapeuticArea] || drug.therapeuticArea,
      "Unmapped Therapeutic Area"
    );
    const approvalTypeEn = getApprovalTypeEn(drug);
    const summaryKr = drug.indicationFull + (drug.notes ? ` ${drug.notes}` : "");
    
    let summaryEn = "";
    const indication = ensureEnglish(
      therapeuticAreaEn.split(" - ")[1] || therapeuticAreaEn,
      "unmapped indication"
    );

    if (drug.isBiosimilar) {
      summaryEn = `Supplemental approval for ${drug.activeIngredient} biosimilar for ${indication.toLowerCase()}.`;
    } else {
      summaryEn = `Supplemental approval for ${drug.activeIngredient} for ${indication.toLowerCase()}.`;
    }
    
    const row = supplSheet.addRow({
      approvalDate: drug.approvalDate,
      brandName: drug.brandName,
      activeIngredient: drug.activeIngredient,
      ndaBlaNumber: drug.ndaBlaNumber,
      sponsor: drug.sponsor,
      approvalTypeEn,
      summaryKr,
      summaryEn: summaryEn.trim(),
    });
    applyRowColor(row, drug, supplColumns.length);
  });

  supplSheet.getColumn("summaryKr").alignment = { wrapText: true };
  supplSheet.getColumn("summaryEn").alignment = { wrapText: true };
  addColorLegend(supplSheet, supplementalApprovals.length + 1);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

function generateEmailHtml(data: EmailRequest): string {
  const { stats, dateRangeText } = data;
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; color: white;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">US FDA 승인 현황</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">미국 FDA 전문의약품 승인 데이터 요약</p>
    </div>
    
    <!-- Date Range Section -->
    <div style="padding: 16px 24px; background: #eff6ff; border-bottom: 1px solid #bfdbfe;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">📅</span>
        <span style="font-size: 14px; color: #1e40af; font-weight: 600;">데이터 수집일: ${dateRangeText}</span>
      </div>
    </div>
    
    <!-- Summary Stats - 3x2 Grid -->
    <div style="padding: 24px; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📊 요약 통계</h2>
      
      <!-- Row 1 -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td width="50%" style="padding-right: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${stats.total}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">전체 승인</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">최초승인: ${stats.origCount}건 / 변경승인: ${stats.supplCount}건</div>
            </div>
          </td>
          <td width="50%" style="padding-left: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${stats.oncology}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">항암제</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">비항암제: ${stats.nonOncology}건</div>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Row 2 -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td width="50%" style="padding-right: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${stats.novelDrug}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">신약 (Novel)</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">항암제 ${stats.novelOncology} / 비항암제 ${stats.novelNonOncology}</div>
            </div>
          </td>
          <td width="50%" style="padding-left: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #7c3aed;">${stats.orphanDrug}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">희귀의약품</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Orphan Drug</div>
            </div>
          </td>
        </tr>
      </table>
      
      <!-- Row 3 -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding-right: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #059669;">${stats.biosimilar}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">바이오시밀러</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Biosimilar</div>
            </div>
          </td>
          <td width="50%" style="padding-left: 6px;">
            <div style="background: white; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb;">
              <div style="font-size: 32px; font-weight: bold; color: #0891b2;">${stats.blaCount || 0}</div>
              <div style="font-size: 13px; color: #374151; font-weight: 500; margin-top: 4px;">BLA</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">생물학적 제제</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Attachment Notice -->
    <div style="padding: 16px 24px; background: #fefce8; border-bottom: 1px solid #fef08a;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">📎</span>
        <span style="font-size: 14px; color: #854d0e; font-weight: 500;">상세 데이터가 포함된 엑셀 파일이 첨부되어 있습니다.</span>
      </div>
    </div>
    
    <!-- CTA Button -->
    <div style="padding: 40px 24px; text-align: center;">
      <a href="https://us-fda-approval.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 18px 48px; border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
        📊 대시보드에서 상세 확인하기
      </a>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280;">클릭하여 필터링, 검색 등 상세 기능을 이용하세요</p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        발송 시각: ${now}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it in Lovable Cloud secrets.");
    }

    const resend = new Resend(apiKey);
    const data: EmailRequest = await req.json();

    if (!data.to || !data.subject) {
      throw new Error("Missing required fields: to, subject");
    }

    const html = generateEmailHtml(data);

    // Generate Excel file if drugs data is provided
    let attachments: { content: string; filename: string }[] | undefined;
    
    if (data.drugs && data.drugs.length > 0) {
      console.log(`Generating Excel with ${data.drugs.length} drugs...`);
      const excelBuffer = await generateExcelBuffer(data.drugs, data.stats, data.dateRangeText);
      
      // Convert Uint8Array to base64
      const base64Content = btoa(String.fromCharCode(...excelBuffer));
      
      // Generate filename with date range
      const sanitizedDateRange = data.dateRangeText.replace(/[^a-zA-Z0-9가-힣\-_]/g, "_");
      const filename = `US-FDA-Approvals_${sanitizedDateRange}.xlsx`;
      
      attachments = [{
        content: base64Content,
        filename,
      }];
      console.log(`Excel generated: ${filename} (${Math.round(excelBuffer.length / 1024)}KB)`);
    }

    const emailResponse = await resend.emails.send({
      from: "FDA Dashboard <onboarding@resend.dev>",
      to: [data.to],
      subject: data.subject,
      html,
      attachments,
    });

    // Check for Resend API errors (e.g., trial mode restrictions)
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      const errorMsg = emailResponse.error.message || "이메일 발송에 실패했습니다.";
      
      // Provide user-friendly message for trial mode restriction
      if (errorMsg.includes("only send testing emails") || errorMsg.includes("verify a domain")) {
        throw new Error(
          "Resend 트라이얼 모드에서는 계정 소유자 이메일로만 발송 가능합니다. " +
          "외부 도메인(samyang.com 등)으로 발송하려면 resend.com/domains에서 도메인 인증이 필요합니다."
        );
      }
      throw new Error(errorMsg);
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
