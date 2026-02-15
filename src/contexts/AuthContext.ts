export interface User {
  id?: number;
  name?: string;
  email?: string;
  Profile_pic?: { url?: string } | null;
  [key: string]: unknown;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
