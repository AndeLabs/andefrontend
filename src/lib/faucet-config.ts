/**
 * Configuración del Faucet para AndeChain
 */

export const FAUCET_CONFIG = {
  // URL del servidor faucet
  URL: process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:3001',
  
  // Cantidad de ANDE por solicitud
  AMOUNT_PER_REQUEST: 10,
  
  // Tiempo de espera entre solicitudes (segundos)
  COOLDOWN_TIME: 60,
  
  // Timeout para requests (ms)
  REQUEST_TIMEOUT: 30000,
  
  // Endpoints
  ENDPOINTS: {
    REQUEST: '/',
    HEALTH: '/health',
    COOLDOWN: (address: string) => `/cooldown/${address}`,
  },
} as const;

/**
 * Valida que el faucet esté disponible
 */
export async function checkFaucetHealth(): Promise<boolean> {
   try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), FAUCET_CONFIG.REQUEST_TIMEOUT);
     
     try {
       const response = await fetch(`${FAUCET_CONFIG.URL}${FAUCET_CONFIG.ENDPOINTS.HEALTH}`, {
         method: 'GET',
         signal: controller.signal,
       });
       return response.ok;
     } finally {
       clearTimeout(timeoutId);
     }
   } catch (error) {
     console.error('Faucet health check failed:', error);
     return false;
   }
}

/**
 * Obtiene el estado del cooldown para una dirección
 */
export async function checkCooldown(address: string): Promise<{
   canRequest: boolean;
   remainingTime: number;
   lastRequestTime?: string;
}> {
   try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), FAUCET_CONFIG.REQUEST_TIMEOUT);
     
     try {
       const response = await fetch(
         `${FAUCET_CONFIG.URL}${FAUCET_CONFIG.ENDPOINTS.COOLDOWN(address)}`,
         { signal: controller.signal }
       );
       
       if (!response.ok) {
         throw new Error('Failed to check cooldown');
       }
       
       return await response.json();
     } finally {
       clearTimeout(timeoutId);
     }
   } catch (error) {
     console.error('Cooldown check failed:', error);
     return { canRequest: false, remainingTime: 0 };
   }
}
