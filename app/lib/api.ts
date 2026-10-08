const isBrowser = typeof window !== "undefined";
const defaultBase = isBrowser ? "/api" : "http://localhost:8080/api";
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || defaultBase;

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function getUser(): any | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setAuth(token: string, user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export async function syncUserProfile(): Promise<any | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await authFetch("/auth/me");
    if (res.ok) {
      const data = await res.json();
      const updatedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      setAuth(token, updatedUser);
      return updatedUser;
    }
  } catch (err) {
    console.warn("Could not sync user profile:", err);
  }
  return getUser();
}

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    clearAuth();
    window.location.href = "/login";
  }

  return response;
}
