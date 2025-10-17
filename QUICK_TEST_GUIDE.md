# Quick Test Guide - Web3 Authentication Fix

## ⚡ Quick Start (5 minutos)

### 1. Limpiar Storage
Abre la consola del navegador (F12) y ejecuta:

```javascript
// Limpiar datos obsoletos
Object.keys(localStorage).forEach(key => {
  if (key.includes('firebase') || key.includes('genkit') || 
      key.includes('siwe') || key.includes('andechain')) {
    localStorage.removeItem(key);
  }
});
location.reload();
```

### 2. Iniciar Dev Server
```bash
cd /Users/munay/dev/ande-labs/andefrontend
npm run dev
```

Abre: http://localhost:9002

### 3. Conectar MetaMask
1. Presiona el botón "Connect MetaMask"
2. Verifica que:
   - ✅ Se abre el popup de MetaMask
   - ✅ NO hay errores en la consola
   - ✅ Se conecta correctamente
   - ✅ El botón muestra tu dirección

### 4. Verificar Storage
En la consola:
```javascript
console.log('localStorage keys:', Object.keys(localStorage));
// Debe mostrar pocas claves, sin firebase/genkit/siwe/andechain
```

### 5. Desconectar
- Presiona el botón de desconectar
- ✅ Funciona sin errores

---

## 🎯 Criterios de Éxito

| Criterio | Estado |
|----------|--------|
| ✅ No hay `QuotaExceededError` | |
| ✅ No hay errores de `window.ethereum` | |
| ✅ Se conecta MetaMask sin problemas | |
| ✅ localStorage está limpio | |
| ✅ Se desconecta sin errores | |
| ✅ Consola sin errores | |

---

## 🐛 Si Algo Falla

### Error: "QuotaExceededError"
```javascript
// Limpiar TODO
Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
Object.keys(sessionStorage).forEach(key => sessionStorage.removeItem(key));
location.reload();
```

### Error: "another Ethereum wallet extension"
- Desactiva Yoroi u otras extensiones de wallet
- Recarga la página
- Intenta conectar nuevamente

### No se abre el popup de MetaMask
- Verifica que MetaMask esté habilitado
- Recarga la página
- Intenta nuevamente

---

## 📊 Archivos Modificados

```
✅ src/lib/storage-cleanup.ts (NUEVO)
✅ src/lib/web3-provider.tsx (ACTUALIZADO)
✅ src/app/layout.tsx (ACTUALIZADO)
✅ src/app/layout-client.tsx (NUEVO)
✅ src/hooks/use-wallet-persistence.ts (NUEVO)
```

---

## 📝 Commit

```
e241ab4 - fix(web3): resolve wallet authentication conflicts and storage quota errors
```

---

## ✨ Listo!

Si todo funciona correctamente, el fix está completo. 🎉
