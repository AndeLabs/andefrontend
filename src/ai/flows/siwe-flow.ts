
'use server';
/**
 * @fileOverview SIWE (Sign-In with Ethereum) authentication flows.
 *
 * This file provides two main functions for SIWE:
 * - getNonce: Generates a secure, random nonce for the client to sign.
 * - verifySignature: Verifies the client's signature and message, and if valid,
 *   returns a custom Firebase authentication token.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SiweMessage } from 'siwe';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}'
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

// --- Get Nonce Flow ---
const GetNonceOutputSchema = z.string().describe('A secure, random nonce.');
export type GetNonceOutput = z.infer<typeof GetNonceOutputSchema>;

export async function getNonce(): Promise<GetNonceOutput> {
  return getNonceFlow();
}

const getNonceFlow = ai.defineFlow(
  {
    name: 'getNonceFlow',
    outputSchema: GetNonceOutputSchema,
  },
  async () => {
    // Generate a secure random string for the nonce
    const { randomBytes } = await import('crypto');
    return randomBytes(32).toString('hex');
  }
);


// --- Verify Signature Flow ---
const VerifySignatureInputSchema = z.object({
  message: z.string().describe('The SIWE message signed by the user.'),
  signature: z.string().describe('The signature produced by the user\'s wallet.'),
});
export type VerifySignatureInput = z.infer<typeof VerifySignatureInputSchema>;

const VerifySignatureOutputSchema = z.object({
  token: z.string().describe('A custom Firebase authentication token.'),
});
export type VerifySignatureOutput = z.infer<typeof VerifySignatureOutputSchema>;

export async function verifySignature(input: VerifySignatureInput): Promise<VerifySignatureOutput> {
  return verifySignatureFlow(input);
}

const verifySignatureFlow = ai.defineFlow(
  {
    name: 'verifySignatureFlow',
    inputSchema: VerifySignatureInputSchema,
    outputSchema: VerifySignatureOutputSchema,
  },
  async ({ message, signature }) => {
    try {
      const siweMessage = new SiweMessage(JSON.parse(message));
      
      // Verify the signature
      const { data } = await siweMessage.verify({ signature });

      if (!data) {
        throw new Error('SIWE signature verification failed.');
      }
      
      // Get the address from the verified message
      const { address } = data;

      // Create a custom Firebase token for the user's address
      const customToken = await getAuth().createCustomToken(address);

      return { token: customToken };
    } catch (error: any) {
      console.error('SIWE verification error:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
);
