import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DrugApproval } from "@/data/fdaData";

export interface FilterState {
  dateRange: string;
  applicationType: string;
  sponsor: string;
  therapeuticArea: string;
  isOncology: string;
  isBiosimilar: string;
  isNovelDrug: string;
  isOrphanDrug: string;
}

interface FiltersProps {
  data: DrugApproval[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const dateRangeOptions = [
  { value: "all", label: "전체" },
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "2y", label: "2년" },
];

const booleanOptions = [
  { value: "all", label: "전체" },
  { value: "true", label: "Y" },
  { value: "false", label: "N" },
];

export function Filters({ data, filters, onFilterChange }: FiltersProps) {
  const uniqueValues = useMemo(() => {
    const applicationTypes = [...new Set(data.map(d => d.applicationType).filter(Boolean))];
    const sponsors = [...new Set(data.map(d => d.sponsor).filter(Boolean))];
    const therapeuticAreas = [...new Set(data.map(d => d.therapeuticArea).filter(Boolean))];

    return { applicationTypes, sponsors, therapeuticAreas };
  }, [data]);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([_, value]) => value !== "all"
  ).length;

  const clearFilters = () => {
    onFilterChange({
      dateRange: "all",
      applicationType: "all",
      sponsor: "all",
      therapeuticArea: "all",
      isOncology: "all",
      isBiosimilar: "all",
      isNovelDrug: "all",
      isOrphanDrug: "all",
    });
  };

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">필터</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}개 적용됨
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
            <X className="h-3 w-3" />
            초기화
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">승인일</label>
          <Select value={filters.dateRange} onValueChange={(v) => handleChange("dateRange", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">신청유형</label>
          <Select value={filters.applicationType} onValueChange={(v) => handleChange("applicationType", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueValues.applicationTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">제약사</label>
          <Select value={filters.sponsor} onValueChange={(v) => handleChange("sponsor", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueValues.sponsors.map((s) => (
                <SelectItem key={s} value={s}>{s.length > 25 ? s.slice(0, 25) + "..." : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">치료영역</label>
          <Select value={filters.therapeuticArea} onValueChange={(v) => handleChange("therapeuticArea", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {uniqueValues.therapeuticAreas.map((area) => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">항암제</label>
          <Select value={filters.isOncology} onValueChange={(v) => handleChange("isOncology", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {booleanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">바이오시밀러</label>
          <Select value={filters.isBiosimilar} onValueChange={(v) => handleChange("isBiosimilar", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {booleanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">신약</label>
          <Select value={filters.isNovelDrug} onValueChange={(v) => handleChange("isNovelDrug", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {booleanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">희귀의약품</label>
          <Select value={filters.isOrphanDrug} onValueChange={(v) => handleChange("isOrphanDrug", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {booleanOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function applyFilters(data: DrugApproval[], filters: FilterState): DrugApproval[] {
  const now = new Date();

  return data.filter((drug) => {
    // Date range filter
    if (filters.dateRange !== "all") {
      const approvalDate = new Date(drug.approvalDate);
      let cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case "1m": cutoffDate.setMonth(now.getMonth() - 1); break;
        case "3m": cutoffDate.setMonth(now.getMonth() - 3); break;
        case "6m": cutoffDate.setMonth(now.getMonth() - 6); break;
        case "1y": cutoffDate.setFullYear(now.getFullYear() - 1); break;
        case "2y": cutoffDate.setFullYear(now.getFullYear() - 2); break;
      }
      
      if (approvalDate < cutoffDate) return false;
    }

    // Application type filter
    if (filters.applicationType !== "all" && drug.applicationType !== filters.applicationType) {
      return false;
    }

    // Sponsor filter
    if (filters.sponsor !== "all" && drug.sponsor !== filters.sponsor) {
      return false;
    }

    // Therapeutic area filter
    if (filters.therapeuticArea !== "all" && drug.therapeuticArea !== filters.therapeuticArea) {
      return false;
    }

    // Boolean filters
    if (filters.isOncology !== "all" && drug.isOncology !== (filters.isOncology === "true")) {
      return false;
    }
    if (filters.isBiosimilar !== "all" && drug.isBiosimilar !== (filters.isBiosimilar === "true")) {
      return false;
    }
    if (filters.isNovelDrug !== "all" && drug.isNovelDrug !== (filters.isNovelDrug === "true")) {
      return false;
    }
    if (filters.isOrphanDrug !== "all" && drug.isOrphanDrug !== (filters.isOrphanDrug === "true")) {
      return false;
    }

    return true;
  });
}
