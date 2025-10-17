'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  type: string;
}

const STORAGE_KEY_PREFIX = 'tx_history_';
const MAX_TRANSACTIONS = 100;

/**
 * Hook para gestionar el historial de transacciones usando localStorage
 * Cada wallet tiene su propio historial independiente
 */
export function useTransactionHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar transacciones del localStorage cuando cambia la wallet
  useEffect(() => {
    setIsLoading(true);
    if (!address) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(Array.isArray(parsed) ? parsed : []);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Añade una nueva transacción al historial
   */
  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!address) {
      console.warn('No wallet connected');
      return;
    }

    const newTx: Transaction = {
      ...tx,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    setTransactions((prev) => {
      const updated = [newTx, ...prev].slice(0, MAX_TRANSACTIONS);
      try {
        const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving transaction to localStorage:', error);
      }
      return updated;
    });
  };

  /**
   * Actualiza el estado de una transacción existente
   */
  const updateTransaction = (
    txId: string,
    updates: Partial<Omit<Transaction, 'id' | 'timestamp'>>
  ) => {
    if (!address) return;

    setTransactions((prev) => {
      const updated = prev.map((tx) =>
        tx.id === txId ? { ...tx, ...updates } : tx
      );
      try {
        const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating transaction in localStorage:', error);
      }
      return updated;
    });
  };

  /**
   * Limpia todo el historial de transacciones
   */
  const clearHistory = () => {
    if (!address) return;
    try {
      const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing transaction history:', error);
    }
    setTransactions([]);
  };

  /**
   * Elimina una transacción específica
   */
  const removeTransaction = (txId: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== txId);
      if (address) {
        try {
          const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (error) {
          console.error('Error removing transaction from localStorage:', error);
        }
      }
      return updated;
    });
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    clearHistory,
    removeTransaction,
    isLoading,
  };
}
