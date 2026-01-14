import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { specialDesignations } from "@/data/fdaData";

const designationColors = {
  "희귀의약품": "bg-chart-orphan",
  "신약": "bg-primary",
  "바이오시밀러": "bg-secondary",
};

export function DesignationProgress() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">특별 지정 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {specialDesignations.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {item.value}/6건 ({item.percentage}%)
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  designationColors[item.name as keyof typeof designationColors] || "bg-primary"
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
