import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
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

interface ActivityType {
  id: string;
  name: string;
  category: string;
  points: number;
  companyId: string | null;
  isDefault: boolean;
}

export default function PerformanceView({ user }: PerformanceViewProps) {
  const { toast } = useToast();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadingActivityName, setLoadingActivityName] = useState<string | null>(null);
  const [durations, setDurations] = useState<Record<string, string>>({});

  const { data: activityTypesData, isLoading: isLoadingTypes, error: typesError } = useQuery<{ activityTypes: ActivityType[] }>({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const response = await fetch("/api/activity-types", { credentials: "include" });
      if (!response.ok) throw new Error("Aktivite türleri yüklenemedi");
      return response.json();
    },
  });

  const activityTypes = activityTypesData?.activityTypes || [];

  useEffect(() => {
    if (typesError) {
      toast({
        title: "Hata",
        description: "Aktivite türleri yüklenemedi",
        variant: "destructive",
      });
    }
  }, [typesError]);

  useEffect(() => {
    if (activityTypes.length > 0) {
      const initialDurations: Record<string, string> = {};
      activityTypes.forEach(at => {
        initialDurations[at.name] = "";
      });
      setDurations(prev => ({ ...initialDurations, ...prev }));
    }
  }, [activityTypes]);

  useEffect(() => {
    fetchActiveShift();
    fetchActivities();
    fetchActiveActivity();
  }, []);


  const fetchActiveShift = async () => {
    try {
      const response = await fetch("/api/shifts/active", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
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
        } else {
          setCurrentActivity(null);
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
        setActiveShift(data.shift);
        fetchActiveShift();
        toast({
          title: "Mesai Bitti",
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
        description: error.message || "Mesai bitirilemedi",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleStartActivity = async (activityName: string) => {
    if (currentActivity) {
      toast({
        title: "Uyarı",
        description: "Önce mevcut aktiviteyi bitirmelisiniz",
        variant: "destructive",
      });
      return;
    }

    setLoadingActivityName(activityName);
    try {
      const response = await fetch("/api/activities/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: activityName,
          shiftId: activeShift?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentActivity(data.activity);
        await fetchActivities();
        toast({
          title: "Aktivite Başladı",
          description: `${activityName} kaydediliyor`,
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
      setLoadingActivityName(null);
    }
  };

  const handleEndActivity = async (activityName: string) => {
    if (!currentActivity) {
      toast({
        title: "Uyarı",
        description: `Önce ${activityName} aktivitesini başlatmalısınız`,
        variant: "destructive",
      });
      return;
    }

    if (currentActivity.type !== activityName) {
      toast({
        title: "Uyarı",
        description: `Şu anda aktif olan aktivite: ${currentActivity.type}`,
        variant: "destructive",
      });
      return;
    }

    setLoadingActivityName(activityName);
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
          [activityName]: durationMinutes.toString(),
        }));

        setCurrentActivity(null);
        await fetchActivities();
        await fetchActiveActivity();

        toast({
          title: "Aktivite Tamamlandı",
          description: `${activityName} - Süre: ${durationMinutes} dakika`,
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
      setLoadingActivityName(null);
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'activity': return 'Aktivite';
      case 'sales': return 'Satış';
      default: return category;
    }
  };

  const isCurrentActivityType = (activityName: string) => {
    return currentActivity?.type === activityName;
  };

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
    return `${hrs} saat ${mins} dakika`;
  };

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Shift Controls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mesai Kontrolü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant={activeShift && !activeShift.endTime ? "default" : "secondary"} data-testid="text-shift-status">
                {activeShift && !activeShift.endTime ? "Mesai Aktif" : "Mesai Dışı"}
              </Badge>
              
              {activeShift && (
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Başlangıç: {formatTimeOnly(activeShift.startTime)}</span>
                  </div>
                  {activeShift.startLatitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[180px]">{formatCoordinates(activeShift.startLatitude, activeShift.startLongitude)}</span>
                    </div>
                  )}
                  {activeShift.endTime && (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Bitiş: {formatTimeOnly(activeShift.endTime)}</span>
                      </div>
                      {activeShift.durationSeconds && (
                        <div className="font-medium text-primary">
                          Süre: {formatDuration(activeShift.durationSeconds)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={activeShift && !activeShift.endTime ? handleEndShift : handleStartShift}
              variant={activeShift && !activeShift.endTime ? "destructive" : "default"}
              size="default"
              className="w-full sm:w-auto text-sm"
              disabled={isLoadingLocation}
              data-testid={activeShift && !activeShift.endTime ? "button-end-shift" : "button-start-shift"}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Konum Alınıyor...
                </>
              ) : activeShift && !activeShift.endTime ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Mesai Bitir
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Mesai Başlat
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Current Activity Status */}
        {currentActivity && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-blue-900">
              Aktif: {currentActivity.type}
            </p>
            <p className="text-xs text-blue-700">
              Başlangıç: {formatDate(currentActivity.startTime)}
            </p>
          </div>
        )}

        {/* Activity Management - 2 Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Müşteri İşlemleri */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Müşteri İşlemleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTypes ? (
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : (
                activityTypes
                  .filter(at => at.category === 'activity' || at.category === 'other')
                  .map((activityType) => (
                    <div key={activityType.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{activityType.name}</span>
                        <span className="text-xs text-muted-foreground">{activityType.points} puan</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleStartActivity(activityType.name)}
                          disabled={loadingActivityName === activityType.name || currentActivity !== null}
                          size="sm"
                          className="flex-1 sm:flex-none text-xs px-3 h-8"
                          data-testid={`button-start-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {loadingActivityName === activityType.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isCurrentActivityType(activityType.name) ? (
                            <span className="text-xs">Aktif</span>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Başlat
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleEndActivity(activityType.name)}
                          disabled={loadingActivityName === activityType.name || !isCurrentActivityType(activityType.name)}
                          variant={isCurrentActivityType(activityType.name) ? "destructive" : "outline"}
                          size="sm"
                          className="flex-1 sm:flex-none text-xs px-3 h-8"
                          data-testid={`button-end-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {loadingActivityName === activityType.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Square className="mr-1 h-3 w-3" />
                              Bitir
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>

          {/* Section 2: Satışlar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Satışlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingTypes ? (
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                </div>
              ) : (
                activityTypes
                  .filter(at => at.category === 'sales')
                  .map((activityType) => (
                    <div key={activityType.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-green-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">{activityType.name}</span>
                        <span className="text-xs text-green-700">{activityType.points} puan</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => handleStartActivity(activityType.name)}
                          disabled={loadingActivityName === activityType.name || currentActivity !== null}
                          size="sm"
                          className="flex-1 sm:flex-none text-xs px-3 h-8 bg-green-600 hover:bg-green-700"
                          data-testid={`button-start-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {loadingActivityName === activityType.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isCurrentActivityType(activityType.name) ? (
                            <span className="text-xs">Aktif</span>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              Başlat
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleEndActivity(activityType.name)}
                          disabled={loadingActivityName === activityType.name || !isCurrentActivityType(activityType.name)}
                          variant={isCurrentActivityType(activityType.name) ? "destructive" : "outline"}
                          size="sm"
                          className="flex-1 sm:flex-none text-xs px-3 h-8"
                          data-testid={`button-end-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {loadingActivityName === activityType.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Square className="mr-1 h-3 w-3" />
                              Bitir
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activities.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{activity.type}</p>
                    <Badge variant={activity.endTime ? "secondary" : "default"} className="text-xs">
                      {activity.durationMinutes ? `${activity.durationMinutes} dk` : "Devam"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>Başlangıç: {formatTimeOnly(activity.startTime)}</span>
                    {activity.endTime && (
                      <span>Bitiş: {formatTimeOnly(activity.endTime)}</span>
                    )}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  Henüz aktivite kaydı yok
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Measurement - Bottom */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Günlük Performans Ölçümü</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-semibold">Aktivite Türü</th>
                  <th className="text-center p-3 font-semibold">Kategori</th>
                  <th className="text-center p-3 font-semibold">Adet</th>
                  <th className="text-center p-3 font-semibold">Puan</th>
                  <th className="text-center p-3 font-semibold">Toplam Puan</th>
                </tr>
              </thead>
              <tbody>
                {activityTypes.map((activityType) => {
                  const count = activities.filter(
                    (a) => a.type === activityType.name && a.endTime
                  ).length;
                  const totalPoints = count * activityType.points;
                  return (
                    <tr key={activityType.id} className="border-b hover:bg-slate-50">
                      <td className="p-3" data-testid={`perf-label-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        {activityType.name}
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="outline" className={
                          activityType.category === 'sales' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }>
                          {getCategoryLabel(activityType.category)}
                        </Badge>
                      </td>
                      <td className="text-center p-3" data-testid={`perf-count-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        {count}
                      </td>
                      <td className="text-center p-3 text-muted-foreground" data-testid={`perf-points-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        {activityType.points}
                      </td>
                      <td className="text-center p-3 font-semibold text-primary" data-testid={`perf-total-${activityType.name.replace(/\s+/g, '-').toLowerCase()}`}>
                        {totalPoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary/10 font-bold">
                  <td className="p-3" colSpan={4}>Günlük Toplam Performans</td>
                  <td className="text-center p-3 text-primary text-lg" data-testid="perf-grand-total">
                    {activityTypes.reduce((total, activityType) => {
                      const count = activities.filter(
                        (a) => a.type === activityType.name && a.endTime
                      ).length;
                      return total + count * activityType.points;
                    }, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
