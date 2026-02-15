import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthContextType, User } from "./AuthContext";
import { UNAUTHORIZED_EVENT, apiFetch, getAuthToken, setAuthToken } from "@/services";

interface AuthResponse {
  auth_token?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hydrateUser = useCallback(async () => {
    const profile = await apiFetch<User>("/user_turbo");
    setUser(profile);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const bootstrap = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await hydrateUser();
      } catch {
        setAuthToken(null);
        setUser(null);
        navigate("/login", { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [hydrateUser, navigate]);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      navigate("/login", { replace: true });
    };

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>("/auth_vic_login", {
      method: "POST",
      body: { email, password },
    });

    if (!data.auth_token) {
      throw new Error("No auth token returned");
    }

    setAuthToken(data.auth_token);
    await hydrateUser();
  }, [hydrateUser]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await apiFetch<unknown>("/auth/vic/signup", {
      method: "POST",
      body: { Name: name, email, password },
    });

    await login(email, password);
  }, [login]);

  const value = useMemo<AuthContextType>(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
