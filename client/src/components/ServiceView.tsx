import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  Clock, 
  Truck, 
  Clock3, 
  FileText, 
  Car,
  CheckCircle,
  AlertCircle,
  Archive,
  Paperclip,
  X,
  File,
  Download,
  Loader2
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface ServiceViewProps {
  user: UserType;
}

interface ServiceRecord {
  id: string;
  userId: string;
  companyId: string | null;
  serviceName: string;
  plate: string;
  startTime: string;
  estimatedDurationMinutes: number;
  endTime: string | null;
  actualDurationMinutes: number | null;
  differenceMinutes: number | null;
  userFullName?: string;
  userDepartment?: string;
}

const DEFAULT_SERVICES = [
  "Kombi Montajı",
  "Kombi Bakımı",
  "Klima Montajı",
  "Klima Bakımı",
  "Fırın Montajı",
  "Fırın Bakımı/Tamiri",
  "Genel Servis Hizmeti"
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

export default function ServiceView({ user }: ServiceViewProps) {
  const { toast } = useToast();
  const [activeService, setActiveService] = useState<ServiceRecord | null>(null);
  const [servicesHistory, setServicesHistory] = useState<ServiceRecord[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isArchivingReport, setIsArchivingReport] = useState(false);

  const handleArchiveServiceReport = async () => {
    setIsArchivingReport(true);
    try {
      const res = await fetch("/api/companies/archive-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportType: "service",
          dateFilter: "all"
        })
      });

      if (res.ok) {
        toast({ title: "Başarılı", description: "Servis raporu şirketin yerel arşivine kaydedildi." });
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Rapor arşivlenemedi", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Hata", description: "Bağlantı hatası", variant: "destructive" });
    } finally {
      setIsArchivingReport(false);
    }
  };

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ fileUrl: string; fileName: string; fileSize: number; fileType: string; } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Hata", description: "Dosya boyutu 10MB sınırını aşamaz", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    setIsUploadingFile(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setFileDetails({
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType
        });
        toast({ title: "Başarılı", description: "Dosya yüklendi." });
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Dosya yüklenemedi", variant: "destructive" });
        setSelectedFile(null);
      }
    } catch (err) {
      toast({ title: "Hata", description: "Sunucu bağlantı hatası", variant: "destructive" });
      setSelectedFile(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Form states
  const [selectedService, setSelectedService] = useState<string>("");
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [plate, setPlate] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState<string>("");

  // Live timer states
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isManager = user.role === "manager" || user.role === "super_admin";

  useEffect(() => {
    fetchActiveService();
    fetchServicesHistory();
    fetchServiceTypes();
    return () => stopTimer();
  }, []);

  // Timer effect when activeService changes
  useEffect(() => {
    if (activeService && !activeService.endTime) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [activeService]);

  const startTimer = () => {
    stopTimer();
    const startTime = new Date(activeService!.startTime).getTime();
    
    const updateTimer = () => {
      const diffMs = Date.now() - startTime;
      const totalSec = Math.floor(diffMs / 1000);
      setElapsedMinutes(Math.floor(totalSec / 60));
      setElapsedSeconds(totalSec % 60);
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMinutes(0);
    setElapsedSeconds(0);
  };

  const fetchServiceTypes = async () => {
    try {
      const res = await fetch("/api/activity-types", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const types = data.activityTypes || [];
        const services = types
          .filter((t: any) => t.category === "service")
          .map((t: any) => t.name);
        
        if (services.length > 0) {
          setServiceTypes(services);
        } else {
          setServiceTypes(DEFAULT_SERVICES);
        }
      } else {
        setServiceTypes(DEFAULT_SERVICES);
      }
    } catch (err) {
      console.error("Fetch service types error:", err);
      setServiceTypes(DEFAULT_SERVICES);
    }
  };

  const fetchActiveService = async () => {
    try {
      const res = await fetch("/api/services/active", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setActiveService(data.service);
      }
    } catch (err) {
      console.error("Fetch active service error:", err);
    }
  };

  const fetchServicesHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/services", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setServicesHistory(data.services || []);
      }
    } catch (err) {
      console.error("Fetch services history error:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleStartService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceName = selectedService === "Diğer / Özel Hizmet" 
      ? customServiceName.trim() 
      : selectedService;

    if (!serviceName) {
      toast({ title: "Hata", description: "Lütfen bir servis seçin veya belirtin", variant: "destructive" });
      return;
    }

    if (!plate.trim()) {
      toast({ title: "Hata", description: "Lütfen araç plakasını girin", variant: "destructive" });
      return;
    }

    const duration = customDuration !== "" 
      ? parseInt(customDuration, 10) 
      : estimatedDuration;

    if (isNaN(duration) || duration <= 0) {
      toast({ title: "Hata", description: "Lütfen geçerli bir tahmini süre belirleyin", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/services/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceName,
          plate: plate.trim().toUpperCase(),
          estimatedDurationMinutes: duration,
          fileUrl: fileDetails?.fileUrl || null,
          fileName: fileDetails?.fileName || null,
          fileSize: fileDetails?.fileSize || null,
          fileType: fileDetails?.fileType || null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveService(data.service);
        toast({ title: "Başarılı", description: "Servis hizmeti başlatıldı" });
        // Reset form
        setSelectedService("");
        setCustomServiceName("");
        setPlate("");
        setCustomDuration("");
        setEstimatedDuration(60);
        clearFile();
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Servis başlatılamadı", variant: "destructive" });
      }
    } catch (err) {
      console.error("Start service error:", err);
      toast({ title: "Hata", description: "Sunucu bağlantı hatası", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndService = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services/end", {
        method: "POST",
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Başarılı", description: "Servis hizmeti sonlandırıldı" });
        setActiveService(null);
        fetchServicesHistory();
      } else {
        const err = await res.json();
        toast({ title: "Hata", description: err.message || "Servis sonlandırılamadı", variant: "destructive" });
      }
    } catch (err) {
      console.error("End service error:", err);
      toast({ title: "Hata", description: "Sunucu bağlantı hatası", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper formatting functions
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getDifferenceBadge = (diff: number | null) => {
    if (diff === null) return <Badge variant="secondary">-</Badge>;
    if (diff === 0) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Zamanında</Badge>;
    if (diff > 0) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">+{diff} dk Erken</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{diff} dk Gecikme</Badge>;
  };

  // Calculate remaining time
  const remainingMinutes = activeService ? activeService.estimatedDurationMinutes - elapsedMinutes : 0;
  const isLate = remainingMinutes < 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Servis Takip Sistemi
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Teknisyenlerin saha servis sürelerini, araç plakalarını ve performansını anlık olarak izleyin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Controller Card */}
        <div className="lg:col-span-1 space-y-6">
          {activeService ? (
            /* Active Service Info Card */
            <Card className="border-2 border-primary/20 shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-50 to-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 animate-pulse pointer-events-none" />
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Aktif Servis Hizmeti
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="h-4 w-4" /> Servis Türü</span>
                    <span className="font-semibold text-slate-900">{activeService.serviceName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Car className="h-4 w-4" /> Araç Plakası</span>
                    <Badge variant="outline" className="font-mono text-sm px-2.5 py-0.5 border-slate-300 bg-slate-50">
                      {activeService.plate}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" /> Başlangıç Saati</span>
                    <span className="font-medium text-slate-800">{formatTime(activeService.startTime)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> Tahmini Süre</span>
                    <span className="font-medium text-slate-800">{activeService.estimatedDurationMinutes} dk</span>
                  </div>
                </div>

                {/* Big Live Ticking Timer */}
                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900 text-white text-center shadow-inner relative overflow-hidden">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Geçen Süre</div>
                  <div className="text-4xl font-mono font-bold leading-none tabular-nums tracking-tight">
                    {String(elapsedMinutes).padStart(2, "0")}:{String(elapsedSeconds).padStart(2, "0")}
                  </div>
                  
                  {/* Estimated remaining time indicator */}
                  <div className="mt-3 pt-3 border-t border-slate-800 w-full flex justify-between items-center text-xs">
                    <span className="text-slate-400">Kalan Tahmini Süre:</span>
                    <span className={`font-semibold font-mono ${isLate ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                      {isLate 
                        ? `${Math.abs(remainingMinutes)} dk Gecikti` 
                        : `${remainingMinutes} dk`}
                    </span>
                  </div>
                </div>

                {/* End Service Button */}
                <Button 
                  onClick={handleEndService} 
                  disabled={isLoading}
                  className="w-full py-6 text-base font-semibold shadow-md bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center gap-2 rounded-xl transition-all"
                >
                  <Square className="h-5 w-5 fill-white" />
                  Servisi Bitir
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Start Service Form Card */
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Servis Başlat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStartService} className="space-y-4">
                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="service-select">Hizmet Seçimi</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger id="service-select">
                        <SelectValue placeholder="Servis hizmeti seçin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        <SelectItem value="Diğer / Özel Hizmet">Diğer / Özel Hizmet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Service Input */}
                  {selectedService === "Diğer / Özel Hizmet" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-service">Özel Hizmet Tanımı</Label>
                      <Input
                        id="custom-service"
                        placeholder="Hizmet detayını giriniz..."
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Plate Input */}
                  <div className="space-y-2">
                    <Label htmlFor="plate">Araç Plakası</Label>
                    <Input
                      id="plate"
                      placeholder="Örn: 34 ABC 123"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                      className="font-mono uppercase"
                      required
                    />
                  </div>

                  {/* Estimated Duration Presets */}
                  <div className="space-y-2">
                    <Label>Tahmini Süre (Dakika)</Label>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_PRESETS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setEstimatedDuration(d);
                            setCustomDuration("");
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                            estimatedDuration === d && customDuration === ""
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {d >= 60 ? `${d / 60} sa` : `${d} dk`}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCustomDuration("90")}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          customDuration !== ""
                            ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Özel
                      </button>
                    </div>
                  </div>

                  {/* Custom Duration Input */}
                  {customDuration !== "" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-duration">Özel Süre (Dakika)</Label>
                      <Input
                        id="custom-duration"
                        type="number"
                        min="1"
                        placeholder="Örn: 90"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* File Upload Field */}
                  <div className="space-y-2">
                    <Label htmlFor="service-file">Hizmet Görseli / Belge Ekle (Opsiyonel)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="service-file"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isUploadingFile}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        className="w-full gap-2 border-dashed border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        {isUploadingFile ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...</>
                        ) : (
                          <><Paperclip className="h-4 w-4" /> Belge / Fotoğraf Seç</>
                        )}
                      </Button>
                    </div>

                    {selectedFile && fileDetails && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                        <File className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="font-medium truncate flex-1">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={clearFile}
                          className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Start Button */}
                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-2 rounded-xl py-5 font-semibold"
                  >
                    <Play className="h-4 w-4" />
                    Servisi Başlat
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - History Table */}
        <div className="lg:col-span-2">
          <Card className="shadow-md h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600" />
                {isManager ? "Tüm Servis Kayıtları" : "Servis Geçmişim"}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isManager && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchiveServiceReport}
                    disabled={servicesHistory.length === 0 || isArchivingReport}
                    className="gap-1.5 text-xs border-slate-300 text-slate-700 hover:bg-slate-50 h-8"
                  >
                    <Archive className="h-3.5 w-3.5" /> Şirket Klasörüne Kaydet
                  </Button>
                )}
                <Badge variant="secondary" className="font-normal text-xs shrink-0">
                  Toplam: {servicesHistory.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isHistoryLoading ? (
                <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
              ) : servicesHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-8 w-8 text-slate-300" />
                  Henüz servis kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-y border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                      <tr>
                        {isManager && <th className="px-4 py-3">Personel</th>}
                        <th className="px-4 py-3">Servis Hizmeti</th>
                        <th className="px-4 py-3">Plaka</th>
                        <th className="px-4 py-3">Tarih / Saat</th>
                        <th className="px-4 py-3">Tahmini</th>
                        <th className="px-4 py-3">Bitiş</th>
                        <th className="px-4 py-3">Gerçek</th>
                        <th className="px-4 py-3">Performans</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {servicesHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          {isManager && (
                            <td className="px-4 py-3.5 font-medium text-slate-900">
                              <div className="flex flex-col">
                                <span>{s.userFullName}</span>
                                <span className="text-[10px] text-slate-400 font-normal">{s.userDepartment}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3.5 font-medium text-slate-800">
                            <div className="flex flex-col">
                              <span>{s.serviceName}</span>
                              {s.fileUrl && (
                                <a
                                  href={s.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold mt-1"
                                >
                                  <File className="h-3 w-3" /> {s.fileName || "Dosya"}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-500 uppercase text-xs">{s.plate}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDate(s.startTime)}</span>
                              <span>{formatTime(s.startTime)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">{s.estimatedDurationMinutes} dk</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">
                            {s.endTime ? formatTime(s.endTime) : <Badge variant="secondary" className="bg-amber-50 text-amber-800 text-[10px]">Devam ediyor</Badge>}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {s.actualDurationMinutes ? `${s.actualDurationMinutes} dk` : "-"}
                          </td>
                          <td className="px-4 py-3.5">
                            {getDifferenceBadge(s.differenceMinutes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
