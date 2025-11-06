# 🚀 ANDE BLOCKCHAIN FRONTEND - VERCEL DEPLOYMENT GUIDE

## 📋 Tabla de Contenidos
1. [Pre-requisitos](#pre-requisitos)
2. [Verificación Local](#verificación-local)
3. [Configuración Vercel](#configuración-vercel)
4. [Deployment](#deployment)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-requisitos

### Requisitos Previos
- ✅ Node.js 18+ instalado
- ✅ npm o yarn instalado
- ✅ Cuenta en Vercel (https://vercel.com)
- ✅ Git configurado
- ✅ Acceso a repositorio

### Verificar Requisitos
```bash
# Verificar Node.js
node --version
# Debe ser v18+

# Verificar npm
npm --version

# Verificar Git
git --version
```

---

## 🔍 Verificación Local

### 1. Ejecutar Script de Validación

```bash
# Instalar dependencias primero (si aún no lo has hecho)
npm install

# Ejecutar validación de configuración
npm run validate

# O ejecutar directamente:
npx ts-node scripts/validate-blockchain-config.ts
```

**Debe mostrar:**
```
✅ All validations passed!
```

Si hay errores, corregir antes de continuar.

### 2. Verificar Build Local

```bash
# Build de producción
npm run build

# Debe completar sin errores:
# ✔ Compiled successfully
# ✔ Ready for production
```

### 3. Probar Localmente

```bash
# Iniciar servidor de producción
npm run start

# Visitar http://localhost:3000
# Verificar que la aplicación carga correctamente
# Verificar en DevTools que se conecta a la blockchain
```

### 4. Verificar Conexión a Blockchain

En la consola del navegador (DevTools → Console):
```javascript
// Debería devolver el bloque actual
// [BlockchainService] Block: 12345
```

---

## 🔧 Configuración Vercel

### 1. Conectar Repositorio a Vercel

**Opción A: Mediante Dashboard Vercel**
1. Ve a https://vercel.com/dashboard
2. Click en "Add New..." → "Project"
3. Busca tu repositorio
4. Click "Import"

**Opción B: CLI Vercel**
```bash
# Instalar Vercel CLI (si aún no lo tienes)
npm i -g vercel

# Deploy desde tu directorio del proyecto
cd /Users/munay/dev/ande-labs/andefrontend
vercel

# Seguir las instrucciones interactivas
```

### 2. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel → Settings → Environment Variables

**Agregar todas estas variables:**

```
# BLOCKCHAIN CONFIGURATION
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_CHAIN_ID=6174
NEXT_PUBLIC_CHAIN_ID_HEX=0x181e
NEXT_PUBLIC_CHAIN_NAME=Ande Network
NEXT_PUBLIC_NETWORK_NAME=Ande Network
NEXT_PUBLIC_CURRENCY_NAME=ANDE
NEXT_PUBLIC_CURRENCY_SYMBOL=ANDE
NEXT_PUBLIC_CURRENCY_DECIMALS=18

# RPC ENDPOINTS
NEXT_PUBLIC_RPC_HTTP=https://rpc.ande.network
NEXT_PUBLIC_RPC_WS=wss://rpc.ande.network
NEXT_PUBLIC_RPC_TIMEOUT=30000
NEXT_PUBLIC_RPC_RETRIES=3

# WEBSOCKET
NEXT_PUBLIC_WS_ENABLED=true
NEXT_PUBLIC_WS_RECONNECT_INTERVAL=5000
NEXT_PUBLIC_WS_RECONNECT_MAX_ATTEMPTS=10

# PUBLIC SERVICES
NEXT_PUBLIC_API_URL=https://api.ande.network
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_API_RETRIES=3

# EXPLORER
NEXT_PUBLIC_EXPLORER_URL=https://explorer.ande.network
NEXT_PUBLIC_EXPLORER_TX_URL=https://explorer.ande.network/tx
NEXT_PUBLIC_EXPLORER_ADDRESS_URL=https://explorer.ande.network/address

# MONITORING
NEXT_PUBLIC_GRAFANA_URL=https://grafana.ande.network
NEXT_PUBLIC_STATS_URL=https://stats.ande.network
NEXT_PUBLIC_VISUALIZER_URL=https://visualizer.ande.network

# ADDITIONAL SERVICES
NEXT_PUBLIC_FAUCET_URL=https://faucet.ande.network
NEXT_PUBLIC_SIGNATURES_URL=https://signatures.ande.network

# CONTRACTS
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0x00000000000000000000000000000000000000FD

# FEATURES
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
NEXT_PUBLIC_ENABLE_DEX=false
NEXT_PUBLIC_ENABLE_BRIDGE=false
NEXT_PUBLIC_ENABLE_FAUCET=true
NEXT_PUBLIC_ENABLE_EXPLORER=true

# SECURITY
NEXT_PUBLIC_ENABLE_CORS=true
NEXT_PUBLIC_ALLOWED_ORIGINS=https://ande.network,https://www.ande.network
NEXT_PUBLIC_CORS_CREDENTIALS=true

# ANALYTICS
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_LOG_LEVEL=info

# PERFORMANCE
NEXT_PUBLIC_CACHE_ENABLED=true
NEXT_PUBLIC_CACHE_DURATION=300000
NEXT_PUBLIC_REVALIDATE_TIME=60

# ADVANCED
NEXT_PUBLIC_HEALTH_CHECK_ENABLED=true
NEXT_PUBLIC_HEALTH_CHECK_INTERVAL=30000
NEXT_PUBLIC_WATCH_BLOCKS=true
NEXT_PUBLIC_BLOCK_WATCH_INTERVAL=2000
NEXT_PUBLIC_TX_CONFIRMATION_BLOCKS=1
NEXT_PUBLIC_TX_TIMEOUT=60000

# ENVIRONMENT
NODE_ENV=production
```

**Importante:** Asegúrate de que todas las variables sean `NEXT_PUBLIC_*` (públicas)

### 3. Configurar Dominios (Opcional pero Recomendado)

En Settings → Domains:

```
ande.network          → tu-proyecto.vercel.app
www.ande.network      → tu-proyecto.vercel.app
```

**Pasos:**
1. Click en "Add"
2. Ingresa el dominio
3. Vercel te dará registros DNS a configurar
4. Configura los registros en tu proveedor DNS (Cloudflare, etc.)
5. Espera a que se propague (5-30 minutos)

---

## 🚀 Deployment

### Opción 1: Deployment Automático (Recomendado)

Una vez conectado el repositorio a Vercel:

```bash
# Hacer push a tu rama principal
git add .
git commit -m "Update blockchain configuration for production"
git push origin main
```

**Vercel automáticamente:**
- ✅ Detecta el push
- ✅ Ejecuta build
- ✅ Ejecuta tests
- ✅ Deploya si todo está OK

### Opción 2: Deploy Manual con CLI

```bash
# Desde el directorio del proyecto
vercel --prod

# Vercel te pedirá confirmación
# Escribe 'y' y presiona Enter
```

### Verificar Deployment

1. **En Dashboard Vercel:**
   - Ve a tu proyecto
   - Verifica que el estado sea "Ready"

2. **URL de Producción:**
   - Vercel crea una URL automática
   - Ejemplo: `https://ande-frontend.vercel.app`
   - También puedes usar tu dominio personalizado

---

## ✅ Post-Deployment

### 1. Verificar Que Todo Funciona

```bash
# Visitar tu URL desplegada
https://tu-dominio.vercel.app

# O si usas dominio personalizado
https://ande.network
```

**Verificar en el navegador:**
- ✅ La página carga correctamente
- ✅ No hay errores de JavaScript (DevTools → Console)
- ✅ Los estilos se ven bien
- ✅ Las imágenes se cargan

### 2. Validar Conexión a Blockchain

Abrir DevTools (F12) → Console:

```javascript
// Deberías ver logs similares a:
// [BlockchainService] Connection verified
// Chain ID: 6174
// Block: 12345
```

### 3. Probar Funcionalidades Principales

- [ ] Conectar wallet (MetaMask)
- [ ] Ver balance
- [ ] Ver bloques
- [ ] Ver transacciones
- [ ] Acceder al explorer

### 4. Revisar Deployment Logs

En Dashboard Vercel → Deployments → [Tu deployment]

Busca errores o warnings importantes.

### 5. Configurar Monitoreo

**En Vercel Dashboard → Analytics:**
- Monitorear performance
- Verificar Core Web Vitals
- Revisar errores

### 6. Configurar Sentry (Opcional pero Recomendado)

Para monitoreo de errores en producción:

```bash
# Instalar Sentry
npm install @sentry/nextjs

# Configurar en next.config.ts (si quieres)
# Ver documentación oficial
```

---

## 🔄 Actualizaciones Futuras

### Para Actualizar Tu Aplicación

```bash
# 1. Hacer cambios locales
# 2. Testear localmente
npm run dev

# 3. Si todo bien, hacer commit
git add .
git commit -m "Fix: description of changes"

# 4. Push a GitHub
git push origin main

# 5. Vercel automáticamente deploya (opcional)
```

### Para Hacer Rollback a Versión Anterior

En Dashboard Vercel → Deployments:
- Busca el deployment anterior
- Click en los 3 puntos
- Selecciona "Promote to Production"

---

## 🆘 Troubleshooting

### Problema: Build Falla en Vercel

**Síntomas:**
- Dashboard muestra "Error" en el build
- Página dice "Build Failed"

**Solución:**
1. Click en el deployment
2. Ver logs del error
3. Verificar que `.env.production` tiene las variables correctas
4. Hacer push nuevamente

### Problema: Aplicación Carga pero No Se Conecta a Blockchain

**Síntomas:**
- Página carga pero dice "Not Connected"
- Console shows "RPC error"

**Solución:**
```javascript
// Abrir DevTools → Console
// Verificar que RPC URL sea correcto:
console.log(process.env.NEXT_PUBLIC_RPC_HTTP)
// Debe mostrar: https://rpc.ande.network

// Si no, verificar variables de entorno en Vercel Dashboard
```

### Problema: CORS Error

**Síntomas:**
- Console muestra "Access to XMLHttpRequest blocked by CORS policy"

**Solución:**
- Las variables de entorno deben estar configuradas
- Cloudflare maneja CORS automáticamente
- Verifica que `NEXT_PUBLIC_ALLOWED_ORIGINS` esté correcto

### Problema: Dominio No Resuelve

**Síntomas:**
- Dominio personalizado dice "DNS_PROBE_FINISHED_NXDOMAIN"

**Solución:**
1. Verificar registros DNS en tu proveedor (Cloudflare, etc.)
2. Copiar registros exactamente como Vercel dice
3. Esperar propagación (5-30 minutos)
4. Usar `nslookup` para verificar:
```bash
nslookup ande.network
# Debería mostrar IPs de Vercel
```

### Problema: Performance Lenta

**Síntomas:**
- Página tarda mucho en cargar
- Bloques/transacciones tardan mucho

**Solución:**
1. Verificar latencia RPC
2. Aumentar timeouts si es necesario
3. Usar Vercel Analytics para identificar cuello de botella
4. Verificar que Cloudflare esté proxying correctamente

### Problema: Sesión Se Cierra al Actualizar

**Síntomas:**
- Wallet desconecta al hacer F5

**Solución:**
- Esto es comportamiento normal (web3 sin persistencia)
- Para solucionarlo, usar `useWalletPersistence` hook
- O configurar localStorage para guardar conexión

---

## 📊 Monitoreo en Producción

### Vercel Analytics

```
Dashboard → Analytics
- Monitorar latencia
- Verificar Core Web Vitals
- Revisar errores
```

### Blockchain Health

```
Dashboard debería mostrar:
- Block numbers actualizándose
- Gas prices en tiempo real
- Transacciones confirmándose
```

### Logs

```bash
# Ver logs en vivo
vercel logs

# Ver logs filtrados
vercel logs --follow
```

---

## 🔐 Seguridad en Producción

### Verificaciones

- ✅ `NEXT_PUBLIC_DEBUG=false` en producción
- ✅ No incluir private keys en variables de entorno
- ✅ Habilitar DDoS protection en Cloudflare
- ✅ Configurar rate limiting si es necesario

### Certificados SSL

- ✅ Vercel automáticamente genera certificados SSL
- ✅ Renovación automática
- ✅ HTTPS por defecto

---

## 📝 Checklist Pre-Deploy

Antes de desplegar, verifica:

- [ ] Script de validación pasa sin errores
- [ ] Build local completa sin errores
- [ ] Aplicación funciona localmente
- [ ] Variables de entorno configuradas en Vercel
- [ ] Dominio configurado (si aplica)
- [ ] Tests pasan (si tienes tests)
- [ ] No hay errores en la consola
- [ ] Blockchain conecta correctamente
- [ ] Wallet puede conectarse

---

## 🎉 ¡Listo!

Tu aplicación ANDE está **listo para producción** en Vercel.

### Próximos Pasos

1. Monitorea los logs y analytics
2. Configura alertas si es necesario
3. Mantén `.env.production` actualizado
4. Haz backup de la configuración
5. Documenta cualquier cambio importante

---

## 📞 Soporte

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **ANDE Docs**: https://docs.ande.network
- **Discord**: https://discord.gg/andelabs

---

**Última actualización**: 2025-11-06
**Versión**: 2.0.0
**Status**: Production Ready ✅
