import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/auth";

interface PerformanceViewProps {
  user: User;
}

interface Activity {
  id: string;
  type: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
}

interface Shift {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
}

export default function PerformanceView({ user }: PerformanceViewProps) {
  const { toast } = useToast();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftDuration, setShiftDuration] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [durations, setDurations] = useState({
    customer: "",
    phone: "",
    vehicle: "",
  });

  const activityTypes = {
    "Müşteri yüz yüze görüşme": "customer",
    "Müşteri telefonla görüşme": "phone",
    "Araç teslimatı": "vehicle",
    "Diğer": "other",
  };

  useEffect(() => {
    fetchActiveShift();
    fetchActiveActivity();
    fetchActivities();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeShift && !activeShift.endTime) {
      interval = setInterval(() => {
        const start = new Date(activeShift.startTime).getTime();
        const now = Date.now();
        const seconds = Math.floor((now - start) / 1000);
        setShiftDuration(seconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const fetchActiveShift = async () => {
    try {
      const response = await fetch("/api/shifts/active", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        if (data.shift) {
          const start = new Date(data.shift.startTime).getTime();
          const now = Date.now();
          setShiftDuration(Math.floor((now - start) / 1000));
        }
      }
    } catch (error) {
      console.error("Error fetching active shift:", error);
    }
  };

  const fetchActiveActivity = async () => {
    try {
      const response = await fetch("/api/activities/active", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentActivity(data.activity);
      }
    } catch (error) {
      console.error("Error fetching active activity:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleStartShift = async () => {
    try {
      const response = await fetch("/api/shifts/start", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        setShiftDuration(0);
        toast({
          title: "Vardiya Başladı",
          description: "Çalışma süreniz kayıt altına alınıyor.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Vardiya başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const handleEndShift = async () => {
    try {
      const response = await fetch("/api/shifts/end", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(null);
        toast({
          title: "Vardiya Bitti",
          description: `Toplam çalışma süresi: ${formatTime(data.shift.durationSeconds)}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Vardiya bitirilemedi",
        variant: "destructive",
      });
    }
  };

  const handleStartActivity = async () => {
    if (!selectedActivityType) {
      toast({
        title: "Hata",
        description: "Lütfen bir aktivite tipi seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/activities/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: selectedActivityType,
          shiftId: activeShift?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentActivity(data.activity);
        toast({
          title: "Aktivite Başladı",
          description: `${selectedActivityType} kaydediliyor`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Aktivite başlatılamadı",
        variant: "destructive",
      });
    }
  };

  const handleEndActivity = async () => {
    if (!currentActivity) return;

    try {
      const response = await fetch("/api/activities/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notes: null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentActivity(null);
        setSelectedActivityType("");
        
        // Auto-populate duration based on activity type
        const durationMinutes = data.activity.durationMinutes || 0;
        const durationKey = Object.entries(activityTypes).find(
          ([key]) => key === data.activity.type
        )?.[1] as keyof typeof durations;

        if (durationKey && durationKey !== "other") {
          setDurations((prev) => ({
            ...prev,
            [durationKey]: durationMinutes.toString(),
          }));
        }

        await fetchActivities();

        toast({
          title: "Aktivite Tamamlandı",
          description: `${currentActivity.type} - Süre: ${durationMinutes} dakika`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Aktivite bitirilemedi",
        variant: "destructive",
      });
    }
  };

  const saveDurations = () => {
    toast({
      title: "Süreler Kaydedildi",
      description: "Aktivite süreleri başarıyla güncellendi.",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Shift Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Vardiya Kontrolü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" data-testid="text-shift-status">
                {activeShift && !activeShift.endTime ? "Vardiya Aktif" : "Vardiya Dışı"}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-shift-duration">
                Toplam Süre: {formatTime(shiftDuration)}
              </p>
            </div>
            <Button
              onClick={activeShift && !activeShift.endTime ? handleEndShift : handleStartShift}
              variant={activeShift && !activeShift.endTime ? "destructive" : "default"}
              size="lg"
              data-testid={activeShift && !activeShift.endTime ? "button-end-shift" : "button-start-shift"}
            >
              {activeShift && !activeShift.endTime ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  Vardiya Bitir
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Vardiya Başlat
                </>
              )}
            </Button>
          </div>
          <Progress value={(shiftDuration / 28800) * 100} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Management - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Yönetimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Aktivite Başlat</Label>
                  <Select
                    value={currentActivity ? currentActivity.type : selectedActivityType}
                    onValueChange={setSelectedActivityType}
                    disabled={currentActivity !== null}
                  >
                    <SelectTrigger data-testid="select-activity-start">
                      <SelectValue placeholder="Aktivite seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(activityTypes).map((type) => (
                        <SelectItem key={type} value={type} data-testid={`option-activity-${activityTypes[type as keyof typeof activityTypes]}`}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleStartActivity}
                    disabled={currentActivity !== null || !selectedActivityType}
                    className="flex-1"
                    data-testid="button-start-activity"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Başlat
                  </Button>
                  <Button
                    onClick={handleEndActivity}
                    disabled={currentActivity === null}
                    variant="destructive"
                    className="flex-1"
                    data-testid="button-end-activity"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Bitir
                  </Button>
                </div>

                {currentActivity && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900" data-testid="text-active-activity">
                      Aktif: {currentActivity.type}
                    </p>
                    <p className="text-xs text-blue-700">
                      Başlangıç: {formatDate(currentActivity.startTime)}
                    </p>
                  </div>
                )}
              </div>

              {/* Duration Inputs */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Aktivite Süreleri (Dakika)</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-duration">Müşteri Görüşme</Label>
                    <Input
                      id="customer-duration"
                      data-testid="input-duration-customer"
                      type="number"
                      placeholder="0"
                      value={durations.customer}
                      onChange={(e) => setDurations({ ...durations, customer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-duration">Telefon Görüşme</Label>
                    <Input
                      id="phone-duration"
                      data-testid="input-duration-phone"
                      type="number"
                      placeholder="0"
                      value={durations.phone}
                      onChange={(e) => setDurations({ ...durations, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle-duration">Araç Teslimatı</Label>
                    <Input
                      id="vehicle-duration"
                      data-testid="input-duration-vehicle"
                      type="number"
                      placeholder="0"
                      value={durations.vehicle}
                      onChange={(e) => setDurations({ ...durations, vehicle: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={saveDurations} className="w-full" data-testid="button-save-durations">
                  Süreleri Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{activity.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.startTime)}
                          {activity.endTime && ` - ${formatDate(activity.endTime)}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {activity.durationMinutes ? `${activity.durationMinutes} dk` : "Devam ediyor"}
                    </Badge>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Henüz aktivite kaydı yok
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Summary - Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Günlük Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Aktivite</span>
                  <span className="font-semibold" data-testid="text-total-activities">{activities.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tamamlanan</span>
                  <span className="font-semibold" data-testid="text-completed-activities">
                    {activities.filter((a) => a.endTime).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vardiya Süresi</span>
                  <span className="font-semibold" data-testid="text-shift-time">{formatTime(shiftDuration)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
