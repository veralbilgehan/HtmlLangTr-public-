import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, CheckCircle, AlertTriangle, Briefcase, TrendingUp } from "lucide-react";

export default function DashboardHome() {
  const stats = [
    { 
      title: "Toplam Puan", 
      value: "1,250", 
      icon: Activity, 
      color: "text-blue-500", 
      bg: "bg-blue-50",
      border: "border-blue-500" 
    },
    { 
      title: "Tamamlanan Görevler", 
      value: "45", 
      icon: CheckCircle, 
      color: "text-green-500", 
      bg: "bg-green-50",
      border: "border-green-500" 
    },
    { 
      title: "Bekleyen İşler", 
      value: "8", 
      icon: AlertTriangle, 
      color: "text-orange-500", 
      bg: "bg-orange-50",
      border: "border-orange-500" 
    },
    { 
      title: "Departman Sırası", 
      value: "#3", 
      icon: TrendingUp, 
      color: "text-purple-500", 
      bg: "bg-purple-50",
      border: "border-purple-500" 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`border-l-4 ${stat.border} shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Son Duyurular</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <h4 className="font-medium">Yıllık Performans Değerlendirmeleri</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      2025 yılı 1. çeyrek değerlendirmeleri başlamıştır. Lütfen formlarınızı doldurunuz.
                    </p>
                    <span className="text-xs text-muted-foreground mt-2 block">2 saat önce</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-4">Ayın Çalışanları</h3>
            <div className="space-y-4">
              {[
                { name: "Ayşe Demir", role: "İK Uzmanı", points: 2450 },
                { name: "Mehmet Kaya", role: "Yazılım", points: 2300 },
                { name: "Zeynep Çelik", role: "Tasarım", points: 2100 },
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.role}</div>
                    </div>
                  </div>
                  <div className="font-bold text-primary">{user.points} P</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
