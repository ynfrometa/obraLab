# Configuración de Firebase Realtime Database

## Error: PERMISSION_DENIED

Si estás viendo el error `PERMISSION_DENIED: Permission denied`, necesitas configurar las reglas de seguridad de Firebase.

## Pasos para solucionar:

### 1. Accede a Firebase Console
- Ve a: https://console.firebase.google.com/
- Selecciona tu proyecto: `constructdb-2616b`

### 2. Configura las Reglas de Realtime Database
- En el menú lateral, ve a **Realtime Database**
- Haz clic en la pestaña **Rules** (Reglas)
- Reemplaza las reglas actuales con las siguientes:

```json
{
  "rules": {
    "worker": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3. Publica las Reglas
- Haz clic en **Publish** (Publicar) para guardar los cambios

## Reglas de Seguridad Recomendadas (Para Producción)

Para producción, deberías usar reglas más restrictivas con autenticación:

```json
{
  "rules": {
    "worker": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$workerId": {
        ".validate": "newData.hasChildren(['name', 'alias', 'address', 'phoneNumber', 'job', 'company', 'workStatus', 'hireDate'])"
      }
    }
  }
}
```

## Nota Importante

Las reglas actuales (`".read": true, ".write": true`) permiten que **cualquiera** pueda leer y escribir en tu base de datos. Esto es solo para desarrollo. 

**Para producción, configura autenticación y reglas más restrictivas.**

