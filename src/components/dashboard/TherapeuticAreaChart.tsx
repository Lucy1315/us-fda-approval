import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

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

const ONCOLOGY_COLORS = [
  "hsl(45, 90%, 65%)",
  "hsl(15, 85%, 65%)",
  "hsl(320, 60%, 65%)",
  "hsl(35, 85%, 60%)",
];

export function TherapeuticAreaChart({ data }: TherapeuticAreaChartProps) {
  const oncologyData = useMemo(() => {
    return data.filter(d => d.category === "항암제");
  }, [data]);

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
        <div className="grid grid-rows-2 gap-6">
          {/* 전체 차트 */}
          <div>
            <p className="text-sm font-medium text-muted-foreground text-center mb-2">전체 ({data.reduce((acc, d) => acc + d.value, 0)}건)</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}(${value})`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  >
                    {data.map((_, index) => (
                      <Cell key={`cell-all-${index}`} fill={COLORS[index % COLORS.length]} />
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
          </div>

          {/* 항암제 차트 */}
          <div>
            <p className="text-sm font-medium text-muted-foreground text-center mb-2">항암제 ({oncologyData.reduce((acc, d) => acc + d.value, 0)}건)</p>
            <div className="h-[160px]">
              {oncologyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={oncologyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}(${value})`}
                      labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                    >
                      {oncologyData.map((_, index) => (
                        <Cell key={`cell-onc-${index}`} fill={ONCOLOGY_COLORS[index % ONCOLOGY_COLORS.length]} />
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
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  항암제 데이터 없음
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
