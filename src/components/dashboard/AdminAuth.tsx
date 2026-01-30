import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, UserPlus, Shield, CloudUpload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { DrugApproval } from "@/data/fdaData";

interface AdminAuthProps {
  onSaveToCloud: (data: DrugApproval[], notes?: string) => Promise<boolean>;
  data: DrugApproval[];
  isFromCloud: boolean;
  cloudVersion: number | null;
}

export function AdminAuth({ onSaveToCloud, data, isFromCloud, cloudVersion }: AdminAuthProps) {
  const { user, isAdmin, isLoading, signIn, signUp, signOut, bootstrapAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);
    if (result.success) {
      setIsOpen(false);
      setEmail("");
      setPassword("");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    const result = await signUp(email, password);
    setIsSigningUp(false);
    if (result.success) {
      // Auto sign in after signup (since auto-confirm is enabled)
      await signIn(email, password);
      setIsOpen(false);
      setEmail("");
      setPassword("");
    }
  };

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    await onSaveToCloud(data, `Manual save by ${user?.email}`);
    setIsSaving(false);
  };

  // Not logged in
  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">관리자 로그인</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              관리자 인증
            </DialogTitle>
            <DialogDescription>
              데이터를 영구 저장하려면 관리자로 로그인하세요.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
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
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  <LogIn className="h-4 w-4" />
                  로그인
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
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
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={isSigningUp}>
                  {isSigningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  회원가입
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {user.email}
        </span>
        <Button variant="outline" size="sm" onClick={bootstrapAdmin} className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">관리자 등록</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={async () => {
            setIsLoggingOut(true);
            await signOut();
            setIsLoggingOut(false);
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  // Admin user
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-primary font-medium hidden sm:inline">
        ✓ 관리자
      </span>
      <Button
        variant="default"
        size="sm"
        onClick={handleSaveToCloud}
        disabled={isSaving}
        className="gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CloudUpload className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isFromCloud ? `저장 (v${cloudVersion})` : "클라우드 저장"}
        </span>
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={async () => {
          setIsLoggingOut(true);
          await signOut();
          setIsLoggingOut(false);
        }}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      </Button>
    </div>
  );
}
