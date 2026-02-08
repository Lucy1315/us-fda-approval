import { useState } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DrugApproval } from "@/data/fdaData";
import { FilterState } from "./Filters";
import { supabase } from "@/integrations/supabase/client";

interface EmailSendProps {
  filteredData: DrugApproval[];
  filters: FilterState;
}

// Helper to get date range text for email header
function getDateRangeText(filters: FilterState): string {
  if (filters.dateRange === "all") {
    return "전체 기간";
  }
  
  if (filters.dateRange === "custom") {
    const start = filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : "";
    const end = filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : "";
    if (start && end) {
      return `${start} ~ ${end}`;
    } else if (start) {
      return `${start} ~`;
    } else if (end) {
      return `~ ${end}`;
    }
    return "전체 기간";
  }
  
  const rangeLabels: Record<string, string> = {
    "1m": "최근 1개월",
    "3m": "최근 3개월",
    "6m": "최근 6개월",
    "1y": "최근 1년",
    "2y": "최근 2년",
  };
  return rangeLabels[filters.dateRange] || "전체 기간";
}

export function EmailSend({ filteredData, filters }: EmailSendProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd", { locale: ko });
  const dateRangeText = getDateRangeText(filters);
  
  // Calculate statistics with sub-metrics
  const stats = {
    total: filteredData.length,
    oncology: filteredData.filter((d) => d.isOncology).length,
    nonOncology: filteredData.filter((d) => !d.isOncology).length,
    novelDrug: filteredData.filter((d) => d.isNovelDrug).length,
    novelOncology: filteredData.filter((d) => d.isNovelDrug && d.isOncology).length,
    novelNonOncology: filteredData.filter((d) => d.isNovelDrug && !d.isOncology).length,
    orphanDrug: filteredData.filter((d) => d.isOrphanDrug).length,
    biosimilar: filteredData.filter((d) => d.isBiosimilar).length,
    origCount: filteredData.filter((d) => !d.supplementCategory?.includes("SUPPL")).length,
    supplCount: filteredData.filter((d) => d.supplementCategory?.includes("SUPPL")).length,
  };

  // Prepare drugs array for Excel attachment
  const prepareDrugsForEmail = () => {
    return filteredData.map((drug) => ({
      approvalDate: drug.approvalDate,
      brandName: drug.brandName,
      activeIngredient: drug.activeIngredient,
      ndaBlaNumber: drug.ndaBlaNumber,
      sponsor: drug.sponsor,
      therapeuticArea: drug.therapeuticArea,
      indicationFull: drug.indicationFull,
      notes: drug.notes || "",
      isOncology: drug.isOncology,
      isBiosimilar: drug.isBiosimilar,
      isNovelDrug: drug.isNovelDrug,
      isOrphanDrug: drug.isOrphanDrug,
      supplementCategory: drug.supplementCategory || "",
    }));
  };

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      toast.error("수신자 이메일을 입력해주세요.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSending(true);
    try {
      const drugs = prepareDrugsForEmail();
      
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          subject: `[FDA 승인 현황] ${today} 기준 ${stats.total}건`,
          dateRangeText,
          stats,
          drugs,
        },
      });

      if (error) throw error;

      toast.success(`${recipientEmail}로 이메일이 발송되었습니다. (엑셀 첨부됨)`);
      setOpen(false);
      setRecipientEmail("");
    } catch (error: any) {
      console.error("Email send error:", error);
      toast.error(error.message || "이메일 발송에 실패했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mail className="h-4 w-4" />
          이메일
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>FDA 승인 현황 이메일 발송</DialogTitle>
          <DialogDescription>
            현재 필터링된 데이터를 이메일로 발송합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">수신자 이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium text-sm mb-3">발송 내용 미리보기</h4>
            <div className="space-y-2 text-sm">
              <p><strong>제목:</strong> [FDA 승인 현황] {today} 기준 {stats.total}건</p>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">📅 승인일:</p>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {dateRangeText}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <div className="p-2 bg-background rounded border">
                  <p className="font-medium">전체 승인: <strong>{stats.total}건</strong></p>
                  <p className="text-muted-foreground">최초 {stats.origCount} / 변경 {stats.supplCount}</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="font-medium">항암제: <strong>{stats.oncology}건</strong></p>
                  <p className="text-muted-foreground">비항암제: {stats.nonOncology}건</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="font-medium">신약: <strong>{stats.novelDrug}건</strong></p>
                  <p className="text-muted-foreground">항암 {stats.novelOncology} / 비항암 {stats.novelNonOncology}</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <p className="font-medium">희귀의약품: <strong>{stats.orphanDrug}건</strong></p>
                  <p className="text-muted-foreground">Orphan Drug</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-muted-foreground flex items-center gap-2">
                  <span>📎</span>
                  <span>엑셀 파일 첨부 (5개 시트: 요약, 국문 상세, English Details, 최초승인, 변경승인)</span>
                </p>
                <p className="text-muted-foreground mt-1">대시보드 링크가 포함됩니다.</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                발송 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                발송
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
