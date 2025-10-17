# MetaMask Integration - Testing Guide

## 🎯 Objetivo

Verificar que todas las mejoras de MetaMask integration funcionan correctamente en diferentes escenarios.

---

## 📋 Requisitos Previos

### Software
- [ ] Node.js 18+ instalado
- [ ] npm o yarn instalado
- [ ] Git instalado

### Navegador
- [ ] Chrome, Firefox, Edge o Safari (versión reciente)
- [ ] MetaMask extension instalado (opcional para algunas pruebas)

### Blockchain
- [ ] AndeChain local corriendo en `http://localhost:8545`
- [ ] Chain ID: 1234
- [ ] Fondos de prueba disponibles

---

## 🚀 Setup Inicial

### 1. Instalar Dependencias
```bash
cd andefrontend
npm install
```

### 2. Configurar Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_USE_LOCAL_CHAIN=true
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo-project-id
```

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
# Abre http://localhost:3000
```

### 4. Verificar Compilación
```bash
npm run typecheck
npm run lint
```

---

## 🧪 Test Cases

### Test Suite 1: Conexión Inicial

#### Test 1.1: MetaMask Instalado
**Precondiciones:**
- MetaMask extension instalado
- Usuario NO conectado

**Pasos:**
1. Navegar a http://localhost:3000/login
2. Verificar que se muestra "Connect MetaMask"
3. Verificar que el icono 🦊 está visible
4. Verificar que se detectó MetaMask

**Resultado Esperado:**
- ✅ Botón está habilitado
- ✅ No muestra advertencia de MetaMask no instalado
- ✅ Se muestra información sobre AndeChain

**Evidencia:**
```
Screenshot: login-metamask-detected.png
```

---

#### Test 1.2: MetaMask NO Instalado
**Precondiciones:**
- MetaMask extension NO instalado
- Usuario NO conectado

**Pasos:**
1. Navegar a http://localhost:3000/login
2. Verificar que se muestra advertencia
3. Verificar que se muestra link de descarga
4. Clic en "Install MetaMask"

**Resultado Esperado:**
- ✅ Se muestra card roja con "MetaMask Not Detected"
- ✅ Se muestra link de descarga
- ✅ Clic abre https://metamask.io/download/ en nueva pestaña

**Evidencia:**
```
Screenshot: login-metamask-not-installed.png
```

---

#### Test 1.3: Conexión Exitosa
**Precondiciones:**
- MetaMask instalado
- Usuario NO conectado
- AndeChain agregado a MetaMask

**Pasos:**
1. Navegar a http://localhost:3000/login
2. Clic en "Connect MetaMask"
3. Aprobar conexión en MetaMask
4. Esperar a que se complete

**Resultado Esperado:**
- ✅ Se muestra spinner "Connecting..."
- ✅ MetaMask abre popup de conexión
- ✅ Se redirige a /dashboard
- ✅ Se muestra address en el header
- ✅ Se muestra balance ANDE

**Evidencia:**
```
Screenshot: login-connecting.png
Screenshot: dashboard-connected.png
Console: "Wallet connected successfully"
```

---

#### Test 1.4: Usuario Rechaza Conexión
**Precondiciones:**
- MetaMask instalado
- Usuario NO conectado

**Pasos:**
1. Navegar a http://localhost:3000/login
2. Clic en "Connect MetaMask"
3. Rechazar en MetaMask popup
4. Esperar a que se complete

**Resultado Esperado:**
- ✅ Se muestra toast "Connection Rejected"
- ✅ Permanece en login page
- ✅ Botón vuelve a estar habilitado

**Evidencia:**
```
Screenshot: login-rejected.png
Toast: "You rejected the connection request."
```

---

### Test Suite 2: Auto-Reconexión

#### Test 2.1: Reconexión Automática
**Precondiciones:**
- Usuario conectado previamente
- Browser cerrado y reabierto

**Pasos:**
1. Conectar wallet en login
2. Navegar a dashboard
3. Verificar que se muestra balance
4. Cerrar navegador completamente
5. Reabrirlo y navegar a http://localhost:3000
6. Esperar 2 segundos

**Resultado Esperado:**
- ✅ Se redirige automáticamente a /dashboard
- ✅ Se muestra address en header
- ✅ Se muestra balance ANDE
- ✅ No requiere interacción del usuario

**Evidencia:**
```
Screenshot: dashboard-auto-reconnected.png
Console: "Attempting eager connection with saved connector"
LocalStorage: andechain-wallet-connected = true
```

---

#### Test 2.2: Reconexión Falla
**Precondiciones:**
- Usuario conectado previamente
- MetaMask desconectado manualmente

**Pasos:**
1. Conectar wallet
2. Desconectar manualmente en MetaMask
3. Cerrar navegador
4. Reabrirlo y navegar a http://localhost:3000

**Resultado Esperado:**
- ✅ Se intenta reconectar (spinner)
- ✅ Falla después de 5 segundos
- ✅ Se limpia localStorage
- ✅ Se muestra login page

**Evidencia:**
```
Console: "Eager connection failed"
LocalStorage: andechain-wallet-connected = cleared
```

---

### Test Suite 3: Cambio de Red

#### Test 3.1: Cambio Automático a AndeChain
**Precondiciones:**
- MetaMask instalado
- Usuario conectado a Ethereum mainnet

**Pasos:**
1. Conectar a Ethereum mainnet en MetaMask
2. Clic en "Connect MetaMask" en login
3. Aprobar conexión
4. Esperar a que se complete

**Resultado Esperado:**
- ✅ Se conecta a Ethereum mainnet
- ✅ Se muestra "Wrong Network" en header
- ✅ Se abre modal de confirmación
- ✅ Se cambia automáticamente a AndeChain
- ✅ Se redirige a dashboard

**Evidencia:**
```
Screenshot: wrong-network-modal.png
Console: "Switched to AndeChain successfully"
MetaMask: Muestra "AndeChain Local" como red activa
```

---

#### Test 3.2: Usuario Rechaza Cambio de Red
**Precondiciones:**
- Usuario en red incorrecta
- Modal de cambio de red abierto

**Pasos:**
1. Clic en "Cancel" en modal
2. Esperar a que se cierre

**Resultado Esperado:**
- ✅ Modal se cierra
- ✅ Permanece en red incorrecta
- ✅ Botón "Wrong Network" sigue visible

**Evidencia:**
```
Screenshot: wrong-network-cancel.png
```

---

#### Test 3.3: Agregar Red a MetaMask
**Precondiciones:**
- AndeChain NO agregado a MetaMask
- Usuario en red incorrecta

**Pasos:**
1. Clic en "Add Network to MetaMask"
2. Aprobar en MetaMask popup
3. Esperar a que se complete

**Resultado Esperado:**
- ✅ Se abre popup de MetaMask
- ✅ Se muestra información de AndeChain
- ✅ Se agrega la red
- ✅ Se cambia automáticamente a AndeChain
- ✅ Se redirige a dashboard

**Evidencia:**
```
Screenshot: add-network-metamask.png
MetaMask: AndeChain agregado a lista de redes
```

---

### Test Suite 4: WalletButton

#### Test 4.1: Estados del Botón
**Precondiciones:**
- Navegar a dashboard

**Pasos:**
1. Verificar estado "Disconnected"
2. Conectar wallet
3. Verificar estado "Connected"
4. Cambiar a red incorrecta
5. Verificar estado "Wrong Network"

**Resultado Esperado:**
- ✅ Disconnected: Azul, "Connect MetaMask"
- ✅ Connected: Verde, address truncada
- ✅ Wrong Network: Naranja, "Wrong Network"

**Evidencia:**
```
Screenshot: wallet-button-disconnected.png
Screenshot: wallet-button-connected.png
Screenshot: wallet-button-wrong-network.png
```

---

#### Test 4.2: Dropdown Menu
**Precondiciones:**
- Usuario conectado
- Navegar a dashboard

**Pasos:**
1. Clic en WalletButton
2. Verificar que se abre dropdown
3. Verificar opciones disponibles

**Resultado Esperado:**
- ✅ Se abre dropdown menu
- ✅ Muestra address completa
- ✅ Opciones disponibles:
  - Copy Address
  - View on Explorer
  - Add ANDE Token
  - Disconnect

**Evidencia:**
```
Screenshot: wallet-button-dropdown.png
```

---

#### Test 4.3: Copy Address
**Precondiciones:**
- Dropdown menu abierto

**Pasos:**
1. Clic en "Copy Address"
2. Pegar en notepad o similar

**Resultado Esperado:**
- ✅ Se muestra toast "Copied"
- ✅ Address se copia al clipboard
- ✅ Icono cambia a checkmark ✓

**Evidencia:**
```
Screenshot: wallet-button-copy.png
Clipboard: Address copiada correctamente
```

---

#### Test 4.4: View on Explorer
**Precondiciones:**
- Dropdown menu abierto

**Pasos:**
1. Clic en "View on Explorer"
2. Esperar a que se abra nueva pestaña

**Resultado Esperado:**
- ✅ Se abre nueva pestaña
- ✅ URL contiene address del usuario
- ✅ Se muestra página del explorer

**Evidencia:**
```
Screenshot: explorer-page.png
URL: http://localhost:8545/address/0x...
```

---

#### Test 4.5: Add ANDE Token
**Precondiciones:**
- Dropdown menu abierto

**Pasos:**
1. Clic en "Add ANDE Token"
2. Aprobar en MetaMask

**Resultado Esperado:**
- ✅ Se abre popup de MetaMask
- ✅ Se muestra información del token
- ✅ Se agrega el token a MetaMask
- ✅ Se muestra toast "Token Added"

**Evidencia:**
```
Screenshot: add-token-metamask.png
MetaMask: ANDE token agregado a lista de tokens
```

---

#### Test 4.6: Disconnect
**Precondiciones:**
- Dropdown menu abierto

**Pasos:**
1. Clic en "Disconnect"
2. Esperar a que se complete

**Resultado Esperado:**
- ✅ Se desconecta wallet
- ✅ Se muestra toast "Wallet Disconnected"
- ✅ Se redirige a login
- ✅ LocalStorage se limpia

**Evidencia:**
```
Screenshot: login-after-disconnect.png
Console: "Wallet disconnected"
LocalStorage: andechain-wallet-connected = cleared
```

---

### Test Suite 5: ChainInfoCard

#### Test 5.1: Información en Tiempo Real
**Precondiciones:**
- Usuario conectado
- Navegar a dashboard

**Pasos:**
1. Verificar que se muestra ChainInfoCard
2. Esperar 5 segundos
3. Verificar que se actualiza block number
4. Verificar que se muestra gas price
5. Verificar que se muestra latencia

**Resultado Esperado:**
- ✅ Se muestra block number
- ✅ Se muestra gas price en Gwei
- ✅ Se muestra latencia en ms
- ✅ Se actualiza cada 5 segundos

**Evidencia:**
```
Screenshot: chain-info-card.png
Console: Network latency = XXms
```

---

#### Test 5.2: Modo Compacto
**Precondiciones:**
- Usuario conectado
- Navegar a dashboard

**Pasos:**
1. Verificar que hay ChainInfoCard compacto en primera fila
2. Verificar que muestra información esencial

**Resultado Esperado:**
- ✅ Se muestra en primera fila junto a balance cards
- ✅ Muestra: Network status, Block, Gas price
- ✅ Tamaño compacto

**Evidencia:**
```
Screenshot: dashboard-first-row.png
```

---

#### Test 5.3: Modo Completo
**Precondiciones:**
- Usuario conectado
- Navegar a dashboard

**Pasos:**
1. Scroll down a segunda fila
2. Verificar que hay ChainInfoCard completo
3. Verificar que muestra toda la información

**Resultado Esperado:**
- ✅ Se muestra en segunda fila
- ✅ Muestra: Block, Gas, Time, Transactions, Latency, RPC
- ✅ Tamaño completo

**Evidencia:**
```
Screenshot: dashboard-second-row.png
```

---

### Test Suite 6: NetworkErrorModal

#### Test 6.1: Red Incorrecta >10s
**Precondiciones:**
- Usuario en red incorrecta
- Esperar >10 segundos

**Pasos:**
1. Conectar a red incorrecta
2. Esperar 10+ segundos
3. Verificar que se muestra modal

**Resultado Esperado:**
- ✅ Se muestra modal "Wrong Network Detected"
- ✅ Se muestra mensaje claro
- ✅ Se ofrecen opciones de acción

**Evidencia:**
```
Screenshot: network-error-modal.png
```

---

#### Test 6.2: RPC Offline
**Precondiciones:**
- AndeChain RPC apagado

**Pasos:**
1. Apagar AndeChain RPC
2. Navegar a dashboard
3. Esperar a que se detecte

**Resultado Esperado:**
- ✅ Se muestra modal "Network Connection Error"
- ✅ Se muestra URL del RPC
- ✅ Se ofrece opción de reintentar

**Evidencia:**
```
Screenshot: rpc-offline-modal.png
Console: "RPC Endpoint Offline"
```

---

### Test Suite 7: Responsive Design

#### Test 7.1: Mobile (320px)
**Precondiciones:**
- Abrir DevTools
- Emular dispositivo: iPhone SE

**Pasos:**
1. Navegar a login
2. Verificar que se muestra correctamente
3. Conectar wallet
4. Verificar header en mobile

**Resultado Esperado:**
- ✅ Botón es compacto
- ✅ Solo muestra icono + address corta
- ✅ No hay overflow
- ✅ Touch-friendly

**Evidencia:**
```
Screenshot: mobile-login.png
Screenshot: mobile-dashboard.png
```

---

#### Test 7.2: Tablet (768px)
**Precondiciones:**
- Abrir DevTools
- Emular dispositivo: iPad

**Pasos:**
1. Navegar a dashboard
2. Verificar layout

**Resultado Esperado:**
- ✅ Layout es responsive
- ✅ Componentes se adaptan
- ✅ No hay overflow

**Evidencia:**
```
Screenshot: tablet-dashboard.png
```

---

#### Test 7.3: Desktop (1920px)
**Precondiciones:**
- Pantalla de escritorio

**Pasos:**
1. Navegar a dashboard
2. Verificar layout completo

**Resultado Esperado:**
- ✅ Todos los componentes visibles
- ✅ Layout óptimo
- ✅ Información clara

**Evidencia:**
```
Screenshot: desktop-dashboard.png
```

---

## 📊 Matriz de Cobertura

| Test Suite | Test Cases | Status | Notes |
|-----------|-----------|--------|-------|
| Conexión Inicial | 4 | ⏳ Pending | |
| Auto-Reconexión | 2 | ⏳ Pending | |
| Cambio de Red | 3 | ⏳ Pending | |
| WalletButton | 6 | ⏳ Pending | |
| ChainInfoCard | 3 | ⏳ Pending | |
| NetworkErrorModal | 2 | ⏳ Pending | |
| Responsive Design | 3 | ⏳ Pending | |
| **TOTAL** | **23** | | |

---

## 🐛 Reporte de Bugs

### Formato
```markdown
## Bug: [Título]

**Severidad:** Critical / High / Medium / Low

**Precondiciones:**
- Paso 1
- Paso 2

**Pasos para Reproducir:**
1. Paso 1
2. Paso 2

**Resultado Esperado:**
- Comportamiento esperado

**Resultado Actual:**
- Comportamiento actual

**Evidencia:**
- Screenshot
- Console logs
- Network logs

**Notas:**
- Información adicional
```

---

## ✅ Checklist de Finalización

- [ ] Todos los test cases ejecutados
- [ ] Todos los test cases pasaron
- [ ] No hay bugs críticos
- [ ] Performance es aceptable
- [ ] Responsive design funciona
- [ ] Documentación actualizada
- [ ] Code review completado
- [ ] Ready for production

---

## 📞 Contacto

Para preguntas o problemas durante testing:
1. Revisar la documentación en `METAMASK_IMPROVEMENTS_SUMMARY.md`
2. Revisar los logs en la consola del navegador
3. Contactar al equipo de desarrollo

---

**Última actualización:** Octubre 16, 2025
**Versión:** 1.0.0
