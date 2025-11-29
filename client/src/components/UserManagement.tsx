import { useState, useEffect } from "react";
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
import { Plus, Users, UserPlus } from "lucide-react";
import { type User } from "@/lib/auth";

interface CompanyUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string | null;
  avatar: string | null;
  companyId: string | null;
}

interface Company {
  id: string;
  name: string;
}

interface UserManagementProps {
  user: User;
}

export default function UserManagement({ user }: UserManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "employee",
    department: "",
    companyId: "",
  });
  const queryClient = useQueryClient();
  const isSuperAdmin = user.role === 'super_admin';

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: CompanyUser[] }>({
    queryKey: ["company-users"],
    queryFn: async () => {
      const response = await fetch("/api/company/users", { credentials: "include" });
      if (!response.ok) throw new Error("Kullanıcılar yüklenemedi");
      return response.json();
    },
  });

  const { data: companiesData } = useQuery<{ companies: Company[] }>({
    queryKey: ["companies"],
    queryFn: async () => {
      const response = await fetch("/api/companies", { credentials: "include" });
      if (!response.ok) return { companies: [] };
      return response.json();
    },
    enabled: isSuperAdmin,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await fetch("/api/company/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kullanıcı oluşturulamadı");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      setIsDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        fullName: "",
        role: "employee",
        department: "",
        companyId: "",
      });
    },
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      alert("Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Süper Admin';
      case 'manager': return 'Yönetici';
      case 'employee': return 'Çalışan';
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const users = usersData?.users || [];
  const companies = companiesData?.companies || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Kullanıcı Yönetimi
          </h2>
          <p className="text-muted-foreground mt-1">
            {isSuperAdmin ? "Tüm şirketlerdeki kullanıcıları yönetin" : "Şirketinizdeki kullanıcıları yönetin"}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
              <DialogDescription>
                Yeni bir kullanıcı oluşturmak için bilgileri doldurun.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Kullanıcı Adı *</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="kullanici123"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Şifre *</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Ad Soyad *</Label>
                <Input
                  id="fullName"
                  data-testid="input-fullname"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Departman</Label>
                <Input
                  id="department"
                  data-testid="input-department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Satış"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Rol seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Çalışan</SelectItem>
                    <SelectItem value="manager">Yönetici</SelectItem>
                    {isSuperAdmin && <SelectItem value="super_admin">Süper Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && (
                <div className="grid gap-2">
                  <Label htmlFor="company">Şirket</Label>
                  <Select
                    value={newUser.companyId}
                    onValueChange={(value) => setNewUser({ ...newUser, companyId: value })}
                  >
                    <SelectTrigger data-testid="select-company">
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                data-testid="button-submit-user"
              >
                {createUserMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz kullanıcı bulunmuyor</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departman</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(u.role)}>
                        {getRoleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.department || "-"}</TableCell>
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
