export interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string | null;
  avatar: string | null;
}

export async function login(username: string, password: string): Promise<User> {
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
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  localStorage.removeItem("user");
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

export async function checkAuth(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (!response.ok) {
      localStorage.removeItem("user");
      return null;
    }

    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
}
