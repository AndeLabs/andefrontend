# 🔐 Guía de Autenticación 100% Descentralizada

## Visión General

La dApp ANDE ahora utiliza **autenticación 100% descentralizada** basada en Web3 wallets. No hay dependencias de Firebase, Firestore o cualquier backend centralizado.

### Arquitectura

```
┌─────────────────────────────────────────┐
│         Web3Provider (Wagmi)            │
│  ├─ MetaMask                            │
│  ├─ WalletConnect                       │
│  └─ Coinbase Wallet                     │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      Custom Hooks (Web3-only)           │
│  ├─ useWalletConnection                 │
│  ├─ useTransactionHistory               │
│  └─ useWalletActions                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      localStorage (Client-side)         │
│  └─ Transaction history per wallet      │
└─────────────────────────────────────────┘
```

## Hooks Disponibles

### 1. `useTransactionHistory`

Hook para gestionar el historial de transacciones con localStorage.

**Ubicación:** `/src/hooks/use-transaction-history.ts`

**Uso:**

```tsx
'use client';

import { useTransactionHistory } from '@/hooks/use-transaction-history';

export function MyComponent() {
  const { 
    transactions,      // Transaction[]
    addTransaction,    // (tx: Omit<Transaction, 'id' | 'timestamp'>) => void
    updateTransaction, // (txId: string, updates: Partial<...>) => void
    clearHistory,      // () => void
    removeTransaction, // (txId: string) => void
    isLoading          // boolean
  } = useTransactionHistory();

  return (
    <div>
      {transactions.map(tx => (
        <div key={tx.id}>
          {tx.hash} - {tx.status}
        </div>
      ))}
    </div>
  );
}
```

**Interfaz de Transacción:**

```typescript
interface Transaction {
  id: string;                           // Auto-generado
  hash: string;                         // Hash de transacción
  from: string;                         // Dirección origen
  to: string;                           // Dirección destino
  value: string;                        // Cantidad (ej: "100 ANDE")
  timestamp: number;                    // Timestamp en ms
  status: 'pending' | 'success' | 'failed';
  type: string;                         // Tipo (Send, Receive, Staking, etc)
}
```

**Métodos:**

- `addTransaction(tx)` - Añade nueva transacción
- `updateTransaction(txId, updates)` - Actualiza transacción existente
- `clearHistory()` - Limpia todo el historial
- `removeTransaction(txId)` - Elimina transacción específica

**Características:**

- ✅ Historial persistente por wallet
- ✅ Máximo 100 transacciones por wallet
- ✅ Sincronización automática con localStorage
- ✅ Se limpia al cambiar de wallet
- ✅ Sin dependencias de backend

### 2. `useWalletActions`

Hook simplificado para acciones de wallet.

**Ubicación:** `/src/hooks/use-wallet-actions.ts`

**Uso:**

```tsx
'use client';

import { useWalletActions } from '@/hooks/use-wallet-actions';

export function DisconnectButton() {
  const { handleDisconnect } = useWalletActions();

  return (
    <button onClick={handleDisconnect}>
      Disconnect Wallet
    </button>
  );
}
```

**Métodos:**

- `handleDisconnect()` - Desconecta wallet, navega a home y muestra toast

### 3. `useWalletConnection` (Existente)

Hook puro Web3 para conexión de wallet.

**Ubicación:** `/src/hooks/use-wallet-connection.ts`

**Uso:**

```tsx
'use client';

import { useWalletConnection } from '@/hooks/use-wallet-connection';

export function WalletStatus() {
  const { isConnected, address, chainId } = useWalletConnection();

  if (!isConnected) return <div>Connect wallet</div>;

  return (
    <div>
      Connected: {address}
      Chain: {chainId}
    </div>
  );
}
```

## Flujo de Autenticación

### 1. Conexión Inicial

```
Usuario → Click "Connect Wallet"
  ↓
Web3Provider (Wagmi) → Abre selector de wallet
  ↓
Usuario selecciona wallet (MetaMask, WalletConnect, etc)
  ↓
Wallet conectada → useWalletConnection retorna address
  ↓
useTransactionHistory carga historial del localStorage
  ↓
Dashboard disponible
```

### 2. Transacción

```
Usuario → Ejecuta transacción (Send, Stake, etc)
  ↓
Wagmi hook → Ejecuta en blockchain
  ↓
useTransactionHistory.addTransaction()
  ↓
localStorage actualizado
  ↓
UI re-renderiza con nueva transacción
```

### 3. Cambio de Wallet

```
Usuario → Desconecta y conecta otra wallet
  ↓
useWalletConnection → address cambia
  ↓
useTransactionHistory → useEffect se dispara
  ↓
localStorage carga historial de nueva wallet
  ↓
UI muestra historial de nueva wallet
```

### 4. Desconexión

```
Usuario → Click "Disconnect"
  ↓
useWalletActions.handleDisconnect()
  ↓
Wagmi disconnect() → Wallet desconectada
  ↓
Router.push('/') → Navega a home
  ↓
Toast → Muestra confirmación
```

## Almacenamiento de Datos

### localStorage Structure

```javascript
// Clave: tx_history_0x1234567890abcdef...
// Valor:
[
  {
    id: "1729123456789_abc123def",
    hash: "0x1234...5678",
    from: "0x1234...5678",
    to: "0x8765...4321",
    value: "100 ANDE",
    timestamp: 1729123456789,
    status: "success",
    type: "Send"
  },
  // ... más transacciones
]
```

### Límites

- **Max transacciones por wallet:** 100
- **Storage por wallet:** ~50-100 KB (depende del tamaño de hash)
- **Total storage:** ~5-10 MB (para 100 wallets)

## Integración con Wagmi

### Ejemplo: Rastrear Transacción Real

```tsx
'use client';

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useTransactionHistory } from '@/hooks/use-transaction-history';

export function StakingComponent() {
  const { addTransaction, updateTransaction } = useTransactionHistory();
  const { writeContract, data: hash } = useWriteContract();

  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleStake = async () => {
    // 1. Crear transacción
    writeContract({
      address: STAKING_ADDRESS,
      abi: STAKING_ABI,
      functionName: 'stake',
      args: [amount],
    });

    // 2. Añadir a historial como pending
    const txId = addTransaction({
      hash: 'pending...',
      from: address,
      to: STAKING_ADDRESS,
      value: `${amount} ANDE`,
      status: 'pending',
      type: 'Staking',
    });
  };

  // 3. Actualizar cuando se confirme
  useEffect(() => {
    if (isSuccess && hash) {
      updateTransaction(txId, {
        hash,
        status: 'success',
      });
    }
  }, [isSuccess, hash]);

  return <button onClick={handleStake}>Stake</button>;
}
```

## Migración desde Firebase

### Antes (Firebase)

```tsx
import { useUser, useFirestore, useCollection } from '@/firebase';

export function Transactions() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: transactions } = useCollection(
    query(collection(firestore, `transactions/${user.uid}`))
  );
  // ...
}
```

### Después (Web3)

```tsx
import { useTransactionHistory } from '@/hooks/use-transaction-history';

export function Transactions() {
  const { transactions } = useTransactionHistory();
  // ...
}
```

## Consideraciones de Seguridad

### ✅ Seguro

- localStorage es **aislado por dominio** (no accesible desde otros sitios)
- Datos son **solo del cliente** (no se envían a servidor)
- Cada wallet tiene su **propio historial** (no se mezclan)
- Datos se **limpian al cambiar wallet** (no hay fuga de datos)

### ⚠️ Limitaciones

- localStorage tiene límite de ~5-10 MB por dominio
- Datos se pierden si se limpia caché del navegador
- No hay sincronización entre dispositivos
- No hay backup automático

### 🔒 Mejoras Futuras

Para mayor seguridad y persistencia:

1. **The Graph** - Historial en cadena (on-chain)
2. **IPFS** - Backup distribuido
3. **Encryption** - Encriptar datos en localStorage
4. **Cloud Sync** - Sincronización opcional con servidor

## Troubleshooting

### "No transactions found"

**Causa:** Wallet no conectada o sin historial

**Solución:**
```tsx
const { address } = useAccount();
if (!address) return <div>Connect wallet first</div>;
```

### Historial desaparece al cambiar wallet

**Causa:** Comportamiento esperado (cada wallet tiene su historial)

**Solución:** Usar The Graph para historial en cadena

### localStorage full

**Causa:** Más de 100 transacciones

**Solución:** Se mantienen solo las últimas 100 automáticamente

## API Reference

### useTransactionHistory()

```typescript
interface UseTransactionHistoryReturn {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransaction: (txId: string, updates: Partial<Omit<Transaction, 'id' | 'timestamp'>>) => void;
  clearHistory: () => void;
  removeTransaction: (txId: string) => void;
  isLoading: boolean;
}
```

### useWalletActions()

```typescript
interface UseWalletActionsReturn {
  handleDisconnect: () => void;
}
```

## Recursos

- [Wagmi Documentation](https://wagmi.sh)
- [Web3 Wallet Connection](https://web3modal.com)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [ANDE Smart Contracts](../andechain/contracts)

---

**Última actualización:** 2025-10-16
**Status:** ✅ Producción
