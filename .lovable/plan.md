

# 2026년 1월 29~30일 FDA 승인 NDA/BLA ETC 품목 추가

## 요약
첨부 엑셀에서 **2026년 1월 29일~31일** 기간의 NDA/BLA 품목 중 **ETC(전문의약품)** 만 선별하여 `src/data/fdaData.ts`에 추가합니다. 엑셀에 1월 31일 데이터는 없으므로, 실제 추가 대상은 **1월 29~30일**입니다.

---

## 추가 대상 NDA/BLA ETC 품목 (13건)

### 01/29/2026 (5건)

| 품목 | 허가번호 | 유형 | 성분 | 제약사 | 분류 |
|------|----------|------|------|--------|------|
| XIMINO | NDA 201922 | SUPPL-4 Labeling | minocycline HCl | Journey | 피부과 - 여드름 (항생제) |
| RIZAFILM | NDA 205394 | SUPPL-7 Labeling | rizatriptan benzoate | Gensco | 신경과 - 편두통 |
| LORBRENA | NDA 210868 | SUPPL-8 Labeling | lorlatinib | Pfizer | **항암제** - ALK+ 비소세포폐암 |
| WEGOVY | NDA 215256 | SUPPL-30 Labeling | semaglutide | Novo | 내분비내과 - 비만/체중관리 |
| WEGOVY | NDA 218316 | SUPPL-2 Labeling | semaglutide | Novo | 내분비내과 - 비만/체중관리 |

### 01/30/2026 (8건)

| 품목 | 허가번호 | 유형 | 성분 | 제약사 | 분류 |
|------|----------|------|------|--------|------|
| ZYPREXA | NDA 020592 | SUPPL-79 Labeling | olanzapine | Cheplapharm | 정신건강의학과 - 항정신병제 |
| ZYPREXA ZYDIS | NDA 021086 | SUPPL-53 Labeling | olanzapine | Cheplapharm | 정신건강의학과 - 항정신병제 |
| ZYPREXA | NDA 021253 | SUPPL-67 Labeling | olanzapine | Cheplapharm | 정신건강의학과 - 항정신병제 |
| ZYPREXA RELPREVV | NDA 022173 | SUPPL-50 Labeling | olanzapine pamoate | Cheplapharm | 정신건강의학과 - 항정신병제 |
| ENBREL | BLA 103795 | SUPPL-5605 | etanercept | Immunex | 류마티스내과 - 자가면역질환 |
| RYBELSUS | NDA 213051 | SUPPL-30 Labeling | semaglutide | Novo | 내분비내과 - 제2형 당뇨 |
| LYBALVI | NDA 213378 | SUPPL-11 Labeling | olanzapine/samidorphan | Alkermes Inc | 정신건강의학과 - 조현병/양극성장애 |
| LIVDELZI | NDA 217899 | SUPPL-2 Labeling | seladelpar lysine | Gilead Sciences Inc | 소화기내과 - 원발성 담즙성 담관염(PBC) |

---

## 제외 품목

| 제외 사유 | 품목 |
|-----------|------|
| OTC (일반의약품) | CETIRIZINE HYDROCHLORIDE ALLERGY / HIVES RELIEF (NDA 022429) |
| ANDA (제네릭) | GABAPENTIN (075350, 207099), DIVALPROEX SODIUM (214462), RILPIVIRINE (218798), VORTIOXETINE (211130, Tentative), SERTRALINE (220275), LACOSAMIDE (220386), DAPAGLIFLOZIN/METFORMIN (219755, Tentative) 등 |
| ANDA (1/30) | AMPICILLIN/SULBACTAM, EPIRUBICIN, AMOXICILLIN/CLAVULANATE, OLANZAPINE/FLUOXETINE 다수, LATANOPROST, LAMOTRIGINE 다수, VENLAFAXINE, VALACYCLOVIR, DAPTOMYCIN, ARSENIC TRIOXIDE, EMTRICITABINE/RILPIVIRINE/TENOFOVIR, BRIVARACETAM 등 |

---

## 참고사항

- 1월 31일 데이터: 엑셀 파일에 **해당 날짜 데이터 없음**
- 항암제 해당: LORBRENA (lorlatinib, ALK+ NSCLC) 1건
- 희귀의약품 해당: LORBRENA (1건), LIVDELZI (1건)
- 모든 항목이 변경승인(SUPPL)

---

## 수정 파일

### `src/data/fdaData.ts`
- 기존 1월 28일 데이터 뒤, 2월 데이터 앞에 13건 삽입
- 각 항목에 치료영역, 항암제 여부, 희귀의약품 여부, 적응증(국문), 비고 등 메타데이터 포함

