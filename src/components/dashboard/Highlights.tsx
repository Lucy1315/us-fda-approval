import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star } from "lucide-react";

const highlights = [
  {
    title: "ITVISMA",
    description: "SMA 성인 유전자치료 - 최초 성인/고연령 소아 대상",
  },
  {
    title: "HYRNUO",
    description: "HER2 TKD 표적치료 - 최초 선택적 HER2/EGFR 키나제 억제제",
  },
  {
    title: "VOYXACT",
    description: "IgA 신병증 최초 APRIL 차단제",
  },
];

export function Highlights() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          11월 주요 특징
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-chart-orphan">83%</p>
              <p className="text-xs text-muted-foreground mt-1">희귀의약품 비중</p>
            </div>
            <div className="p-4 rounded-lg bg-card border">
              <p className="text-2xl font-bold text-primary">50%</p>
              <p className="text-xs text-muted-foreground mt-1">신약 비중</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <p className="text-sm font-medium text-muted-foreground">🌟 최초 승인</p>
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-3 rounded-lg bg-card border hover:border-primary/30 transition-colors"
              >
                <Star className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
