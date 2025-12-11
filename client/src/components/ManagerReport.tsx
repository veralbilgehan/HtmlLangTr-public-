import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock, MapPin, Download, Users, Activity, TrendingUp } from "lucide-react";
import type { User } from "@/lib/auth";

interface ManagerReportProps {
  user: User;
}

interface Employee {
  id: string;
  username: string;
  fullName: string;
  department: string | null;
  role: string;
}

interface Shift {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
}

interface ActivityRecord {
  id: string;
  userId: string;
  type: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
}

interface ActivityType {
  id: string;
  name: string;
  category: string;
  points: number;
}

export default function ManagerReport({ user }: ManagerReportProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");

  const { data: usersData } = useQuery<{ users: Employee[] }>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      if (!response.ok) throw new Error("Kullanıcılar yüklenemedi");
      return response.json();
    },
  });

  const { data: shiftsData } = useQuery<{ shifts: Shift[] }>({
    queryKey: ["all-shifts", selectedUserId, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedUserId !== "all") params.set("userId", selectedUserId);
      params.set("dateFilter", dateFilter);
      const response = await fetch(`/api/reports/shifts?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Mesai verileri yüklenemedi");
      return response.json();
    },
  });

  const { data: activitiesData } = useQuery<{ activities: ActivityRecord[] }>({
    queryKey: ["all-activities", selectedUserId, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedUserId !== "all") params.set("userId", selectedUserId);
      params.set("dateFilter", dateFilter);
      const response = await fetch(`/api/reports/activities?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Aktivite verileri yüklenemedi");
      return response.json();
    },
  });

  const { data: activityTypesData } = useQuery<{ activityTypes: ActivityType[] }>({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const response = await fetch("/api/activity-types", { credentials: "include" });
      if (!response.ok) throw new Error("Aktivite türleri yüklenemedi");
      return response.json();
    },
  });

  const employees = usersData?.users?.filter(u => u.role === "employee") || [];
  const shifts = shiftsData?.shifts || [];
  const activities = activitiesData?.activities || [];
  const activityTypes = activityTypesData?.activityTypes || [];

  const formatTimeOnly = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}s ${mins}dk`;
  };

  const formatDurationMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}s ${mins}dk`;
    }
    return `${mins}dk`;
  };

  const getEmployeeName = (userId: string) => {
    const emp = employees.find(e => e.id === userId);
    return emp?.fullName || "Bilinmiyor";
  };

  const getActivityStats = (userId: string | null) => {
    const userActivities = userId 
      ? activities.filter(a => a.userId === userId && a.endTime)
      : activities.filter(a => a.endTime);
    
    const stats: Record<string, { count: number; totalMinutes: number; points: number }> = {};
    
    activityTypes.forEach(at => {
      const matching = userActivities.filter(a => a.type === at.name);
      const totalMinutes = matching.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
      stats[at.name] = {
        count: matching.length,
        totalMinutes,
        points: matching.length * at.points,
      };
    });

    return stats;
  };

  const getTotalStats = () => {
    const stats = getActivityStats(selectedUserId === "all" ? null : selectedUserId);
    let totalCount = 0;
    let totalMinutes = 0;
    let totalPoints = 0;
    
    Object.values(stats).forEach(s => {
      totalCount += s.count;
      totalMinutes += s.totalMinutes;
      totalPoints += s.points;
    });
    
    return { totalCount, totalMinutes, totalPoints };
  };

  const totalStats = getTotalStats();
  const userShifts = selectedUserId === "all" 
    ? shifts 
    : shifts.filter(s => s.userId === selectedUserId);
  const totalShiftSeconds = userShifts.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-bold">Performans Raporu</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[180px]" data-testid="select-employee">
              <SelectValue placeholder="Çalışan Seç" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">Tüm Çalışanlar</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-date-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="today">Bugün</SelectItem>
              <SelectItem value="week">Bu Hafta</SelectItem>
              <SelectItem value="month">Bu Ay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Toplam Mesai</p>
                <p className="text-lg font-bold">{formatDuration(totalShiftSeconds)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Aktivite Sayısı</p>
                <p className="text-lg font-bold">{totalStats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Aktivite Süresi</p>
                <p className="text-lg font-bold">{formatDurationMinutes(totalStats.totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-xs text-muted-foreground">Toplam Puan</p>
                <p className="text-lg font-bold">{totalStats.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mesai Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Çalışan</th>
                  <th className="text-center p-2 font-medium">Başlangıç</th>
                  <th className="text-center p-2 font-medium">Bitiş</th>
                  <th className="text-center p-2 font-medium">Süre</th>
                  <th className="text-center p-2 font-medium">Konum</th>
                </tr>
              </thead>
              <tbody>
                {userShifts.slice(0, 10).map(shift => (
                  <tr key={shift.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{getEmployeeName(shift.userId)}</td>
                    <td className="text-center p-2">{formatTimeOnly(shift.startTime)}</td>
                    <td className="text-center p-2">
                      {shift.endTime ? formatTimeOnly(shift.endTime) : <Badge>Devam</Badge>}
                    </td>
                    <td className="text-center p-2">
                      {shift.durationSeconds ? formatDuration(shift.durationSeconds) : "-"}
                    </td>
                    <td className="text-center p-2">
                      {shift.startLatitude ? (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Var
                        </Badge>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
                {userShifts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-4 text-muted-foreground">
                      Mesai kaydı bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aktivite Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Aktivite Türü</th>
                  <th className="text-center p-2 font-medium">Kategori</th>
                  <th className="text-center p-2 font-medium">Adet</th>
                  <th className="text-center p-2 font-medium">Toplam Süre</th>
                  <th className="text-center p-2 font-medium">Birim Puan</th>
                  <th className="text-center p-2 font-medium">Toplam Puan</th>
                </tr>
              </thead>
              <tbody>
                {activityTypes.map(at => {
                  const stats = getActivityStats(selectedUserId === "all" ? null : selectedUserId);
                  const atStats = stats[at.name] || { count: 0, totalMinutes: 0, points: 0 };
                  return (
                    <tr key={at.id} className="border-b hover:bg-slate-50">
                      <td className="p-2">{at.name}</td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className={
                          at.category === 'sales' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }>
                          {at.category === 'sales' ? 'Satış' : 'Aktivite'}
                        </Badge>
                      </td>
                      <td className="text-center p-2 font-medium">{atStats.count}</td>
                      <td className="text-center p-2">{formatDurationMinutes(atStats.totalMinutes)}</td>
                      <td className="text-center p-2 text-muted-foreground">{at.points}</td>
                      <td className="text-center p-2 font-bold text-primary">{atStats.points}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="p-2">Toplam</td>
                  <td className="text-center p-2">{totalStats.totalCount}</td>
                  <td className="text-center p-2">{formatDurationMinutes(totalStats.totalMinutes)}</td>
                  <td className="text-center p-2">-</td>
                  <td className="text-center p-2 text-primary">{totalStats.totalPoints}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
