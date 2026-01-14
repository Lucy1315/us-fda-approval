import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DesignationData {
  name: string;
  value: number;
  percentage: number;
}

interface DesignationProgressProps {
  data: DesignationData[];
}

const designationColors: Record<string, string> = {
  "희귀의약품": "bg-chart-orphan",
  "신약": "bg-primary",
  "바이오시밀러": "bg-secondary",
};

export function DesignationProgress({ data }: DesignationProgressProps) {
  const total = data.reduce((acc, item) => Math.max(acc, item.value), 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">특별 지정 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {data.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {item.value}건 ({item.percentage}%)
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  designationColors[item.name] || "bg-primary"
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
