import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approvalTypeData, drugCategoryData } from "@/data/fdaData";

const APPROVAL_COLORS = ["hsl(200, 85%, 45%)", "hsl(168, 70%, 42%)"];
const CATEGORY_COLORS = ["hsl(25, 95%, 55%)", "hsl(200, 85%, 45%)"];

export function ApprovalTypeChart() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">승인 유형 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-3">승인 유형</p>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={approvalTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}건`, "승인 건수"]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {approvalTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={APPROVAL_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-3">약물 분류</p>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drugCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}건`, "승인 건수"]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {drugCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
