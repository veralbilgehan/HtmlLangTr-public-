import { useLocation } from "wouter";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, Activity, MessageSquare } from "lucide-react";
import DashboardHome from "@/components/DashboardHome";
import PerformanceView from "@/components/PerformanceView";
import ChatInterface from "@/components/ChatInterface";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "performance" | "chat">("dashboard");

  const handleLogout = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden min-h-[85vh] flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Şirket Portalı</h1>
            <p className="text-primary-foreground/80 text-sm">Hoşgeldiniz, Ahmet Yılmaz</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <Avatar className="h-8 w-8 border-2 border-white/20">
                <AvatarFallback className="bg-white text-primary font-bold">AY</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium leading-none">Ahmet Yılmaz</p>
                <p className="text-xs opacity-80">Departman Müdürü</p>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="shadow-lg hover:bg-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" /> Çıkış
            </Button>
          </div>
        </header>

        {/* Navigation */}
        <nav className="flex border-b bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("dashboard")}
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
          {activeTab === "dashboard" && <DashboardHome />}
          {activeTab === "performance" && <PerformanceView />}
          {activeTab === "chat" && <ChatInterface />}
        </main>
      </div>
    </div>
  );
}
