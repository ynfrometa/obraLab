import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthContext } from 'contexts/auth.context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rutas que requieren autenticación
const protectedRoutes = [
  '/empresas',
  '/constructoras',
  '/trabajadores',
  '/obras',
  '/actividades',
  '/hoja-pedidos',
  '/hoja-mediciones',
  '/pedidos',
];

// Rutas públicas que no deben mostrar Navbar/Footer
const publicRoutes = ['/login'];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      setIsChecking(false);
      return;
    }

    // Esperar a que el router esté listo
    if (!router.isReady) {
      return;
    }

    const currentPath = router.pathname;
    const isProtected = protectedRoutes.some(route => currentPath.startsWith(route));
    const isPublic = publicRoutes.some(route => currentPath === route);

    // Si es una ruta pública (como login), no verificar autenticación
    if (isPublic) {
      setIsChecking(false);
      return;
    }

    // Si es una ruta protegida y no está autenticado, redirigir al login inmediatamente
    if (isProtected && !isAuthenticated) {
      setIsChecking(false);
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, router.isReady, router.pathname, router]);

  // Mostrar loading mientras se verifica (solo en cliente)
  if (typeof window !== 'undefined' && isChecking) {
    return null;
  }

  // Si está autenticado o la ruta no está protegida, mostrar el contenido
  return <>{children}</>;
}

