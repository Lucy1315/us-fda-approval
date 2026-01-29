import { useEffect, useMemo, useState } from "react";
import { Pill, FlaskConical, Star, Microscope, Syringe, Activity } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TherapeuticAreaChart } from "@/components/dashboard/TherapeuticAreaChart";


import { DrugTable } from "@/components/dashboard/DrugTable";
import { Highlights } from "@/components/dashboard/Highlights";
import { Filters, FilterState, applyFilters } from "@/components/dashboard/Filters";
import { fdaApprovals, DrugApproval } from "@/data/fdaData";

const LOCAL_DATA_KEY = "fda_approvals_overrides_v1";
// Version key: creates a fingerprint from source data to invalidate stale localStorage overrides
const createDataFingerprint = () => {
  const first = fdaApprovals[0];
  const last = fdaApprovals[fdaApprovals.length - 1];
  const idsLen = fdaApprovals.reduce((acc, d) => acc + (d.applicationNo?.length || 0), 0);
  return `v2-${fdaApprovals.length}-${first?.applicationNo || ""}-${last?.applicationNo || ""}-${idsLen}`;
};
const SOURCE_DATA_VERSION = createDataFingerprint();
const VERSION_KEY = "fda_source_version";

function deduplicateData(data: DrugApproval[]): DrugApproval[] {
  const seen = new Set<string>();
  return data.filter((drug) => {
    // Create unique key based on applicationNo, approvalDate, and supplementCategory only
    // This ensures products like MEN'S ROGAINE / WOMEN'S ROGAINE with same NDA are consolidated
    const key = `${drug.applicationNo}-${drug.approvalDate}-${drug.supplementCategory || ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function loadPersistedData(): DrugApproval[] | null {
  try {
    // Check if source data version changed - if so, invalidate cache
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== SOURCE_DATA_VERSION) {
      // Source data was updated, clear old cache and use fresh source data
      localStorage.removeItem(LOCAL_DATA_KEY);
      localStorage.setItem(VERSION_KEY, SOURCE_DATA_VERSION);
      return null;
    }
    
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    // Minimal shape check to avoid breaking the app on malformed storage.
    if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null && "applicationNo" in (parsed[0] as any)) {
      // Deduplicate data to remove any duplicates
      return deduplicateData(parsed as DrugApproval[]);
    }
    return null;
  } catch {
    return null;
  }
}

function persistData(data: DrugApproval[]) {
  try {
    // Only persist if the current source version matches.
    // This prevents re-saving stale state during/after a source-data update.
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== SOURCE_DATA_VERSION) return;
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
    localStorage.setItem(VERSION_KEY, SOURCE_DATA_VERSION);
  } catch {
    // ignore
  }
}

const Index = () => {
  const [data, setData] = useState<DrugApproval[]>(() => loadPersistedData() ?? fdaApprovals);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "all",
    startDate: undefined,
    endDate: undefined,
    applicationType: "all",
    sponsor: "all",
    therapeuticArea: "all",
    isOncology: "all",
    isBiosimilar: "all",
    isNovelDrug: "all",
    isOrphanDrug: "all",
  });

  const filteredData = useMemo(() => {
    const filtered = applyFilters(data, filters);
    // Deduplicate again to ensure no duplicates slip through from localStorage overrides
    const deduped = deduplicateData(filtered);
    // Always show the detailed list in chronological (oldest -> newest) order.
    return [...deduped].sort((a, b) => a.approvalDate.localeCompare(b.approvalDate));
  }, [data, filters]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const oncology = filteredData.filter((d) => d.isOncology).length;
    const nonOncology = total - oncology;
    const biosimilar = filteredData.filter((d) => d.isBiosimilar).length;
    const novelDrug = filteredData.filter((d) => d.isNovelDrug).length;
    const novelOncology = filteredData.filter((d) => d.isNovelDrug && d.isOncology).length;
    const novelNonOncology = novelDrug - novelOncology;
    const orphanDrug = filteredData.filter((d) => d.isOrphanDrug).length;
    const blaCount = filteredData.filter((d) => d.applicationType === "BLA").length;
    const ndaCount = filteredData.filter((d) => d.applicationType === "NDA").length;
    
    // 최초승인 vs 변경승인 구분: SUPPL 포함 여부로 판단
    const supplCount = filteredData.filter((d) => {
      const cat = d.supplementCategory || "";
      return cat.includes("SUPPL");
    }).length;
    const origCount = total - supplCount;

    return { total, oncology, nonOncology, biosimilar, novelDrug, novelOncology, novelNonOncology, orphanDrug, blaCount, ndaCount, origCount, supplCount };
  }, [filteredData]);

  const therapeuticAreaData = useMemo(() => {
    const areaMap = new Map<string, { name: string; value: number; category: string }>();
    filteredData.forEach((drug) => {
      const parts = drug.therapeuticArea.split(" - ");
      const category = parts[0] || "";
      const name = parts[1] || drug.therapeuticArea;
      const key = name;
      if (areaMap.has(key)) {
        areaMap.get(key)!.value++;
      } else {
        areaMap.set(key, { name, value: 1, category });
      }
    });
    return Array.from(areaMap.values());
  }, [filteredData]);



  const handleDataUpdate = (newData: DrugApproval[]) => {
    setData(newData);
  };

  // If the bundled source data changed (e.g., publish/update), immediately invalidate local overrides
  // and reset in-memory state too (not only on first load).
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      if (storedVersion !== SOURCE_DATA_VERSION) {
        localStorage.removeItem(LOCAL_DATA_KEY);
        localStorage.setItem(VERSION_KEY, SOURCE_DATA_VERSION);
        setData(fdaApprovals);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist any updates coming from FDA validation / Excel upload so they don't "revert" on refresh.
  useEffect(() => {
    persistData(data);
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header onDataUpdate={handleDataUpdate} data={data} filteredData={filteredData} />
        
        {/* Filters */}
        <Filters data={data} filters={filters} onFilterChange={setFilters} />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <StatCard
            title="전체 승인"
            value={stats.total}
            subtitle={`최초승인: ${stats.origCount} / 변경승인: ${stats.supplCount}`}
            icon={Pill}
            variant="primary"
          />
          <StatCard
            title="항암제"
            value={stats.oncology}
            subtitle={`비항암제: ${stats.nonOncology}건`}
            icon={FlaskConical}
            variant="oncology"
          />
          <StatCard
            title="신약 (Novel)"
            value={stats.novelDrug}
            subtitle={`항암제 ${stats.novelOncology} / 비항암제 ${stats.novelNonOncology}`}
            icon={Star}
            variant="novel"
          />
          <StatCard
            title="희귀의약품"
            value={stats.orphanDrug}
            subtitle="Orphan Drug"
            icon={Microscope}
            variant="orphan"
          />
          <StatCard
            title="바이오시밀러"
            value={stats.biosimilar}
            subtitle="Biosimilar"
            icon={Syringe}
            variant="biosimilar"
          />
          <StatCard
            title="BLA"
            value={stats.blaCount}
            subtitle={`${stats.total > 0 ? Math.round((stats.blaCount / stats.total) * 100) : 0}% 생물의약품`}
            icon={Activity}
            variant="primary"
          />
          <StatCard
            title="NDA"
            value={stats.ndaCount}
            subtitle={`${stats.total > 0 ? Math.round((stats.ndaCount / stats.total) * 100) : 0}% 화학의약품`}
            icon={Pill}
            variant="nda"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TherapeuticAreaChart data={therapeuticAreaData} />
          <Highlights data={filteredData} />
        </div>

        {/* Drug Table Section */}
        <div className="mb-8">
          <DrugTable data={filteredData} />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 border-t">
          <p className="text-sm text-muted-foreground">
            데이터 출처: FDA Novel Drug Approvals 2025 | Drugs.com | ASCO Post | NeurologyLive
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
