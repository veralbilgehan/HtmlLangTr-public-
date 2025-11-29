import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Activity, MessageSquare, Settings, Users, Building2 } from "lucide-react";
import DashboardHome from "@/components/DashboardHome";
import PerformanceView from "@/components/PerformanceView";
import ChatInterface from "@/components/ChatInterface";
import UserManagement from "@/components/UserManagement";
import CompanyManagement from "@/components/CompanyManagement";
import ActivitySettings from "@/components/ActivitySettings";
import { getCurrentUser, getCurrentCompany, logout, type User, type Company } from "@/lib/auth";

type TabType = "dashboard" | "performance" | "chat" | "users" | "settings" | "companies";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentCompany = getCurrentCompany();
    if (!currentUser) {
      setLocation("/");
      return;
    }
    setUser(currentUser);
    setCompany(currentCompany);
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'manager': return 'Yönetici';
      case 'employee': return 'Çalışan';
      default: return role;
    }
  };

  const isSuperAdmin = user.role === 'super_admin';
  const isManager = user.role === 'manager' || isSuperAdmin;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden min-h-[85vh] flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-company-name">
              {company?.name || (isSuperAdmin ? "Sistem Yönetimi" : "Şirket Portalı")}
            </h1>
            <p className="text-primary-foreground/80 text-sm" data-testid="text-welcome">
              {user.fullName} - {getRoleLabel(user.role)}
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
                <p className="text-xs opacity-80" data-testid="text-department">{user.department || getRoleLabel(user.role)}</p>
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
        <nav className="flex border-b bg-white sticky top-0 z-10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            data-testid="tab-dashboard"
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
            className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "chat" 
                ? "border-primary text-primary bg-blue-50/50" 
                : "border-transparent text-muted-foreground hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Sohbet
          </button>
          
          {/* Manager/Admin tabs */}
          {isManager && (
            <button
              onClick={() => setActiveTab("users")}
              data-testid="tab-users"
              className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "users" 
                  ? "border-primary text-primary bg-blue-50/50" 
                  : "border-transparent text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <Users className="h-4 w-4 mr-2" /> Kullanıcılar
            </button>
          )}
          
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("companies")}
              data-testid="tab-companies"
              className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "companies" 
                  ? "border-primary text-primary bg-blue-50/50" 
                  : "border-transparent text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <Building2 className="h-4 w-4 mr-2" /> Şirketler
            </button>
          )}
          
          {isManager && (
            <button
              onClick={() => setActiveTab("settings")}
              data-testid="tab-settings"
              className={`flex items-center px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "settings" 
                  ? "border-primary text-primary bg-blue-50/50" 
                  : "border-transparent text-muted-foreground hover:bg-slate-50"
              }`}
            >
              <Settings className="h-4 w-4 mr-2" /> Ayarlar
            </button>
          )}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 bg-slate-50/30 overflow-y-auto">
          {activeTab === "dashboard" && <DashboardHome user={user} />}
          {activeTab === "performance" && <PerformanceView user={user} />}
          {activeTab === "chat" && <ChatInterface user={user} />}
          {activeTab === "users" && isManager && <UserManagement user={user} />}
          {activeTab === "companies" && isSuperAdmin && <CompanyManagement user={user} />}
          {activeTab === "settings" && isManager && <ActivitySettings user={user} />}
        </main>
      </div>
    </div>
  );
}
