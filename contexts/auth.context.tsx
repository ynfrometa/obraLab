import React, { Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useState } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const AuthContext = React.createContext<AuthContextProps | null>(null);

export function AuthContextProvider<T>({ children }: PropsWithChildren<T>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAuthenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    // Obtener credenciales de variables de entorno o usar valores por defecto
    const validUsername = process.env.NEXT_PUBLIC_AUTH_USERNAME || 'admin';
    const validPassword = process.env.NEXT_PUBLIC_AUTH_PASSWORD || 'admin123';

    if (username === validUsername && password === validPassword) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('isAuthenticated', 'true');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext can only be used inside AuthContextProvider');
  }
  return context;
}

