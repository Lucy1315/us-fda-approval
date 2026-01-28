import { useMemo, useState } from "react";
import { Filter, X, CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DrugApproval } from "@/data/fdaData";

export interface FilterState {
  dateRange: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
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
  { value: "custom", label: "직접 선택" },
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

  const handleChange = (key: keyof FilterState, value: string | Date | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (value: string) => {
    if (value === "custom") {
      onFilterChange({ ...filters, dateRange: value });
    } else {
      onFilterChange({ ...filters, dateRange: value, startDate: undefined, endDate: undefined });
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => {
      if (key === "startDate" || key === "endDate") return value !== undefined;
      return value !== "all";
    }
  ).length;

  const clearFilters = () => {
    onFilterChange({
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
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "선택";
    return format(date, "yy-MM-dd");
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
          <Select value={filters.dateRange} onValueChange={handleDateRangeChange}>
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

        {filters.dateRange === "custom" && (
          <>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">시작일</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal text-sm",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateDisplay(filters.startDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => handleChange("startDate", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">종료일</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 w-full justify-start text-left font-normal text-sm",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateDisplay(filters.endDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => handleChange("endDate", date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">신청유형</label>
          <Select value={filters.applicationType} onValueChange={(v) => handleChange("applicationType", v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="NDA">NDA</SelectItem>
              <SelectItem value="BLA">BLA</SelectItem>
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
    const approvalDate = new Date(drug.approvalDate);
    
    // Custom date range filter
    if (filters.dateRange === "custom") {
      if (filters.startDate && approvalDate < filters.startDate) return false;
      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (approvalDate > endOfDay) return false;
      }
    } else if (filters.dateRange !== "all") {
      // Preset date range filter
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
