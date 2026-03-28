import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock, MapPin, Loader2, Navigation } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { User } from "@/lib/auth";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const liveIcon = L.divIcon({
  html: `<div style="
    width: 20px; height: 20px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function LiveMapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

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
  const [livePosition, setLivePosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchActiveShift();
  }, []);

  // Start watching position when shift is active
  useEffect(() => {
    const isActive = activeShift && !activeShift.endTime;

    if (isActive) {
      setLocationError(null);
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setLivePosition([pos.coords.latitude, pos.coords.longitude]);
            setLocationError(null);
          },
          (err) => {
            setLocationError("Konum alınamıyor: " + err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      }
    } else {
      // Stop watching when shift ends
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // If shift has start coords, show those on the ended map
      if (activeShift?.startLatitude && activeShift?.startLongitude) {
        setLivePosition([activeShift.startLatitude, activeShift.startLongitude]);
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeShift]);

  const fetchActiveShift = async () => {
    try {
      const response = await fetch("/api/shifts/active", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.shift);
        if (data.shift?.startLatitude && data.shift?.startLongitude) {
          setLivePosition([data.shift.startLatitude, data.shift.startLongitude]);
        }
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
        setLivePosition([location.latitude, location.longitude]);
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

  const isShiftActive = activeShift && !activeShift.endTime;

  return (
    <div className="space-y-4">
      {/* Shift Control Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mesai Kontrolü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge variant={isShiftActive ? "default" : "secondary"} data-testid="text-shift-status">
                {isShiftActive ? "Mesai Aktif" : "Mesai Dışı"}
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
              onClick={isShiftActive ? handleEndShift : handleStartShift}
              variant={isShiftActive ? "destructive" : "default"}
              size="default"
              className="w-full sm:w-auto text-sm"
              disabled={isLoadingLocation}
              data-testid={isShiftActive ? "button-end-shift" : "button-start-shift"}
            >
              {isLoadingLocation ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Konum Alınıyor...</>
              ) : isShiftActive ? (
                <><Square className="mr-2 h-4 w-4" />Mesai Bitir</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />Mesai Başlat</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Map */}
      {livePosition && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className={`h-4 w-4 ${isShiftActive ? "text-blue-600 animate-pulse" : "text-muted-foreground"}`} />
              {isShiftActive ? "Canlı Konum" : "Mesai Konumu"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            {locationError && (
              <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200">
                {locationError}
              </div>
            )}
            <div style={{ height: "300px", width: "100%" }}>
              <MapContainer
                center={livePosition}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={livePosition} icon={isShiftActive ? liveIcon : new L.Icon.Default()}>
                  <Popup>
                    {isShiftActive ? "Anlık konumunuz" : "Mesai başlangıç konumu"}
                    <br />
                    <span className="text-xs text-gray-500">
                      {livePosition[0].toFixed(6)}, {livePosition[1].toFixed(6)}
                    </span>
                  </Popup>
                </Marker>
                {isShiftActive && <LiveMapUpdater position={livePosition} />}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
