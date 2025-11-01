# Actualización de Variables de Ambiente en Vercel

## ⚠️ IMPORTANTE: Actualizar estas variables en Vercel

Después de hacer push de estos cambios, debes actualizar las siguientes variables en tu dashboard de Vercel:

### Variables a ACTUALIZAR (valores incorrectos):

```bash
# CAMBIAR de valor antiguo a nuevo:
NEXT_PUBLIC_ANDE_TOKEN_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

**Valor anterior (INCORRECTO)**: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`  
**Valor nuevo (CORRECTO)**: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`

### Variables a AGREGAR (nuevas):

```bash
# Governance
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e

# Staking
NEXT_PUBLIC_ANDE_NATIVE_STAKING_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853

# Timelock Controller
NEXT_PUBLIC_TIMELOCK_ADDRESS=0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
```

## Direcciones de Contratos en Producción (Chain ID 6174)

| Contrato | Dirección | Estado |
|----------|-----------|--------|
| **ANDE Token (Token Duality)** | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` | ✅ Deployado |
| **AndeGovernor** | `0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e` | ✅ Deployado |
| **AndeNativeStaking** | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` | ✅ Deployado |
| **AndeTimelockController** | `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` | ✅ Deployado |
| **ANDE Native Precompile** | `0x00000000000000000000000000000000000000FD` | ✅ Nativo |

## Pasos para Actualizar en Vercel

1. Ve a: https://vercel.com/dashboard/[tu-proyecto]/settings/environment-variables
2. Busca `NEXT_PUBLIC_ANDE_TOKEN_ADDRESS`
3. Haz clic en **Edit** (los tres puntos)
4. Cambia el valor a: `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707`
5. Agrega las variables nuevas de Governance, Staking y Timelock
6. **Save**
7. Ve a **Deployments** → **Redeploy** (usa el botón de tres puntos en el último deployment)

## Verificación Post-Deployment

Después del redeploy, verifica en la consola del navegador:

```javascript
// Debería mostrar:
console.log(process.env.NEXT_PUBLIC_ANDE_TOKEN_ADDRESS)
// "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
```

También verifica que MetaMask muestre:
- Chain ID: **6174**
- RPC URL: **http://189.28.81.202:8545**
- Network Name: **AndeChain Testnet**

## Características de los Contratos Deployados

### ANDE Token (Token Duality)
- ✅ Core Token Duality implementado
- ✅ Precompile nativo en `0x00...FD`
- ✅ Compatible ERC-20 para dApps
- ✅ Funciona como moneda nativa para gas fees
- ✅ Incluye: ERC20Votes, Permit, Burnable, Pausable, UUPS

### AndeNativeStaking
- ✅ 3 niveles de staking: Liquidity, Governance, Sequencer
- ✅ Lock periods con multipliers (1x-2x voting power)
- ✅ Flash loan protection
- ✅ Circuit breakers para seguridad
- ✅ Slashing mechanism para sequencers

### AndeGovernor
- ✅ Dual Token Voting (ANDE + Staking bonus)
- ✅ Adaptive Quorum (4%-15% dinámico)
- ✅ Multi-Level Proposals (4 tipos)
- ✅ Emergency Council
- ✅ Integración completa con Timelock

### AndeTimelockController
- ✅ Delay de 1 hora para seguridad
- ✅ Configurado con roles proper
- ✅ Controlado por governance
