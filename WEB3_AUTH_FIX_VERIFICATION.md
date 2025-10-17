# Web3 Authentication Fix - Verification Guide

## ✅ Cambios Implementados

### 1. **storage-cleanup.ts** (NUEVO)
**Archivo:** `/src/lib/storage-cleanup.ts`

Limpia localStorage de datos obsoletos de Wagmi/Firebase/Genkit que causaban:
- `QuotaExceededError: Failed to execute 'setItem' on 'Storage'`
- Conflictos de múltiples wallets

**Funciones:**
- `cleanupLegacyStorage()` - Ejecuta limpieza una sola vez por sesión
- `getLocalStorageSize()` - Obtiene tamaño aproximado del storage
- `getStorageDebugInfo()` - Información de debugging

### 2. **web3-provider.tsx** (ACTUALIZADO)
**Archivo:** `/src/lib/web3-provider.tsx`

**Cambios:**
- ❌ Removido: `walletConnect` connector (causaba conflictos)
- ❌ Removido: `coinbaseWallet` connector (causaba conflictos)
- ❌ Removido: `createStorage` (causaba QuotaExceededError)
- ✅ Mantenido: Solo `injected` (MetaMask)
- ✅ Agregado: Llamada a `cleanupLegacyStorage()`
- ✅ Cambiado: `reconnectOnMount={false}` (más seguro)

**Resultado:**
- Solo MetaMask como wallet connector
- Sin persistencia automática en localStorage
- Sin conflictos de `window.ethereum`

### 3. **layout.tsx** (ACTUALIZADO)
**Archivo:** `/src/app/layout.tsx`

**Cambios:**
- Removido: `'use client'` directive (conflictaba con metadata)
- Separado: Lógica client en nuevo componente `layout-client.tsx`

### 4. **layout-client.tsx** (NUEVO)
**Archivo:** `/src/app/layout-client.tsx`

Componente client que:
- Ejecuta `cleanupLegacyStorage()` al montar
- Proporciona `ThemeProvider`, `Web3Provider`, `Toaster`

### 5. **use-wallet-persistence.ts** (NUEVO - OPCIONAL)
**Archivo:** `/src/hooks/use-wallet-persistence.ts`

Hook para persistencia manual usando `sessionStorage`:
- Se limpia automáticamente al cerrar la tab
- Más seguro que localStorage
- Uso: `useWalletPersistence()` en cualquier componente

---

## 🧪 Criterios de Éxito

### ✅ Build
```bash
npm run build
# ✓ Compiled successfully in 6.0s
# ✓ Generating static pages (13/13)
```

### ✅ TypeScript
```bash
npm run typecheck
# Sin errores
```

### ✅ Lint
```bash
npm run lint
# Sin errores (excepto warnings de dependencias de terceros)
```

---

## 🔍 Verificación Manual en el Navegador

### Paso 1: Limpiar Storage Existente
Abre la consola del navegador (F12) y ejecuta:

```javascript
// Limpiar TODO
Object.keys(localStorage).forEach(key => {
  if (key.includes('firebase') || key.includes('genkit') || key.includes('siwe') || key.includes('andechain')) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

Object.keys(sessionStorage).forEach(key => {
  if (key.includes('firebase') || key.includes('genkit') || key.includes('siwe') || key.includes('andechain')) {
    sessionStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

// Recargar
location.reload();
```

### Paso 2: Verificar Limpieza
En la consola, ejecuta:

```javascript
// Ver información de storage
console.log('localStorage keys:', Object.keys(localStorage));
console.log('sessionStorage keys:', Object.keys(sessionStorage));

// Ver si se ejecutó la limpieza
console.log('Cleanup marker:', localStorage.getItem('__storage_cleanup_v1_done'));
```

**Esperado:**
- `localStorage keys:` - Pocas claves (sin firebase, genkit, siwe, andechain)
- `sessionStorage keys:` - Pocas claves
- `Cleanup marker:` - `"true"`

### Paso 3: Conectar MetaMask
1. Presiona el botón "Connect MetaMask" en la app
2. Verifica en la consola:

```javascript
// NO debe haber errores como:
// - QuotaExceededError
// - "another Ethereum wallet extension"
// - "Failed to execute 'setItem' on 'Storage'"

// Debe haber logs como:
// [Storage] Cleaned: andechain-wallet
// [Storage] Cleanup complete: X items removed
```

### Paso 4: Verificar Conexión
- ✅ Se abre el popup de MetaMask
- ✅ Se puede seleccionar una cuenta
- ✅ Se conecta sin errores
- ✅ El botón cambia a mostrar la dirección conectada
- ✅ La consola NO muestra errores

### Paso 5: Desconectar
- ✅ Se puede presionar el botón de desconectar
- ✅ Se desconecta sin errores
- ✅ El botón vuelve a "Connect MetaMask"

---

## 📊 Comparación Antes/Después

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Wallets** | MetaMask + WalletConnect + Coinbase | Solo MetaMask |
| **Storage** | localStorage (QuotaExceededError) | Sin persistencia automática |
| **Conflictos** | Múltiples wallets compitiendo | Solo MetaMask, sin conflictos |
| **Reconexión** | Automática (causa errores) | Manual (más seguro) |
| **Bundle Size** | Más grande | Más pequeño |
| **localStorage** | ~50-100KB de datos | ~1-5KB de datos |

---

## 🐛 Problemas Resueltos

### 1. QuotaExceededError
**Causa:** Wagmi guardaba estado muy grande en localStorage
**Solución:** Remover `createStorage` y ejecutar `cleanupLegacyStorage()`

### 2. "another Ethereum wallet extension also setting the global Ethereum provider"
**Causa:** Yoroi (Cardano) + MetaMask + Web3Modal compitiendo por `window.ethereum`
**Solución:** Remover WalletConnect y Coinbase Wallet, solo usar MetaMask

### 3. Conflictos de Múltiples Wallets
**Causa:** Múltiples connectors intentando controlar `window.ethereum`
**Solución:** Solo usar `injected` connector (MetaMask)

---

## 📝 Notas Importantes

### ⚠️ Cambios de Comportamiento

1. **Sin Reconexión Automática**
   - Antes: Se reconectaba automáticamente al recargar
   - Ahora: El usuario debe presionar "Connect" nuevamente
   - Razón: Evitar conflictos y errores

2. **Sin WalletConnect**
   - Antes: Podías conectar wallets mobile via QR
   - Ahora: Solo MetaMask (desktop)
   - Razón: Evitar conflictos de `window.ethereum`

3. **Sin Coinbase Wallet**
   - Antes: Podías conectar Coinbase Wallet
   - Ahora: Solo MetaMask
   - Razón: Evitar conflictos de `window.ethereum`

### ✅ Persistencia Manual (Opcional)

Si necesitas persistencia, usa el hook `useWalletPersistence`:

```tsx
import { useWalletPersistence } from '@/hooks/use-wallet-persistence';

export function MyComponent() {
  useWalletPersistence(); // Usa sessionStorage
  
  return (
    // Tu componente
  );
}
```

---

## 🔧 Debugging

### Ver Información de Storage
```javascript
// En la consola del navegador
import { getStorageDebugInfo } from '@/lib/storage-cleanup';
console.log(getStorageDebugInfo());
```

### Ver Tamaño de Storage
```javascript
import { getLocalStorageSize } from '@/lib/storage-cleanup';
console.log('Storage size:', getLocalStorageSize(), 'bytes');
```

---

## 📚 Archivos Modificados

```
✅ src/lib/storage-cleanup.ts (NUEVO)
✅ src/lib/web3-provider.tsx (ACTUALIZADO)
✅ src/app/layout.tsx (ACTUALIZADO)
✅ src/app/layout-client.tsx (NUEVO)
✅ src/hooks/use-wallet-persistence.ts (NUEVO)
```

---

## ✨ Próximos Pasos (Opcional)

1. **Agregar soporte para más wallets** (si es necesario)
   - Usar WalletConnect v2 con mejor manejo de conflictos
   - Agregar Coinbase Wallet con shimDisconnect

2. **Implementar persistencia robusta**
   - Usar IndexedDB en lugar de localStorage
   - Implementar sincronización entre tabs

3. **Mejorar UX de reconexión**
   - Mostrar estado de conexión
   - Permitir reconexión manual fácil

---

## 📞 Soporte

Si encuentras problemas:

1. Verifica que localStorage esté limpio (paso 1 de verificación manual)
2. Revisa la consola del navegador para errores
3. Intenta desactivar otras extensiones de wallet
4. Limpia el cache del navegador y recarga

---

**Commit:** `e241ab4` - fix(web3): resolve wallet authentication conflicts and storage quota errors
**Fecha:** 2025-10-16
