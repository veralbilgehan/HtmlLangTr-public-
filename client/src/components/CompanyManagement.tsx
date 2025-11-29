import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import { type User } from "@/lib/auth";

interface Company {
  id: string;
  name: string;
  createdAt: string | null;
}

interface CompanyManagementProps {
  user: User;
}

export default function CompanyManagement({ user }: CompanyManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
  });
  const queryClient = useQueryClient();

  const { data: companiesData, isLoading } = useQuery<{ companies: Company[] }>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies", { credentials: "include" });
      if (!response.ok) throw new Error("Şirketler yüklenemedi");
      return response.json();
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: typeof newCompany) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Şirket oluşturulamadı");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsDialogOpen(false);
      setNewCompany({ name: "" });
    },
  });

  const handleCreateCompany = () => {
    if (!newCompany.name) {
      alert("Lütfen şirket adını girin");
      return;
    }
    createCompanyMutation.mutate(newCompany);
  };

  const companies = companiesData?.companies || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Şirket Yönetimi
          </h2>
          <p className="text-muted-foreground mt-1">
            Sistemdeki şirketleri görüntüleyin ve yönetin
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-company" className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Şirket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Şirket Ekle</DialogTitle>
              <DialogDescription>
                Yeni bir şirket oluşturmak için bilgileri doldurun.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Şirket Adı *</Label>
                <Input
                  id="companyName"
                  data-testid="input-company-name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="ABC Otomotiv"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCompany}
                disabled={createCompanyMutation.isPending}
                data-testid="button-submit-company"
              >
                {createCompanyMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Şirket Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz şirket bulunmuyor</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Şirket Adı</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      {company.createdAt 
                        ? new Date(company.createdAt).toLocaleDateString('tr-TR')
                        : "-"
                      }
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
