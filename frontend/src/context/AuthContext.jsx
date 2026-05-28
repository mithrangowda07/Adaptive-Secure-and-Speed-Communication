import { createContext, useMemo, useState } from "react";
import { clearAuth, getUser, setAuth as storeAuth } from "../services/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());

  const login = (token, authUser) => {
    storeAuth(token, authUser);
    setUser(authUser);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
