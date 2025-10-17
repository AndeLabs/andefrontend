# Network Status - Características y Funcionalidades

## 📊 Descripción General

La página de **Network Status** proporciona una vista completa en tiempo real del estado de la blockchain ANDE, incluyendo métricas avanzadas, visualizaciones interactivas y monitoreo de salud de la red.

## 🚀 Características Principales

### 1. **Monitoreo en Tiempo Real**

#### WebSocket Live Updates
- **Actualización automática de bloques**: Los nuevos bloques aparecen instantáneamente sin necesidad de recargar la página
- **Polling inteligente**: Sistema optimizado que actualiza datos cada 2 segundos sin sobrecargar el RPC
- **Cache estratégico**: Reduce llamadas innecesarias manteniendo datos frescos en memoria

#### Métricas Clave Actualizadas
- **Latest Block**: Número del último bloque minado con contador de transacciones
- **Gas Price**: Precio actual del gas en Gwei con precisión de 4 decimales
- **TPS (Transactions Per Second)**: Transacciones por segundo calculadas sobre los últimos 20 bloques
- **Block Time**: Tiempo promedio entre bloques (objetivo: 2 segundos)

### 2. **Network Health Dashboard**

#### Indicadores de Salud
```typescript
interface NetworkHealth {
  isHealthy: boolean;              // Estado general de la red
  rpcLatency: number;              // Latencia del RPC en ms
  blockProductionRate: string;     // 'normal' | 'slow' | 'stalled'
  lastBlockAge: number;            // Edad del último bloque en segundos
}
```

#### Estados de la Red
- **🟢 Healthy**: Bloques producidos normalmente (< 30s edad)
- **🟡 Degraded**: Producción lenta (30-60s edad)
- **🔴 Unhealthy**: Red estancada (> 60s edad)

#### Medición de Latencia RPC
- Ping automático cada 10 segundos
- Muestra latencia en milisegundos
- Clasificación: Excellent (< 100ms), Good (< 300ms), Poor (> 300ms)

### 3. **Métricas Avanzadas**

#### Gas Utilization
- **Porcentaje de uso**: Cálculo preciso de capacidad usada vs disponible
- **Barra de progreso visual**: Indicador gráfico del uso de gas
- **Interpretación**: 
  - < 30%: Red poco utilizada (verde)
  - 30-70%: Uso normal (amarillo)
  - > 70%: Alta congestión (rojo)

#### Average Gas Used
- Promedio de gas usado por bloque en millones (M)
- Calculado sobre los últimos 20 bloques
- Útil para estimar costos de transacciones

#### Total Transactions
- Suma de todas las transacciones en el período analizado
- Actualización en tiempo real con cada nuevo bloque
- Muestra la actividad general de la red

### 4. **Gráficos Interactivos con Recharts**

#### Block Activity Chart
Gráfico de área animado con tres vistas seleccionables:

##### a) Transactions View
- Muestra número de transacciones por bloque
- Color: Violeta (#8b5cf6)
- Útil para: Identificar picos de actividad

##### b) Gas Used View
- Gas consumido por bloque (en millones)
- Color: Ámbar (#f59e0b)
- Útil para: Analizar bloques con alta computación

##### c) Gas Utilization View
- Porcentaje de uso del gas por bloque
- Color: Verde (#10b981)
- Útil para: Detectar congestión de red

#### Características del Gráfico
- **Responsive**: Se adapta a cualquier tamaño de pantalla
- **Tooltips interactivos**: Información detallada al pasar el mouse
- **Gradientes suaves**: Visualización atractiva y profesional
- **Formato de timestamps**: Fechas legibles en formato local
- **Eje X**: Números de bloque (#6234, #6235...)
- **Eje Y**: Valores métricos con unidades apropiadas

### 5. **Tabla de Bloques Recientes**

#### Características
- **Últimos 10 bloques**: Vista de los bloques más recientes
- **Actualización en vivo**: Nuevos bloques aparecen automáticamente en la parte superior
- **Responsive design**: Se adapta a móviles y tablets

#### Información por Bloque
| Campo | Descripción | Formato |
|-------|-------------|---------|
| Block | Número de bloque con link al explorer | #6234 |
| Hash | Hash del bloque (truncado) | 0xb03fe4c0...1c8d |
| Txs | Número de transacciones con badge | 5 txs |
| Gas Used | Porcentaje y cantidad | 45.2% • 9.12M |
| Validator | Dirección del validador/miner | 0x1234...5678 |
| Age | Tiempo desde que se minó | 3 seconds ago |

#### Indicadores de Color
- **Verde**: Uso de gas < 30%
- **Amarillo**: Uso de gas 30-70%
- **Rojo**: Uso de gas > 70%

### 6. **Información Detallada de Gas (EIP-1559)**

#### Campos Disponibles
```typescript
{
  currentGasPrice: string;      // Precio actual en Gwei
  maxFeePerGas: string;         // Máximo dispuesto a pagar
  priorityFee: string;          // Propina para el miner
  baseFee: string;              // Fee base del último bloque
}
```

#### Explicación EIP-1559
- **Base Fee**: Fee mínimo que se quema (burn)
- **Priority Fee**: Propina opcional al validador
- **Max Fee**: Máximo total = Base Fee + Priority Fee
- **Ajuste dinámico**: Base fee sube/baja según congestión

### 7. **Chain Information Panel**

#### Datos de Configuración
- **Network Name**: ANDE Blockchain
- **Chain ID**: 1234 (0x4d2)
- **Native Currency**: ANDE
- **RPC Endpoint**: http://localhost:8545
- **Network Type**: Testnet/Mainnet badge
- **Block Explorer**: Link directo al explorer

### 8. **Latest Block Details**

Vista expandida del último bloque con:
- **Block Hash completo**: Sin truncar
- **Timestamp**: Fecha y hora exacta
- **Transaction count**: Número de transacciones
- **Gas metrics**: Used, Limit y Utilization
- **Miner/Validator**: Dirección completa
- **Base Fee Per Gas**: Si está disponible (EIP-1559)

## 🔧 Implementación Técnica

### Arquitectura

```
┌─────────────────────────────────────────┐
│         Network Status Page             │
│         (network/page.tsx)              │
└─────────────┬───────────────────────────┘
              │
              ├──► useNetworkStatus Hook
              │    ├─► useBlockNumber (watch: true)
              │    ├─► useBlock (latest)
              │    ├─► useFeeData
              │    └─► Custom calculations
              │
              ├──► BlockActivityChart
              │    └─► Recharts AreaChart
              │
              ├──► NetworkHealthIndicator
              │    └─► Health metrics display
              │
              └──► RecentBlocksTable
                   └─► Live blocks table
```

### Hook: useNetworkStatus

```typescript
export function useNetworkStatus() {
  // State management
  const [blockHistory, setBlockHistory] = useState<BlockInfo[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics>({...});
  const [health, setHealth] = useState<NetworkHealth>({...});

  // Wagmi hooks for live data
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: latestBlock } = useBlock({ blockNumber });
  const { data: feeData } = useFeeData();

  // Calculate metrics from last 20 blocks
  // Measure RPC latency every 10 seconds
  // Update health status continuously

  return {
    blockHistory,    // Last 20 blocks
    metrics,         // Calculated metrics
    health,          // Network health
    latestBlock,     // Current block
    gasPrice,        // Current gas price
    // ...
  };
}
```

### Optimizaciones

#### 1. Caching Inteligente
- **Block history**: Mantiene solo los últimos 20 bloques en memoria
- **No duplicados**: Verifica que el bloque no exista antes de agregarlo
- **FIFO**: Elimina bloques antiguos automáticamente

#### 2. Performance
- **Cálculos eficientes**: Usa BigInt para operaciones precisas
- **Memoización**: useMemo y useCallback para evitar re-renders
- **Debouncing**: Actualización de métricas controlada

#### 3. User Experience
- **Loading states**: Skeletons mientras carga data
- **Error boundaries**: Manejo graceful de errores
- **Responsive**: Mobile-first design
- **Smooth animations**: Transiciones suaves en gráficos

## 📊 Métricas Calculadas

### TPS (Transactions Per Second)
```typescript
const totalTxs = blocks.reduce((sum, block) => sum + block.transactions, 0);
const timeSpan = newestBlock.timestamp - oldestBlock.timestamp;
const tps = totalTxs / timeSpan;
```

### Average Block Time
```typescript
const timeSpan = newestBlock.timestamp - oldestBlock.timestamp;
const avgBlockTime = timeSpan / (blocks.length - 1);
```

### Gas Utilization
```typescript
const totalGasUsed = blocks.reduce((sum, b) => sum + b.gasUsed, 0n);
const totalGasLimit = blocks.reduce((sum, b) => sum + b.gasLimit, 0n);
const utilization = (totalGasUsed * 10000n) / totalGasLimit / 100;
```

## 🎨 UI/UX Features

### Animaciones
- **Pulse animation**: Indicador de red activa (verde pulsante)
- **Smooth transitions**: Transiciones de color en badges
- **Loading skeletons**: Placeholders animados mientras carga
- **Chart animations**: Entrada suave de datos en gráficos

### Color Scheme
- **Primary**: Violeta para elementos principales
- **Success**: Verde para estados saludables
- **Warning**: Amarillo para advertencias
- **Danger**: Rojo para errores/alertas
- **Muted**: Gris para información secundaria

### Typography
- **Monospace**: Para hashes, direcciones y números de bloque
- **Bold**: Para métricas importantes
- **Tabular nums**: Para alineación de números

## 🔮 Próximas Mejoras Sugeridas

### 1. Histórico Extendido
- Gráficos de 24 horas
- Comparación día/semana/mes
- Exportación de datos CSV

### 2. Alertas Personalizadas
- Notificaciones cuando TPS > umbral
- Alertas de gas price alto
- Notificación de bloques perdidos

### 3. Validadores/Miners
- Top miners por bloques
- Distribución de recompensas
- Uptime de validadores

### 4. Network Comparison
- Comparar con otras chains
- Benchmarks de rendimiento
- Gráficos comparativos

### 5. Transacciones Pendientes
- Pool de transacciones pendientes (mempool)
- Tiempo estimado de inclusión
- Gas price óptimo sugerido

### 6. WebSocket Real-Time
- Conexión WebSocket directa (sin polling)
- Eventos en tiempo real
- Notificaciones push

## 📚 Referencias

- **Wagmi Hooks**: https://wagmi.sh/react/hooks/useBlockNumber
- **Viem**: https://viem.sh/docs/actions/public/getBlock
- **Recharts**: https://recharts.org/en-US/api
- **EIP-1559**: https://eips.ethereum.org/EIPS/eip-1559

## 🐛 Troubleshooting

### Bloque no se actualiza
```bash
# Verificar que el RPC esté corriendo
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Alta latencia RPC
- Verificar que ev-reth esté corriendo
- Revisar logs: `docker logs ev-reth-node`
- Considerar aumentar recursos de Docker

### Gráficos no se muestran
- Verificar que `recharts` esté instalado
- Limpiar cache: `rm -rf .next`
- Rebuild: `npm run build`

## ✅ Testing

### Pruebas Manuales
1. Abrir `/network`
2. Verificar que aparezca el último bloque
3. Esperar 2-5 segundos, debe aparecer nuevo bloque
4. Cambiar entre vistas del gráfico (Transactions/Gas Used/Utilization)
5. Verificar que tooltips funcionen al hover
6. Probar en móvil (responsive)

### Verificar Métricas
```bash
# Comparar con RPC directo
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}'
```

---

**Última actualización**: 2024
**Versión**: 1.0.0
**Mantenedor**: ANDE Labs Team