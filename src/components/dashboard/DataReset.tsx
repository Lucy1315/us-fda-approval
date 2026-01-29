import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const LOCAL_DATA_KEY = "fda_approvals_overrides_v1";

interface DataResetProps {
  onReset: () => void;
}

export function DataReset({ onReset }: DataResetProps) {
  const handleReset = () => {
    try {
      localStorage.removeItem(LOCAL_DATA_KEY);
      onReset();
      toast.success("데이터가 초기화되었습니다", {
        description: "기본 데이터로 복원되었습니다.",
      });
    } catch (error) {
      toast.error("초기화 실패", {
        description: "데이터 초기화 중 오류가 발생했습니다.",
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          초기화
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>데이터 초기화</AlertDialogTitle>
          <AlertDialogDescription>
            브라우저에 저장된 모든 수정 데이터를 삭제하고 기본 데이터로 복원합니다.
            <br />
            <br />
            이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>초기화</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
