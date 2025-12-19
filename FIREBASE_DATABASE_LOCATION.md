# Dónde ver los trabajadores en Firebase

## ⚠️ IMPORTANTE: Estamos usando Realtime Database, NO Firestore

Los trabajadores se están guardando en **Firebase Realtime Database**, no en Firestore. Son dos servicios diferentes de Firebase.

## 📍 Cómo ver los trabajadores en Realtime Database:

### Pasos:

1. **Ve a Firebase Console**: https://console.firebase.google.com/
2. **Selecciona tu proyecto**: `constructdb-2616b`
3. **En el menú lateral, busca "Realtime Database"** (NO "Firestore Database")
4. **Haz clic en "Realtime Database"**
5. **Deberías ver tus trabajadores en la ruta**: `/worker`

## 🔍 Estructura de datos:

Los trabajadores se guardan así:
```
worker/
  ├── {workerId1}/
  │   ├── name: "Yoanni"
  │   ├── alias: "Negro"
  │   ├── address: "Rio de Janeiro 12"
  │   ├── phoneNumber: "644123123"
  │   ├── job: "Utilero"
  │   ├── company: "Empresa Prueba"
  │   ├── workStatus: "contratado"
  │   └── hireDate: 1733761795000
  └── {workerId2}/
      └── ...
```

## 📊 Diferencia entre Realtime Database y Firestore:

| Característica | Realtime Database | Firestore |
|---------------|-------------------|-----------|
| Ubicación en Console | "Realtime Database" | "Firestore Database" |
| Estructura | JSON en tiempo real | Documentos y colecciones |
| URL | `databaseURL` en config | `firestoreURL` |

## ✅ Verificación:

Si no ves los datos en Realtime Database:
1. Verifica que estés en la pestaña correcta (Realtime Database, no Firestore)
2. Verifica que las reglas permitan lectura: `.read: true`
3. Revisa la consola del navegador para ver si hay errores
4. Verifica que la ruta sea `/worker` (singular, no plural)

## 🔄 Si quieres usar Firestore en su lugar:

Si prefieres usar Firestore, necesitaríamos cambiar el código para usar:
- `getFirestore()` en lugar de `getDatabase()`
- `collection()` y `doc()` en lugar de `ref()`
- `addDoc()` en lugar de `push()`

¿Quieres que cambie el código para usar Firestore en lugar de Realtime Database?

