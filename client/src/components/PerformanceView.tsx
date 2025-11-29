
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

export default function PerformanceView() {
  const { toast } = useToast();
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftDuration, setShiftDuration] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<{
    type: string;
    startTime: string;
  } | null>(null);
  const [activities, setActivities] = useState<Array<{
    id: number;
    type: string;
    startTime: string;
    endTime: string;
    duration: string;
    points: number;
  }>>([]);
  
  const [selectedActivityType, setSelectedActivityType] = useState("");
  const [durations, setDurations] = useState({
    customer: "",
    phone: "",
    vehicle: "",
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isShiftActive) {
      interval = setInterval(() => {
        setShiftDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isShiftActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const handleStartShift = () => {
    setIsShiftActive(true);
    setShiftDuration(0);
    toast({
      title: "Vardiya Başladı",
      description: "Çalışma süreniz kayıt altına alınıyor.",
    });
  };

  const handleEndShift = () => {
    setIsShiftActive(false);
    toast({
      title: "Vardiya Bitti",
      description: `Toplam çalışma süresi: ${formatTime(shiftDuration)}`,
    });
  };

  const handleStartActivity = () => {
    if (!selectedActivityType) {
      toast({
        title: "Hata",
        description: "Lütfen bir aktivite tipi seçin",
        variant: "destructive",
      });
      return;
    }

    const startTime = getCurrentTime();
    setCurrentActivity({
      type: selectedActivityType,
      startTime,
    });

    toast({
      title: "Aktivite Başladı",
      description: `${selectedActivityType} - Başlangıç: ${startTime}`,
    });
  };

  const handleEndActivity = () => {
    if (!currentActivity) return;

    const endTime = getCurrentTime();
    const newActivity = {
      id: Date.now(),
      type: currentActivity.type,
      startTime: currentActivity.startTime,
      endTime: endTime,
      duration: "Hesaplanıyor...",
      points: Math.floor(Math.random() * 50) + 20,
    };

    setActivities([newActivity, ...activities]);
    setCurrentActivity(null);
    setSelectedActivityType("");

    toast({
      title: "Aktivite Tamamlandı",
      description: `${currentActivity.type} - Bitiş: ${endTime}`,
    });
  };

  const saveDurations = () => {
    toast({
      title: "Süreler Kaydedildi",
      description: "Aktivite süreleri başarıyla güncellendi.",
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
              <h3 className="text-lg font-semibold">
                {isShiftActive ? "Vardiya Aktif" : "Vardiya Dışı"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Toplam Süre: {formatTime(shiftDuration)}
              </p>
            </div>
            <Button
              onClick={isShiftActive ? handleEndShift : handleStartShift}
              variant={isShiftActive ? "destructive" : "default"}
              size="lg"
            >
              {isShiftActive ? (
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
                    value={selectedActivityType} 
                    onValueChange={setSelectedActivityType}
                    disabled={currentActivity !== null}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Müşteri yüz yüze görüşme">Müşteri yüz yüze görüşme</SelectItem>
                      <SelectItem value="Müşteri telefonla görüşme">Müşteri telefonla görüşme</SelectItem>
                      <SelectItem value="Araç teslimatı">Araç teslimatı</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {currentActivity && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">{currentActivity.type}</span>
                      </div>
                      <Badge variant="secondary">Devam Ediyor</Badge>
                    </div>
                    <p className="text-sm text-blue-700">
                      Başlangıç Saati: {currentActivity.startTime}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleStartActivity}
                    disabled={!isShiftActive || currentActivity !== null || !selectedActivityType}
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Başlat
                  </Button>
                  <Button
                    onClick={handleEndActivity}
                    disabled={currentActivity === null}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Bitir
                  </Button>
                </div>
              </div>

              {/* Activities List */}
              <div className="space-y-2">
                <Label>Tamamlanan Aktiviteler</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz tamamlanmış aktivite yok
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{activity.type}</h4>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Başlangıç: {activity.startTime}</span>
                              <span>Bitiş: {activity.endTime}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            +{activity.points} P
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Durations - Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aktivite Süreleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Müşteri görüşme süresi (dk)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={durations.customer}
                    onChange={(e) => setDurations({...durations, customer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Telefon görüşme süresi (dk)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={durations.phone}
                    onChange={(e) => setDurations({...durations, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Araç teslimat süresi (dk)</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={durations.vehicle}
                    onChange={(e) => setDurations({...durations, vehicle: e.target.value})}
                  />
                </div>

                <Button onClick={saveDurations} className="w-full">
                  Süreleri Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
