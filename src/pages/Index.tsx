import { Pill, FlaskConical, Star, Microscope, Syringe, Activity } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { TherapeuticAreaChart } from "@/components/dashboard/TherapeuticAreaChart";
import { ApprovalTypeChart } from "@/components/dashboard/ApprovalTypeChart";
import { DesignationProgress } from "@/components/dashboard/DesignationProgress";
import { DrugTable } from "@/components/dashboard/DrugTable";
import { Highlights } from "@/components/dashboard/Highlights";
import { summaryStats } from "@/data/fdaData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="전체 승인"
            value={summaryStats.total}
            subtitle="2025년 11월"
            icon={Pill}
            variant="primary"
          />
          <StatCard
            title="항암제"
            value={summaryStats.oncology}
            subtitle={`비항암제: ${summaryStats.nonOncology}건`}
            icon={FlaskConical}
            variant="accent"
          />
          <StatCard
            title="신약 (Novel)"
            value={summaryStats.novelDrug}
            subtitle="최초 승인 의약품"
            icon={Star}
            variant="secondary"
          />
          <StatCard
            title="희귀의약품"
            value={summaryStats.orphanDrug}
            subtitle="Orphan Drug"
            icon={Microscope}
            variant="muted"
          />
          <StatCard
            title="바이오시밀러"
            value={summaryStats.biosimilar}
            subtitle="Biosimilar"
            icon={Syringe}
            variant="secondary"
          />
          <StatCard
            title="BLA 신청"
            value="100%"
            subtitle="모든 제품"
            icon={Activity}
            variant="primary"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TherapeuticAreaChart />
          <ApprovalTypeChart />
          <Highlights />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <DesignationProgress />
          </div>
          <div className="lg:col-span-3">
            <DrugTable />
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
