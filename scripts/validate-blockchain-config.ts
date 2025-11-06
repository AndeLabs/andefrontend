#!/usr/bin/env node

/**
 * ============================================
 * SCRIPT DE VALIDACIÓN - ANDE BLOCKCHAIN
 * ============================================
 * 
 * Valida la configuración de conexión a la blockchain
 * - Verifica variables de entorno
 * - Prueba conexión RPC
 * - Valida direcciones de contratos
 * - Verifica endpoints de servicios
 * - Genera reporte detallado
 * 
 * Uso: node scripts/validate-blockchain-config.ts
 * O:   npm run validate:blockchain
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ============================================
// TIPOS Y INTERFACES
// ============================================

interface ValidationResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface Report {
  timestamp: string;
  environment: string;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

// ============================================
// COLORES PARA CONSOLA
// ============================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// ============================================
// UTILIDADES
// ============================================

function log(level: 'info' | 'success' | 'warn' | 'error', message: string, details?: any) {
  const timestamp = new Date().toISOString();
  let prefix = '';
  let color = colors.reset;

  switch (level) {
    case 'info':
      color = colors.blue;
      prefix = 'ℹ️  INFO';
      break;
    case 'success':
      color = colors.green;
      prefix = '✅ SUCCESS';
      break;
    case 'warn':
      color = colors.yellow;
      prefix = '⚠️  WARN';
      break;
    case 'error':
      color = colors.red;
      prefix = '❌ ERROR';
      break;
  }

  console.log(`${color}${prefix}${colors.reset} [${timestamp}] ${message}`);
  if (details) {
    console.log(`  ${JSON.stringify(details, null, 2)}`);
  }
}

function divider(title?: string) {
  const width = 60;
  const line = '='.repeat(width);
  console.log(line);
  if (title) {
    const padding = Math.floor((width - title.length - 2) / 2);
    console.log(`${' '.repeat(padding)}${colors.bright}${title}${colors.reset}`);
    console.log(line);
  }
}

// ============================================
// VALIDADORES
// ============================================

class BlockchainValidator {
  private results: ValidationResult[] = [];
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadEnv();
  }

  /**
   * Cargar variables de entorno
   */
  private loadEnv() {
    const envFile = this.environment === 'production' ? '.env.production' : '.env.local';
    const envPath = path.join(process.cwd(), envFile);

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });

      log('success', `Loaded environment from ${envFile}`);
    } else {
      log('error', `Environment file ${envFile} not found`);
    }
  }

  /**
   * Validar variables de entorno requeridas
   */
  async validateEnvVariables(): Promise<void> {
    log('info', 'Validating environment variables...');

    const required = [
      'NEXT_PUBLIC_CHAIN_ID',
      'NEXT_PUBLIC_RPC_HTTP',
      'NEXT_PUBLIC_NETWORK_NAME',
    ];

    const optional = [
      'NEXT_PUBLIC_RPC_WS',
      'NEXT_PUBLIC_API_URL',
      'NEXT_PUBLIC_EXPLORER_URL',
      'NEXT_PUBLIC_ANDE_TOKEN_ADDRESS',
    ];

    // Validar requeridas
    for (const env of required) {
      const value = process.env[env];
      if (!value) {
        this.addResult({
          name: `Environment: ${env}`,
          status: 'error',
          message: `Missing required environment variable: ${env}`,
        });
      } else {
        this.addResult({
          name: `Environment: ${env}`,
          status: 'success',
          message: `Found: ${value}`,
        });
      }
    }

    // Validar opcionales
    for (const env of optional) {
      const value = process.env[env];
      if (!value) {
        this.addResult({
          name: `Environment: ${env}`,
          status: 'warning',
          message: `Optional variable not set: ${env}`,
        });
      } else {
        this.addResult({
          name: `Environment: ${env}`,
          status: 'success',
          message: `Found: ${value}`,
        });
      }
    }
  }

  /**
   * Validar RPC Endpoint
   */
  async validateRpcEndpoint(): Promise<void> {
    log('info', 'Validating RPC endpoint...');

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_HTTP;
    if (!rpcUrl) {
      this.addResult({
        name: 'RPC Endpoint',
        status: 'error',
        message: 'RPC_HTTP not configured',
      });
      return;
    }

    try {
      const start = performance.now();
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const latency = performance.now() - start;
      const data = (await response.json()) as any;

      if (data.error) {
        this.addResult({
          name: 'RPC: eth_blockNumber',
          status: 'error',
          message: `RPC error: ${data.error.message}`,
          details: { url: rpcUrl, latency: `${latency.toFixed(2)}ms` },
        });
      } else {
        const blockNumber = parseInt(data.result, 16);
        this.addResult({
          name: 'RPC: eth_blockNumber',
          status: 'success',
          message: `Block number: ${blockNumber}`,
          details: { url: rpcUrl, latency: `${latency.toFixed(2)}ms` },
        });
      }
    } catch (error) {
      this.addResult({
        name: 'RPC Endpoint',
        status: 'error',
        message: `Failed to connect to RPC: ${error}`,
        details: { url: rpcUrl },
      });
    }
  }

  /**
   * Validar Chain ID
   */
  async validateChainId(): Promise<void> {
    log('info', 'Validating Chain ID...');

    const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '0', 10);
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_HTTP;

    if (!rpcUrl || expectedChainId === 0) {
      this.addResult({
        name: 'Chain ID',
        status: 'error',
        message: 'Chain ID or RPC URL not configured',
      });
      return;
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });

      const data = (await response.json()) as any;

      if (data.error) {
        this.addResult({
          name: 'Chain ID',
          status: 'error',
          message: `RPC error: ${data.error.message}`,
        });
      } else {
        const chainId = parseInt(data.result, 16);
        if (chainId === expectedChainId) {
          this.addResult({
            name: 'Chain ID',
            status: 'success',
            message: `Chain ID matches: ${chainId} (0x${chainId.toString(16)})`,
          });
        } else {
          this.addResult({
            name: 'Chain ID',
            status: 'error',
            message: `Chain ID mismatch: expected ${expectedChainId}, got ${chainId}`,
          });
        }
      }
    } catch (error) {
      this.addResult({
        name: 'Chain ID',
        status: 'error',
        message: `Failed to validate chain ID: ${error}`,
      });
    }
  }

  /**
   * Validar direcciones de contratos
   */
  async validateContractAddresses(): Promise<void> {
    log('info', 'Validating contract addresses...');

    const contracts = {
      ANDE_TOKEN: process.env.NEXT_PUBLIC_ANDE_TOKEN_ADDRESS,
    };

    for (const [name, address] of Object.entries(contracts)) {
      if (!address) {
        this.addResult({
          name: `Contract: ${name}`,
          status: 'warning',
          message: `Contract address not configured`,
        });
        continue;
      }

      // Validar formato de dirección
      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
        this.addResult({
          name: `Contract: ${name}`,
          status: 'error',
          message: `Invalid contract address format: ${address}`,
        });
      } else {
        this.addResult({
          name: `Contract: ${name}`,
          status: 'success',
          message: `Valid address: ${address}`,
        });
      }
    }
  }

  /**
   * Validar endpoints de servicios
   */
  async validateServiceEndpoints(): Promise<void> {
    log('info', 'Validating service endpoints...');

    const endpoints = {
      Explorer: process.env.NEXT_PUBLIC_EXPLORER_URL,
      API: process.env.NEXT_PUBLIC_API_URL,
      Grafana: process.env.NEXT_PUBLIC_GRAFANA_URL,
    };

    for (const [name, url] of Object.entries(endpoints)) {
      if (!url) {
        this.addResult({
          name: `Service: ${name}`,
          status: 'warning',
          message: `Service URL not configured`,
        });
        continue;
      }

      try {
        const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
        if (response.ok || response.status === 404) {
          this.addResult({
            name: `Service: ${name}`,
            status: 'success',
            message: `Service responding (status: ${response.status})`,
            details: { url },
          });
        } else {
          this.addResult({
            name: `Service: ${name}`,
            status: 'warning',
            message: `Service returned status: ${response.status}`,
            details: { url },
          });
        }
      } catch (error) {
        this.addResult({
          name: `Service: ${name}`,
          status: 'warning',
          message: `Cannot reach service: ${error}`,
          details: { url },
        });
      }
    }
  }

  /**
   * Validar configuración de build
   */
  async validateBuildConfig(): Promise<void> {
    log('info', 'Validating build configuration...');

    const configPath = path.join(process.cwd(), 'next.config.ts');

    if (fs.existsSync(configPath)) {
      this.addResult({
        name: 'Build Config',
        status: 'success',
        message: 'next.config.ts found',
      });
    } else {
      this.addResult({
        name: 'Build Config',
        status: 'warning',
        message: 'next.config.ts not found',
      });
    }

    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      this.addResult({
        name: 'Vercel Config',
        status: 'success',
        message: 'vercel.json found',
      });
    }
  }

  /**
   * Agregar resultado
   */
  private addResult(result: ValidationResult) {
    this.results.push(result);
  }

  /**
   * Ejecutar todas las validaciones
   */
  async validate(): Promise<Report> {
    divider('ANDE BLOCKCHAIN CONFIGURATION VALIDATOR');

    await this.validateEnvVariables();
    await this.validateRpcEndpoint();
    await this.validateChainId();
    await this.validateContractAddresses();
    await this.validateServiceEndpoints();
    await this.validateBuildConfig();

    const report = this.generateReport();

    return report;
  }

  /**
   * Generar reporte
   */
  private generateReport(): Report {
    const summary = {
      total: this.results.length,
      passed: this.results.filter((r) => r.status === 'success').length,
      warnings: this.results.filter((r) => r.status === 'warning').length,
      failed: this.results.filter((r) => r.status === 'error').length,
    };

    const report: Report = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      results: this.results,
      summary,
    };

    return report;
  }

  /**
   * Imprimir reporte
   */
  printReport(report: Report) {
    divider('VALIDATION RESULTS');

    console.log(
      `${colors.cyan}Environment: ${colors.bright}${report.environment}${colors.reset}`
    );
    console.log(`${colors.cyan}Timestamp: ${colors.bright}${report.timestamp}${colors.reset}\n`);

    // Agrupar por estado
    const byStatus = {
      success: report.results.filter((r) => r.status === 'success'),
      warning: report.results.filter((r) => r.status === 'warning'),
      error: report.results.filter((r) => r.status === 'error'),
    };

    // Imprimir éxitos
    if (byStatus.success.length > 0) {
      console.log(`${colors.green}${colors.bright}✅ PASSED (${byStatus.success.length})${colors.reset}`);
      byStatus.success.forEach((r) => {
        console.log(`  ${r.name}: ${r.message}`);
      });
      console.log();
    }

    // Imprimir advertencias
    if (byStatus.warning.length > 0) {
      console.log(`${colors.yellow}${colors.bright}⚠️  WARNINGS (${byStatus.warning.length})${colors.reset}`);
      byStatus.warning.forEach((r) => {
        console.log(`  ${r.name}: ${r.message}`);
      });
      console.log();
    }

    // Imprimir errores
    if (byStatus.error.length > 0) {
      console.log(`${colors.red}${colors.bright}❌ ERRORS (${byStatus.error.length})${colors.reset}`);
      byStatus.error.forEach((r) => {
        console.log(`  ${r.name}: ${r.message}`);
      });
      console.log();
    }

    // Resumen
    divider('SUMMARY');
    console.log(`${colors.cyan}Total: ${report.summary.total}${colors.reset}`);
    console.log(`${colors.green}Passed: ${report.summary.passed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${report.summary.warnings}${colors.reset}`);
    console.log(`${colors.red}Errors: ${report.summary.failed}${colors.reset}\n`);

    // Status general
    const allGood = report.summary.failed === 0;
    if (allGood) {
      console.log(
        `${colors.green}${colors.bright}✅ All validations passed!${colors.reset}`
      );
      if (report.summary.warnings > 0) {
        console.log(
          `${colors.yellow}⚠️  ${report.summary.warnings} warnings found - please review${colors.reset}`
        );
      }
    } else {
      console.log(
        `${colors.red}${colors.bright}❌ ${report.summary.failed} errors found - fix before deploying${colors.reset}`
      );
    }

    console.log();
  }

  /**
   * Guardar reporte en archivo
   */
  saveReport(report: Report, filename: string = 'validation-report.json') {
    const reportPath = path.join(process.cwd(), filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('success', `Report saved to ${filename}`);
  }
}

// ============================================
// EJECUCIÓN PRINCIPAL
// ============================================

async function main() {
  const validator = new BlockchainValidator();

  try {
    const report = await validator.validate();
    validator.printReport(report);
    validator.saveReport(report);

    // Exit with appropriate code
    const hasErrors = report.summary.failed > 0;
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    log('error', 'Validation failed with error', error);
    process.exit(1);
  }
}

main();
