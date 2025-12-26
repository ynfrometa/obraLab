# Configuración de Autenticación

## Descripción

La aplicación ahora requiere autenticación con usuario y contraseña para acceder a las secciones de gestión. Las siguientes rutas están protegidas:

- `/empresas`
- `/constructoras`
- `/trabajadores`
- `/obras`
- `/actividades`
- `/hoja-pedidos`
- `/hoja-mediciones`
- `/pedidos`

## Configuración de Credenciales

### Variables de Entorno

Para configurar las credenciales de acceso, crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_AUTH_USERNAME=tu_usuario
NEXT_PUBLIC_AUTH_PASSWORD=tu_contraseña
```

### Valores por Defecto

Si no se configuran las variables de entorno, se usarán los siguientes valores por defecto:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **IMPORTANTE:** Cambia estos valores en producción por seguridad.

## Uso

1. Al intentar acceder a una ruta protegida sin estar autenticado, serás redirigido automáticamente a `/login`.
2. Ingresa tus credenciales en la página de login.
3. Una vez autenticado, podrás acceder a todas las secciones protegidas.
4. La sesión se mantiene activa hasta que cierres sesión o cierres el navegador.
5. Puedes cerrar sesión usando el botón "Cerrar Sesión" en el Navbar.

## Funcionalidades

- ✅ Autenticación con usuario y contraseña
- ✅ Protección de rutas automática
- ✅ Persistencia de sesión (localStorage)
- ✅ Redirección automática después del login
- ✅ Botón de cierre de sesión en el Navbar
- ✅ Página de login sin Navbar/Footer

## Seguridad

**Nota de Seguridad:** Este es un sistema de autenticación básico para control de acceso. Para aplicaciones en producción con datos sensibles, se recomienda:

1. Usar Firebase Authentication o un servicio de autenticación robusto
2. Implementar tokens JWT con expiración
3. Usar HTTPS en producción
4. Implementar rate limiting
5. Agregar validación adicional del lado del servidor


