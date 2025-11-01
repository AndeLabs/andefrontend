# 🚀 Quick Start - AndeChain Frontend

## ✅ Tu blockchain ya está corriendo!

Tu AndeChain está activa en:
- **RPC HTTP**: http://localhost:8545
- **Chain ID**: 6174
- **Bloque Actual**: ~15,154
- **Estado**: ✅ Produciendo bloques cada 2 segundos

---

## 📋 Pasos para ver tu Web conectada con la Blockchain

### 1️⃣ Instalar dependencias (si no lo has hecho)

```bash
cd /Users/munay/dev/ande-labs/andefrontend
npm install
```

### 2️⃣ Iniciar el servidor de desarrollo

```bash
npm run dev
```

Tu web estará disponible en: **http://localhost:9002**

### 3️⃣ Abrir en el navegador

Abre tu navegador y ve a: http://localhost:9002

---

## 🎯 ¿Qué puedes hacer ahora?

### ✨ Explorar la Nueva Página de Integración

1. Ve a **Integration Guide** en el menú lateral (tiene un badge "New")
2. Haz clic en **"Add to MetaMask"** para agregar AndeChain a tu wallet
3. Explora los ejemplos de código para Web3.js, Ethers.js, Viem, y Hardhat

### 📊 Ver el Estado de la Red

1. Ve a **Network Status** en el menú
2. Verás métricas en tiempo real:
   - Último bloque producido
   - Gas price actual
   - TPS (transacciones por segundo)
   - Gráficas de actividad

### 💧 Solicitar Tokens de Prueba

1. Ve a **Faucet** en el menú
2. Conecta tu wallet
3. Solicita ANDE tokens para hacer pruebas

### 🔧 Herramientas de Desarrollador

1. Ve a **Developer Tools**
2. Puedes:
   - Desplegar contratos inteligentes
   - Interactuar con contratos existentes
   - Codificar/decodificar datos

---

## 🌍 Cómo exponer tu Web al Mundo

Actualmente estás en modo **development** (solo localhost). Para hacer que tu web sea accesible desde internet:

### Opción 1: Cambiar a modo Production (Misma máquina)

1. **Edita `.env.local`** y cambia:
   ```bash
   NEXT_PUBLIC_ENV=production
   ```

2. **Actualiza las URLs RPC** en `.env.local`:
   ```bash
   # Descomenta estas líneas
   NEXT_PUBLIC_RPC_HTTP=http://189.28.81.202:8545
   NEXT_PUBLIC_RPC_WS=ws://189.28.81.202:8546
   ```

3. **Build y Deploy**:
   ```bash
   npm run build
   npm start
   ```

4. **Configura Nginx** (ver DEPLOYMENT_GUIDE.md)

### Opción 2: Desplegar en Vercel (Recomendado para facilidad)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Vercel te dará una URL pública automáticamente (ej: `andechain.vercel.app`)

---

## 🔥 Servicios que están corriendo

Según tu análisis, estos servicios están activos:

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| EV-Reth RPC | 8545 | http://localhost:8545 | ✅ Running |
| EV-Reth WebSocket | 8546 | ws://localhost:8546 | ✅ Running |
| Celestia Light | 26658 | http://localhost:26658 | ✅ Running |
| cAdvisor Metrics | 8080 | http://localhost:8080 | ✅ Running |
| Loki Logs | 3100 | http://localhost:3100 | ✅ Running |
| Nginx Proxy | 80/443 | http://localhost | ✅ Running |

### ⚠️ Servicios detenidos (puedes reiniciarlos si los necesitas):

- **Prometheus**: Para métricas (puerto 9090)
- **Grafana**: Para dashboards (puerto 3000)
- **Evolve Sequencer**: Capa de consenso

Para reiniciar los servicios de monitoreo:

```bash
cd /Users/munay/dev/ande-labs/andechain
docker-compose up -d prometheus grafana evolve-sequencer
```

---

## 🧪 Probar la Conexión

### Test 1: Verificar que el RPC funciona

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Deberías ver algo como:
```json
{"jsonrpc":"2.0","id":1,"result":"0x3b32"}
```

### Test 2: Agregar red a MetaMask

1. Abre MetaMask
2. Ve a la página de Integration Guide: http://localhost:9002/integration
3. Haz clic en **"Add to MetaMask"**
4. Acepta en MetaMask
5. ¡Listo! Deberías ver "AndeChain Testnet" en tu lista de redes

### Test 3: Ver bloques en tiempo real

1. Ve a Network Status: http://localhost:9002/network
2. Deberías ver el número de bloque incrementando cada 2 segundos
3. Las gráficas se actualizarán automáticamente

---

## 📚 Documentación Útil

- **DEPLOYMENT_GUIDE.md**: Guía completa de deployment a producción
- **.env.example**: Variables de entorno disponibles
- **Integration Page**: http://localhost:9002/integration (ejemplos de código)

---

## 🐛 Solución de Problemas

### La web no carga

```bash
# Verifica que no haya otro servicio en el puerto 9002
lsof -i :9002

# Si hay algo, cámbialo en .env.local:
PORT=3000

# Reinicia
npm run dev
```

### No se conecta a la blockchain

```bash
# Verifica que el RPC esté corriendo
curl http://localhost:8545

# Verifica los logs del nodo
cd /Users/munay/dev/ande-labs/andechain
docker-compose logs -f ev-reth-sequencer
```

### Error "NEXT_PUBLIC_ENV is not defined"

No te preocupes, es normal. El `.env.local` que creamos tiene valores por defecto. La app funcionará.

---

## 🎨 Nuevas Características Agregadas

### 1. Integration Guide Page (/integration)
- Información completa de la red
- Ejemplos de código para 4 librerías diferentes
- Botón "Add to MetaMask" funcional
- Enlaces a recursos y documentación

### 2. Configuración Dinámica de RPC
- Cambia automáticamente entre desarrollo y producción
- Solo necesitas cambiar `NEXT_PUBLIC_ENV` en `.env.local`
- No más hardcoding de URLs

### 3. Sidebar Actualizado
- Nueva opción "Integration Guide" con badge "New"
- Mejor organización del menú

---

## 🚀 Próximos Pasos

1. ✅ **Ahora**: Ejecuta `npm run dev` y explora tu web
2. 📱 Agrega AndeChain a MetaMask desde la Integration page
3. 💧 Solicita tokens del faucet (si lo tienes corriendo)
4. 🔧 Prueba las Developer Tools
5. 🌍 Cuando estés listo, sigue DEPLOYMENT_GUIDE.md para exposición pública

---

## 💡 Tips

- **Hot Reload**: Los cambios en el código se reflejan automáticamente
- **Console**: Abre DevTools (F12) para ver logs de conexión
- **Network Tab**: Útil para debuggear llamadas RPC
- **MetaMask**: Asegúrate de estar en la red correcta (ChainID 6174)

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en la terminal donde ejecutaste `npm run dev`
2. Verifica que tu blockchain esté corriendo (http://localhost:8545)
3. Revisa la sección de Troubleshooting en DEPLOYMENT_GUIDE.md

---

**¡Listo para empezar! 🎉**

```bash
npm run dev
# Luego abre: http://localhost:9002
```
