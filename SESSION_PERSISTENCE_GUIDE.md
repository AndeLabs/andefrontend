# Guía de Persistencia de Sesión de MetaMask

## ✅ Cambios Implementados

### 1. **Archivo Nuevo: `src/lib/safe-storage.ts`**
Proporciona acceso seguro a localStorage con manejo robusto de errores:
- ✅ Maneja QuotaExceededError gracefully
- ✅ Soporta SSR (server-side rendering)
- ✅ Verifica disponibilidad de espacio
- ✅ Logging de errores para debugging
- ✅ Funciones auxiliares para gestión de storage

**Funciones principales:**
```typescript
safeStorage.getItem(key)          // Obtener valor de forma segura
safeStorage.setItem(key, value)   // Guardar valor de forma segura
safeStorage.removeItem(key)       // Eliminar valor de forma segura
safeStorage.removeItems(keys)     // Eliminar múltiples valores
safeStorage.checkAvailableSpace() // Verificar espacio disponible
safeStorage.getApproximateSize()  // Obtener tamaño de storage
safeStorage.clear()               // Limpiar todo localStorage
```

### 2. **Actualizado: `src/lib/web3-provider.tsx`**
Habilitada la persistencia segura en Wagmi:

**Cambios:**
```typescript
// ✅ Crear storage seguro para Wagmi
const wagmiStorage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'andechain-wagmi', // Key específico para evitar conflictos
});

// ✅ Habilitar persistencia en la configuración
const wagmiConfig = createConfig({
  // ... otras opciones
  storage: wagmiStorage,
  ssr: true,
});

// ✅ Permitir reconexión automática al montar
<WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
```

**Beneficios:**
- Wagmi maneja automáticamente la persistencia
- No hay conflictos con localStorage manual
- Reconexión automática al actualizar página
- Reconexión automática al cerrar/reabrir navegador

### 3. **Actualizado: `src/hooks/use-wallet-connection.ts`**
Eliminado localStorage manual, dejando que Wagmi maneje la persistencia:

**Cambios:**
- ❌ Removido: `localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true')`
- ❌ Removido: `localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address)`
- ❌ Removido: `localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTOR, connector.id)`
- ❌ Removido: `localStorage.removeItem()` en disconnect
- ✅ Mejorado: Eager connection ahora confía en Wagmi

**Beneficios:**
- Sincronización correcta de estado
- Sin duplicación de datos
- Sin conflictos entre localStorage manual y Wagmi
- Manejo automático de reconexión

### 4. **Tests Agregados**
Dos archivos de tests para verificar la persistencia:

**`src/__tests__/session-persistence.test.ts`**
- Tests de safeStorage
- Tests de manejo de errores
- Tests de escenarios de persistencia
- Tests de integración con Wagmi

**`src/__tests__/wallet-persistence-integration.test.ts`**
- Tests de page refresh
- Tests de browser close/reopen
- Tests de múltiples tabs
- Tests de recuperación de errores
- Tests de integridad de datos
- Tests de compatibilidad con Wagmi

## 🧪 Cómo Probar la Persistencia

### Prueba 1: Page Refresh
1. Abre la aplicación en el navegador
2. Conecta tu wallet de MetaMask
3. Verifica que ves tu dirección y balance
4. **Actualiza la página (F5 o Cmd+R)**
5. ✅ **Esperado:** La sesión persiste, no necesitas reconectar

### Prueba 2: Browser Close/Reopen
1. Abre la aplicación en el navegador
2. Conecta tu wallet de MetaMask
3. Verifica que ves tu dirección y balance
4. **Cierra completamente el navegador**
5. **Reabre el navegador**
6. ✅ **Esperado:** La sesión persiste automáticamente

### Prueba 3: Multiple Tabs
1. Abre la aplicación en dos tabs diferentes
2. En Tab 1: Conecta tu wallet
3. En Tab 2: Actualiza la página
4. ✅ **Esperado:** Tab 2 muestra la sesión conectada

### Prueba 4: Desconexión
1. Conecta tu wallet
2. Haz clic en "Disconnect"
3. Actualiza la página
4. ✅ **Esperado:** La sesión está desconectada

### Prueba 5: Storage Lleno (QuotaExceededError)
1. Abre DevTools (F12)
2. Ve a Application > Storage > Local Storage
3. Llena localStorage con datos de prueba
4. Intenta conectar wallet
5. ✅ **Esperado:** No hay error, manejo graceful

## 📊 Verificar en DevTools

### Application > Storage > Local Storage
Deberías ver estas keys de Wagmi:
```
andechain-wagmi          // Estado de conexión de Wagmi
wagmi.store              // Store de Wagmi
wagmi.cache              // Cache de Wagmi
wagmi.recentConnectorId  // Último conector usado
```

### Console
Deberías ver logs como:
```
[Web3] Eager connection: Wagmi will attempt to reconnect using persisted state
[Web3] Wallet connected successfully
[Web3] Wallet disconnected
```

## 🔍 Debugging

### Ver logs de persistencia
```typescript
// En src/lib/safe-storage.ts
// Todos los errores se loguean con logger.warn() o logger.error()
```

### Verificar estado de Wagmi
```javascript
// En la consola del navegador
localStorage.getItem('andechain-wagmi')
localStorage.getItem('wagmi.recentConnectorId')
```

### Limpiar storage (si es necesario)
```javascript
// En la consola del navegador
localStorage.clear()
// Luego actualiza la página
```

## 🛡️ Consideraciones de Seguridad

### ✅ Lo que está seguro:
- **No guardamos claves privadas** - MetaMask las maneja
- **No guardamos datos sensibles** - Solo estado de conexión
- **Manejo seguro de errores** - No exponemos información sensible
- **SSR compatible** - No hay acceso a localStorage en servidor

### ⚠️ Limitaciones:
- localStorage tiene límite de ~5-10MB por dominio
- localStorage es accesible por JavaScript (XSS risk)
- localStorage persiste entre sesiones (considera privacidad)
- localStorage es específico por dominio/protocolo

## 📝 Configuración de Sesión

En `src/lib/safe-storage.ts`:
```typescript
export const SESSION_CONFIG = {
  // Timeout de sesión: 24 horas
  TIMEOUT_MS: 24 * 60 * 60 * 1000,

  // Intervalo de actualización de timestamp: 5 minutos
  UPDATE_INTERVAL_MS: 5 * 60 * 1000,
};
```

Para cambiar el timeout de sesión, modifica `TIMEOUT_MS`.

## 🚀 Próximos Pasos (Opcional)

### 1. Agregar Session Timeout
```typescript
// En use-wallet-connection.ts
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas

useEffect(() => {
  if (isConnected) {
    const lastConnection = safeStorage.getItem('andechain-last-connection-time');
    const now = Date.now();
    
    if (lastConnection) {
      const timeDiff = now - parseInt(lastConnection);
      if (timeDiff > SESSION_TIMEOUT) {
        logger.info('Session expired, disconnecting');
        disconnect();
        return;
      }
    }
    
    safeStorage.setItem('andechain-last-connection-time', now.toString());
  }
}, [isConnected, disconnect]);
```

### 2. Agregar Preferencias de Usuario
```typescript
// Guardar preferencias
const preferences = {
  autoConnect: true,
  preferredConnector: 'injected',
  theme: 'dark',
};
safeStorage.setItem(
  WALLET_STORAGE_KEYS.WALLET_PREFERENCES,
  JSON.stringify(preferences)
);

// Restaurar preferencias
const prefs = JSON.parse(
  safeStorage.getItem(WALLET_STORAGE_KEYS.WALLET_PREFERENCES) || '{}'
);
```

### 3. Monitorear Uso de Storage
```typescript
// Verificar espacio disponible
const spaceAvailable = safeStorage.checkAvailableSpace();
if (spaceAvailable === 0) {
  console.warn('Storage quota exceeded');
}

// Obtener tamaño aproximado
const size = safeStorage.getApproximateSize();
console.log(`Storage size: ${(size / 1024).toFixed(2)}KB`);
```

## 📋 Checklist de Verificación

- [x] Crear `safe-storage.ts` con manejo seguro
- [x] Actualizar `web3-provider.tsx` con persistencia
- [x] Limpiar `use-wallet-connection.ts`
- [x] Crear tests de persistencia
- [x] Verificar que el build pasa
- [x] Verificar que no hay QuotaExceededError
- [ ] Probar en navegador real
- [ ] Probar con MetaMask instalado
- [ ] Probar en múltiples navegadores
- [ ] Probar en modo incógnito/privado

## 🐛 Troubleshooting

### Problema: Sesión no persiste
**Solución:**
1. Verifica que `reconnectOnMount={true}` en WagmiProvider
2. Verifica que `storage: wagmiStorage` en createConfig
3. Abre DevTools y verifica que `andechain-wagmi` existe en localStorage
4. Revisa la consola para errores

### Problema: QuotaExceededError
**Solución:**
1. Abre DevTools > Application > Storage > Local Storage
2. Identifica qué está usando mucho espacio
3. Limpia datos innecesarios
4. Considera usar sessionStorage para datos temporales

### Problema: Reconexión lenta
**Solución:**
1. Verifica la velocidad de tu conexión a internet
2. Verifica que el RPC de AndeChain está disponible
3. Revisa los logs en la consola
4. Intenta desconectar y reconectar manualmente

### Problema: Funciona en dev pero no en producción
**Solución:**
1. Verifica que el dominio es el mismo
2. Verifica que el protocolo es HTTPS (no HTTP)
3. Verifica que no hay restricciones de cookies/storage
4. Verifica que MetaMask está disponible en producción

## 📚 Referencias

- [Wagmi Storage Documentation](https://wagmi.sh/react/api/createConfig#storage)
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Web3 Security Best Practices](https://ethereum.org/en/developers/docs/security/)

## 💬 Soporte

Si tienes problemas:
1. Revisa los logs en la consola del navegador
2. Verifica que MetaMask está instalado y conectado
3. Intenta limpiar localStorage y reintentar
4. Abre un issue en el repositorio con los detalles del error
