# AndeChain Nexus - Enterprise-Grade Web3 DeFi Application

AndeChain Nexus es una plataforma de finanzas descentralizadas (DeFi) diseñada para ofrecer una experiencia de usuario potente, segura y amigable para gestionar carteras de criptoactivos a través de múltiples blockchains.

## ✨ Características Principales

- **Autenticación Multi-Proveedor**: Soporte para Email/Contraseña, Google, GitHub y **Sign-In With Ethereum (SIWE)**.
- **Dashboard Analítico**: Visualización de balance total, composición de portafolio y rendimiento de staking.
- **Interfaz de Staking Detallada**: Calculadora de APY, periodos de bloqueo y gestión de recompensas.
- **Panel de Gobernanza**: Participación en propuestas y votaciones de la comunidad.
- **Monitor en Tiempo Real**: Estado de la red, precio del gas y transacciones por segundo.
- **Rendimiento Optimizado**: Code splitting, lazy loading y memoización de componentes para una experiencia de usuario fluida.
- **Calidad de Código Asegurada**: Configuración de ESLint, Prettier y pre-commit hooks con Husky.

## 🚀 Guía de Inicio Rápido

### 1. Prerrequisitos

- Node.js (versión 20.x o superior)
- `pnpm` como gestor de paquetes (recomendado)

### 2. Configuración del Entorno

1.  **Clonar el repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd andechain-nexus
    ```

2.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` a partir del template `.env.example` y añade tus credenciales.
    ```bash
    cp .env.example .env.local
    ```
    Necesitarás:
    - `NEXT_PUBLIC_WC_PROJECT_ID`: Tu ID de proyecto de WalletConnect.
    - `GOOGLE_APPLICATION_CREDENTIALS`: Las credenciales de tu cuenta de servicio de Firebase para los flujos de Genkit.

### 3. Ejecutar la Aplicación

Inicia el servidor de desarrollo de Next.js:
```bash
pnpm dev
```
La aplicación estará disponible en `http://localhost:9002`.

## 🏗️ Arquitectura de la Aplicación

La aplicación sigue una arquitectura moderna basada en Next.js App Router, con una clara separación de responsabilidades.

```mermaid
graph TD
    A[Usuario] --> B{Next.js App Router};

    subgraph "Frontend (React Server & Client Components)"
        B --> C[Páginas y Layouts];
        C -- usa --> D[Componentes UI (ShadCN)];
        C -- usa --> E[Hooks (wagmi, SWR)];
        D -- estilizados con --> F[Tailwind CSS];
        E -- interactúan con --> G[Contratos Inteligentes];
        E -- interactúan con --> H[Firebase];
    end

    subgraph "Backend & Servicios"
        H[Firebase] --> H1[Auth];
        H --> H2[Firestore];
        H --> H3[Genkit Flows];
        I[WalletConnect] -- para --> G;
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px;
    style H fill:#f90,stroke:#333,stroke-width:2px;
```

- **Next.js App Router**: Utilizado para el enrutamiento y la renderización (Server y Client Components).
- **React y TypeScript**: Para construir la interfaz de usuario.
- **ShadCN/UI y Tailwind CSS**: Para un sistema de diseño moderno y personalizable.
- **Wagmi y Viem**: Para la interacción con la blockchain de Ethereum (conexión de billetera, lectura/escritura de contratos).
- **Firebase**:
    - **Authentication**: Gestiona el inicio de sesión de usuarios (incluyendo SIWE).
    - **Firestore**: Base de datos NoSQL para almacenar perfiles de usuario, configuraciones y metadatos.
    - **Genkit**: Utilizado para crear flujos de backend seguros, como la verificación de SIWE.

## 🔧 Guía de Solución de Problemas

- **Error: `Module not found`**:
  Asegúrate de haber ejecutado `pnpm install`. Si el error persiste, elimina la carpeta `.next` y `node_modules` y vuelve a instalar las dependencias.

- **Error: `Please call "createWeb3Modal" before using "useWeb3Modal" hook`**:
  Verifica que la variable de entorno `NEXT_PUBLIC_WC_PROJECT_ID` esté correctamente configurada en tu archivo `.env.local`. Sin esta variable, Web3Modal no se inicializa.

- **Errores de Permisos en Firestore**:
  Asegúrate de que tus [Reglas de Seguridad de Firestore](firestore.rules) estén correctamente desplegadas y permitan las operaciones que estás intentando realizar.
