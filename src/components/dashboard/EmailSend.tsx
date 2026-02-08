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
import { supabase } from "@/integrations/supabase/client";

interface EmailSendProps {
  filteredData: DrugApproval[];
}

export function EmailSend({ filteredData }: EmailSendProps) {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd", { locale: ko });
  
  // Calculate statistics
  const stats = {
    total: filteredData.length,
    oncology: filteredData.filter((d) => d.isOncology).length,
    novelDrug: filteredData.filter((d) => d.isNovelDrug).length,
    orphanDrug: filteredData.filter((d) => d.isOrphanDrug).length,
    biosimilar: filteredData.filter((d) => d.isBiosimilar).length,
    bla: filteredData.filter((d) => d.applicationType === "BLA").length,
    nda: filteredData.filter((d) => d.applicationType === "NDA").length,
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
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: recipientEmail,
          subject: `[FDA 승인 현황] ${today} 기준 ${stats.total}건`,
          stats,
        },
      });

      if (error) throw error;

      toast.success(`${recipientEmail}로 이메일이 발송되었습니다.`);
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
              <div className="grid grid-cols-4 gap-2 pt-2 border-t text-xs">
                <p>전체: <strong>{stats.total}건</strong></p>
                <p>항암제: <strong>{stats.oncology}건</strong></p>
                <p>신약: <strong>{stats.novelDrug}건</strong></p>
                <p>희귀의약품: <strong>{stats.orphanDrug}건</strong></p>
                <p>바이오시밀러: <strong>{stats.biosimilar}건</strong></p>
                <p>BLA: <strong>{stats.bla}건</strong></p>
                <p>NDA: <strong>{stats.nda}건</strong></p>
              </div>
              <p className="pt-2 border-t text-muted-foreground">
                대시보드 링크가 포함됩니다.
              </p>
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
