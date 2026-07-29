import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import type { RolePermission } from "@shared/schema";

const PERMISSION_ROWS = [
  { key: "manageAllSites", label: "Tüm Siteleri / Şirketleri Yönetme" },
  { key: "defineGlobalPermissions", label: "Sistem Genelinde Yetki Tanımlama" },
  { key: "viewRepositories", label: "Depoları Çekme / Görüntüleme" },
  { key: "viewReports", label: "Raporlara Bakma / Analiz" },
  { key: "viewShifts", label: "Mesaileri İnceleme" },
  { key: "editShiftHours", label: "Mesai Saatlerini Değiştirme / Düzenleme" },
  { key: "addPersonnel", label: "Yeni Kişi Ekleme (Personel Alımı)" },
  { key: "removePersonnel", label: "Kişi Çıkarma (İşten Ayrılış)" },
  { key: "editPersonnel", label: "Personel Bilgilerinde Düzeltme Yapma" },
  { key: "chatInCompany", label: "Şirket İçi Sohbet Etme (Chat)" },
  { key: "manageOwnShifts", label: "Mesai Başlatma ve Bitirme" },
];

const ROLES = [
  { id: "super_admin", label: "Süper Admin" },
  { id: "manager", label: "Şirket Yöneticisi" },
  { id: "employee", label: "Kullanıcı (Personel)" },
];

export default function RoleMatrix() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    super_admin: {},
    manager: {},
    employee: {}
  });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/permissions");
      if (!res.ok) throw new Error("Yetkiler alınamadı");
      const data: RolePermission[] = await res.json();
      
      const newPerms = {
        super_admin: {} as Record<string, boolean>,
        manager: {} as Record<string, boolean>,
        employee: {} as Record<string, boolean>
      };

      data.forEach(p => {
        if (newPerms[p.role as keyof typeof newPerms]) {
          newPerms[p.role as keyof typeof newPerms] = {
            manageAllSites: p.manageAllSites,
            defineGlobalPermissions: p.defineGlobalPermissions,
            viewRepositories: p.viewRepositories,
            viewReports: p.viewReports,
            viewShifts: p.viewShifts,
            editShiftHours: p.editShiftHours,
            addPersonnel: p.addPersonnel,
            removePersonnel: p.removePersonnel,
            editPersonnel: p.editPersonnel,
            chatInCompany: p.chatInCompany,
            manageOwnShifts: p.manageOwnShifts,
          };
        }
      });

      setPermissions(newPerms);
    } catch (error) {
      console.error(error);
      toast({ title: "Hata", description: "Yetki matrisi yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: string, key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: checked
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const role of ROLES) {
        const rolePerms = permissions[role.id];
        const res = await fetch(`/api/permissions/${role.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rolePerms),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Kaydedilemedi");
        }
      }
      toast({ title: "Başarılı", description: "Yetki matrisi güncellendi." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Hata", description: error.message || "Yetkiler kaydedilemedi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card className="w-full border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <CardTitle className="text-lg font-semibold text-slate-800">
          Rol ve Yetki Matrisi
        </CardTitle>
        <Button onClick={handleSave} disabled={saving} size="sm" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Değişiklikleri Kaydet
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">Yetki Alanı</TableHead>
                {ROLES.map(role => (
                  <TableHead key={role.id} className="text-center font-semibold text-slate-700">
                    {role.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSION_ROWS.map(row => (
                <TableRow key={row.key} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-600">
                    {row.label}
                  </TableCell>
                  {ROLES.map(role => (
                    <TableCell key={`${role.id}-${row.key}`} className="text-center">
                      <Checkbox
                        checked={!!permissions[role.id]?.[row.key]}
                        onCheckedChange={(checked) => handleToggle(role.id, row.key, checked as boolean)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
