# 🔗 AndeChain Integration Guide

## ✅ Integración Completada

El frontend de AndeChain ahora está completamente integrado con la blockchain local. Todos los componentes están configurados para conectarse a la instancia de desarrollo.

---

## 📋 Características Implementadas

### 1. Conexión con la Chain Local
- **RPC Endpoint**: `http://localhost:8545` (EV-Reth)
- **Chain ID**: `8086`
- **Configuración dinámica**: El frontend detecta automáticamente si usar la chain local o testnet basado en la variable de entorno `NEXT_PUBLIC_USE_LOCAL_CHAIN`

### 2. Componentes Nuevos

#### 🔍 Chain Explorer (`/developer`)
- Visualiza los últimos 10 bloques en tiempo real
- Muestra detalles de cada bloque:
  - Número de bloque
  - Hash
  - Timestamp
  - Número de transacciones
  - Uso de gas
- Actualización automática cuando se minan nuevos bloques

#### 💧 Faucet
- Request tokens de prueba (AND)
- Configurable de 1 a 100 AND por solicitud
- Funciona con billeteras conectadas o direcciones manuales
- Integrado con el servidor de faucet local

#### 🛠️ Developer Tools Dashboard
- Página dedicada en `/developer` con:
  - Métricas en tiempo real (bloque actual, balance, chain ID)
  - Links rápidos a servicios de infraestructura:
    - Prometheus (`:9090`)
    - Grafana (`:3000`)
    - Celestia Light Node (`:26658`)
    - Sequencer RPC (`:7331`)
  - Explorador de bloques integrado
  - Faucet para obtener tokens de prueba

### 3. Contratos Inteligentes

#### ABIs Integrados
Los siguientes ABIs están disponibles en `src/contracts/abis/`:
- `ANDEToken.json` - Token nativo de AndeChain
- `AndeGovernor.json` - Contrato de gobernanza
- `AndeSequencerRegistry.json` - Registro de sequencers
- `WAndeVault.json` - Vault de wrapping

#### Direcciones de Contratos
Las direcciones se configuran en `src/contracts/addresses.ts`. Actualmente están en `0x0000...` y deben actualizarse cuando los contratos sean deployed.

### 4. Navegación Actualizada
- Nuevo ítem en el sidebar: "Developer" con ícono de código
- Acceso rápido a herramientas de desarrollo desde el dashboard principal

---

## 🚀 Cómo Usar

### 1. Configurar Variables de Entorno

El archivo `.env.local` ya está creado con:

```bash
NEXT_PUBLIC_USE_LOCAL_CHAIN=true
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ANDECHAIN_RPC=http://localhost:8545
NEXT_PUBLIC_SEQUENCER_RPC=http://localhost:7331
NEXT_PUBLIC_ROLLKIT_RPC=http://localhost:26660
```

**Nota**: Necesitas obtener un `NEXT_PUBLIC_WC_PROJECT_ID` de [WalletConnect Cloud](https://cloud.walletconnect.com/) para la funcionalidad completa de conexión de wallets.

### 2. Iniciar el Frontend

```bash
cd andefrontend
npm run dev
```

El frontend estará disponible en `http://localhost:9002`

### 3. Conectar tu Wallet

1. Abre el frontend en tu navegador
2. Click en "Connect Wallet" en la esquina superior derecha
3. Selecciona tu wallet preferida (MetaMask, WalletConnect, etc.)
4. Asegúrate de estar en la red AndeChain Local (Chain ID: 8086)

### 4. Obtener Tokens de Prueba

1. Ve a `/developer` en el sidebar
2. En la sección "Faucet", ingresa la cantidad de AND tokens
3. Click en "Request Tokens"
4. Los tokens se enviarán a tu wallet conectada

### 5. Explorar la Chain

La página de Developer muestra:
- **Bloque actual**: Actualizado en tiempo real
- **Tu balance**: De AND tokens en tu wallet
- **Explorador de bloques**: Últimos 10 bloques con detalles
- **Links rápidos**: A servicios de infraestructura

---

## 🔌 Endpoints Disponibles

### Blockchain
- **EV-Reth RPC**: `http://localhost:8545`
- **Sequencer RPC**: `http://localhost:7331`
- **Rollkit RPC**: `http://localhost:26660`

### Monitoreo
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3000` (admin / ande_dev_2025)

### Data Availability
- **Celestia Light Node**: `http://localhost:26658`

### Faucet
- **Faucet Server**: `http://localhost:3001/faucet` (POST)

---

## 🔧 Próximos Pasos

### 1. Deploy de Contratos
Los contratos aún no están deployed en la chain local. Para deployarlos:

```bash
cd andechain
make deploy-ecosystem
```

Luego actualiza las direcciones en `andefrontend/src/contracts/addresses.ts`

### 2. Integración de Contratos en UI
Una vez deployed, puedes integrar las funciones de los contratos:

```typescript
import { useContractRead, useContractWrite } from 'wagmi';
import ANDETokenABI from '@/contracts/abis/ANDEToken.json';
import { ANDECHAIN_CONTRACTS } from '@/contracts/addresses';

// Leer balance
const { data: balance } = useContractRead({
  address: ANDECHAIN_CONTRACTS.ANDEToken,
  abi: ANDETokenABI,
  functionName: 'balanceOf',
  args: [address],
});

// Escribir (transferir)
const { write: transfer } = useContractWrite({
  address: ANDECHAIN_CONTRACTS.ANDEToken,
  abi: ANDETokenABI,
  functionName: 'transfer',
});
```

### 3. Testing End-to-End
- Probar todas las funcionalidades con la chain local
- Verificar que las transacciones se ejecuten correctamente
- Testear el sistema de gobernanza con propuestas reales
- Validar el staking con contratos deployed

### 4. Optimizaciones
- Implementar cache de datos de blockchain
- Agregar manejo de errores más robusto
- Mejorar UX con loaders y estados de carga
- Implementar reconexión automática si la chain se cae

---

## 📚 Recursos Adicionales

### Documentación
- [Wagmi Docs](https://wagmi.sh/) - Hooks de React para Ethereum
- [Viem Docs](https://viem.sh/) - TypeScript interface para Ethereum
- [Next.js Docs](https://nextjs.org/docs) - Framework React

### Herramientas de Desarrollo
- **Hardhat Console**: Para interactuar con contratos desde CLI
- **Remix IDE**: Para testing rápido de contratos
- **Tenderly**: Para debugging de transacciones

---

## 🐛 Troubleshooting

### La wallet no se conecta
- Verifica que MetaMask esté configurado con la red AndeChain Local
- **Network Name**: AndeChain Local
- **RPC URL**: http://localhost:8545
- **Chain ID**: 8086
- **Currency Symbol**: AND

### El explorador no muestra bloques
- Verifica que el nodo EV-Reth esté corriendo en `localhost:8545`
- Ejecuta `./monitor-logs.sh status` para verificar el estado

### El faucet no funciona
- Asegúrate de que el servidor de faucet esté corriendo
- Verifica que `http://localhost:3001/faucet` responda

### Los contratos no están disponibles
- Los contratos deben ser deployed primero con `make deploy-ecosystem`
- Las direcciones deben actualizarse en `src/contracts/addresses.ts`

---

**Estado**: ✅ Integración base completada - Lista para testing y desarrollo

**Última actualización**: Octubre 16, 2025
