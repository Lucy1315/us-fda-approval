import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DrugApproval } from "@/data/fdaData";

interface DrugTableProps {
  data: DrugApproval[];
}

export function DrugTable({ data }: DrugTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">승인 약물 상세 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            필터 조건에 맞는 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          승인 약물 상세 목록 ({data.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">승인일</TableHead>
                <TableHead className="w-[130px]">제품명</TableHead>
                <TableHead className="w-[150px]">주성분</TableHead>
                <TableHead className="w-[140px]">제약사</TableHead>
                <TableHead className="w-[130px]">적응증</TableHead>
                <TableHead className="w-[150px]">지정</TableHead>
                <TableHead className="w-[80px]">승인유형</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((drug) => (
                <TableRow key={drug.applicationNo} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-sm">
                    {drug.approvalDate.split("-").slice(1).join("/")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    <a 
                      href={`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${drug.applicationNo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      {drug.brandName}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {drug.activeIngredient}
                  </TableCell>
                  <TableCell className="text-sm">
                    {drug.sponsor.length > 20 ? drug.sponsor.slice(0, 20) + "..." : drug.sponsor}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={drug.isOncology ? "default" : "secondary"}
                      className={drug.isOncology ? "bg-chart-oncology hover:bg-chart-oncology/80" : ""}
                    >
                      {drug.therapeuticArea.split(" - ")[1] || drug.therapeuticArea}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {drug.isNovelDrug && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          신약
                        </Badge>
                      )}
                      {drug.isOrphanDrug && (
                        <Badge variant="outline" className="text-xs border-chart-orphan text-chart-orphan">
                          희귀
                        </Badge>
                      )}
                      {drug.isBiosimilar && (
                        <Badge variant="outline" className="text-xs border-secondary text-secondary">
                          바이오시밀러
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={
                        drug.approvalType === "신속승인" 
                          ? "border-secondary bg-secondary/10 text-secondary" 
                          : "border-primary bg-primary/10 text-primary"
                      }
                    >
                      {drug.approvalType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
