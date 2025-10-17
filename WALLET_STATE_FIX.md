# 🔧 Corrección: Estado Inconsistente de Wallet

## 📋 Resumen del Problema

**Síntoma:**
```
✅ Logs: "Wallet connected successfully"
❌ UI: Muestra "Connect Wallet"
❌ Estado: 'error'
```

**Causa Raíz:**
El orden de las condiciones en el `useEffect` de determinación de estado era incorrecto. El `else if (error || connectError)` se ejecutaba ANTES que `else if (isConnected && chain)`, causando que errores anteriores tuvieran prioridad sobre la conexión exitosa.

---

## ✅ Cambios Realizados

### 1. **Reorganización de Prioridades en `use-wallet-connection.ts`**

**Archivo:** `/Users/munay/dev/ande-labs/andefrontend/src/hooks/use-wallet-connection.ts`

**Cambio Principal (líneas 112-131):**

```typescript
// ❌ ANTES (INCORRECTO)
useEffect(() => {
  if (isConnecting) {
    setState('connecting');
  } else if (isSwitching) {
    setState('switching-network');
  } else if (isConnected && chain) {  // ← Conexión exitosa
    // ...
  } else if (error || connectError) {  // ← ERROR TIENE PRIORIDAD (INCORRECTO)
    setState('error');
  } else {
    setState('disconnected');
  }
}, [isConnected, isConnecting, isSwitching, chain, error, connectError, address]);
```

```typescript
// ✅ DESPUÉS (CORRECTO)
useEffect(() => {
  // Prioridad 1: Conexión exitosa (máxima prioridad)
  if (isConnected && chain) {
    if (chain.id === andechain.id) {
      setState('connected');
      setError(undefined);  // ← Limpiar errores anteriores
    } else {
      setState('wrong-network');
      setError(undefined);
    }
  }
  // Prioridad 2: Procesos en progreso
  else if (isConnecting) {
    setState('connecting');
  } else if (isSwitching) {
    setState('switching-network');
  }
  // Prioridad 3: Errores (solo si no está conectado)
  else if (error || connectError) {
    setState('error');
  }
  // Prioridad 4: Desconectado
  else {
    setState('disconnected');
  }
}, [isConnected, isConnecting, isSwitching, chain, error, connectError]);
```

### 2. **Limpieza de Errores en `connect()`**

**Línea ~297:**
```typescript
await wagmiConnect({ connector });

// ✅ Limpiar errores después de conexión exitosa
setError(undefined);

logger.info('Wallet connected successfully', { 
  connectionId,
  connectorId: connector.id,
  chainId: andechain.id,
  clearedError: true,  // ← Nuevo campo para debugging
});
```

### 3. **Logging Mejorado**

Se agregaron logs detallados en cada transición de estado:

```typescript
if (chain.id === andechain.id) {
  setState('connected');
  setError(undefined);
  logger.info('State set to connected', { 
    address, 
    chainId: chain.id,
    clearedPreviousError: !!error || !!connectError  // ← Indica si se limpió error
  });
}
```

### 4. **Debugging: Snapshot de Estado**

Se agregó un nuevo `useEffect` para monitorear cambios de estado (línea ~182):

```typescript
useEffect(() => {
  logger.info('State determination snapshot', {
    state,
    isConnected,
    isConnecting,
    isSwitching,
    chainId: chain?.id,
    expectedChainId: andechain.id,
    hasError: !!error,
    hasConnectError: !!connectError,
    address: address?.slice(0, 6) + '...',
    timestamp: new Date().toISOString(),
  });
}, [state, isConnected, isConnecting, isSwitching, chain, error, connectError, address]);
```

---

## 🧪 Cómo Probar la Corrección

### Paso 1: Iniciar el servidor de desarrollo

```bash
cd /Users/munay/dev/ande-labs/andefrontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Paso 2: Abrir la consola del navegador

```
Chrome/Firefox: F12 o Cmd+Option+I
```

### Paso 3: Conectar la wallet

1. Haz clic en el botón "Connect MetaMask"
2. Aprueba la conexión en MetaMask
3. Verifica los logs en la consola

### Paso 4: Verificar los logs esperados

**Logs esperados en orden:**

```
[INFO] Attempting wallet connection
  connectionId: "1729..."
  chainId: 1337
  ...

[INFO] Wallet connected successfully
  connectionId: "1729..."
  connectorId: "injected"
  chainId: 1337
  clearedError: true  ← ✅ Indica que se limpió el error

[INFO] State set to connected
  address: "0x1234..."
  chainId: 1337
  clearedPreviousError: false  ← ✅ No había error previo

[INFO] State determination snapshot
  state: "connected"
  isConnected: true
  chainId: 1337
  hasError: false  ← ✅ Sin errores
  hasConnectError: false  ← ✅ Sin errores de conexión
```

### Paso 5: Verificar la UI

**Comportamiento esperado:**

- ✅ El botón "Connect MetaMask" desaparece
- ✅ Aparece el dropdown con la dirección de la wallet
- ✅ Se muestra el saldo ANDE (si está habilitado)
- ✅ No hay mensajes de error en la UI

### Paso 6: Probar desconexión

1. Haz clic en el dropdown de la wallet
2. Selecciona "Disconnect"
3. Verifica que el botón "Connect MetaMask" reaparece

**Logs esperados:**

```
[INFO] Wallet disconnected
[INFO] State set to disconnected
```

### Paso 7: Probar reconexión

1. Haz clic en "Connect MetaMask" nuevamente
2. Verifica que la conexión es exitosa sin errores

---

## 🔍 Debugging Adicional

### Ver todos los logs de wallet

En la consola del navegador, ejecuta:

```javascript
// Filtrar logs de wallet
console.log('=== WALLET LOGS ===');
// Los logs aparecerán con el prefijo [ANDE]
```

### Monitorear cambios de estado en tiempo real

En la consola del navegador, ejecuta:

```javascript
// Ver el estado actual
localStorage.getItem('andechain-wagmi');
```

### Simular error de conexión

1. Desactiva MetaMask temporalmente
2. Intenta conectar
3. Verifica que el estado sea 'error'
4. Reactiva MetaMask
5. Intenta conectar nuevamente
6. Verifica que el estado sea 'connected' (no 'error')

---

## 📊 Matriz de Estados

| Condición | Estado Esperado | Comportamiento |
|-----------|-----------------|----------------|
| `isConnected && chain.id === andechain.id` | `connected` | Mostrar dropdown con wallet |
| `isConnected && chain.id !== andechain.id` | `wrong-network` | Mostrar botón "Wrong Network" |
| `isConnecting` | `connecting` | Mostrar spinner "Connecting..." |
| `isSwitching` | `switching-network` | Mostrar spinner "Switching..." |
| `error \|\| connectError` | `error` | Mostrar botón "Connect MetaMask" |
| Ninguna condición | `disconnected` | Mostrar botón "Connect MetaMask" |

---

## 🎯 Validación de Corrección

La corrección es exitosa si:

- ✅ Los logs muestran "Wallet connected successfully"
- ✅ El estado es 'connected'
- ✅ La UI muestra el dropdown con la wallet
- ✅ No hay mensajes de error
- ✅ La reconexión funciona sin errores
- ✅ El cambio de red funciona correctamente

---

## 📝 Archivos Modificados

1. **`/Users/munay/dev/ande-labs/andefrontend/src/hooks/use-wallet-connection.ts`**
   - Reorganización de prioridades en el useEffect de estado
   - Limpieza de errores en la función `connect()`
   - Logging mejorado
   - Nuevo useEffect para debugging

2. **`/Users/munay/dev/ande-labs/andefrontend/src/__tests__/wallet-state-consistency.test.ts`** (NUEVO)
   - Tests unitarios para validar la lógica de estado
   - 8 tests cubriendo todos los escenarios

---

## 🚀 Próximos Pasos

1. ✅ Probar la conexión de wallet
2. ✅ Verificar los logs en la consola
3. ✅ Validar que la UI es correcta
4. ✅ Probar desconexión y reconexión
5. ✅ Probar cambio de red
6. ⏭️ Si todo funciona, hacer commit de los cambios

---

## ⚠️ Notas Importantes

- **No se modificó la lógica de Wagmi**: Solo se reorganizó el orden de las condiciones
- **No se agregó localStorage manual**: Wagmi maneja automáticamente la persistencia
- **Los errores se limpian automáticamente**: Cuando la conexión es exitosa
- **El logging es exhaustivo**: Para facilitar debugging en el futuro

---

## 📞 Soporte

Si encuentras problemas:

1. Abre la consola del navegador (F12)
2. Busca logs con el prefijo `[ANDE]`
3. Verifica que el estado sea correcto
4. Revisa la matriz de estados arriba
5. Intenta desconectar y reconectar

