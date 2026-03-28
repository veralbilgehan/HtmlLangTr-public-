import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/auth";

interface PerformanceViewProps {
  user: User;
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

export default function PerformanceView({ user }: PerformanceViewProps) {
  const { toast } = useToast();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    fetchActiveShift();
  }, []);

  const fetchActiveShift = async () => {
    try {
      const response = await fetch("/api/shifts/active", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
      }
    } catch (error) {
      console.error("Error fetching active shift:", error);
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
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        (error) => {
          let message = "Konum alınamadı";
          switch (error.code) {
            case error.PERMISSION_DENIED: message = "Konum izni reddedildi"; break;
            case error.POSITION_UNAVAILABLE: message = "Konum bilgisi mevcut değil"; break;
            case error.TIMEOUT: message = "Konum isteği zaman aşımına uğradı"; break;
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
        body: JSON.stringify({ latitude: location.latitude, longitude: location.longitude }),
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        toast({ title: "Mesai Başladı", description: `Konum: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` });
      } else {
        const error = await response.json();
        toast({ title: "Hata", description: error.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Mesai başlatılamadı", variant: "destructive" });
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
        body: JSON.stringify({ latitude: location.latitude, longitude: location.longitude }),
      });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        fetchActiveShift();
        toast({ title: "Mesai Bitti", description: `Konum: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` });
      } else {
        const error = await response.json();
        toast({ title: "Hata", description: error.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Mesai bitirilemedi", variant: "destructive" });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return "Konum yok";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs} saat ${mins} dakika`;
  };

  return (
    <div className="space-y-4">
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Konum Alınıyor...</>
              ) : activeShift && !activeShift.endTime ? (
                <><Square className="mr-2 h-4 w-4" />Mesai Bitir</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />Mesai Başlat</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
