# Documentación de Funcionalidades Implementadas - AndeChain Frontend

## 📋 Resumen General

AndeChain es una aplicación Web3/DeFi enterprise-grade construida con Next.js 15, TypeScript, y un stack tecnológico moderno. La aplicación ofrece una experiencia completa de gestión de activos digitales con autenticación multi-proveedor y funcionalidades avanzadas de DeFi.

---

## 🏗️ Arquitectura y Stack Tecnológico

### Core Framework
- **Next.js 15.3.3** con App Router (Server/Client Components)
- **TypeScript 5** con modo estricto
- **React 18.3.1** con hooks modernos
- **Tailwind CSS 3.4.1** para estilos
- **ShadCN/UI** como sistema de diseño

### Estado y Datos
- **TanStack Query 5.51.15** para manejo de estado del servidor
- **Wagmi 2.10.10** + **Viem 2.17.4** para interacciones Web3
- **Firebase 11.9.1** para backend (Auth, Firestore, Genkit)

### Web3 y Blockchain
- **WalletConnect 4.2.3** para conexión de billeteras
- **SIWE (Sign-In with Ethereum) 2.3.2** para autenticación descentralizada
- **AndeChain Testnet** configurada como chain por defecto (Chain ID: 8086)

---

## 🔐 Sistema de Autenticación

### Proveedores Disponibles
1. **Email/Contraseña** tradicional
2. **Google OAuth** 
3. **GitHub OAuth**
4. **Sign-In with Ethereum (SIWE)** - Autenticación descentralizada

### Flujo SIWE Implementado
- Generación segura de nonce mediante Genkit flows
- Verificación de firma en servidor con Firebase Admin SDK
- Creación de custom token para Firebase
- Integración completa con wagmi para firma de mensajes

### Gestión de Usuarios
- Perfiles automáticos en Firestore al registrarse
- Configuraciones personalizadas (tema, idioma, notificaciones)
- Avatares generados con DiceBear API
- Soporte para múltiples billeteras por usuario

---

## 📊 Dashboard Principal

### Métricas en Tiempo Real
- **Balance Total** con conversión a USD
- **Balance de Wallet** conectada
- **Balance de Staking** con APY mostrado
- **Estado de la Red** (AndeChain Testnet)

### Visualizaciones
- **Gráfico de Overview** con datos de portafolio (Chart.js/Recharts)
- **Tabla de Portfolio** con allocation por activo
- **Cards animados** con skeletons durante carga

### Datos de Ejemplo
- AndeChain (AND): 1,250.50 tokens ($2,876.15 USD)
- Ethereum (ETH): 0.50 ETH ($1,750.00 USD)
- USD Coin (USDC): 1,000.00 USDC
- Staked AND: 500.00 AND ($1,150.00 USD)

---

## 💎 Sistema de Staking

### Tiers de Staking
1. **Sequencer Tier** - 12.5% APY base
   - Ayuda a asegurar la red ejecutando nodos sequencer
2. **Governance Tier** - 8.2% APY base  
   - Participación en propuestas y votaciones
3. **Liquidity Tier** - 15.0% APY base
   - Provisión de liquidez al ecosistema

### Períodos de Bloqueo y Multiplicadores
- **3 meses**: x1.1 multiplier
- **6 meses**: x1.25 multiplier  
- **12 meses**: x1.5 multiplier
- **24 meses**: x2.0 multiplier

### Calculadora Interactiva
- Cálculo en tiempo real de APY final
- Estimación de recompensas mensuales/anuales
- Slider para selección de período de bloqueo
- Validación de montos mínimos

### Gestión de Posiciones
- Visualización de posiciones activas
- Tiempo restante de bloqueo
- Recompensas acumuladas por reclamar
- Botones de unstake y claim rewards

---

## 🏛️ Sistema de Gobernanza

### Propuestas Activas
- **AIP-001**: Increase Sequencer Node Rewards by 5%
- **AIP-002**: Fund a Community-Led Marketing Initiative
- **AIP-003**: Integrate a New Liquidity Protocol (Passed)

### Interfaz de Votación
- Visualización de votos For/Against con progress bars
- Fechas de cierre de votación
- Descripciones detalladas de propuestas
- Badges de estado (Active, Passed)

### Poder de Voto
- Display de voting power del usuario
- Funcionalidad de delegación de votos
- Historial de propuestas aprobadas

---

## 💸 Gestión de Transacciones

### Historial Completo
- **Tipos**: Send, Receive, Staking
- **Estados**: Completed, Pending, Failed
- **Iconos diferenciados** por tipo de transacción
- **Timestamps** con formato legible

### Características
- Tabla responsive con datos completos
- Badges de estado con colores distintivos
- Direcciones from/to en formato abreviado
- Función para agregar transacciones de prueba

### Integración Firestore
- Almacenamiento no bloqueante de transacciones
- Ordenamiento por timestamp descendente
- Loading states con skeletons
- Manejo de errores elegante

---

## 🎨 UI/UX y Componentes

### Sistema de Diseño
- **ShadCN/UI** con componentes consistentes
- **Dark/Light Theme** con Next Themes
- **Responsive Design** mobile-first
- **Animaciones** con Tailwind CSS

### Componentes Clave
- **Sidebar** navegacional con iconos Lucide
- **Cards** para información financiera
- **Tables** para datos tabulares
- **Forms** para input de usuario
- **Charts** para visualizaciones
- **Toasts** para notificaciones

### Accesibilidad
- Semantic HTML5
- ARIA labels donde corresponde
- Keyboard navigation
- Screen reader support

---

## 🔧 Configuración y Deploy

### Variables de Entorno
- `NEXT_PUBLIC_WC_PROJECT_ID`: WalletConnect Project ID
- `GOOGLE_APPLICATION_CREDENTIALS`: Firebase service account

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo (puerto 9002)
npm run build        # Build de producción
npm run typecheck    # Verificación de tipos
npm run lint         # Linting con ESLint
npm run format       # Formateo con Prettier
```

### Optimizaciones
- **Code splitting** automático con Next.js
- **Lazy loading** de componentes pesados
- **Memoización** con React.memo
- **Image optimization** con Next.js Image

---

## 🔌 Integraciones Externas

### Blockchain
- **AndeChain Testnet**: RPC personalizado
- **Ethereum Mainnet**: Soporte completo
- **Sepolia Testnet**: Para testing

### APIs y Servicios
- **DiceBear API**: Generación de avatares
- **Firebase**: Backend as a Service
- **Genkit**: Flows de AI para backend
- **WalletConnect**: Conexión de billeteras

---

## 📱 Estructura de Archivos Clave

```
src/
├── app/
│   ├── (auth)/login/           # Página de login
│   ├── (dashboard)/            # Dashboard protegido
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── staking/            # Sistema de staking
│   │   ├── governance/         # Gobernanza
│   │   └── transactions/       # Historial
│   └── layout.tsx              # Layout principal
├── components/
│   ├── dashboard/              # Componentes del dashboard
│   ├── ui/                     # Componentes base ShadCN
│   └── icons.tsx               # Iconos personalizados
├── firebase/                   # Configuración Firebase
├── hooks/                      # Hooks personalizados
├── lib/                        # Utilidades y configuración
└── ai/flows/                   # Flows de Genkit (SIWE)
```

---

## 🚀 Funcionalidades Futuras (Planeadas)

1. **Swap/DEX Integration** - Intercambio de tokens
2. **Yield Farming** - Pools de liquidez  
3. **NFT Gallery** - Visualización de NFTs
4. **Advanced Analytics** - Métricas detalladas
5. **Mobile App** - Versión móvil nativa
6. **Multi-chain Support** - Más blockchains

---

## 📈 Estado Actual de Implementación

✅ **Completamente Implementado:**
- Autenticación multi-proveedor
- Dashboard con métricas en tiempo real
- Sistema de staking completo
- Gobernanza con propuestas
- Historial de transacciones
- UI/UX responsive y moderna

🔄 **En Desarrollo:**
- Integración con contratos reales
- Testing end-to-end
- Optimización de rendimiento
- Documentación API

---

## 🔒 Seguridad

- **Validación de inputs** en cliente y servidor
- **Nonces seguros** para SIWE
- **Environment variables** para datos sensibles
- **Firestore rules** para control de acceso
- **TypeScript strict** para prevención de errores

---

*Última actualización: Octubre 2024*