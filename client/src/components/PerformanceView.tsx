import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  startLatitude: number | null;
  startLongitude: number | null;
  endLatitude: number | null;
  endLongitude: number | null;
}

const ACTIVITY_TYPES = [
  { key: "customer", label: "Müşteri Görüşmesi" },
  { key: "phone", label: "Telefon Görüşmesi" },
  { key: "vehicle", label: "Araç Teslimatı" },
  { key: "other", label: "Diğer" },
];

export default function PerformanceView({ user }: PerformanceViewProps) {
  const { toast } = useToast();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftDuration, setShiftDuration] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [currentActivityKey, setCurrentActivityKey] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [durations, setDurations] = useState({
    customer: "",
    phone: "",
    vehicle: "",
    other: "",
  });

  useEffect(() => {
    fetchActiveShift();
    fetchActivities();
    fetchActiveActivity();
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
        if (data.activity) {
          setCurrentActivity(data.activity);
          // Find the matching activity key
          const matchingType = ACTIVITY_TYPES.find(t => t.label === data.activity.type);
          setCurrentActivityKey(matchingType?.key || null);
        }
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

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Konum servisi desteklenmiyor"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Konum alınamadı";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Konum izni reddedildi";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Konum bilgisi mevcut değil";
              break;
            case error.TIMEOUT:
              message = "Konum isteği zaman aşımına uğradı";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleStartShift = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getLocation();
      
      const response = await fetch("/api/shifts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        setShiftDuration(0);
        toast({
          title: "Mesai Başladı",
          description: `Konum: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesai başlatılamadı",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleEndShift = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getLocation();
      
      const response = await fetch("/api/shifts/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveShift(null);
        toast({
          title: "Mesai Bitti",
          description: `Süre: ${formatTime(data.shift.durationSeconds)} - Konum: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Hata",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesai bitirilemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleStartActivity = async (activityKey: string, activityLabel: string) => {
    if (currentActivity) {
      toast({
        title: "Uyarı",
        description: "Önce mevcut aktiviteyi bitirmelisiniz",
        variant: "destructive",
      });
      return;
    }

    setLoadingActivity(activityKey);
    try {
      const response = await fetch("/api/activities/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: activityLabel,
          shiftId: activeShift?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentActivity(data.activity);
        setCurrentActivityKey(activityKey);
        await fetchActivities();
        toast({
          title: "Aktivite Başladı",
          description: `${activityLabel} kaydediliyor`,
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
    } finally {
      setLoadingActivity(null);
    }
  };

  const handleEndActivity = async (activityKey: string, activityLabel: string) => {
    if (!currentActivity) {
      toast({
        title: "Uyarı",
        description: `Önce ${activityLabel} aktivitesini başlatmalısınız`,
        variant: "destructive",
      });
      return;
    }

    if (currentActivityKey !== activityKey) {
      toast({
        title: "Uyarı",
        description: `Şu anda aktif olan aktivite: ${currentActivity.type}`,
        variant: "destructive",
      });
      return;
    }

    setLoadingActivity(activityKey);
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
        const durationMinutes = data.activity.durationMinutes || 0;
        
        setDurations(prev => ({
          ...prev,
          [activityKey]: durationMinutes.toString(),
        }));

        setCurrentActivity(null);
        setCurrentActivityKey(null);
        await fetchActivities();
        await fetchActiveActivity();

        toast({
          title: "Aktivite Tamamlandı",
          description: `${activityLabel} - Süre: ${durationMinutes} dakika`,
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
    } finally {
      setLoadingActivity(null);
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

  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return "Konum yok";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Shift Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Mesai Kontrolü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" data-testid="text-shift-status">
                {activeShift && !activeShift.endTime ? "Mesai Aktif" : "Mesai Dışı"}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-shift-duration">
                Toplam Süre: {formatTime(shiftDuration)}
              </p>
              {activeShift && activeShift.startLatitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  Başlangıç: {formatCoordinates(activeShift.startLatitude, activeShift.startLongitude)}
                </p>
              )}
            </div>
            <Button
              onClick={activeShift && !activeShift.endTime ? handleEndShift : handleStartShift}
              variant={activeShift && !activeShift.endTime ? "destructive" : "default"}
              size="lg"
              disabled={isLoadingLocation}
              data-testid={activeShift && !activeShift.endTime ? "button-end-shift" : "button-start-shift"}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Konum Alınıyor...
                </>
              ) : activeShift && !activeShift.endTime ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  Mesai Bitir
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Mesai Başlat
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
              {currentActivity && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    Aktif: {currentActivity.type}
                  </p>
                  <p className="text-xs text-blue-700">
                    Başlangıç: {formatDate(currentActivity.startTime)}
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Activities Column */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-primary border-b pb-2 text-sm">Başlat Aktiviteleri</h3>
                  {ACTIVITY_TYPES.map((activity) => (
                    <div key={`start-${activity.key}`} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium truncate flex-1 min-w-0">{activity.label}</span>
                      <Button
                        onClick={() => handleStartActivity(activity.key, activity.label)}
                        disabled={loadingActivity === activity.key || currentActivity !== null}
                        size="sm"
                        className="shrink-0 text-xs px-2 py-1 h-7"
                        data-testid={`button-start-${activity.key}`}
                      >
                        {loadingActivity === activity.key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : currentActivityKey === activity.key ? (
                          <span className="text-xs">Aktif</span>
                        ) : (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Başlat
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* End Activities Column */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-destructive border-b pb-2 text-sm">Bitiş Aktiviteleri</h3>
                  {ACTIVITY_TYPES.map((activity) => (
                    <div key={`end-${activity.key}`} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                      <span className="text-xs font-medium truncate flex-1 min-w-0">{activity.label}</span>
                      <Button
                        onClick={() => handleEndActivity(activity.key, activity.label)}
                        disabled={loadingActivity === activity.key || currentActivityKey !== activity.key}
                        variant={currentActivityKey === activity.key ? "destructive" : "outline"}
                        size="sm"
                        className="shrink-0 text-xs px-2 py-1 h-7"
                        data-testid={`button-end-${activity.key}`}
                      >
                        {loadingActivity === activity.key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Square className="mr-1 h-3 w-3" />
                            Bitir
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration Inputs */}
              <div className="border-t mt-4 pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Aktivite Süreleri (Dakika)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVITY_TYPES.map((activity) => (
                    <div key={`duration-${activity.key}`} className="space-y-1">
                      <Label htmlFor={`${activity.key}-duration`} className="text-xs truncate block">{activity.label}</Label>
                      <Input
                        id={`${activity.key}-duration`}
                        data-testid={`input-duration-${activity.key}`}
                        type="number"
                        placeholder="0"
                        className="bg-white h-8 text-sm"
                        value={durations[activity.key as keyof typeof durations]}
                        onChange={(e) => setDurations({ ...durations, [activity.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={saveDurations} className="w-full h-8 text-sm" data-testid="button-save-durations">
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
                    <Badge variant={activity.endTime ? "secondary" : "default"}>
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
                  <span className="text-muted-foreground">Mesai Süresi</span>
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
