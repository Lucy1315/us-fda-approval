import { useState, useMemo } from "react";
import { Pill, FlaskConical, Star, Microscope, Syringe, Activity } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TherapeuticAreaChart } from "@/components/dashboard/TherapeuticAreaChart";
import { ApprovalTypeChart } from "@/components/dashboard/ApprovalTypeChart";
import { DesignationProgress } from "@/components/dashboard/DesignationProgress";
import { DrugTable } from "@/components/dashboard/DrugTable";
import { Highlights } from "@/components/dashboard/Highlights";
import { Filters, FilterState, applyFilters } from "@/components/dashboard/Filters";
import { fdaApprovals, DrugApproval } from "@/data/fdaData";

const Index = () => {
  const [data, setData] = useState<DrugApproval[]>(fdaApprovals);
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

  const filteredData = useMemo(() => applyFilters(data, filters), [data, filters]);

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

    return { total, oncology, nonOncology, biosimilar, novelDrug, novelOncology, novelNonOncology, orphanDrug, blaCount, ndaCount };
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

  const approvalTypeData = useMemo(() => {
    const typeMap = new Map<string, number>();
    filteredData.forEach((drug) => {
      const type = drug.approvalType || "기타";
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    return Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const drugCategoryData = useMemo(() => [
    { name: "항암제", value: stats.oncology },
    { name: "비항암제", value: stats.nonOncology },
  ], [stats]);

  const specialDesignations = useMemo(() => {
    const total = stats.total || 1;
    return [
      { name: "희귀의약품", value: stats.orphanDrug, percentage: Math.round((stats.orphanDrug / total) * 100) },
      { name: "신약", value: stats.novelDrug, percentage: Math.round((stats.novelDrug / total) * 100) },
      { name: "바이오시밀러", value: stats.biosimilar, percentage: Math.round((stats.biosimilar / total) * 100) },
    ];
  }, [stats]);

  const handleDataUpdate = (newData: DrugApproval[]) => {
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header onDataUpdate={handleDataUpdate} dataCount={data.length} />
        
        {/* Filters */}
        <Filters data={data} filters={filters} onFilterChange={setFilters} />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
          <StatCard
            title="전체 승인"
            value={stats.total}
            subtitle={`필터 적용: ${filteredData.length === data.length ? "없음" : `${data.length}건 중`}`}
            icon={Pill}
            variant="primary"
          />
          <StatCard
            title="항암제"
            value={stats.oncology}
            subtitle={`비항암제: ${stats.nonOncology}건`}
            icon={FlaskConical}
            variant="accent"
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
          <ApprovalTypeChart approvalTypeData={approvalTypeData} drugCategoryData={drugCategoryData} />
          <Highlights data={filteredData} />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <DesignationProgress data={specialDesignations} />
          </div>
          <div className="lg:col-span-3">
            <DrugTable data={filteredData} />
          </div>
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
