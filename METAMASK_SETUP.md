# Guía de Configuración de MetaMask para AndeChain

Esta guía te ayudará a conectar tu wallet MetaMask con AndeChain para poder interactuar con el ecosistema.

## 📋 Requisitos Previos

- Un navegador web moderno (Chrome, Firefox, Brave, Edge)
- Conexión a Internet
- Nodo local de AndeChain corriendo en `http://localhost:8545` (para desarrollo local)

## 🦊 Paso 1: Instalar MetaMask

### ¿Qué es MetaMask?

MetaMask es una wallet de criptomonedas que funciona como extensión de navegador. Te permite:
- Gestionar tus activos de criptomonedas
- Conectarte a aplicaciones descentralizadas (dApps)
- Firmar transacciones de forma segura
- Interactuar con múltiples redes blockchain

### Instalación

1. **Visita el sitio oficial de MetaMask:**
   - Ve a https://metamask.io/download/
   - ⚠️ Importante: Siempre descarga desde el sitio oficial

2. **Completa la instalación y configura tu wallet**

## 🌐 Paso 2: Agregar la Red AndeChain

### Método Automático (Recomendado)

1. Haz clic en "Connect Wallet" en el dashboard
2. MetaMask te solicitará agregar la red AndeChain
3. Acepta y confirma la conexión

### Método Manual

Network Name:       AndeChain Local
RPC URL:           http://localhost:8545
Chain ID:          1234
Currency Symbol:   ANDE
Block Explorer:    http://localhost:8545

## ⚠️ Advertencias de Seguridad de MetaMask

**¡Es NORMAL que MetaMask muestre advertencias!** Cuando agregues AndeChain, MetaMask puede mostrar mensajes como:

- ❗ "Este símbolo de token no coincide con el nombre de la red"
- ❗ "El ID de cadena devuelto no coincide"
- ❗ "Cuidado con estafas en la red"

### ¿Por qué aparecen estas advertencias?

MetaMask compara los datos de tu red con su base de datos de redes conocidas. Como AndeChain es una red **local de desarrollo** y no está en su registro oficial, MetaMask no puede verificarla automáticamente.

### ¿Es seguro continuar?

**SÍ, es completamente seguro** si:
- ✅ Estás en tu computadora local
- ✅ La RPC URL es `http://localhost:8545`
- ✅ El Chain ID es `1234`
- ✅ Estás desarrollando/probando AndeChain

**NO continúes** si:
- ❌ No reconoces la red
- ❌ La URL parece sospechosa
- ❌ Te pidieron agregar la red desde un sitio desconocido

### Cómo proceder con las advertencias

1. **Lee las advertencias cuidadosamente**
2. **Verifica que los datos sean correctos:**
   - Network Name: `AndeChain Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `1234`
   - Symbol: `ANDE`
3. **Haz clic en "Aprobar" o "Approve"**
4. **Las advertencias desaparecerán después de agregar la red**

### Captura de pantalla de referencia

Cuando veas la advertencia, simplemente:
1. Revisa que los datos sean correctos
2. Marca la casilla "Entiendo los riesgos" (si aparece)
3. Haz clic en "Aprobar" o "Approve"

## 💰 Obtener Tokens ANDE

1. Ve a la página "Faucet" en el menú lateral
2. Haz clic en "Request 10 ANDE Tokens"
3. Los tokens se enviarán instantáneamente

## 🔍 Verificar la Conexión

Después de conectar tu wallet:

1. **Verifica el Chain ID en MetaMask:**
   - Abre MetaMask
   - Deberías ver "AndeChain Local" en la parte superior
   - El ícono de la red debería ser el predeterminado

2. **Verifica tu balance:**
   - Ve al Dashboard
   - Deberías ver tu dirección de wallet en el header
   - Tu balance inicial será 0 ANDE

3. **Obtén tokens del faucet:**
   - Ve a la página "Faucet"
   - Solicita 10 ANDE
   - Verifica que tu balance se actualice en el Dashboard

¡Listo para usar AndeChain! 🎉
