import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Users, TrendingUp, Download, FileText, FolderOpen, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface ReportsProps {
  user: User;
}

type DateFilter = "all" | "today" | "week" | "month";

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} dk`;
  return `${h} sa ${m} dk`;
}

function totalSeconds(shifts: any[]): number {
  return shifts.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
}

export default function Reports({ user }: ReportsProps) {
  const isManager = user.role === "manager" || user.role === "super_admin";
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);
  const [archives, setArchives] = useState<any[]>([]);
  const [isArchivesLoading, setIsArchivesLoading] = useState(false);

  const fetchArchives = async () => {
    setIsArchivesLoading(true);
    try {
      const res = await fetch("/api/companies/archives", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setArchives(data.archives || []);
      }
    } catch (err) {
      console.error("Fetch archives error:", err);
    } finally {
      setIsArchivesLoading(false);
    }
  };

  const handleArchiveReport = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch("/api/companies/archive-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportType: "shift",
          dateFilter
        })
      });

      if (res.ok) {
        toast({ title: "Başarılı", description: "Mesai raporu şirketin yerel arşivine kaydedildi." });
        fetchArchives();
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Rapor arşivlenemedi", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Hata", description: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteArchive = async (id: string) => {
    if (!window.confirm("Bu arşiv dosyasını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/companies/archives/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast({ title: "Başarılı", description: "Arşiv dosyası silindi." });
        fetchArchives();
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Dosya silinemedi", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Hata", description: "Bağlantı hatası", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchArchives();
    }
  }, []);
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/shifts", dateFilter, selectedUserId],
    queryFn: async () => {
      const params = new URLSearchParams({ dateFilter });
      if (isManager && selectedUserId !== "all") params.set("userId", selectedUserId);
      const res = await fetch(`/api/reports/shifts?${params}`);
      if (!res.ok) throw new Error("Rapor alınamadı");
      return res.json();
    },
  });

  const shifts: any[] = data?.shifts || [];
  const users: User[] = data?.users || [];

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const weeklyShifts = useMemo(
    () => shifts.filter(s => new Date(s.startTime) >= weekStart),
    [shifts, weekStart]
  );
  const monthlyShifts = useMemo(
    () => shifts.filter(s => new Date(s.startTime) >= monthStart),
    [shifts, monthStart]
  );

  const totalDailyToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return totalSeconds(shifts.filter(s => new Date(s.startTime) >= today));
  }, [shifts]);

  const exportCSV = () => {
    const headers = ["Kullanıcı Adı", "Departman", "Tarih", "Mesai Başlangıç", "Mesai Bitiş", "Çalışma Süresi"];
    const rows = shifts.map(s => [
      s.userFullName,
      s.userDepartment,
      format(new Date(s.startTime), "dd.MM.yyyy"),
      format(new Date(s.startTime), "HH:mm"),
      s.endTime ? format(new Date(s.endTime), "HH:mm") : "Devam ediyor",
      formatDuration(s.durationSeconds),
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mesai-raporu-${format(now, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const dateFilterLabel: Record<DateFilter, string> = {
    all: "Tüm Zamanlar",
    today: "Bugün",
    week: "Bu Hafta",
    month: "Bu Ay",
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Mesai Raporları
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isManager ? "Tüm çalışanların mesai kayıtları" : "Mesai kayıtlarınız"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={shifts.length === 0}
            data-testid="button-export-csv"
            className="gap-2"
          >
            <Download className="h-4 w-4" /> CSV İndir
          </Button>
          {isManager && (
            <Button
              variant="default"
              size="sm"
              onClick={handleArchiveReport}
              disabled={shifts.length === 0 || isArchiving}
              className="gap-2 bg-slate-800 text-white hover:bg-slate-700"
            >
              <Archive className="h-4 w-4" /> Şirket Klasörüne Kaydet
            </Button>
          )}
        </div>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Bugün</p>
            <p className="text-lg font-bold text-slate-800" data-testid="summary-today">
              {formatDuration(totalDailyToday)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Bu Hafta</p>
            <p className="text-lg font-bold text-slate-800" data-testid="summary-week">
              {formatDuration(totalSeconds(weeklyShifts))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Bu Ay</p>
            <p className="text-lg font-bold text-slate-800" data-testid="summary-month">
              {formatDuration(totalSeconds(monthlyShifts))}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Toplam Kayıt</p>
            <p className="text-lg font-bold text-slate-800" data-testid="summary-count">
              {shifts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
          <SelectTrigger className="w-40" data-testid="select-date-filter">
            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="week">Bu Hafta</SelectItem>
            <SelectItem value="month">Bu Ay</SelectItem>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
          </SelectContent>
        </Select>

        {isManager && (
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-48" data-testid="select-user-filter">
              <Users className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Çalışan seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Çalışanlar</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Badge variant="outline" className="h-9 px-3 flex items-center gap-1 text-slate-600">
          <TrendingUp className="h-3.5 w-3.5" />
          {dateFilterLabel[dateFilter]} — {shifts.length} kayıt
        </Badge>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-700">
            Mesai Detayları
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-spin" />
              Yükleniyor...
            </div>
          ) : shifts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Bu dönemde mesai kaydı bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                    {isManager && <th className="px-4 py-3 text-left font-semibold">Kullanıcı Adı</th>}
                    {isManager && <th className="px-4 py-3 text-left font-semibold">Departman</th>}
                    <th className="px-4 py-3 text-left font-semibold">Tarih</th>
                    <th className="px-4 py-3 text-left font-semibold">Mesai Başlangıç</th>
                    <th className="px-4 py-3 text-left font-semibold">Mesai Bitiş</th>
                    <th className="px-4 py-3 text-left font-semibold">Günlük Çalışma</th>
                    <th className="px-4 py-3 text-left font-semibold">Haftalık Toplam</th>
                    <th className="px-4 py-3 text-left font-semibold">Aylık Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts
                    .slice()
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .map((shift, idx) => {
                      const shiftDate = new Date(shift.startTime);
                      const shiftWeekStart = startOfWeek(shiftDate, { weekStartsOn: 1 });
                      const shiftMonthStart = startOfMonth(shiftDate);

                      const weekTotal = totalSeconds(
                        shifts.filter(s =>
                          s.userId === shift.userId &&
                          new Date(s.startTime) >= shiftWeekStart &&
                          new Date(s.startTime) <= shiftDate
                        )
                      );
                      const monthTotal = totalSeconds(
                        shifts.filter(s =>
                          s.userId === shift.userId &&
                          new Date(s.startTime) >= shiftMonthStart &&
                          new Date(s.startTime) <= shiftDate
                        )
                      );

                      const isActive = !shift.endTime;

                      return (
                        <tr
                          key={shift.id}
                          data-testid={`row-shift-${shift.id}`}
                          className={`border-b transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/30`}
                        >
                          {isManager && (
                            <td className="px-4 py-3 font-medium text-slate-800" data-testid={`text-username-${shift.id}`}>
                              {shift.userFullName}
                            </td>
                          )}
                          {isManager && (
                            <td className="px-4 py-3 text-slate-600" data-testid={`text-department-${shift.id}`}>
                              {shift.userDepartment !== "-" ? (
                                <Badge variant="secondary" className="text-xs">{shift.userDepartment}</Badge>
                              ) : "-"}
                            </td>
                          )}
                          <td className="px-4 py-3 text-slate-700" data-testid={`text-date-${shift.id}`}>
                            {format(shiftDate, "dd MMM yyyy", { locale: tr })}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium" data-testid={`text-start-${shift.id}`}>
                            {format(shiftDate, "HH:mm")}
                          </td>
                          <td className="px-4 py-3" data-testid={`text-end-${shift.id}`}>
                            {isActive ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                Devam ediyor
                              </Badge>
                            ) : (
                              <span className="text-slate-700 font-medium">
                                {format(new Date(shift.endTime), "HH:mm")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-primary" data-testid={`text-duration-${shift.id}`}>
                            {formatDuration(shift.durationSeconds)}
                          </td>
                          <td className="px-4 py-3 text-slate-600" data-testid={`text-week-${shift.id}`}>
                            {formatDuration(weekTotal)}
                          </td>
                          <td className="px-4 py-3 text-slate-600" data-testid={`text-month-${shift.id}`}>
                            {formatDuration(monthTotal)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Şirket Yerel Klasörü Arşivi (Only for Managers) */}
      {isManager && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Şirket Yerel Klasörü Arşivi
            </CardTitle>
            <CardDescription>
              Şirketinizin local klasöründe saklanan chat dosyaları, mesai raporları ve servis raporları.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isArchivesLoading ? (
              <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
            ) : archives.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Şirket klasörüne henüz hiçbir dosya veya rapor kaydedilmemiş.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 font-semibold">Dosya Adı</th>
                      <th className="px-4 py-3 font-semibold">Dosya Türü</th>
                      <th className="px-4 py-3 font-semibold">Boyut</th>
                      <th className="px-4 py-3 font-semibold">Kayıt Tarihi</th>
                      <th className="px-4 py-3 font-semibold">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archives.map((file) => (
                      <tr key={file.id} className="border-b hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {file.fileName}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {file.fileType === "chat_attachment" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Chat Dosyası</Badge>
                          )}
                          {file.fileType === "shift_report" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Mesai Raporu</Badge>
                          )}
                          {file.fileType === "service_report" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Servis Raporu</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {file.createdAt ? format(new Date(file.createdAt), "dd.MM.yyyy HH:mm") : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={file.filePath}
                              download={file.fileName}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              <Download className="h-3.5 w-3.5" /> İndir
                            </a>
                            <button
                              onClick={() => handleDeleteArchive(file.id)}
                              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold ml-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
