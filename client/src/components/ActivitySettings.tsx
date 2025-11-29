import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Plus, Pencil } from "lucide-react";
import { type User } from "@/lib/auth";

interface ActivityType {
  id: string;
  name: string;
  category: string;
  points: number;
  companyId: string | null;
  isDefault: boolean;
}

interface ActivitySettingsProps {
  user: User;
}

export default function ActivitySettings({ user }: ActivitySettingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ActivityType | null>(null);
  const [newActivityType, setNewActivityType] = useState({
    name: "",
    category: "activity",
    points: 1,
    isDefault: false,
  });
  const queryClient = useQueryClient();
  const isSuperAdmin = user.role === 'super_admin';

  const { data: activityTypesData, isLoading } = useQuery<{ activityTypes: ActivityType[] }>({
    queryKey: ["activity-types"],
    queryFn: async () => {
      const response = await fetch("/api/activity-types", { credentials: "include" });
      if (!response.ok) throw new Error("Aktivite türleri yüklenemedi");
      return response.json();
    },
  });

  const createActivityTypeMutation = useMutation({
    mutationFn: async (typeData: typeof newActivityType) => {
      const response = await fetch("/api/activity-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeData),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Aktivite türü oluşturulamadı");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateActivityTypeMutation = useMutation({
    mutationFn: async ({ id, ...typeData }: { id: string } & Partial<typeof newActivityType>) => {
      const response = await fetch(`/api/activity-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeData),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Aktivite türü güncellenemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-types"] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setNewActivityType({
      name: "",
      category: "activity",
      points: 1,
      isDefault: false,
    });
    setEditingType(null);
  };

  const handleSubmit = () => {
    if (!newActivityType.name) {
      alert("Lütfen aktivite adını girin");
      return;
    }
    
    if (editingType) {
      updateActivityTypeMutation.mutate({
        id: editingType.id,
        name: newActivityType.name,
        category: newActivityType.category,
        points: newActivityType.points,
      });
    } else {
      createActivityTypeMutation.mutate(newActivityType);
    }
  };

  const handleEdit = (type: ActivityType) => {
    setEditingType(type);
    setNewActivityType({
      name: type.name,
      category: type.category,
      points: type.points,
      isDefault: type.isDefault,
    });
    setIsDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'activity': return 'Aktivite';
      case 'sales': return 'Satış';
      default: return category;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'activity': return 'bg-blue-100 text-blue-800';
      case 'sales': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activityTypes = activityTypesData?.activityTypes || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Puan Ayarları
          </h2>
          <p className="text-muted-foreground mt-1">
            Aktivite ve satış türlerinin puanlarını yönetin
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-activity-type" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Tür Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingType ? "Tür Düzenle" : "Yeni Tür Ekle"}</DialogTitle>
              <DialogDescription>
                {editingType ? "Aktivite/satış türünü düzenleyin." : "Yeni bir aktivite veya satış türü oluşturun."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="typeName">Tür Adı *</Label>
                <Input
                  id="typeName"
                  data-testid="input-type-name"
                  value={newActivityType.name}
                  onChange={(e) => setNewActivityType({ ...newActivityType, name: e.target.value })}
                  placeholder="Araç Satışı"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  value={newActivityType.category}
                  onValueChange={(value) => setNewActivityType({ ...newActivityType, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Aktivite</SelectItem>
                    <SelectItem value="sales">Satış</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="points">Puan Değeri *</Label>
                <Input
                  id="points"
                  type="number"
                  min={1}
                  data-testid="input-points"
                  value={newActivityType.points}
                  onChange={(e) => setNewActivityType({ ...newActivityType, points: parseInt(e.target.value) || 1 })}
                  placeholder="50"
                />
              </div>
              {isSuperAdmin && !editingType && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newActivityType.isDefault}
                    onChange={(e) => setNewActivityType({ ...newActivityType, isDefault: e.target.checked })}
                    className="h-4 w-4"
                    data-testid="checkbox-is-default"
                  />
                  <Label htmlFor="isDefault">Varsayılan Tür (tüm şirketlerde geçerli)</Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={createActivityTypeMutation.isPending || updateActivityTypeMutation.isPending}
                data-testid="button-submit-type"
              >
                {(createActivityTypeMutation.isPending || updateActivityTypeMutation.isPending) 
                  ? "Kaydediliyor..." 
                  : editingType ? "Güncelle" : "Ekle"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aktivite ve Satış Türleri</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : activityTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz tür bulunmuyor</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tür Adı</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Puan</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTypes.map((type) => (
                  <TableRow key={type.id} data-testid={`row-type-${type.id}`}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadgeColor(type.category)}>
                        {getCategoryLabel(type.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {type.points} puan
                    </TableCell>
                    <TableCell>
                      {type.isDefault ? (
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
                          Varsayılan
                        </Badge>
                      ) : (
                        <Badge variant="outline">Özel</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(type)}
                        data-testid={`button-edit-type-${type.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
