export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string | null;
  avatar: string | null;
  companyId: string | null;
}

export interface AuthState {
  user: User;
  company: Company | null;
}

export async function login(username: string, password: string): Promise<AuthState> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Giriş başarısız");
  }

  const data = await response.json();
  localStorage.setItem("user", JSON.stringify(data.user));
  if (data.company) {
    localStorage.setItem("company", JSON.stringify(data.company));
  }
  return { user: data.user, company: data.company };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  localStorage.removeItem("user");
  localStorage.removeItem("company");
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

export function getCurrentCompany(): Company | null {
  const companyStr = localStorage.getItem("company");
  return companyStr ? JSON.parse(companyStr) : null;
}

export async function checkAuth(): Promise<AuthState | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      localStorage.removeItem("user");
      localStorage.removeItem("company");
      return null;
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.company) {
      localStorage.setItem("company", JSON.stringify(data.company));
    }
    return { user: data.user, company: data.company };
  } catch (error) {
    localStorage.removeItem("user");
    localStorage.removeItem("company");
    return null;
  }
}
