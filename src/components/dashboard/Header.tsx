import { Calendar, Database, FileText, Cloud, LogIn, LogOut, Shield, UserPlus } from "lucide-react";
import { ExcelUpload } from "./ExcelUpload";
import { FdaNovelDrugsExport } from "./FdaNovelDrugsExport";
import { FdaValidation } from "./FdaValidation";
import { UsageGuide } from "./UsageGuide";
import { DrugApproval } from "@/data/fdaData";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface HeaderProps {
  onDataUpdate: (data: DrugApproval[]) => void;
  data: DrugApproval[];
  filteredData: DrugApproval[];
  saveToCloud: (data: DrugApproval[], notes?: string) => Promise<boolean>;
  isFromCloud: boolean;
  cloudVersion: number | null;
  isAdmin: boolean;
  user: User | null;
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  onSignUp: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  onSignOut: () => Promise<{ success: boolean; error?: any }>;
  onBootstrapAdmin: () => Promise<boolean>;
}

export function Header({
  onDataUpdate,
  data,
  filteredData,
  saveToCloud,
  isFromCloud,
  cloudVersion,
  isAdmin,
  user,
  onSignIn,
  onSignUp,
  onSignOut,
  onBootstrapAdmin,
}: HeaderProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsAdminBootstrap, setNeedsAdminBootstrap] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onSignIn(email, password);
    setIsSubmitting(false);
    if (result.success) {
      setAuthDialogOpen(false);
      setEmail("");
      setPassword("");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await onSignUp(email, password);
    setIsSubmitting(false);
    if (result.success) {
      setNeedsAdminBootstrap(true);
    }
  };

  const handleSignOut = async () => {
    await onSignOut();
  };

  const handleBootstrapAdmin = async () => {
    const success = await onBootstrapAdmin();
    if (success) {
      setNeedsAdminBootstrap(false);
      setAuthDialogOpen(false);
    }
  };

  const handleCloudSave = async () => {
    if (!isAdmin) {
      toast.error("관리자 권한이 필요합니다.");
      return;
    }
    await saveToCloud(data);
  };

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-3">
        {/* 타이틀 */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">
            US FDA 승인 전문의약품
          </h1>
          {isFromCloud && (
            <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
              <Cloud className="h-3 w-3" />
              v{cloudVersion}
            </span>
          )}
        </div>
        
        {/* 서브타이틀 + 데이터 정보 + 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">미국 FDA 전문의약품 승인 데이터 대시보드</span>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span>데이터: <strong className="text-foreground">{data.length}건</strong></span>
          </div>
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>수집일: <strong className="text-foreground">2026-01-29</strong></span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 모든 사용자가 볼 수 있는 버튼 */}
            <UsageGuide />
            <FdaNovelDrugsExport data={data} filteredData={filteredData} />
            
            {/* 관리자 전용 버튼 */}
            {isAdmin && (
              <>
                <FdaValidation data={data} onDataUpdate={onDataUpdate} />
                <ExcelUpload onDataUpdate={onDataUpdate} currentData={data} />
              </>
            )}
            
            {/* 인증 관련 버튼 */}
            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <>
                    <span className="text-xs text-primary font-medium flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <Shield className="h-3 w-3" />
                      관리자
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCloudSave}
                      className="gap-2"
                    >
                      <Cloud className="h-4 w-4" />
                      저장 {cloudVersion ? `(v${cloudVersion})` : ""}
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {user.email?.split("@")[0]}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} title="로그아웃">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    관리자 로그인
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      관리자 인증
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    데이터를 영구 저장하려면 관리자로 로그인하세요.
                  </p>
                  
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">로그인</TabsTrigger>
                      <TabsTrigger value="signup">회원가입</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-email">이메일</Label>
                          <Input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">비밀번호</Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? "로그인 중..." : "로그인"}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="signup">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email">이메일</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">비밀번호</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                          <UserPlus className="h-4 w-4" />
                          {isSubmitting ? "가입 중..." : "회원가입"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {/* 데이터 소스 태그 */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 rounded bg-muted">FDA Official</span>
          <span className="px-2 py-1 rounded bg-muted">Drugs.com</span>
          <span className="px-2 py-1 rounded bg-muted">ASCO Post</span>
          <span className="px-2 py-1 rounded bg-muted">NeurologyLive</span>
        </div>
      </div>
    </header>
  );
}
