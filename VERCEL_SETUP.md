# 🚀 Vercel Deployment Guide for AndeChain Frontend

## 📋 Resumen

Tu web **ande.network** se desplegará en Vercel y se conectará a tu blockchain AndeChain corriendo en **189.28.81.202:8545**

---

## ⚡ Opción 1: Deploy Rápido (Recomendado)

### Paso 1: Push los cambios a GitHub (Ya hecho ✅)

Los cambios ya están en tu repositorio: `AndeLabs/andefrontend`

### Paso 2: Conectar Vercel con GitHub

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Busca tu repositorio: **AndeLabs/andefrontend**
4. Click en **"Import"**

### Paso 3: Configurar Variables de Entorno en Vercel

En la página de configuración del proyecto, ve a **"Environment Variables"** y agrega estas:

```bash
# IMPORTANTE: Copia y pega estas variables exactamente

NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_CHAIN_ID=6174
NEXT_PUBLIC_NETWORK_NAME=AndeChain Testnet

# RPC Endpoints (Tu blockchain)
NEXT_PUBLIC_RPC_HTTP=http://189.28.81.202:8545
NEXT_PUBLIC_RPC_WS=ws://189.28.81.202:8546

# Servicios
NEXT_PUBLIC_FAUCET_URL=http://189.28.81.202:3001
NEXT_PUBLIC_EXPLORER_URL=http://189.28.81.202:4000
NEXT_PUBLIC_GRAFANA_URL=http://189.28.81.202:3000
NEXT_PUBLIC_PROMETHEUS_URL=http://189.28.81.202:9090

# Externos
NEXT_PUBLIC_CELESTIA_EXPLORER=https://mocha-4.celenium.io
NEXT_PUBLIC_DOCS_URL=https://docs.ande.network
NEXT_PUBLIC_SUPPORT_URL=https://discord.gg/andelabs

# Contratos
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Features (deshabilitados por ahora)
NEXT_PUBLIC_ENABLE_STAKING=false
NEXT_PUBLIC_ENABLE_GOVERNANCE=false
NEXT_PUBLIC_ENABLE_DEX=false
NEXT_PUBLIC_ENABLE_BRIDGE=false

# Production
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
```

### Paso 4: Configurar el Dominio

1. En tu proyecto de Vercel, ve a **"Settings"** → **"Domains"**
2. Agrega tu dominio: **ande.network**
3. Si también quieres: **www.ande.network**

Vercel te mostrará qué registros DNS agregar:

```
Type    Name              Value
----    ----              -----
A       @                 76.76.21.21  (IP de Vercel)
CNAME   www               cname.vercel-dns.com
```

### Paso 5: Deploy!

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. ¡Tu web estará live en ande.network! 🎉

---

## ⚡ Opción 2: Deploy desde CLI

Si prefieres usar la línea de comandos:

### Paso 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 2: Login a Vercel

```bash
vercel login
```

### Paso 3: Deploy

```bash
cd /Users/munay/dev/ande-labs/andefrontend

# Deploy a producción
vercel --prod
```

### Paso 4: Agregar Variables de Entorno

```bash
# Agregar cada variable
vercel env add NEXT_PUBLIC_ENV production
vercel env add NEXT_PUBLIC_CHAIN_ID 6174
vercel env add NEXT_PUBLIC_RPC_HTTP http://189.28.81.202:8545
# ... etc (todas las variables de arriba)
```

O usar el archivo `.env.production`:

```bash
# Subir todas las variables de una vez
vercel env pull .env.production
```

### Paso 5: Configurar Dominio

```bash
vercel domains add ande.network
```

---

## 🔧 Configuración de DNS

### En tu registrador de dominios (donde compraste ande.network):

Agrega estos registros DNS:

```dns
# Para el dominio principal (ande.network)
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto

# Para www (opcional)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

**Nota**: Vercel te dará la IP exacta cuando agregues el dominio. Usa esa.

---

## 🧪 Verificar el Deploy

### 1. Verifica que la web carga

```bash
curl https://ande.network
```

### 2. Verifica la conexión a tu blockchain

Abre DevTools (F12) en tu navegador y verifica que no haya errores de CORS.

### 3. Prueba agregar a MetaMask

1. Ve a https://ande.network/integration
2. Click en "Add to MetaMask"
3. Debería agregar AndeChain con RPC: http://189.28.81.202:8545

---

## ⚠️ IMPORTANTE: Configurar CORS en tu servidor

Para que tu blockchain sea accesible desde ande.network (que está en Vercel), necesitas habilitar CORS:

### Opción 1: Configurar CORS en EV-Reth

Edita tu configuración de docker-compose.yml:

```yaml
services:
  ev-reth-sequencer:
    environment:
      # Agregar estas líneas
      - RPC_CORS_ORIGINS=https://ande.network,https://www.ande.network
      - RPC_HTTP_CORS_ORIGINS=*
```

Luego reinicia:

```bash
cd /Users/munay/dev/ande-labs/andechain
docker-compose restart ev-reth-sequencer
```

### Opción 2: Usar Nginx como Proxy con CORS

Agrega a tu configuración de Nginx:

```nginx
server {
    listen 8545;
    
    location / {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        proxy_pass http://localhost:8545;
    }
}
```

---

## 🔄 Actualizar el Deploy

Cada vez que hagas cambios:

### Automático (Recomendado):

1. Haz commit y push a GitHub:
   ```bash
   git add .
   git commit -m "feat: nuevos cambios"
   git push origin main
   ```

2. Vercel detecta automáticamente y hace redeploy ✅

### Manual:

```bash
vercel --prod
```

---

## 📊 Monitorear tu Deploy

### Ver Analytics

1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto **andefrontend**
3. Ve a **Analytics** para ver:
   - Visitantes
   - Páginas más visitadas
   - Velocidad de carga
   - Errores

### Ver Logs

```bash
vercel logs
```

O en el dashboard: **Deployments** → Click en un deploy → **Logs**

---

## 🐛 Solución de Problemas

### Error: "Failed to fetch from RPC"

**Causa**: CORS no configurado o firewall bloqueando

**Solución**:
1. Verifica CORS (ver sección CORS arriba)
2. Verifica firewall:
   ```bash
   sudo ufw allow 8545/tcp
   sudo ufw reload
   ```

### Error: "Environment variables not defined"

**Solución**:
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que TODAS las variables estén agregadas
3. Redeploy: Settings → Deployments → Latest → ⋮ → Redeploy

### El dominio no carga

**Solución**:
1. Verifica DNS con: `dig ande.network`
2. Espera propagación (puede tomar hasta 48h)
3. Verifica en Vercel Dashboard → Domains que esté "Valid"

### Blockchain no conecta desde Vercel

**Causa**: La IP 189.28.81.202 podría no ser accesible públicamente

**Solución**: Verifica que tu ISP no esté bloqueando el puerto 8545:

```bash
# Desde otra máquina o usa un servicio online
curl http://189.28.81.202:8545
```

Si no funciona, considera:
1. Port forwarding en tu router
2. Usar un túnel como ngrok o Cloudflare Tunnel
3. Desplegar un proxy en un VPS

---

## 🎯 Checklist Final

Antes de compartir tu web:

- [ ] Deploy exitoso en Vercel
- [ ] Dominio ande.network apuntando correctamente
- [ ] SSL/HTTPS funcionando (Vercel lo hace automático)
- [ ] Conexión a blockchain funcionando
- [ ] MetaMask puede agregar la red
- [ ] Faucet accesible (si está corriendo)
- [ ] Explorer accesible (si está corriendo)
- [ ] Integration page carga correctamente
- [ ] Network status muestra datos en vivo

---

## 🚀 Próximos Pasos

Una vez desplegado:

1. ✅ Comparte la URL: **https://ande.network**
2. 📱 Prueba en diferentes dispositivos
3. 🧪 Haz pruebas de transacciones
4. 📊 Monitorea analytics en Vercel
5. 🔄 Itera y mejora basado en feedback

---

## 🆘 Ayuda Rápida

### Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs --follow

# Ver todas las variables de entorno
vercel env ls

# Remover un deploy malo
vercel remove [deployment-url]

# Ver información del proyecto
vercel inspect
```

### Links Útiles

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Docs de Vercel**: https://vercel.com/docs
- **Status de Vercel**: https://www.vercel-status.com/

---

## 📞 Contacto

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica que tu blockchain esté corriendo
3. Prueba las URLs directamente (http://189.28.81.202:8545)

---

**¡Listo para desplegar! 🎉**

El próximo paso es simplemente ir a vercel.com, conectar tu repo, y agregar las variables de entorno.
