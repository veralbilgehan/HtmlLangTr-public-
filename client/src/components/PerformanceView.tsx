import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Pause, Plus, Trash2, Clock } from "lucide-react";
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
  const [activities, setActivities] = useState([
    { id: 1, type: "Kod Yazma", desc: "Frontend Login Modülü", duration: "01:20:00", points: 80 },
    { id: 2, type: "Toplantı", desc: "Günlük Standup", duration: "00:15:00", points: 15 },
  ]);
  
  const [newActivity, setNewActivity] = useState({ type: "", desc: "" });

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
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [durations, setDurations] = useState({
    customer: "",
    phone: "",
    vehicle: ""
  });

  const calculateTotal = () => {
    const parseMinutes = (str: string) => {
      const num = parseInt(str) || 0;
      return num;
    };
    return parseMinutes(durations.customer) + parseMinutes(durations.phone) + parseMinutes(durations.vehicle);
  };

  const formatTotal = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}s ${m}dk`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Shift Control - Left Column */}
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Mesai Kontrolü</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-6 rounded-lg text-center mb-6 border border-slate-100">
              <div className="text-sm text-muted-foreground mb-1">Geçen Süre</div>
              <div className="text-4xl font-mono font-bold text-primary tracking-wider">
                {formatTime(shiftDuration)}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge variant={isShiftActive ? "default" : "secondary"} className={isShiftActive ? "bg-green-500" : ""}>
                  {isShiftActive ? "AKTİF" : "BEKLEMEDE"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                disabled={true}
                className="bg-green-600 hover:bg-green-700 text-white opacity-50 cursor-not-allowed"
              >
                <Play className="mr-2 h-4 w-4" /> Başlat
              </Button>
              <Button 
                disabled={true}
                variant="destructive"
                className="opacity-50 cursor-not-allowed"
              >
                <Square className="mr-2 h-4 w-4 fill-current" /> Bitir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Günlük Hedef</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Performans Puanı</span>
                  <span className="font-bold text-primary">95/100</span>
                </div>
                <Progress value={95} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mesai Süresi</span>
                  <span className="font-bold text-primary">6s / 8s</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log - Right Column (Spans 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivite Yönetimi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Aktivite Başlat</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musteri_cezasi">Müşteri cezası</SelectItem>
                    <SelectItem value="gorusme_araclari">Görüşme araçları</SelectItem>
                    <SelectItem value="telefonla_gorusme">Telefonla görüşme</SelectItem>
                    <SelectItem value="arac_teslimati">Araç teslimatı</SelectItem>
                    <SelectItem value="diger">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Aktivite Bitir</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="musteri_gorusmesi_bitir">Müşteri görüşmesi bitir</SelectItem>
                    <SelectItem value="musteri_telefon_gorusmesi_bitir">Müşteri telefon görüşmesi bitir</SelectItem>
                    <SelectItem value="arac_teslimati_bitir">Araç teslimatı bitir</SelectItem>
                    <SelectItem value="diger_bitir">Diğer bitir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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

              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Genel Toplam</span>
                  <span className="font-bold text-xl text-primary">{formatTotal(calculateTotal())}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1">Performans Süresi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-2 rounded border shadow-sm">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{activity.type}</h4>
                      <p className="text-sm text-muted-foreground">{activity.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="font-mono text-sm font-medium">{activity.duration}</div>
                      <div className="text-xs text-green-600 font-bold">+{activity.points} Puan</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz aktivite girişi yapılmadı.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
