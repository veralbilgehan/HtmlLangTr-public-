import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Clock, Bell, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type User } from "@/lib/auth";

interface CompanySettings {
  id: string;
  companyId: string;
  shiftStartTime: string;
  shiftEndTime: string;
  lateThresholdMinutes: number;
  lateWarning1: string;
  lateWarning2: string;
  lateWarning3: string;
}

interface ActivitySettingsProps {
  user: User;
}

export default function ActivitySettings({ user }: ActivitySettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    shiftStartTime: "09:00",
    shiftEndTime: "18:00",
    lateThresholdMinutes: 15,
    lateWarning1: "Mesai saatinde işyerinde olmadığınızdan kanuna ilişkin mazeretinizi bildiriniz.",
    lateWarning2: "Mesai başlangıç saatini geçmenize rağmen mesainizi başlatmadınız. Lütfen durumu yöneticinize bildirin.",
    lateWarning3: "Devamsızlık tutanağı düzenlenecektir. En kısa sürede işyerinizde bulununuz.",
  });

  const { data, isLoading } = useQuery<{ settings: CompanySettings | null }>({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const response = await fetch("/api/company/settings", { credentials: "include" });
      if (!response.ok) throw new Error("Ayarlar yüklenemedi");
      return response.json();
    },
  });

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setForm({
        shiftStartTime: s.shiftStartTime,
        shiftEndTime: s.shiftEndTime,
        lateThresholdMinutes: s.lateThresholdMinutes,
        lateWarning1: s.lateWarning1,
        lateWarning2: s.lateWarning2,
        lateWarning3: s.lateWarning3,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (formData: typeof form) => {
      const response = await fetch("/api/company/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Ayarlar kaydedilemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast({ title: "Kaydedildi", description: "Mesai ayarları başarıyla güncellendi." });
    },
    onError: (err: Error) => {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.shiftStartTime || !form.shiftEndTime) {
      toast({ title: "Hata", description: "Mesai saatlerini doldurun", variant: "destructive" });
      return;
    }
    if (!form.lateWarning1 || !form.lateWarning2 || !form.lateWarning3) {
      toast({ title: "Hata", description: "Tüm uyarı metinlerini doldurun", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Mesai Ayarları
        </h2>
        <p className="text-muted-foreground mt-1">
          Şirketinizin mesai saatlerini ve geç kalma uyarılarını yapılandırın.
        </p>
      </div>

      {/* Shift Times */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Mesai Saatleri
          </CardTitle>
          <CardDescription>Çalışanların mesai başlangıç ve bitiş saatlerini belirleyin.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shiftStart">Mesai Başlangıcı</Label>
            <Input
              id="shiftStart"
              type="time"
              data-testid="input-shift-start"
              value={form.shiftStartTime}
              onChange={(e) => setForm({ ...form, shiftStartTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shiftEnd">Mesai Bitişi</Label>
            <Input
              id="shiftEnd"
              type="time"
              data-testid="input-shift-end"
              value={form.shiftEndTime}
              onChange={(e) => setForm({ ...form, shiftEndTime: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Late Warning Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Geç Kalma Uyarısı
          </CardTitle>
          <CardDescription>
            Mesai başlangıcından kaç dakika sonra uyarı gönderilsin? Her uyarı bu süre aralığıyla tekrar gönderilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="threshold">Uyarı Aralığı (dakika)</Label>
          <Input
            id="threshold"
            type="number"
            min={1}
            max={120}
            data-testid="input-late-threshold"
            value={form.lateThresholdMinutes}
            onChange={(e) => setForm({ ...form, lateThresholdMinutes: parseInt(e.target.value) || 15 })}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground pt-1">
            Örn: 15 dakika ayarlandıysa — 1. uyarı mesai başlangıcı + 15 dk, 2. uyarı + 30 dk, 3. uyarı + 45 dk sonra gönderilir.
          </p>
        </CardContent>
      </Card>

      {/* Warning Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            Otomatik Uyarı Mesajları
          </CardTitle>
          <CardDescription>
            Mesaiye geç kalan çalışanlara otomatik olarak gönderilecek 3 uyarı metnini belirleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warning1" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">1</span>
              1. Uyarı Metni
            </Label>
            <Textarea
              id="warning1"
              data-testid="textarea-warning1"
              value={form.lateWarning1}
              onChange={(e) => setForm({ ...form, lateWarning1: e.target.value })}
              rows={2}
              placeholder="1. uyarı mesajını girin..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warning2" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">2</span>
              2. Uyarı Metni
            </Label>
            <Textarea
              id="warning2"
              data-testid="textarea-warning2"
              value={form.lateWarning2}
              onChange={(e) => setForm({ ...form, lateWarning2: e.target.value })}
              rows={2}
              placeholder="2. uyarı mesajını girin..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warning3" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold">3</span>
              3. Uyarı Metni
            </Label>
            <Textarea
              id="warning3"
              data-testid="textarea-warning3"
              value={form.lateWarning3}
              onChange={(e) => setForm({ ...form, lateWarning3: e.target.value })}
              rows={2}
              placeholder="3. uyarı mesajını girin..."
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full sm:w-auto gap-2"
        data-testid="button-save-settings"
      >
        {saveMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Kaydediliyor...</>
        ) : (
          <><Save className="h-4 w-4" />Ayarları Kaydet</>
        )}
      </Button>
    </div>
  );
}
