import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TherapeuticAreaData {
  name: string;
  value: number;
  category: string;
}

interface TherapeuticAreaChartProps {
  data: TherapeuticAreaData[];
}

const COLORS = [
  "hsl(45, 90%, 65%)",
  "hsl(85, 55%, 55%)",
  "hsl(262, 65%, 65%)",
  "hsl(320, 60%, 65%)",
  "hsl(200, 70%, 60%)",
  "hsl(15, 85%, 65%)",
  "hsl(175, 50%, 55%)",
];

export function TherapeuticAreaChart({ data }: TherapeuticAreaChartProps) {
  if (data.length === 0) {
    return (
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">적응증별 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">적응증별 분포</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number, name: string) => [`${value}건`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
