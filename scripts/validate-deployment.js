#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * 
 * Validates the frontend application before deployment to ensure:
 * - All required environment variables are set
 * - Contract addresses are valid
 * - Build passes without errors
 * - No console.log statements in production code
 * - All imports are valid
 * - TypeScript compiles without errors
 * 
 * Usage: node scripts/validate-deployment.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Validation results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function pass(message) {
  results.passed.push(message);
  log(`✅ ${message}`, 'green');
}

function fail(message) {
  results.failed.push(message);
  log(`❌ ${message}`, 'red');
}

function warn(message) {
  results.warnings.push(message);
  log(`⚠️  ${message}`, 'yellow');
}

// Validation functions
function validateEnvironmentVariables() {
  logSection('Environment Variables Validation');

  const requiredVars = [
    'NEXT_PUBLIC_USE_LOCAL_CHAIN',
    'NEXT_PUBLIC_LOCAL_RPC_URL',
    'NEXT_PUBLIC_CHAIN_ID',
  ];

  const envFile = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envFile)) {
    fail('.env.local file not found');
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });

  let allPresent = true;
  requiredVars.forEach(varName => {
    if (!envVars[varName]) {
      fail(`Missing environment variable: ${varName}`);
      allPresent = false;
    }
  });

  if (allPresent) {
    pass('All required environment variables are set');
  }

  // Check for zero addresses in production
  if (process.env.NODE_ENV === 'production') {
    const contractVars = [
      'NEXT_PUBLIC_ANDE_TOKEN_ADDRESS',
      'NEXT_PUBLIC_GOVERNANCE_ADDRESS',
    ];

    contractVars.forEach(varName => {
      const value = envVars[varName];
      if (value === '0x0000000000000000000000000000000000000000') {
        warn(`${varName} is set to zero address (contract not deployed)`);
      }
    });
  }
}

function validateContractAddresses() {
  logSection('Contract Addresses Validation');

  const addressesFile = path.join(__dirname, '..', 'src', 'contracts', 'addresses.ts');
  
  if (!fs.existsSync(addressesFile)) {
    fail('Contract addresses file not found');
    return;
  }

  const content = fs.readFileSync(addressesFile, 'utf-8');

  // Check for valid Ethereum addresses
  const addressRegex = /0x[a-fA-F0-9]{40}/g;
  const addresses = content.match(addressRegex) || [];

  if (addresses.length === 0) {
    fail('No contract addresses found');
    return;
  }

  pass(`Found ${addresses.length} contract addresses`);

  // Validate address format
  const invalidAddresses = addresses.filter(addr => {
    return addr.length !== 42 || !addr.match(/^0x[a-fA-F0-9]{40}$/);
  });

  if (invalidAddresses.length > 0) {
    fail(`Invalid address format: ${invalidAddresses.join(', ')}`);
  } else {
    pass('All contract addresses have valid format');
  }
}

function validateTypeScript() {
  logSection('TypeScript Validation');

  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    pass('TypeScript compilation successful');
  } catch (error) {
    fail('TypeScript compilation failed');
    console.log(error.stdout?.toString() || error.message);
  }
}

function validateLinting() {
  logSection('ESLint Validation');

  try {
    execSync('npm run lint', { stdio: 'pipe' });
    pass('ESLint validation passed');
  } catch (error) {
    warn('ESLint warnings found (non-blocking)');
    // Don't fail on lint warnings, just warn
  }
}

function validateProductionCode() {
  logSection('Production Code Quality Checks');

  const srcDir = path.join(__dirname, '..', 'src');
  const files = [];

  // Recursively get all .ts and .tsx files
  function getFiles(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        getFiles(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    });
  }

  getFiles(srcDir);

  let consoleLogCount = 0;
  let debuggerCount = 0;

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for console.log (except in development utilities)
    if (content.includes('console.log') && !file.includes('lib/logger')) {
      consoleLogCount++;
    }

    // Check for debugger statements
    if (content.includes('debugger;')) {
      debuggerCount++;
    }
  });

  if (consoleLogCount > 0 && process.env.NODE_ENV === 'production') {
    warn(`Found ${consoleLogCount} console.log statements (should be removed for production)`);
  }

  if (debuggerCount > 0) {
    fail(`Found ${debuggerCount} debugger statements (must be removed)`);
  }

  if (consoleLogCount === 0 && debuggerCount === 0) {
    pass('No console.log or debugger statements found');
  }
}

function validateDependencies() {
  logSection('Dependencies Validation');

  const packageJson = require('../package.json');
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    'wagmi',
    'viem',
    '@tanstack/react-query',
  ];

  let allPresent = true;
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      fail(`Missing required dependency: ${dep}`);
      allPresent = false;
    }
  });

  if (allPresent) {
    pass('All required dependencies are installed');
  }

  // Check for outdated critical packages
  try {
    const outdated = execSync('npm outdated --json', { stdio: 'pipe' }).toString();
    const outdatedPackages = JSON.parse(outdated || '{}');
    
    const criticalOutdated = Object.keys(outdatedPackages).filter(pkg => 
      requiredDeps.includes(pkg)
    );

    if (criticalOutdated.length > 0) {
      warn(`Critical packages have updates available: ${criticalOutdated.join(', ')}`);
    }
  } catch (error) {
    // npm outdated returns exit code 1 if there are outdated packages
    // This is expected, so we don't fail
  }
}

function validateBuild() {
  logSection('Build Validation');

  try {
    log('Building application... (this may take a minute)', 'blue');
    execSync('npm run build', { stdio: 'pipe' });
    pass('Build completed successfully');
  } catch (error) {
    fail('Build failed');
    console.log(error.stdout?.toString() || error.message);
  }
}

function validateABIs() {
  logSection('Contract ABIs Validation');

  const abisDir = path.join(__dirname, '..', 'src', 'contracts', 'abis');
  
  if (!fs.existsSync(abisDir)) {
    fail('ABIs directory not found');
    return;
  }

  const abiFiles = fs.readdirSync(abisDir).filter(f => f.endsWith('.json'));

  if (abiFiles.length === 0) {
    warn('No ABI files found');
    return;
  }

  let validCount = 0;
  abiFiles.forEach(file => {
    const filePath = path.join(abisDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const abi = JSON.parse(content);
      
      if (Array.isArray(abi) && abi.length > 0) {
        validCount++;
      } else {
        warn(`ABI file ${file} is empty or invalid`);
      }
    } catch (error) {
      fail(`Failed to parse ABI file ${file}: ${error.message}`);
    }
  });

  if (validCount === abiFiles.length) {
    pass(`All ${abiFiles.length} ABI files are valid`);
  }
}

function printSummary() {
  logSection('Validation Summary');

  log(`\nPassed: ${results.passed.length}`, 'green');
  log(`Failed: ${results.failed.length}`, 'red');
  log(`Warnings: ${results.warnings.length}`, 'yellow');

  if (results.failed.length > 0) {
    log('\n❌ VALIDATION FAILED - Fix the errors above before deployment', 'red');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    log('\n⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings before deployment', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ ALL VALIDATIONS PASSED - Ready for deployment!', 'green');
    process.exit(0);
  }
}

// Main execution
async function main() {
  log('\n🚀 Starting Pre-Deployment Validation...', 'cyan');
  log('Node.js version: ' + process.version, 'blue');
  log('Environment: ' + (process.env.NODE_ENV || 'development'), 'blue');

  try {
    validateEnvironmentVariables();
    validateContractAddresses();
    validateABIs();
    validateDependencies();
    validateTypeScript();
    validateLinting();
    validateProductionCode();
    
    // Build validation is heavy, only run if all other checks pass
    if (results.failed.length === 0) {
      validateBuild();
    } else {
      warn('Skipping build validation due to previous failures');
    }

    printSummary();
  } catch (error) {
    log('\n❌ Validation script encountered an error:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();