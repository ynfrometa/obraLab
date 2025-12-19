# Configuración de Reglas de Firestore

## Error: permission-denied

Si estás viendo el error `permission-denied`, necesitas configurar las reglas de seguridad de Firestore.

## Pasos para solucionar:

### 1. Accede a Firebase Console
- Ve a: https://console.firebase.google.com/
- Selecciona tu proyecto: `constructdb-2616b`

### 2. Configura las Reglas de Firestore
- En el menú lateral, ve a **Firestore Database**
- Haz clic en la pestaña **Rules** (Reglas)
- Reemplaza las reglas actuales con las siguientes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workers/{document=**} {
      allow read, write: if true;
    }
    match /obras/{document=**} {
      allow read, write: if true;
    }
    match /mediciones/{document=**} {
      allow read, write: if true;
    }
    match /empresas/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Publica las Reglas
- Haz clic en **Publish** (Publicar) para guardar los cambios

## Reglas de Seguridad Recomendadas (Para Producción)

Para producción, deberías usar reglas más restrictivas con autenticación:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workers/{workerId} {
      allow read, write: if request.auth != null;
      
      // Validación de campos
      allow create: if request.resource.data.keys().hasAll([
        'name', 'alias', 'address', 'phoneNumber', 
        'job', 'company', 'workStatus', 'hireDate'
      ]);
    }
  }
}
```

## Nota Importante

Las reglas actuales (`allow read, write: if true`) permiten que **cualquiera** pueda leer y escribir en tu base de datos. Esto es solo para desarrollo.

**Para producción, configura autenticación y reglas más restrictivas.**

