export interface DrugApproval {
  approvalMonth: string;
  approvalDate: string;
  ndaBlaNumber: string;
  applicationNo: string;
  applicationType: string;
  brandName: string;
  activeIngredient: string;
  sponsor: string;
  indicationFull: string;
  therapeuticArea: string;
  isOncology: boolean;
  isBiosimilar: boolean;
  isNovelDrug: boolean;
  isOrphanDrug: boolean;
  approvalType: string;
  notes: string;
}

export const fdaApprovals: DrugApproval[] = [
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-19",
    ndaBlaNumber: "BLA 125755",
    applicationNo: "125755",
    applicationType: "BLA",
    brandName: "IMDELLTRA",
    activeIngredient: "tarlatamab-dlle",
    sponsor: "Amgen",
    indicationFull: "백금 기반 화학요법 후 질병 진행이 있는 광범위 소세포폐암 성인 환자 치료",
    therapeuticArea: "항암제 - 폐암",
    isOncology: true,
    isBiosimilar: false,
    isNovelDrug: false,
    isOrphanDrug: true,
    approvalType: "정규승인",
    notes: "2024년 신속승인에서 정규승인으로 전환. CD3/DLL3 타겟 이중특이 T세포 결합체",
  },
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-19",
    ndaBlaNumber: "BLA 761473",
    applicationNo: "761473",
    applicationType: "BLA",
    brandName: "HYRNUO",
    activeIngredient: "sevabertinib",
    sponsor: "Bayer HealthCare Pharmaceuticals",
    indicationFull: "HER2 티로신 키나제 도메인 활성화 변이가 있는 국소 진행성 또는 전이성 비편평 비소세포폐암 성인 환자 치료",
    therapeuticArea: "항암제 - 폐암",
    isOncology: true,
    isBiosimilar: false,
    isNovelDrug: true,
    isOrphanDrug: true,
    approvalType: "신속승인",
    notes: "HER2 TKD 변이 최초 선택적 HER2/EGFR 키나제 억제제. 가역적 티로신 키나제 억제제",
  },
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-19",
    ndaBlaNumber: "BLA 761145",
    applicationNo: "761145",
    applicationType: "BLA",
    brandName: "DARZALEX FASPRO",
    activeIngredient: "daratumumab and hyaluronidase-fihj",
    sponsor: "Janssen Biotech",
    indicationFull: "새로 진단된 경쇄 아밀로이드증 환자의 bortezomib/cyclophosphamide/dexamethasone 병용요법",
    therapeuticArea: "항암제 - 아밀로이드증",
    isOncology: true,
    isBiosimilar: false,
    isNovelDrug: false,
    isOrphanDrug: true,
    approvalType: "정규승인",
    notes: "변경승인 - 경쇄 아밀로이드증 신규 적응증. CD38 단클론항체",
  },
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-24",
    ndaBlaNumber: "BLA 761589",
    applicationNo: "761589",
    applicationType: "BLA",
    brandName: "ITVISMA",
    activeIngredient: "onasemnogene abeparvovec-brve",
    sponsor: "Novartis Pharmaceuticals",
    indicationFull: "2세 이상 성인 및 소아의 척수성 근위축증 유전자 대체 치료",
    therapeuticArea: "신경과 - 유전자치료",
    isOncology: false,
    isBiosimilar: false,
    isNovelDrug: true,
    isOrphanDrug: true,
    approvalType: "정규승인",
    notes: "성인 및 고연령 소아 SMA 최초 유전자 치료. AAV 벡터 기반. 척수강 내 투여",
  },
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-25",
    ndaBlaNumber: "BLA 761690",
    applicationNo: "761690",
    applicationType: "BLA",
    brandName: "VOYXACT",
    activeIngredient: "sibeprenlimab-szsi",
    sponsor: "Otsuka Pharmaceutical",
    indicationFull: "질병 진행 위험이 있는 일차성 IgA 신병증 성인 환자의 단백뇨 감소",
    therapeuticArea: "신장내과 - IgA 신병증",
    isOncology: false,
    isBiosimilar: false,
    isNovelDrug: true,
    isOrphanDrug: true,
    approvalType: "신속승인",
    notes: "IgA 신병증 최초 APRIL 차단제",
  },
  {
    approvalMonth: "2025-11",
    approvalDate: "2025-11-28",
    ndaBlaNumber: "BLA 761691",
    applicationNo: "761691",
    applicationType: "BLA",
    brandName: "ARMLUPEG",
    activeIngredient: "pegfilgrastim-unne",
    sponsor: "Lupin Limited",
    indicationFull: "화학요법 치료 환자의 발열성 중성구감소증 발생률 감소; 골수억제 방사선 노출 환자의 생존율 증가",
    therapeuticArea: "혈액내과 - 중성구감소증",
    isOncology: false,
    isBiosimilar: true,
    isNovelDrug: false,
    isOrphanDrug: false,
    approvalType: "정규승인",
    notes: "Neulasta (pegfilgrastim) 바이오시밀러. PEG화 과립구 집락자극인자",
  },
];

export const summaryStats = {
  total: 6,
  oncology: 3,
  nonOncology: 3,
  biosimilar: 1,
  novelDrug: 3,
  novelOncology: 1,
  novelNonOncology: 2,
  orphanDrug: 5,
  orphanOncology: 3,
  orphanNonOncology: 2,
};

export const therapeuticAreaData = [
  { name: "폐암", value: 2, category: "항암제" },
  { name: "아밀로이드증", value: 1, category: "항암제" },
  { name: "유전자치료", value: 1, category: "신경과" },
  { name: "IgA 신병증", value: 1, category: "신장내과" },
  { name: "중성구감소증", value: 1, category: "혈액내과" },
];

export const approvalTypeData = [
  { name: "정규승인", value: 4 },
  { name: "신속승인", value: 2 },
];

export const drugCategoryData = [
  { name: "항암제", value: 3 },
  { name: "비항암제", value: 3 },
];

export const specialDesignations = [
  { name: "희귀의약품", value: 5, percentage: 83 },
  { name: "신약", value: 3, percentage: 50 },
  { name: "바이오시밀러", value: 1, percentage: 17 },
];
