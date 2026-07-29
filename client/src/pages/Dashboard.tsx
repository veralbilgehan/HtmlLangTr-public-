import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Activity, MessageSquare, Settings, Users, Building2, Menu, BarChart2, Truck, Home } from "lucide-react";
import PerformanceView from "@/components/PerformanceView";
import ChatInterface from "@/components/ChatInterface";
import UserManagement from "@/components/UserManagement";
import CompanyManagement from "@/components/CompanyManagement";
import ActivitySettings from "@/components/ActivitySettings";
import Reports from "@/components/Reports";
import ServiceView from "@/components/ServiceView";
import { getCurrentUser, getCurrentCompany, logout, type User, type Company } from "@/lib/auth";

type TabType = "home" | "performance" | "chat" | "users" | "settings" | "companies" | "reports" | "services";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("home");
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
    <div className="h-screen bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-primary text-primary-foreground px-3 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          {/* Sol: Şirket adı + Kullanıcı yan yana */}
          <div className="flex items-center gap-3 md:gap-5 min-w-0">
            {/* Kullanıcı bilgisi */}
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 md:h-9 md:w-9 border-2 border-white/30 shrink-0">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.fullName} /> : null}
                <AvatarFallback className="bg-white text-primary font-bold text-xs">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-xs md:text-sm leading-tight truncate" data-testid="text-fullname">{user.fullName}</p>
                <p className="text-[10px] md:text-xs opacity-75 truncate" data-testid="text-department">
                  {user.department ? `${user.department} · ` : ""}{getRoleLabel(user.role)}
                </p>
              </div>
            </div>
          </div>

          {/* Sağ üst: Logo */}
          <img
            src="/bigchat-logo.jpg"
            alt="BIGChat Logo"
            className="h-8 md:h-10 w-auto rounded object-contain bg-white px-1"
          />
        </header>

        {/* Navigation - Hamburger Menu */}
        <nav className="flex bg-white sticky top-0 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="hamburger-menu"
                className="flex items-center px-6 py-4 font-medium transition-colors hover:bg-slate-50"
              >
                <Menu className="h-5 w-5 mr-2" />
                Menü
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white shadow-lg border border-gray-200">
              <DropdownMenuItem 
                onClick={() => setActiveTab("home")}
                data-testid="menu-home"
                className={activeTab === "home" ? "bg-blue-50 text-primary" : ""}
              >
                <Home className="h-4 w-4 mr-2" /> Ana Sayfa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveTab("performance")}
                data-testid="menu-performance"
                className={activeTab === "performance" ? "bg-blue-50 text-primary" : ""}
              >
                <Activity className="h-4 w-4 mr-2" /> Mesaim
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveTab("chat")}
                data-testid="menu-chat"
                className={activeTab === "chat" ? "bg-blue-50 text-primary" : ""}
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Sohbet
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("reports")}
                data-testid="menu-reports"
                className={activeTab === "reports" ? "bg-blue-50 text-primary" : ""}
              >
                <BarChart2 className="h-4 w-4 mr-2" /> Raporlar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("services")}
                data-testid="menu-services"
                className={activeTab === "services" ? "bg-blue-50 text-primary" : ""}
              >
                <Truck className="h-4 w-4 mr-2" /> Servis Takibi
              </DropdownMenuItem>

              {/* Manager/Admin Options */}
              {isManager && (
                <>
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("users")}
                    data-testid="menu-users"
                    className={activeTab === "users" ? "bg-blue-50 text-primary" : ""}
                  >
                    <Users className="h-4 w-4 mr-2" /> Kullanıcılar
                  </DropdownMenuItem>
                  {isSuperAdmin && (
                    <DropdownMenuItem 
                      onClick={() => setActiveTab("companies")}
                      data-testid="menu-companies"
                      className={activeTab === "companies" ? "bg-blue-50 text-primary" : ""}
                    >
                      <Building2 className="h-4 w-4 mr-2" /> Şirketler
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setActiveTab("settings")}
                    data-testid="menu-settings"
                    className={activeTab === "settings" ? "bg-blue-50 text-primary" : ""}
                  >
                    <Settings className="h-4 w-4 mr-2" /> Ayarlar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                data-testid="button-logout"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" /> Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Current page indicator */}
          <div className="flex items-center px-4 py-4 text-sm text-muted-foreground">
            {activeTab === "home" && <><Home className="h-4 w-4 mr-2 text-primary" /> Ana Sayfa</>}
            {activeTab === "performance" && <><Activity className="h-4 w-4 mr-2 text-primary" /> Mesaim</>}
            {activeTab === "chat" && <><MessageSquare className="h-4 w-4 mr-2 text-primary" /> Sohbet</>}
            {activeTab === "reports" && <><BarChart2 className="h-4 w-4 mr-2 text-primary" /> Raporlar</>}
            {activeTab === "services" && <><Truck className="h-4 w-4 mr-2 text-primary" /> Servis Takibi</>}
            {activeTab === "users" && <><Users className="h-4 w-4 mr-2 text-primary" /> Kullanıcılar</>}
            {activeTab === "companies" && <><Building2 className="h-4 w-4 mr-2 text-primary" /> Şirketler</>}
            {activeTab === "settings" && <><Settings className="h-4 w-4 mr-2 text-primary" /> Ayarlar</>}
          </div>
        </nav>

        {/* Content */}
        <main className={activeTab === "chat" ? "flex-1 flex flex-col min-h-0 bg-white overflow-hidden" : "flex-1 p-6 bg-white overflow-y-auto"}>
          {activeTab === "home" && (
            <div className="max-w-md mx-auto w-full space-y-6 py-4 px-2">
              {/* User profile card at the top */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <CardContent className="p-6 flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/20 shrink-0">
                    {user.avatar ? <AvatarImage src={user.avatar} alt={user.fullName} /> : null}
                    <AvatarFallback className="bg-white text-primary font-bold text-lg">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold leading-tight truncate">{user.fullName}</h3>
                    <p className="text-sm opacity-80 mt-1 truncate">
                      {user.department ? `${user.department} · ` : ""}{getRoleLabel(user.role)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Grid of 3 square/card buttons */}
              <div className="grid grid-cols-3 gap-4">
                {/* 1. Sohbet */}
                <button
                  onClick={() => setActiveTab("chat")}
                  className="aspect-square flex flex-col items-center justify-center p-3 bg-white border border-slate-100 hover:border-blue-100 hover:bg-blue-50/10 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 duration-200 group text-slate-700"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Sohbet</span>
                </button>

                {/* 2. Servis */}
                <button
                  onClick={() => setActiveTab("services")}
                  className="aspect-square flex flex-col items-center justify-center p-3 bg-white border border-slate-100 hover:border-amber-100 hover:bg-amber-50/10 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 duration-200 group text-slate-700"
                >
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                    <Truck className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Servis</span>
                </button>

                {/* 3. Mesai */}
                <button
                  onClick={() => setActiveTab("performance")}
                  className="aspect-square flex flex-col items-center justify-center p-3 bg-white border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/10 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 duration-200 group text-slate-700"
                >
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-2 group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold">Mesai</span>
                </button>
              </div>
            </div>
          )}
          {activeTab === "performance" && <PerformanceView user={user} />}
          {activeTab === "chat" && <ChatInterface user={user} />}
          {activeTab === "reports" && <Reports user={user} />}
          {activeTab === "services" && <ServiceView user={user} />}
          {activeTab === "users" && isManager && <UserManagement user={user} />}
          {activeTab === "companies" && isSuperAdmin && <CompanyManagement user={user} />}
          {activeTab === "settings" && isManager && <ActivitySettings user={user} />}
        </main>
    </div>
  );
}
