#!/usr/bin/env node

/**
 * Security Check Script
 * Run this to verify security configurations
 */

const fs = require('fs')
const path = require('path')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[36m'
const RESET = '\x1b[0m'

let passed = 0
let failed = 0
let warnings = 0

function check(name, condition, errorMsg) {
  if (condition) {
    console.log(`${GREEN}✓${RESET} ${name}`)
    passed++
  } else {
    console.log(`${RED}✗${RESET} ${name}`)
    if (errorMsg) console.log(`  ${RED}→${RESET} ${errorMsg}`)
    failed++
  }
}

function warn(name, message) {
  console.log(`${YELLOW}⚠${RESET} ${name}`)
  if (message) console.log(`  ${YELLOW}→${RESET} ${message}`)
  warnings++
}

console.log(`${BLUE}═══════════════════════════════════════════${RESET}`)
console.log(`${BLUE}   Clinic Booking - Security Check${RESET}`)
console.log(`${BLUE}═══════════════════════════════════════════${RESET}\n`)

// 1. Check package.json
console.log(`${BLUE}1. Checking Dependencies...${RESET}`)
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  )
  
  const nextVersion = packageJson.dependencies.next
  const isSecure = nextVersion.includes('15.') || nextVersion.includes('16.')
  
  check(
    'Next.js version is secure (15.x or 16.x)',
    isSecure,
    `Current version: ${nextVersion}. Should be 15.0.8+ or 16.0.11+`
  )
  
  const reactVersion = packageJson.dependencies.react
  check(
    'React version is updated (19.x)',
    reactVersion.includes('19') || reactVersion.includes('^18'),
    `Current version: ${reactVersion}`
  )
} catch (error) {
  failed++
  console.log(`${RED}✗${RESET} Could not read package.json: ${error.message}`)
}

// 2. Check next.config.js
console.log(`\n${BLUE}2. Checking Next.js Configuration...${RESET}`)
try {
  const configContent = fs.readFileSync(
    path.join(__dirname, '..', 'next.config.js'),
    'utf8'
  )
  
  check(
    'Uses remotePatterns instead of domains',
    configContent.includes('remotePatterns'),
    'Should use remotePatterns for image configuration'
  )
  
  check(
    'React Strict Mode enabled',
    configContent.includes('reactStrictMode: true'),
    'Enable reactStrictMode for better error detection'
  )
} catch (error) {
  failed++
  console.log(`${RED}✗${RESET} Could not read next.config.js: ${error.message}`)
}

// 3. Check middleware
console.log(`\n${BLUE}3. Checking Middleware Security...${RESET}`)
try {
  const middlewareContent = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'middleware.ts'),
    'utf8'
  )
  
  check(
    'Security headers configured',
    middlewareContent.includes('X-Content-Type-Options') &&
    middlewareContent.includes('X-Frame-Options'),
    'Security headers should be set in middleware'
  )
  
  check(
    'CORS is restricted',
    !middlewareContent.includes("'Access-Control-Allow-Origin', '*'"),
    'CORS should not use wildcard (*)'
  )
  
  check(
    'Authentication checks present',
    middlewareContent.includes('getSession'),
    'Middleware should check authentication'
  )
} catch (error) {
  failed++
  console.log(`${RED}✗${RESET} Could not read middleware.ts: ${error.message}`)
}

// 4. Check security utilities
console.log(`\n${BLUE}4. Checking Security Utilities...${RESET}`)
try {
  const securityPath = path.join(__dirname, '..', 'src', 'lib', 'security.ts')
  
  if (fs.existsSync(securityPath)) {
    const securityContent = fs.readFileSync(securityPath, 'utf8')
    
    check(
      'Rate limiting implemented',
      securityContent.includes('checkRateLimit'),
      'Rate limiting function should be present'
    )
    
    check(
      'Input sanitization implemented',
      securityContent.includes('sanitizeString'),
      'Input sanitization function should be present'
    )
    
    check(
      'Validation functions implemented',
      securityContent.includes('isValidEmail') &&
      securityContent.includes('isValidUUID'),
      'Validation functions should be present'
    )
  } else {
    failed++
    console.log(`${RED}✗${RESET} Security utilities file not found`)
  }
} catch (error) {
  failed++
  console.log(`${RED}✗${RESET} Could not check security utilities: ${error.message}`)
}

// 5. Check API routes
console.log(`\n${BLUE}5. Checking API Routes Security...${RESET}`)
try {
  const apiPath = path.join(__dirname, '..', 'src', 'app', 'api')
  
  if (fs.existsSync(apiPath)) {
    // Check appointments route
    const appointmentsRoute = path.join(apiPath, 'appointments', 'route.ts')
    if (fs.existsSync(appointmentsRoute)) {
      const content = fs.readFileSync(appointmentsRoute, 'utf8')
      
      check(
        'Appointments route uses rate limiting',
        content.includes('checkRateLimit'),
        'API routes should implement rate limiting'
      )
      
      check(
        'Appointments route validates input',
        content.includes('validateAppointmentData'),
        'API routes should validate input data'
      )
    }
    
    // Check login route
    const loginRoute = path.join(apiPath, 'auth', 'login', 'route.ts')
    if (fs.existsSync(loginRoute)) {
      const content = fs.readFileSync(loginRoute, 'utf8')
      
      check(
        'Login route uses rate limiting',
        content.includes('checkRateLimit'),
        'Login should implement strict rate limiting'
      )
      
      check(
        'Login validates email format',
        content.includes('isValidEmail'),
        'Login should validate email format'
      )
    }
  } else {
    warn('API routes directory not found', 'Skipping API security checks')
  }
} catch (error) {
  warn('Could not check API routes', error.message)
}

// 6. Check environment variables
console.log(`\n${BLUE}6. Checking Environment Configuration...${RESET}`)
try {
  const envExamplePath = path.join(__dirname, '..', '.env.example')
  const envPath = path.join(__dirname, '..', '.env')
  
  if (fs.existsSync(envExamplePath)) {
    check('.env.example exists', true)
  } else {
    warn('.env.example not found', 'Should have example environment file')
  }
  
  if (fs.existsSync(envPath)) {
    warn(
      '.env file exists',
      'Make sure .env is in .gitignore and never committed'
    )
  }
} catch (error) {
  warn('Could not check environment files', error.message)
}

// 7. Check .gitignore
console.log(`\n${BLUE}7. Checking .gitignore...${RESET}`)
try {
  const gitignorePath = path.join(__dirname, '..', '.gitignore')
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8')
    
    check(
      '.env files are ignored',
      content.includes('.env'),
      '.env files should be in .gitignore'
    )
    
    check(
      'node_modules is ignored',
      content.includes('node_modules'),
      'node_modules should be in .gitignore'
    )
  } else {
    failed++
    console.log(`${RED}✗${RESET} .gitignore not found`)
  }
} catch (error) {
  warn('Could not check .gitignore', error.message)
}

// Summary
console.log(`\n${BLUE}═══════════════════════════════════════════${RESET}`)
console.log(`${BLUE}   Summary${RESET}`)
console.log(`${BLUE}═══════════════════════════════════════════${RESET}`)
console.log(`${GREEN}Passed:${RESET}   ${passed}`)
console.log(`${RED}Failed:${RESET}   ${failed}`)
console.log(`${YELLOW}Warnings:${RESET} ${warnings}`)

if (failed === 0) {
  console.log(`\n${GREEN}✓ All security checks passed!${RESET}`)
  process.exit(0)
} else {
  console.log(`\n${RED}✗ Some security checks failed. Please review and fix.${RESET}`)
  process.exit(1)
}
