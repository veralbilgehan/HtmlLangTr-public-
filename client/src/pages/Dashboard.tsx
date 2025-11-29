import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Activity, MessageSquare } from "lucide-react";
import DashboardHome from "@/components/DashboardHome";
import PerformanceView from "@/components/PerformanceView";
import ChatInterface from "@/components/ChatInterface";
import { getCurrentUser, logout, type User } from "@/lib/auth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "performance" | "chat">("dashboard");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setLocation("/");
      return;
    }
    setUser(currentUser);
  }, [setLocation]);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden min-h-[85vh] flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Şirket Portalı</h1>
            <p className="text-primary-foreground/80 text-sm" data-testid="text-welcome">
              Hoşgeldiniz, {user.fullName}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.fullName} />
                ) : null}
                <AvatarFallback className="bg-white text-primary font-bold">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium leading-none" data-testid="text-fullname">{user.fullName}</p>
                <p className="text-xs opacity-80" data-testid="text-department">{user.department || "Departman"}</p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="shadow-lg hover:bg-red-600"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" /> Çıkış
            </Button>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex border-b bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("dashboard")}
            data-testid="tab-dashboard"
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "dashboard" 
                ? "border-primary text-primary bg-blue-50/50" 
                : "border-transparent text-muted-foreground hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" /> Panel
          </button>
          <button
            onClick={() => setActiveTab("performance")}
            data-testid="tab-performance"
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "performance" 
                ? "border-primary text-primary bg-blue-50/50" 
                : "border-transparent text-muted-foreground hover:bg-slate-50"
            }`}
          >
            <Activity className="h-4 w-4 mr-2" /> Performans
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            data-testid="tab-chat"
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === "chat" 
                ? "border-primary text-primary bg-blue-50/50" 
                : "border-transparent text-muted-foreground hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Sohbet
          </button>
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 bg-slate-50/30 overflow-y-auto">
          {activeTab === "dashboard" && <DashboardHome user={user} />}
          {activeTab === "performance" && <PerformanceView user={user} />}
          {activeTab === "chat" && <ChatInterface user={user} />}
        </main>
      </div>
    </div>
  );
}
